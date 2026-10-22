import {randomUUID} from 'node:crypto';
import {aiError} from '../../services/ai/contracts.mjs';
export class SharedAiProvider {
  constructor({sessionId,state,send=message=>process.send(message)}={}){this.shared=true;this.sessionId=sessionId;this.send=send;this.state=state??{epoch:0,hasCredential:false};this.pending=new Map();this.connected=true;}
  get key(){return this.state.hasCredential?'platform-session':'';}set key(value){}
  update(state){if(state&&state.epoch>=this.state.epoch){const changed=state.epoch!==this.state.epoch;this.state=state;if(changed)this.onChange?.();}}
  receive(value){if(value?.kind==='service.ai'){this.update(value.state);return;}if(value?.kind!=='service.reply'||value.sessionId!==this.sessionId)return;const p=this.pending.get(value.requestId);if(!p)return;this.pending.delete(value.requestId);p.cleanup();if(value.ok){this.update(value.result.state);p.resolve(value.result.response);}else p.reject(aiError(value.error?.message??'Shared AI request failed'));}
  request(path,{key=this.key,body,signal}={}){
    return this.invoke('request',{path,key,body,epoch:this.state.epoch},signal);
  }
  invoke(action,data,signal){
    if(signal?.aborted)return Promise.reject(aiError('AI request cancelled or timed out'));
    return new Promise((resolve,reject)=>{
      const requestId=randomUUID(),cancel=()=>{this.send({kind:'service.request',sessionId:this.sessionId,requestId:randomUUID(),service:'ai',action:'cancel',data:{requestId}});const p=this.pending.get(requestId);if(p){this.pending.delete(requestId);p.cleanup();reject(aiError('AI request cancelled or timed out'));}},timer=setTimeout(cancel,305000);
      const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);};this.pending.set(requestId,{resolve,reject,cleanup});signal?.addEventListener('abort',cancel,{once:true});
      try{this.send({kind:'service.request',sessionId:this.sessionId,requestId,service:'ai',action,data:{requestId,...data}});}catch{this.pending.delete(requestId);cleanup();reject(aiError('AI host is unavailable'));}
    });
  }
  disconnect(){return this.invoke('disconnect',{});}
  close(){for(const p of this.pending.values()){p.cleanup();p.reject(aiError('Product AI session closed'));}this.pending.clear();}
}

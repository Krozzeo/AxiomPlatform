import {randomUUID} from 'node:crypto';
import {GitHubClient,githubError} from '../../services/integrations/github/client.mjs';
// The parent owns the credential; product processes only receive account identity and epoch.
export class SharedGitHubClient extends GitHubClient{
  constructor({sessionId,account,send=message=>process.send(message)}={}){super();this.sharedAccount=true;this.sessionId=sessionId;this.send=send;this.account=null;this.epoch=0;this.pending=new Map();this.update(account);}
  get token(){return this.account?'platform-session':null;}set token(value){}
  update(state){if(state&&state.epoch>=this.epoch){const changed=this.epoch!==state.epoch||this.account?.id!==state.account?.id;this.account=state.account??null;this.epoch=state.epoch;if(changed)this.onAccountChange?.();}}
  receive(value){
    if(value?.kind==='service.account'){this.update(value.state);return;}
    if(value?.kind!=='service.reply'||value.sessionId!==this.sessionId)return;
    const pending=this.pending.get(value.requestId);if(!pending)return;this.pending.delete(value.requestId);clearTimeout(pending.timer);
    if(value.ok)pending.resolve(value.result);else pending.reject(githubError(value.error?.message??'Shared GitHub operation failed.',value.error?.code));
  }
  call(action,data={}){return new Promise((resolve,reject)=>{const requestId=randomUUID(),timer=setTimeout(()=>{this.pending.delete(requestId);reject(githubError('GitHub operation was not confirmed. Review its status before retrying.','AX_GITHUB_0003'));},25000);this.pending.set(requestId,{resolve,reject,timer});this.send({kind:'service.request',sessionId:this.sessionId,requestId,service:'github',action,data});});}
  async connect(token){const state=await this.call('connect',{token});this.update(state);return this.account;}
  async disconnect(){const state=await this.call('disconnect');this.update(state);}
  request(path,options={}){return this.call('request',{path,options,epoch:this.epoch});}
  close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(githubError('Product session closed.','AX_GITHUB_0003'));}this.pending.clear();}
}

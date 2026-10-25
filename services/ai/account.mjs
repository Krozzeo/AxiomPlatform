import {OpenAiProvider} from './provider.mjs';
import {aiError} from './contracts.mjs';
import {atomicJson} from '../local-files/files.mjs';
import {readFile} from 'node:fs/promises';
export class AiAccount {
  constructor({provider=new OpenAiProvider({key:process.env.OPENAI_API_KEY??''}),onChange=()=>{},usagePath,transport}={}){this.provider=provider;this.epoch=0;this.onChange=onChange;this.requests=new Map();this.usage={};this.usagePath=usagePath;this.flight=Promise.resolve();this.transport={timeoutSeconds:120,maxConcurrentRequests:4,maxResponseBytes:2097152};this.verified=false;this.setTransport(transport??this.transport);}
  async initialize(){if(this.usagePath)try{const value=JSON.parse(await readFile(this.usagePath,'utf8'));if(value.version!==1||!value.scopes||Object.values(value.scopes).some(s=>!['inputTokens','outputTokens','totalTokens','unreportedRequests'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)))throw aiError('Invalid AI usage ledger');this.usage=value.scopes;}catch(e){if(e.code!=='ENOENT')throw e;}return this;}
  setTransport(value){if(!value||!Number.isInteger(value.timeoutSeconds)||value.timeoutSeconds<15||value.timeoutSeconds>300||!Number.isInteger(value.maxConcurrentRequests)||value.maxConcurrentRequests<1||value.maxConcurrentRequests>8||!Number.isInteger(value.maxResponseBytes)||value.maxResponseBytes<262144||value.maxResponseBytes>2097152)throw aiError('Invalid shared AI transport settings');this.transport={timeoutSeconds:value.timeoutSeconds,maxConcurrentRequests:value.maxConcurrentRequests,maxResponseBytes:value.maxResponseBytes};}
  status(){return {hasCredential:!!this.provider.key||this.provider.id==='local'&&this.verified,connected:(this.provider.id==='local'||!!this.provider.key)&&this.verified,provider:this.provider.id??'openai',providerConfig:{...(this.provider.config??{})},saved:!!this.saved,storage:this.storage??null,connectionError:this.connectionError??null,transport:{...this.transport},epoch:this.epoch,model:this.defaults?.model??this.model??null,defaults:{...(this.defaults??{})},modelTest:this.modelTest??null,busy:this.requests.size>0};}
  changed(){this.epoch++;this.onChange(this.status());}
  disconnect(){this.modelTest=null;this.verified=false;this.provider.key='';for(const item of this.requests.values())item.controller.abort();this.changed();return this.status();}
  cancelOwner(owner){for(const item of this.requests.values())if(item.owner===owner)item.controller.abort();}
  async persist(){if(!this.usagePath)return;const snapshot={version:1,scopes:structuredClone(this.usage)},flight=this.flight.catch(()=>{}).then(()=>atomicJson(this.usagePath,snapshot));this.flight=flight;await flight;}
  async invoke(owner,scope,action,data={}){
    if(this.closed)throw aiError('AI host session is closed');
    if(action==='status')return this.status();
    if(action==='disconnect')return this.disconnect();
    if(action==='cancel'){const item=this.requests.get(data.requestId);if(item?.owner===owner)item.controller.abort();return {};}
    if(action!=='request'||!['/models','/responses'].includes(data.path))throw aiError('Unsupported AI service operation');
    if(data.epoch!==this.epoch)throw aiError('AI connection changed; reconnect this task');
    if(typeof data.requestId!=='string'||this.requests.has(data.requestId)||this.requests.size>=this.transport.maxConcurrentRequests)throw aiError('AI request limit or duplicate identity');
    const supplied=data.key&&data.key!=='platform-session'?data.key:null,key=supplied??this.provider.key;
    if(this.provider.id!=='local'&&(typeof key!=='string'||key.length<10||key.length>512||/\s/.test(key)))throw aiError('Connect an AI credential first');
    if(data.path==='/responses'&&(!data.body||data.body.store!==false||data.body.stream||data.body.background||data.body.previous_response_id||Buffer.byteLength(JSON.stringify(data.body))>512*1024))throw aiError('Invalid stateless AI request');
    const epoch=this.epoch,controller=new AbortController(),slot=this.usage[scope]??={inputTokens:0,outputTokens:0,totalTokens:0,unreportedRequests:0};
    const entry={owner,controller,slot,response:data.path==='/responses',reported:false};this.requests.set(data.requestId,entry);
    let reported=false;
    try{
      const result=await this.provider.request(data.path,{key,body:data.body,maxResponseBytes:this.transport.maxResponseBytes,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(this.transport.timeoutSeconds*1000)])});
      if(this.closed)throw aiError('AI host session is closed');
      if(data.path==='/models'&&!Array.isArray(result.data))throw aiError('AI provider returned an invalid model list.');
      if(data.path==='/responses'){const u=result.usage??{};for(const [to,from] of [['inputTokens','input_tokens'],['outputTokens','output_tokens'],['totalTokens','total_tokens']])if(Number.isSafeInteger(u[from])&&u[from]>=0)slot[to]+=u[from];if(!Number.isSafeInteger(u.total_tokens)||u.total_tokens<0)slot.unreportedRequests++;reported=true;entry.reported=true;await this.persist();}
      if(controller.signal.aborted||epoch!==this.epoch)throw aiError('AI result belongs to a cancelled or replaced connection');
      if(supplied&&supplied!==this.provider.key){this.provider.key=supplied;this.verified=false;this.changed();}
      if((data.path==='/models'&&Array.isArray(result.data)||data.path==='/responses'&&result.status==='completed'&&result.output?.some(o=>o.type==='function_call'||o.type==='message'&&o.role==='assistant'&&o.content?.some(c=>c.text||c.refusal)))&&!this.verified){this.verified=true;this.onChange(this.status());}
      const encoded=JSON.stringify(result);const response=JSON.parse(key?encoded.replaceAll(JSON.stringify(key).slice(1,-1),'[redacted]'):encoded);
      return {response,state:this.status()};
    }catch(error){if(data.path==='/responses'&&!reported&&!this.closed){slot.unreportedRequests++;entry.reported=true;await this.persist();}if(epoch===this.epoch&&(error.upstreamStatus===401||!error.upstreamStatus&&/rejected the credential/.test(error.message))&&!supplied)this.disconnect();throw error;}
    finally{this.requests.delete(data.requestId);}
  }
  async close(){if(this.closed)return;this.closed=true;for(const item of this.requests.values())if(item.response&&!item.reported){item.slot.unreportedRequests++;item.reported=true;}this.disconnect();await this.persist();await this.flight;}
}

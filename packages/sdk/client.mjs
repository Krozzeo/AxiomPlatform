import {fork} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {PROTOCOL_VERSION, failure} from '../contracts/index.mjs';
export function productEnvironment(source=process.env){const env={...source};for(const key of Object.keys(env))if(['OPENAI_API_KEY','ANTHROPIC_API_KEY','GOOGLE_API_KEY','GEMINI_API_KEY','GOOGLE_APPLICATION_CREDENTIALS','CLAUDE_CODE_OAUTH_TOKEN','OLLAMA_API_KEY','LM_STUDIO_API_TOKEN','GITHUB_TOKEN','GH_TOKEN','AXIOM_SESSION_TOKEN'].includes(key.toUpperCase()))delete env[key];return env;}

// Only an explicitly registered installation supplies this executable; projects never do.
export class ProductClient {
  constructor(entry, {timeoutMs = 30000, onExit = () => {}, productId, onService} = {}) {
    this.timeoutMs = timeoutMs;
    this.pending = new Map();
    this.dead = false;
    this.productId=productId;
    const env=productEnvironment();
    this.child = fork(entry, [], {stdio: ['ignore','ignore','ignore','ipc'], windowsHide: true,env});
    this.child.on('message', value => {
      if(value?.kind==='service.request'){
        if(value.sessionId!==this.sessionId||!onService)return;
        void Promise.resolve().then(()=>onService(value)).then(result=>this.notify({kind:'service.reply',requestId:value.requestId,sessionId:this.sessionId,ok:true,result}),error=>this.notify({kind:'service.reply',requestId:value.requestId,sessionId:this.sessionId,ok:false,error:{code:error.code??'operationFailed',message:error.code?error.message:'Shared service operation failed.'}}));
        return;
      }
      const pending = this.pending.get(value?.requestId);
      if (!pending || value.protocolVersion !== PROTOCOL_VERSION || value.sessionId !== pending.sessionId || (this.productId&&value.productId!==this.productId) || value.correlationId!==value.requestId) return;
      clearTimeout(pending.timer); this.pending.delete(value.requestId);
      if (value.ok === true) {if(value.result?.status&&Object.hasOwn(value.result.status,'projectId'))this.projectId=value.result.status.projectId;pending.resolve(value.result);}
      else pending.reject(failure(value.error?.code, value.error?.message ?? 'Product operation failed.'));
    });
    const fail = () => {
      if (this.dead) return;
      this.dead = true;
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(failure('resultUnknown','Product exited before confirming the operation. Inspect the project before retrying.')); }
      this.pending.clear(); onExit();
    };
    this.child.once('error', fail); this.child.once('exit', fail);
  }
  call(method, params, sessionId) {
    this.sessionId=sessionId;
    if (this.dead) return Promise.reject(failure('operationFailed','Product process is unavailable.'));
    return new Promise((resolve, reject) => {
      const requestId = randomUUID();
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(failure('resultUnknown','The product did not confirm in time. Its session was stopped; inspect saved data before reopening.'));
        this.child.kill();
      }, this.timeoutMs);
      this.pending.set(requestId, {resolve,reject,timer,sessionId});
      this.child.send({protocolVersion: PROTOCOL_VERSION, requestId, correlationId:requestId, sessionId, productId:this.productId, projectId:this.projectId??null, actor:{kind:'human',id:'platform-hub'}, method, params}, error => {
        if (error) { clearTimeout(timer); this.pending.delete(requestId); reject(failure('operationFailed','Cannot communicate with the product.')); }
      });
    });
  }
  notify(message){if(!this.dead&&this.child.connected)this.child.send(message,()=>{});}
  async stop() {
    if (this.dead) return;
    const exited = once(this.child, 'exit').catch(() => {});
    this.child.disconnect();
    const timer = setTimeout(() => this.child.kill(), 10000);
    await exited; clearTimeout(timer);
  }
}

import {OpenAiProvider} from './provider.mjs';
import {aiError,usageDetails,textOf} from './contracts.mjs';
const fail=message=>{throw aiError(message);};
// Domain adapters supply syncBudget/persistSession/check and the actual tool handlers.
export class AiRuntime {
 constructor({fetchImpl=fetch,apiKey='',transport}={}){this.provider=transport??new OpenAiProvider({fetchImpl,key:apiKey});}
 get key(){return this.provider.key;} set key(value){this.provider.key=value;}
 get fetchImpl(){return this.provider.fetchImpl;}set fetchImpl(value){if(!this.provider.shared)this.provider.fetchImpl=value;}
 async request(path,options={}){try{return await this.provider.request(path,options);}catch(error){if(this.provider.connected===false)this.connected=false;throw error;}}
 launchTask(s,execute){s.flight=new Promise(resolve=>setImmediate(resolve)).then(()=>execute(s)).finally(()=>{clearTimeout(s.timer);if(this.active===s)this.active=null;});return s.flight;}
 async shutdownTask(){if(this.active){this.active.cancelled=true;this.active.controller.abort();await this.active.flight;}}
 async runTurn(s,{input,body,requestBytes,context,normalize,stage}){
  this.check(s);s.public.requests++;s.cumulative.requests++;s.public.phase='requesting';const started=performance.now();
  const response=await this.responseRequest({signal:s.controller.signal,body});
  s.public.requestUsage.push({request:s.public.requests,...usageDetails(response),requestBytes,context:context(),message:this.redact(textOf(response)).slice(0,16000),providerStatus:response.status,incompleteReason:response.incomplete_details?.reason??null,stage:stage?.()??'planning',elapsedMs:Math.round(performance.now()-started)});
  // Account actual usage even when a cancelled/stale reply cannot be used for tools.
  await this.recordUsage(response,s);s.cumulative.totalTokens+=response.usage?.total_tokens??0;this.check(s);
  if(response.status!=='completed'||!Array.isArray(response.output))fail('OpenAI did not complete this response; task stopped without accepting changes');
  input.push(...response.output);const message=this.redact(textOf(response)).slice(0,16000),calls=response.output.filter(o=>o.type==='function_call').map(normalize);
  s.public.requestUsage.at(-1).message=message;return {response,message,calls};
 }

 async recordUsage(response,task=null){this.syncBudget();const u=response.usage??{},total=Number.isSafeInteger(u.total_tokens)&&u.total_tokens>=0?u.total_tokens:null;for(const [target,source]of [['inputTokens','input_tokens'],['outputTokens','output_tokens'],['totalTokens','total_tokens']]){const value=u[source];if(Number.isSafeInteger(value)&&value>=0){this.sessionUsage[target]+=value;if(task)task.public.usage[target]+=value;}}if(task){const detail=usageDetails(response);task.public.usage.cachedInputTokens+=detail.cachedInputTokens;task.public.usage.reasoningTokens+=detail.reasoningTokens;}if(total===null)this.sessionUsage.unreportedRequests++;await this.persistSession();if(total===null)fail('OpenAI omitted token usage; task stopped because session consumption cannot be verified');}
 workBudgetCheck(s){if(s.cumulative.totalTokens>=(s.public.limits.maxWorkTokens??Infinity))fail('AI work-order token budget exhausted');if(s.cumulative.totalTokens-(s.stepTokensStart??0)>=(s.public.limits.maxStepTokens??Infinity))fail('AI subtask token budget exhausted');}
 tokenCheck(){this.syncBudget();if(this.config.limits.maxTokens!==null&&this.sessionUsage.totalTokens>=this.config.limits.maxTokens)fail('AI session token budget exhausted; increase the session limit to continue');}
 redact(value){const text=String(value);return (this.key?text.replaceAll(this.key,'[redacted]'):text).replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g,'[redacted]');}
 async responseRequest(options){try{return await this.request('/responses',options);}catch(error){this.sessionUsage.unreportedRequests++;await this.persistSession();throw error;}}
}

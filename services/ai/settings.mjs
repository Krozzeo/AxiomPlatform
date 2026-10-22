import {randomUUID} from 'node:crypto';
import {isAssistantModel} from './models.mjs';
import {aiError,textOf} from './contracts.mjs';
export const CONNECTION_MODEL='gpt-4.1-nano';
export const defaultSelection={model:CONNECTION_MODEL,reasoning:'default'};
export const reasoningEfforts=['default','none','minimal','low','medium','high','xhigh','max'];
export function effortsFor(model){
 if(/^gpt-6/.test(model))return ['default','low','medium','high','xhigh','max'];
 if(/^(?:gpt-4(?:[.-]|$)|chatgpt-4|ft:gpt-4)/.test(model))return ['default'];
 if(/^gpt-5(?:-mini|-nano)?(?:-\d{4}-\d{2}-\d{2})?$/.test(model))return ['default','minimal','low','medium','high'];
 if(/^(?:o[134](?:-|$))/.test(model))return ['default','low','medium','high'];
 return reasoningEfforts;
}
export function selection(value={}){if(!isAssistantModel(value.model)||!effortsFor(value.model).includes(value.reasoning??'default'))throw aiError('Choose a compatible model and Reasoning Effort. Non-reasoning models use the provider default.');return {model:value.model,reasoning:value.reasoning??'default'};}
export function probeBody(value,{connection=false}={}){const s=selection(value);return {model:s.model,store:false,input:[{role:'user',content:connection?'Reply with OK. This is an account connection test.':'Reply with OK. This tests the selected model and reasoning configuration.'}],tools:[],tool_choice:'none',max_output_tokens:s.reasoning==='default'&&/^gpt-4/.test(s.model)?128:2048,...(s.reasoning!=='default'?{reasoning:{effort:s.reasoning}}:{})};}
export async function probe(ai,value,{apiKey,connection=false}={}){const result=await ai.invoke('platform-settings','platform-settings','request',{requestId:randomUUID(),epoch:ai.epoch,path:'/responses',...(apiKey?{key:apiKey}:{}),body:probeBody(value,{connection})});if(result.response.status!=='completed'||!textOf(result.response).trim())throw aiError('The test did not complete with text. Verify model access, reasoning and output limits.');return {model:value.model,reasoning:value.reasoning??'default',testedAt:new Date().toISOString()};}

export function resolveSelection(settings={},defaults=defaultSelection){const model=settings.model||defaults.model,reasoning=settings.reasoning&&settings.reasoning!=='platform'?settings.reasoning:!settings.model||settings.model===defaults.model?defaults.reasoning:'default';return selection({model,reasoning});}

export const aiError=(message,code='AX_AI_0001')=>Object.assign(new Error(message),{code,status:422});
const fail=message=>{throw aiError(message);};
export const defaultAiLimits={maxRequests:12,maxTools:48,maxTokens:100000,maxOutputTokens:4096,maxSeconds:300,maxWorkTokens:150000,maxStepTokens:40000};
const ranges={maxRequests:[1,512],maxTools:[1,96],maxTokens:[4096,1000000000],maxOutputTokens:[512,16384],maxSeconds:[10,3600],maxWorkTokens:[4096,1000000000],maxStepTokens:[4096,1000000000]};
export function limits(value={}){if(!value||typeof value!=='object'||Array.isArray(value))fail('Invalid AI limits');for(const [name,v]of Object.entries(value)){const range=ranges[name];if(!range||v!==null&&(!Number.isSafeInteger(v)||v<range[0]||v>range[1]))fail('Invalid AI limit: '+name);}return {...defaultAiLimits,...value};}
export function textOf(response){return (response.output??[]).filter(i=>i.type==='message'&&i.role==='assistant').flatMap(i=>i.content??[]).filter(c=>['output_text','refusal'].includes(c.type)).map(c=>c.text??c.refusal??'').join('\n');}


export function usageDetails(response){const u=response.usage??{};return {inputTokens:u.input_tokens??0,cachedInputTokens:u.input_tokens_details?.cached_tokens??0,outputTokens:u.output_tokens??0,reasoningTokens:u.output_tokens_details?.reasoning_tokens??0,totalTokens:u.total_tokens??null};}

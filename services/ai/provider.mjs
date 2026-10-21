import {aiError} from './contracts.mjs';
const fail=message=>{throw aiError(message);};
const ENDPOINT='https://api.openai.com/v1';
// Extracted from Game Engine d6aad38. Fixed endpoint; provider content never selects credentials.
export class OpenAiProvider {
 constructor({fetchImpl=fetch,key=''}={}){this.fetchImpl=fetchImpl;this.key=key;this.connected=true;}

 async request(path,{key=this.key,body,signal}={}){
  if(!['/models','/responses'].includes(path))fail('Unsupported AI provider path');
  let response;try{response=await this.fetchImpl(ENDPOINT+path,{method:body?'POST':'GET',redirect:'error',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:signal??AbortSignal.timeout(30000)});}catch{fail(signal?.aborted?'AI request cancelled or timed out':'OpenAI is unreachable; check the network and retry');}
  const chunks=[];let total=0;
  try{for await(const chunk of response.body){total+=chunk.length;if(total>2*1024*1024)fail('OpenAI response exceeds transport budget');chunks.push(chunk);}}catch(error){if(error.code==='AX_AI_0001')throw error;fail('OpenAI response interrupted');}
  if(!response.ok){if(response.status===401||response.status===403){this.connected=false;fail('OpenAI rejected the credential or model access ('+response.status+')');}if(response.status===429)fail('OpenAI rate or account usage limit reached (429)');fail('OpenAI request failed ('+response.status+'); verify model compatibility and configuration');}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('OpenAI returned invalid JSON');}return value;
 }
}

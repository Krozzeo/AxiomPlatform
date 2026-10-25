import {readFile,lstat} from 'node:fs/promises';
import {atomicJson} from '../local-files/files.mjs';
import {releaseSources} from './release-sources.mjs';

const ttl=600000,cacheLimit=8*1024*1024;
const problem=(code,status,retryAt)=>Object.assign(Error(messages[code]??'Release service could not complete the request.'),{discoveryCode:code,status,retryAt});
const messages={rateLimited:'GitHub request limit reached.',unauthorized:'GitHub rejected the account credential. Refresh the GitHub connection.',forbidden:'GitHub denied access. Check the repository and account permissions.',notFound:'Repository or release was not found. Check its source URL.',serviceUnavailable:'GitHub is temporarily unavailable.',network:'Could not reach GitHub. Check the connection and retry.',invalidResponse:'GitHub returned an invalid catalog response.',invalidRelease:'Some published packages could not be validated.'};
const mode=token=>token?'authenticated':'anonymous';
const key=source=>source.productId+'#'+source.repository;

// Public metadata only. Tokens are supplied at request time and never serialized.
export class ReleaseDiscovery {
 constructor({fetchImpl=fetch,platform=process.platform,arch=process.arch,clock=Date.now,validateRelease,assetUrl,compareVersions}={}){
  Object.assign(this,{fetchImpl,platform,arch,clock,validateRelease,assetUrl,compareVersions});this.sources=releaseSources();this.items=[];this.errors=[];this.checkedAt=null;this.flight=null;this.installs=new Set();this.states={};this.manifestKeys={};this.httpCache=new Map();this.getToken=()=>null;
 }
 async initialize({cachePath,getToken}={}){this.cachePath=cachePath;if(getToken)this.getToken=getToken;await this.loadCache();if(this.checkedAt!=null)await this.saveCache();return this;}
 async configure(overrides={}){const next=releaseSources(overrides);if(this.flight)await this.flight;if(JSON.stringify(next)===JSON.stringify(this.sources))return;this.sources=next;this.items=[];this.errors=[];this.states={};this.manifestKeys={};this.checkedAt=null;this.httpCache.clear();await this.loadCache();}
 async loadCache(){
  if(!this.cachePath)return;
  try{
   const stat=await lstat(this.cachePath);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size>cacheLimit)throw Error('Invalid cache');
   const cache=JSON.parse(await readFile(this.cachePath,'utf8'));if(cache.version!==1||!Array.isArray(cache.items)||cache.items.length>3000)throw Error('Invalid cache');
   const restored=[],invalidSources=new Set();for(const value of cache.items){const source=this.sources.find(s=>s.repository===value.repository&&s.productId===value.productId);if(!source)continue;try{const experimental=value.channel==='experimental';restored.push(this.validateRelease(value,source,{tag_name:experimental?`experimental-pr-${value.build.pullRequest}-${value.build.commit}`:'v'+value.version,target_commitish:value.build?.commit,prerelease:experimental,published_at:value.publishedAt,assets:value.artifacts.map(a=>({name:a.name,size:a.bytes,browser_download_url:a.url}))}));}catch{invalidSources.add(key(source));this.cacheWarning='Some saved catalog entries were invalid and were ignored.';}}
   if(!this.items.length)this.items=restored;
   for(const source of this.sources){const state=cache.states?.[key(source)];if(state&&[state.checkedAt,state.lastAttemptAt,state.retryAt].every(n=>n==null||Number.isFinite(n)&&n>=0))this.states[key(source)]={checkedAt:state.checkedAt??null,lastAttemptAt:state.lastAttemptAt??null,retryAt:state.retryAt??null,retryMode:state.retryMode==='authenticated'?'authenticated':'anonymous',error:messages[state.error]?state.error:null,status:Number.isInteger(state.status)?state.status:null};}
   for(const id of invalidSources)this.states[id]={...this.states[id],checkedAt:null,error:'invalidRelease',retryAt:null};
   for(const item of restored){const id=item.repository+'#'+item.id,value=cache.manifestKeys?.[id];if(typeof value==='string'&&value.length<=4096)this.manifestKeys[id]=value;}
   const backoff=cache.apiRetry;if(backoff&&Number.isFinite(backoff.until)&&backoff.until>this.clock()&&backoff.until<=this.clock()+86400000)this.apiRetry={until:backoff.until,mode:backoff.mode==='authenticated'?'authenticated':'anonymous'};
   this.checkedAt=Math.max(0,...Object.values(this.states).map(s=>s.lastAttemptAt??0))||null;this.updateErrors();
  }catch(e){if(e.code!=='ENOENT')this.cacheWarning='The saved version catalog could not be read. A successful check will rebuild it.';}
 }
 async saveCache(){
  if(!this.cachePath)return;
  const value={version:1,items:this.items,states:this.states,manifestKeys:this.manifestKeys,apiRetry:this.apiRetry??null};
  try{if(Buffer.byteLength(JSON.stringify(value))>cacheLimit)throw Error('Catalog too large');await atomicJson(this.cachePath,value);this.cacheWarning=null;}catch{this.cacheWarning='Could not save the version catalog. The next startup may require a connection.';}
 }
 updateErrors(){this.errors=this.sources.flatMap(source=>{const state=this.states[key(source)];if(!state?.error)return [];return [{productId:source.productId,repository:source.repository,code:state.error,status:state.status??null,retryAt:state.retryAt??null,message:messages[state.error]??messages.network,usingCache:this.items.some(i=>i.productId===source.productId&&i.repository===source.repository)}];});}
 async bytes(url,max,{onProgress,signal,metadata=false}={}){
  const api=new URL(url).origin==='https://api.github.com',token=api?this.getToken():null,authMode=mode(token),now=this.clock(),cached=metadata?this.httpCache.get(url):null;
  if(api&&this.apiRetry?.mode===authMode&&this.apiRetry.until>now)throw problem('rateLimited',403,this.apiRetry.until);
  const headers={Accept:'application/vnd.github+json',...(api?{'X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})}:{}),...(cached?.etag?{'If-None-Match':cached.etag}:{})};
  let response;try{response=await this.fetchImpl(url,{headers,redirect:api?'error':'follow',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(onProgress?600000:30000)]):AbortSignal.timeout(onProgress?600000:30000)});}catch{throw problem('network');}
  if(response.status===304&&cached)return cached.data;
  if(!response.ok){const status=response.status,limited=status===429||status===403&&(response.headers.get('x-ratelimit-remaining')==='0'||response.headers.has('retry-after'));let retryAt;
   if(limited){const retry=response.headers.get('retry-after'),reset=Number(response.headers.get('x-ratelimit-reset'))*1000;retryAt=Math.min(now+86400000,Math.max(now+1000,retry?(Number.isFinite(Number(retry))?now+Number(retry)*1000:Date.parse(retry))||now+60000:reset>now?reset:now+60000));if(api)this.apiRetry={until:retryAt,mode:authMode};}
   await response.body?.cancel().catch(()=>{});throw problem(limited?'rateLimited':status===401?'unauthorized':status===403?'forbidden':status===404?'notFound':status>=500?'serviceUnavailable':'invalidResponse',status,retryAt);
  }
  if(Number(response.headers.get('content-length')??0)>max)throw problem('invalidResponse');
  const chunks=[];let size=0;try{for await(const chunk of response.body){size+=chunk.length;if(size>max)throw problem('invalidResponse');chunks.push(chunk);onProgress?.(size);}}catch(e){throw e.discoveryCode?e:problem('network');}
  const data=Buffer.concat(chunks);if(metadata){if(this.httpCache.size>=2048)this.httpCache.delete(this.httpCache.keys().next().value);this.httpCache.set(url,{data,etag:response.headers.get('etag')});}return data;
 }
 async refresh(force=false){
  if(this.flight)return this.flight;
  this.flight=(async()=>{
   const credential=this.getToken();if(this.lastCredential!==undefined&&credential!==this.lastCredential){this.apiRetry=null;for(const state of Object.values(this.states))state.retryAt=null;}this.lastCredential=credential;
   let didCheck=false;
   // Sequential source checks share GitHub's quota and stop immediately on a limit response.
   for(const source of this.sources){const state=this.states[key(source)]??={},now=this.clock(),authMode=mode(this.getToken());
    if(state.retryAt>now&&state.retryMode===authMode||!force&&state.checkedAt!=null&&now-state.checkedAt<ttl&&!state.error)continue;
    didCheck=true;const previous=this.items.filter(i=>i.productId===source.productId&&i.repository===source.repository),items=[],prs=new Map(),nextKeys={};let partial=false;
    try{
     const releases=[];for(let page=1;page<=10;page++){let batch;try{batch=JSON.parse((await this.bytes(`https://api.github.com/repos/${source.repository}/releases?per_page=100&page=${page}`,4*1024*1024,{metadata:true})).toString());}catch(e){throw e.discoveryCode?e:problem('invalidResponse');}if(!Array.isArray(batch))throw problem('invalidResponse');releases.push(...batch);if(batch.length<100)break;if(page===10)throw problem('invalidResponse');}
     for(const release of releases.filter(r=>!r.draft&&(/^v\d+\.\d+\.\d+$/.test(r.tag_name)||/^experimental-pr-\d+-[a-f0-9]{40}$/.test(r.tag_name)))){
      const asset=release.assets?.find(a=>a.name==='axiom-release.json');if(!asset)continue;
      let item;try{const signature=JSON.stringify([asset.browser_download_url,asset.id,asset.size,asset.updated_at]),old=previous.find(i=>i.releaseUrl.endsWith('/'+encodeURIComponent(release.tag_name)));if(old&&this.manifestKeys[old.repository+'#'+old.id]===signature)item=this.validateRelease(old,source,release);else{const value=JSON.parse((await this.bytes(this.assetUrl(asset.browser_download_url,source.repository,release.tag_name),65536)).toString());item=this.validateRelease(value,source,release);}nextKeys[item.repository+'#'+item.id]=signature;}catch(e){if(e.discoveryCode)throw e;partial=true;continue;}
      if(item.channel==='experimental'){const id=item.build.pullRequest;if(!prs.has(id)){let pr;try{pr=JSON.parse((await this.bytes(`https://api.github.com/repos/${source.repository}/pulls/${id}`,65536,{metadata:true})).toString());}catch(e){throw e.discoveryCode?e:problem('invalidResponse');}if(!['open','closed'].includes(pr?.state))throw problem('invalidResponse');prs.set(id,pr);}const pr=prs.get(id);if(pr.state==='closed'||pr.merged_at)continue;}
      items.push(item);
     }
     Object.assign(this.manifestKeys,nextKeys);this.items=[...this.items.filter(i=>i.productId!==source.productId),...items];this.states[key(source)]={checkedAt:now,lastAttemptAt:now,error:partial?'invalidRelease':null,retryAt:partial?now+60000:null,retryMode:authMode};
    }catch(e){const code=e.discoveryCode??'network';this.states[key(source)]={...state,lastAttemptAt:now,error:code,retryAt:e.retryAt??now+60000,retryMode:authMode,status:e.status??null};}
   }
   if(!didCheck)return this.view();
   this.items.sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)||this.compareVersions(b.version,a.version));this.checkedAt=this.clock();this.updateErrors();await this.saveCache();return this.view();
  })();try{await this.flight;}finally{this.flight=null;}return this.view();
 }
 discoveryView(){return {sourceStatus:this.sources.map(s=>({productId:s.productId,repository:s.repository,...this.states[key(s)],cached:this.items.some(i=>i.productId===s.productId&&i.repository===s.repository)})),cacheWarning:this.cacheWarning??null};}
}

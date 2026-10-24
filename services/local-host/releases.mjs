import {distribution} from './distribution.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,rename,rm,lstat,realpath,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {PLATFORM_VERSION,assert} from '../../packages/contracts/index.mjs';
import {extractRelease} from '../local-files/release-zip.mjs';
import {inside} from './paths.mjs';
export {defaultSources as sources} from './release-sources.mjs';
import {releaseSources} from './release-sources.mjs';
export function compareVersions(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;}
function assetUrl(url,repository,tag){const u=new URL(url);assert(u.protocol==='https:'&&u.hostname==='github.com'&&!u.port&&!u.username&&!u.password&&u.pathname.slice(0,('/'+repository+'/releases/download/').length).toLowerCase()===('/'+repository+'/releases/download/').toLowerCase()&&u.pathname.slice(('/'+repository+'/releases/download/').length).startsWith(encodeURIComponent(tag)+'/'),'invalidRequest','Release asset must belong to the official repository and tag.');return u.href;}
export function validateRelease(value,source,release){
 const build=distribution({...value?.build,channel:value?.channel??'stable'}),experimental=build.channel==='experimental';
 assert(experimental===!!release.prerelease,'invalidRequest','Release channel does not match GitHub publication.');
 assert(value?.schemaVersion===1&&value.productId===source.productId&&/^\d+\.\d+\.\d+$/.test(value.version)&&(experimental?release.tag_name===`experimental-pr-${build.pullRequest}-${build.commit}`&&release.target_commitish===build.commit:release.tag_name==='v'+value.version),'incompatibleVersion','Release identity/version mismatch.');
 assert(value.platformApiRange==='>=0.1.0 <0.2.0'&&Array.isArray(value.artifacts)&&value.artifacts.length>0&&value.artifacts.length<=12,'incompatibleVersion','Unsupported release contract.');
 assert(new Set(value.artifacts.map(a=>a.platform+':'+a.arch)).size===value.artifacts.length,'invalidRequest','Duplicate release platform/architecture.');
 const artifacts=value.artifacts.map(a=>{assert(['win32','linux','darwin'].includes(a.platform)&&['x64','arm64'].includes(a.arch)&&/^[\w.-]+\.zip$/.test(a.name)&&/^[a-f0-9]{64}$/.test(a.sha256)&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&a.bytes<=128*1024*1024,'invalidRequest','Invalid release artifact.');const asset=release.assets.find(item=>item.name===a.name);assert(asset&&asset.size===a.bytes,'invalidRequest','Release artifact is missing or has changed.');return {...a,url:assetUrl(asset.browser_download_url,source.repository,release.tag_name)};});
 return {...value,channel:build.channel,build:experimental?build:null,publishedAt:release.published_at??null,artifacts,repository:source.repository,name:source.name,releaseUrl:`https://github.com/${source.repository}/releases/tag/${encodeURIComponent(release.tag_name)}`,id:source.productId+'@'+value.version+(experimental?'~'+build.commit:'')};
}
export class ReleaseCatalog{
 constructor({fetchImpl=fetch,platform=process.platform,arch=process.arch,clock=Date.now}={}){Object.assign(this,{fetchImpl,platform,arch,clock});this.sources=releaseSources();this.items=[];this.errors=[];this.checkedAt=null;this.flight=null;this.installs=new Set();}
 async configure(overrides={}){const next=releaseSources(overrides);if(this.flight)await this.flight;this.sources=next;this.items=[];this.errors=[];this.checkedAt=null;}
 async bytes(url,max){const response=await this.fetchImpl(url,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(30000)});assert(response.ok,'operationFailed',`Release service returned HTTP ${response.status}.`);assert(Number(response.headers.get('content-length')??0)<=max,'invalidRequest','Release response exceeds the limit.');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;assert(size<=max,'invalidRequest','Release response exceeds the limit.');chunks.push(chunk);}return Buffer.concat(chunks);}
 async refresh(force=false){
  if(this.flight)return this.flight;if(!force&&this.checkedAt&&this.clock()-this.checkedAt<600000)return this.view();
  this.flight=(async()=>{const items=[],errors=[];await Promise.all(this.sources.map(async source=>{try{
   const releases=[];for(let page=1;page<=10;page++){const batch=JSON.parse((await this.bytes(`https://api.github.com/repos/${source.repository}/releases?per_page=100&page=${page}`,4*1024*1024)).toString());assert(Array.isArray(batch),'invalidRequest','Invalid release list.');releases.push(...batch);if(batch.length<100)break;if(page===10)errors.push({productId:source.productId,message:'Release history exceeds the 1,000-publication catalog limit.'});}
   for(const release of releases.filter(r=>!r.draft&&(/^v\d+\.\d+\.\d+$/.test(r.tag_name)||/^experimental-pr-\d+-[a-f0-9]{40}$/.test(r.tag_name)))){
    const asset=release.assets?.find(a=>a.name==='axiom-release.json');if(!asset)continue;
    try{const value=JSON.parse((await this.bytes(assetUrl(asset.browser_download_url,source.repository,release.tag_name),65536)).toString());items.push(validateRelease(value,source,release));}catch{errors.push({productId:source.productId,message:`Ignored invalid release ${release.tag_name}.`});}
   }
  }catch{errors.push({productId:source.productId,message:'Release check unavailable. Retry later; installed versions remain usable.'});items.push(...this.items.filter(i=>i.productId===source.productId));}}));this.items=items.sort((a,b)=>compareVersions(b.version,a.version)||(a.channel==='stable'?-1:1)-(b.channel==='stable'?-1:1)||(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));this.errors=errors;this.checkedAt=this.clock();return this.view();})();try{return await this.flight;}finally{this.flight=null;}
 }
 view(installations=[]){
  const compatible=this.items.map(i=>({...i,artifact:i.artifacts.find(a=>a.platform===this.platform&&a.arch===this.arch)??null}));
  const pending=this.sources.filter(s=>s.productId!=='axiom.platform').filter(s=>{const active=installations.find(i=>i.productId===s.productId&&i.active&&!i.error);return active&&(installations.some(i=>i.productId===s.productId&&!i.error&&compareVersions(i.version,active.version)>0)||compatible.some(r=>r.productId===s.productId&&r.artifact&&!installations.some(i=>i.productId===r.productId&&(i.releaseId===r.id||r.channel==='stable'&&i.version===r.version&&i.channel!=='experimental'))&&(compareVersions(r.version,active.version)>0||r.version===active.version&&(r.channel==='experimental'?r.build.commit!==active.commit:active.channel==='experimental'))));});
  return {sources:this.sources,products:this.sources.filter(s=>s.productId!=='axiom.platform'),checkedAt:this.checkedAt,checking:!!this.flight,items:compatible,errors:this.errors,pending:pending.map(s=>s.productId),platformUpdate:compatible.find(r=>r.productId==='axiom.platform'&&r.channel==='stable'&&r.artifact&&compareVersions(r.version,PLATFORM_VERSION)>0)??null};
 }
 async install(id,manager){
  const release=this.view().items.find(r=>r.id===id);assert(release?.artifact&&release.productId!=='axiom.platform','invalidRequest','Choose an available compatible product release.');assert(!this.installs.has(id),'projectBusy','This release is already being installed.');this.installs.add(id);let staging,published=false;
  try{
   const root=manager.store.value.productRoot;assert(typeof root==='string','invalidRequest','Choose product storage in Settings.');await mkdir(root,{recursive:true});assert(!(await lstat(root)).isSymbolicLink(),'permissionDenied','Product storage cannot be a symbolic link.');const canonical=await realpath(root),target=join(canonical,release.productId+'-'+release.version+(release.channel==='experimental'?'-experimental-'+release.build.commit:''));
   try{await lstat(target);assert(false,'projectBusy','This version folder already exists. Add its folder manually or choose another storage directory.');}catch(error){if(error.code!=='ENOENT')throw error;}
   const data=await this.bytes(release.artifact.url,release.artifact.bytes);assert(data.length===release.artifact.bytes&&createHash('sha256').update(data).digest('hex')===release.artifact.sha256,'invalidRequest','Release checksum/size mismatch. Nothing was installed.');
   staging=join(canonical,'.install-'+randomUUID());await mkdir(staging);await extractRelease(data,staging);
   const manifest=JSON.parse(await readFile(join(staging,'platform/product.json'),'utf8'));assert(manifest.productId===release.productId&&manifest.productVersion===release.version,'incompatibleVersion','Downloaded product descriptor differs from the release.');
   if(release.channel==='experimental'){const build=distribution(JSON.parse(await readFile(join(staging,'axiom-build.json'),'utf8')));assert(build.commit===release.build.commit&&build.pullRequest===release.build.pullRequest&&build.runId===release.build.runId,'incompatibleVersion','Package build provenance differs from its release.');}
   assert(inside(canonical,resolve(staging))&&inside(canonical,resolve(target)),'permissionDenied','Installation path escapes storage.');await rename(staging,target);published=true;
   const installationId=await manager.registry.add(target);await manager.probeInstallation(installationId);if(release.channel!=='experimental'||!manager.registry.selected[release.productId])await manager.registry.activate(installationId,manager.busyProducts);manager.products=manager.registry.products;return manager.catalog();
  }finally{this.installs.delete(id);if(staging&&!published)await rm(staging,{recursive:true,force:true});}
 }
}

import {createHash,randomUUID} from 'node:crypto';
import {mkdir,rename,rm,lstat,realpath,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {PLATFORM_VERSION,assert} from '../../packages/contracts/index.mjs';
import {extractRelease} from '../local-files/release-zip.mjs';
import {inside} from './paths.mjs';
export const sources=Object.freeze([
 {productId:'axiom.platform',name:'Axiom Platform',repository:'Krozzeo/AxiomPlatform'},
 {productId:'axiom.game-engine',name:'Axiom Game Engine',repository:'Krozzeo/AxiomGameEngine'},
 {productId:'axiom.math-lab',name:'Axiom Math Lab',repository:'Krozzeo/AxiomMathLab'}
]);
export function compareVersions(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;}
function assetUrl(url,repository,tag){const u=new URL(url);assert(u.protocol==='https:'&&u.hostname==='github.com'&&!u.port&&!u.username&&!u.password&&u.pathname.startsWith('/'+repository+'/releases/download/'+encodeURIComponent(tag)+'/'),'invalidRequest','Release asset must belong to the official repository and tag.');return u.href;}
export function validateRelease(value,source,release){
 assert(value?.schemaVersion===1&&value.productId===source.productId&&/^\d+\.\d+\.\d+$/.test(value.version)&&release.tag_name==='v'+value.version,'incompatibleVersion','Release identity/version mismatch.');
 assert(value.platformApiRange==='>=0.1.0 <0.2.0'&&Array.isArray(value.artifacts)&&value.artifacts.length>0&&value.artifacts.length<=12,'incompatibleVersion','Unsupported release contract.');
 assert(new Set(value.artifacts.map(a=>a.platform+':'+a.arch)).size===value.artifacts.length,'invalidRequest','Duplicate release platform/architecture.');
 const artifacts=value.artifacts.map(a=>{assert(['win32','linux','darwin'].includes(a.platform)&&['x64','arm64'].includes(a.arch)&&/^[\w.-]+\.zip$/.test(a.name)&&/^[a-f0-9]{64}$/.test(a.sha256)&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&a.bytes<=128*1024*1024,'invalidRequest','Invalid release artifact.');const asset=release.assets.find(item=>item.name===a.name);assert(asset&&asset.size===a.bytes,'invalidRequest','Release artifact is missing or has changed.');return {...a,url:assetUrl(asset.browser_download_url,source.repository,release.tag_name)};});
 return {...value,artifacts,repository:source.repository,name:source.name,releaseUrl:`https://github.com/${source.repository}/releases/tag/${encodeURIComponent(release.tag_name)}`,id:source.productId+'@'+value.version};
}
export class ReleaseCatalog{
 constructor({fetchImpl=fetch,platform=process.platform,arch=process.arch,clock=Date.now}={}){Object.assign(this,{fetchImpl,platform,arch,clock});this.items=[];this.errors=[];this.checkedAt=null;this.flight=null;this.installs=new Set();}
 async bytes(url,max){const response=await this.fetchImpl(url,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(30000)});assert(response.ok,'operationFailed',`Release service returned HTTP ${response.status}.`);assert(Number(response.headers.get('content-length')??0)<=max,'invalidRequest','Release response exceeds the limit.');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;assert(size<=max,'invalidRequest','Release response exceeds the limit.');chunks.push(chunk);}return Buffer.concat(chunks);}
 async refresh(force=false){
  if(this.flight)return this.flight;if(!force&&this.checkedAt&&this.clock()-this.checkedAt<600000)return this.view();
  this.flight=(async()=>{const items=[],errors=[];await Promise.all(sources.map(async source=>{try{
   const releases=JSON.parse((await this.bytes(`https://api.github.com/repos/${source.repository}/releases?per_page=30`,1024*1024)).toString());assert(Array.isArray(releases),'invalidRequest','Invalid release list.');
   for(const release of releases.filter(r=>!r.draft&&!r.prerelease&&/^v\d+\.\d+\.\d+$/.test(r.tag_name)).slice(0,20)){
    const asset=release.assets?.find(a=>a.name==='axiom-release.json');if(!asset)continue;
    try{const value=JSON.parse((await this.bytes(assetUrl(asset.browser_download_url,source.repository,release.tag_name),65536)).toString());items.push(validateRelease(value,source,release));}catch{errors.push({productId:source.productId,message:`Ignored invalid release ${release.tag_name}.`});}
   }
  }catch{errors.push({productId:source.productId,message:'Release check unavailable. Retry later; installed versions remain usable.'});items.push(...this.items.filter(i=>i.productId===source.productId));}}));this.items=items.sort((a,b)=>compareVersions(b.version,a.version));this.errors=errors;this.checkedAt=this.clock();return this.view();})();try{return await this.flight;}finally{this.flight=null;}
 }
 view(installations=[]){const compatible=this.items.map(i=>({...i,artifact:i.artifacts.find(a=>a.platform===this.platform&&a.arch===this.arch)??null})),pending=sources.filter(s=>s.productId!=='axiom.platform').filter(s=>{const newest=compatible.find(r=>r.productId===s.productId&&r.artifact),installed=installations.filter(i=>i.productId===s.productId&&!i.error).sort((a,b)=>compareVersions(b.version,a.version))[0];return newest&&(!installed||compareVersions(newest.version,installed.version)>0);});return {checkedAt:this.checkedAt,checking:!!this.flight,items:compatible,errors:this.errors,pending:pending.map(s=>s.productId),platformUpdate:compatible.find(r=>r.productId==='axiom.platform'&&r.artifact&&compareVersions(r.version,PLATFORM_VERSION)>0)??null};}
 async install(id,manager){
  const release=this.view().items.find(r=>r.id===id);assert(release?.artifact&&release.productId!=='axiom.platform','invalidRequest','Choose an available compatible product release.');assert(!this.installs.has(id),'projectBusy','This release is already being installed.');this.installs.add(id);let staging,published=false;
  try{
   const root=manager.store.value.productRoot;assert(typeof root==='string','invalidRequest','Choose product storage in Settings.');await mkdir(root,{recursive:true});assert(!(await lstat(root)).isSymbolicLink(),'permissionDenied','Product storage cannot be a symbolic link.');const canonical=await realpath(root),target=join(canonical,release.productId+'-'+release.version);
   try{await lstat(target);assert(false,'projectBusy','This version folder already exists. Add its folder manually or choose another storage directory.');}catch(error){if(error.code!=='ENOENT')throw error;}
   const data=await this.bytes(release.artifact.url,release.artifact.bytes);assert(data.length===release.artifact.bytes&&createHash('sha256').update(data).digest('hex')===release.artifact.sha256,'invalidRequest','Release checksum/size mismatch. Nothing was installed.');
   staging=join(canonical,'.install-'+randomUUID());await mkdir(staging);await extractRelease(data,staging);
   const manifest=JSON.parse(await readFile(join(staging,'platform/product.json'),'utf8'));assert(manifest.productId===release.productId&&manifest.productVersion===release.version,'incompatibleVersion','Downloaded product descriptor differs from the release.');
   assert(inside(canonical,resolve(staging))&&inside(canonical,resolve(target)),'permissionDenied','Installation path escapes storage.');await rename(staging,target);published=true;
   const installationId=await manager.registry.add(target);await manager.probeInstallation(installationId);await manager.registry.activate(installationId,manager.busyProducts);manager.products=manager.registry.products;return manager.catalog();
  }finally{this.installs.delete(id);if(staging&&!published)await rm(staging,{recursive:true,force:true});}
 }
}

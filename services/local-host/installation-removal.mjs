import {lstat,readdir,realpath,readFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {assert} from '../../packages/contracts/index.mjs';
import {inside} from './paths.mjs';
import {inspectInstallation,installationRoot} from './installations.mjs';
const applicationRoot=fileURLToPath(new URL('../../',import.meta.url));
async function snapshot(folder){
 const records=[];let bytes=0;
 async function walk(path){const s=await lstat(path);assert(!s.isSymbolicLink()&&(s.isDirectory()||s.isFile()&&s.nlink===1),'permissionDenied','Installation removal refuses linked or special files.');assert(records.length<20000,'invalidRequest','Installation contains too many files to review safely.');records.push([path,s.ino,s.size,s.mtimeMs]);if(s.isDirectory())for(const n of(await readdir(path)).sort())await walk(join(path,n));else{bytes+=s.size;if(path.endsWith('.json')&&s.size<=4*1024*1024){let v;try{v=JSON.parse(await readFile(path,'utf8'));}catch{}assert(!(v?.schemaVersion===1&&typeof v.id==='string'&&v.id.startsWith('project://')),'permissionDenied','This installation contains a project. Move the project outside the installation first.');}}}
 await walk(folder);return {hash:createHash('sha256').update(JSON.stringify(records)).digest('hex'),files:records.length,bytes};
}
export class InstallationRemoval{
 constructor(manager){this.manager=manager;this.plans=new Map();}
 async target(id){const m=this.manager,item=m.registry.items.get(id);assert(item,'invalidRequest','Choose an installed version.');assert(![...(m.demoJobs?.jobs.values()??[])].some(j=>j.installationId===id&&j.state==='running'),'projectBusy','Wait for demo loading to finish before removing this installation.');assert(![...m.sessions.values()].some(s=>['starting','ready'].includes(s.state)&&(s.installationId===id||!s.installationId&&s.productId===item.productId)),'projectBusy','Close this installation’s project sessions before removing it.');
  if(!item.error){const checked=await inspectInstallation(item.path);assert(checked.id===id,'revisionConflict','Installation changed. Refresh it before removal.');}const requested=installationRoot(item.path),folder=await realpath(requested);assert(!(await lstat(requested)).isSymbolicLink()&&folder!==dirname(folder),'permissionDenied','Choose an ordinary installation folder.');
  const protectedPaths=[applicationRoot,m.root,m.store.root,m.store.value.productRoot,...m.store.value.recents.flatMap(p=>[p.path,p.storageRoot]),...[...m.registry.items.values()].filter(i=>i.id!==id).map(i=>installationRoot(i.path))].filter(Boolean);
  for(const path of protectedPaths){const canonical=await realpath(path).catch(e=>{if(e.code==='ENOENT')return resolve(path);throw e;});assert(!inside(folder,canonical),'permissionDenied','Installation contains protected storage, another installation or project files.');}return {item,folder};
 }
 async review(id){const {item,folder}=await this.target(id),info=await snapshot(folder),planId=randomUUID();if(this.plans.size>=64)this.plans.delete(this.plans.keys().next().value);this.plans.set(planId,{id,folder,...info,expires:Date.now()+120000});return {planId,installationId:id,folder,version:item.version,name:item.manifest?.displayName??item.productId,files:info.files,bytes:info.bytes};}
 async remove(data){const plan=this.plans.get(data.planId);assert(data.confirm===true&&plan&&plan.id===data.installationId&&plan.expires>Date.now(),'invalidRequest','Review and confirm moving this installation to the Recycle Bin.');const {folder}=await this.target(plan.id);assert(folder===plan.folder&&(await snapshot(folder)).hash===plan.hash,'revisionConflict','Installation files changed. Review removal again.');this.plans.delete(data.planId);
  await this.manager.recycle(folder);
  const r=this.manager.registry;r.items.delete(plan.id);for(const map of[r.selected,r.previous,r.pending])for(const[product,id]of Object.entries(map))if(id===plan.id)delete map[product];await r.persist();this.manager.products=r.products;return this.manager.catalog();
 }
}

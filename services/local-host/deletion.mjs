import {lstat,readdir,realpath,readFile,rm} from 'node:fs/promises';
import {dirname,join,resolve,relative} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {inside,authorizedPath} from './paths.mjs';
import {assert} from '../../packages/contracts/index.mjs';
async function snapshot(root,file){
 const records=[];let bytes=0;async function walk(path){const info=await lstat(path);assert(!info.isSymbolicLink()&&(info.isDirectory()||info.isFile()&&info.nlink===1),'permissionDenied','Project deletion refuses linked or special files.');assert(records.length<16384,'invalidRequest','Project has too many files for safe deletion.');records.push([path,info.ino,info.size,info.mtimeMs]);if(info.isDirectory())for(const n of (await readdir(path)).sort())await walk(join(path,n));else bytes+=info.size;}
 await walk(root);const document=await readFile(file);return {hash:createHash('sha256').update(JSON.stringify(records)).update(document).digest('hex'),files:records.length,bytes};
}
export class ProjectDeletion {
 constructor(manager){this.manager=manager;this.plans=new Map();}
 async review(entry){const m=this.manager,root=await realpath(m.root),file=await authorizedPath(m.root,entry.path),folder=dirname(file);assert(folder!==root&&inside(root,folder),'permissionDenied','The storage root cannot be deleted as a project.');assert(!m.store.value.recents.some(p=>p.path!==entry.path&&inside(folder,inside(m.root,p.path)?resolve(root,relative(m.root,p.path)):p.path)),'projectBusy','This folder contains another registered project.');const info=await snapshot(folder,file),id=randomUUID();this.plans.set(id,{entry:structuredClone(entry),folder,...info,expires:Date.now()+120000});if(this.plans.size>64)this.plans.delete(this.plans.keys().next().value);return {planId:id,projectId:entry.projectId,name:entry.name,folder,files:info.files,bytes:info.bytes};}
 async remove(entry,data){const plan=this.plans.get(data.planId);assert(plan&&plan.expires>Date.now()&&plan.entry.projectId===entry.projectId&&plan.entry.path===entry.path&&data.confirmName===entry.name,'invalidRequest','Confirm the current project name and review deletion again.');
  const root=await realpath(this.manager.root),file=await authorizedPath(this.manager.root,entry.path);assert(dirname(file)===plan.folder&&inside(root,plan.folder)&&plan.folder!==root,'permissionDenied','Deletion target changed.');const current=await snapshot(plan.folder,file);assert(current.hash===plan.hash,'revisionConflict','Project files changed since deletion was reviewed. Review again.');this.plans.delete(data.planId);
  // Only the canonical, reviewed folder beneath the authorized storage root is removed.
  await rm(plan.folder,{recursive:true,force:false});await this.manager.store.update(v=>{v.recents=v.recents.filter(p=>p.path!==entry.path);});return {deleted:entry.projectId};
 }
}


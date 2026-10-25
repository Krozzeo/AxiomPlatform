import {readFile,mkdir,realpath,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {atomicJson} from '../local-files/files.mjs';
import {failure} from '../../packages/contracts/index.mjs';
import {acquireProfileLock} from './profile-lock.mjs';
export class PlatformState{
  constructor(root){this.root=resolve(root);this.path=join(this.root,'platform.json');this.pending=Promise.resolve();}
  static async load(root,defaults={}){
    const state=new PlatformState(root);await mkdir(state.root,{recursive:true});
    if((await lstat(state.root)).isSymbolicLink())throw failure('permissionDenied','Settings directory cannot be a symbolic link.');
    state.lock=await acquireProfileLock(state.root);
    try{
      try{state.value=JSON.parse(await readFile(state.path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw failure('invalidRequest','Platform settings cannot be read. Restore the settings file rather than resetting it.');state.value={version:1,projectRoot:defaults.root,manifests:defaults.manifests??[],recents:[],preferences:{}};}
      const v=state.value;
      if(v.version!==1||!Array.isArray(v.recents)||v.recents.length>128||!Array.isArray(v.manifests)||!v.preferences||typeof v.preferences!=='object')throw failure('incompatibleVersion','Unsupported or invalid Platform settings.');
      for(const entry of v.recents)entry.storageRoot??=v.projectRoot;
      if(defaults.root)v.projectRoot=resolve(defaults.root);if(defaults.manifests?.length)v.manifests=defaults.manifests.map(p=>resolve(p));
      if(v.installations!==undefined&&(!Array.isArray(v.installations)||v.installations.length>64))throw failure('invalidRequest','Invalid installation registry.');
      if(typeof v.projectRoot!=='string')throw failure('invalidRequest','Choose project storage and register a product for this first launch.');
      await mkdir(v.projectRoot,{recursive:true});v.projectRoot=await realpath(v.projectRoot);
      for(const entry of v.recents)if(typeof entry?.path!=='string'||typeof entry.projectId!=='string'||typeof entry.productId!=='string'||typeof entry.storageRoot!=='string'||!entry.storageRoot.trim())throw failure('invalidRequest','Invalid recent-project entry.');
      if(v.releaseReadIds!==undefined&&(!Array.isArray(v.releaseReadIds)||v.releaseReadIds.length>10000||v.releaseReadIds.some(id=>typeof id!=='string'||id.length>512)))throw failure('invalidRequest','Invalid version inbox state.');
      if(v.demoProjects!==undefined&&(!Array.isArray(v.demoProjects)||v.demoProjects.length>128||v.demoProjects.some(r=>typeof r.key!=='string'||r.key.length!==64||!Array.isArray(r.entries)||r.entries.length>32||r.entries.some(e=>['demoId','productId','projectId','path','storageRoot','name'].some(k=>typeof e[k]!=='string'||e[k].length>4096)))))throw failure('invalidRequest','Invalid demo project registry.');
      v.productRoot??=join(state.root,'products');if(typeof v.productRoot!=='string'||!v.productRoot.trim())throw failure('invalidRequest','Choose product storage.');v.productRoot=resolve(v.productRoot);
      await atomicJson(state.path,v);return state;
    }catch(error){await state.close();throw error;}
  }
  update(change){const task=this.pending.then(async()=>{const value=structuredClone(this.value);await change(value);await atomicJson(this.path,value);this.value=value;return value;});this.pending=task.catch(()=>{});return task;}
  remember(entry){return this.update(v=>{const previous=v.recents.find(p=>p.projectId===entry.projectId&&p.productId===entry.productId);if(previous&&previous.path.toLowerCase()!==entry.path.toLowerCase())throw failure('projectBusy','This project identity already exists in the catalog. Use its registered copy.');v.recents=[{storageRoot:v.projectRoot,...previous,...entry,lastOpenedAt:new Date().toISOString()},...v.recents.filter(p=>p!==previous)].slice(0,128);});}
  async close(){await this.pending;await this.lock?.close();this.lock=null;}
}

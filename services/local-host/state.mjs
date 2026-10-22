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
      if(defaults.root)v.projectRoot=resolve(defaults.root);if(defaults.manifests?.length)v.manifests=defaults.manifests.map(p=>resolve(p));
      if(v.installations!==undefined&&(!Array.isArray(v.installations)||v.installations.length>64))throw failure('invalidRequest','Invalid installation registry.');
      if(typeof v.projectRoot!=='string'||!v.manifests.length&&!v.installations?.length)throw failure('invalidRequest','Choose project storage and register a product for this first launch.');
      await mkdir(v.projectRoot,{recursive:true});v.projectRoot=await realpath(v.projectRoot);
      for(const entry of v.recents)if(typeof entry?.path!=='string'||typeof entry.projectId!=='string'||typeof entry.productId!=='string')throw failure('invalidRequest','Invalid recent-project entry.');
      await atomicJson(state.path,v);return state;
    }catch(error){await state.close();throw error;}
  }
  update(change){const task=this.pending.then(async()=>{const value=structuredClone(this.value);await change(value);await atomicJson(this.path,value);this.value=value;return value;});this.pending=task.catch(()=>{});return task;}
  remember(entry){return this.update(v=>{const previous=v.recents.find(p=>p.projectId===entry.projectId&&p.productId===entry.productId);if(previous&&previous.path.toLowerCase()!==entry.path.toLowerCase())throw failure('projectBusy','This project identity already exists in the catalog. Use its registered copy.');v.recents=[{...previous,...entry,lastOpenedAt:new Date().toISOString()},...v.recents.filter(p=>p!==previous)].slice(0,128);});}
  async close(){await this.pending;await this.lock?.close();this.lock=null;}
}

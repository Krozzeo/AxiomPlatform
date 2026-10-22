import {readFile,realpath,lstat} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateManifest,assert} from '../../packages/contracts/index.mjs';
import {inside} from './paths.mjs';
export async function inspectInstallation(source){
 const path=await realpath(source),manifest=validateManifest(JSON.parse(await readFile(path,'utf8'))),entry=await realpath(resolve(dirname(path),manifest.launch.entry));
 assert(inside(dirname(path),entry),'permissionDenied','Adapter entry must stay inside its registered installation.');
 const fingerprint=createHash('sha256').update(JSON.stringify(manifest)).update(await readFile(entry)).digest('hex'),id=createHash('sha256').update(path+'\0'+fingerprint).digest('hex').slice(0,24);
 return {id,path,manifest,entry,fingerprint,productId:manifest.productId,version:manifest.productVersion};
}
export class Installations {
 constructor(store){this.store=store;this.items=new Map();this.products=new Map();}
 static async load(store,manifests,{allowUnavailable=false}={}){
  const self=new Installations(store),saved=store.value.installations??[],selected={...store.value.selectedInstallations},previous={...store.value.previousInstallations},pending={...store.value.pendingInstallations};
  for(const item of saved){try{const next=await inspectInstallation(item.path);assert(next.id===item.id,'incompatibleVersion','Installation files changed. Register this folder again.');self.items.set(item.id,next);}catch(e){self.items.set(item.id,{...item,error:e.message});}}
  for(const source of manifests){try{const item=await inspectInstallation(source);self.items.set(item.id,item);if(!selected[item.productId]){if(selected[item.productId]&&selected[item.productId]!==item.id)previous[item.productId]=selected[item.productId];selected[item.productId]=item.id;}}catch(e){if(!allowUnavailable)throw e;}}
  self.selected=selected;self.previous=previous;self.pending=pending;await self.persist();return self;
 }
 async persist(){const products=new Map();for(const [productId,id] of Object.entries(this.selected)){const item=this.items.get(id);if(item&&!item.error)products.set(productId,item);}
  await this.store.update(v=>{v.installations=[...this.items.values()].map(({id,path,productId,version,fingerprint})=>({id,path,productId,version,fingerprint}));v.selectedInstallations={...this.selected};v.previousInstallations={...this.previous};v.pendingInstallations={...this.pending};v.manifests=[...products.values()].map(p=>p.path);});this.products=products;
 }
 view(){return [...this.items.values()].map(i=>({id:i.id,path:i.path,productId:i.productId,displayName:i.manifest?.displayName??i.productId,version:i.version,error:i.error??null,active:this.selected[i.productId]===i.id,pending:this.pending[i.productId]===i.id,previous:this.previous[i.productId]===i.id}));}
 async add(folder){let path=folder;if((await lstat(folder)).isDirectory()){path=join(folder,'platform/product.json');try{await lstat(path);}catch(e){if(e.code!=='ENOENT')throw e;path=join(folder,'product.json');}}const item=await inspectInstallation(path);assert(this.items.size<64||this.items.has(item.id),'invalidRequest','Installation limit reached.');const previous=this.items.get(item.id);this.items.set(item.id,item);try{await this.persist();}catch(e){if(previous)this.items.set(item.id,previous);else this.items.delete(item.id);throw e;}return item.id;}
 async activate(id,busy){const item=this.items.get(id);assert(item&&!item.error,'incompatibleVersion','Choose an available compatible installation.');const checked=await inspectInstallation(item.path);assert(checked.id===id,'incompatibleVersion','Installation changed. Register it again before activation.');
  const saved={selected:{...this.selected},previous:{...this.previous},pending:{...this.pending}};try{if(busy(item.productId)){this.pending[item.productId]=id;}else{const old=this.selected[item.productId];if(old&&old!==id)this.previous[item.productId]=old;this.selected[item.productId]=id;delete this.pending[item.productId];}await this.persist();}catch(e){Object.assign(this,saved);throw e;}
 }
 async flush(busy){for(const [productId,id] of Object.entries({...this.pending}))if(!busy(productId))await this.activate(id,busy);}
}

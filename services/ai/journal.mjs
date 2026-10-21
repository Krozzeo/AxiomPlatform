import {readdir,readFile,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {atomicJson} from '../local-files/files.mjs';
import {aiError} from './contracts.mjs';
// Generic persistence envelope. The domain adapter chooses and validates its payload.
export class TaskJournal {
  constructor(root){this.root=root;this.flight=Promise.resolve();}
  async load(){
    let names;try{names=await readdir(this.root);}catch(e){if(e.code==='ENOENT')return [];throw e;}
    names=names.filter(n=>/^[a-f0-9-]{36}\.json$/.test(n));
    if(names.length>256)throw aiError('Work history limit exceeded');
    const out=[];
    for(const name of names){const path=join(this.root,name),info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size>8*1024*1024)throw aiError('Invalid work journal');const value=JSON.parse(await readFile(path,'utf8'));if(value.version!==1||value.public?.id!=='ai-task://'+name.slice(0,-5))throw aiError('Invalid work journal');out.push(value);}
    return out.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  save(value){
    const id=value.public?.id;if(!/^ai-task:\/\/[a-f0-9-]{36}$/.test(id??''))throw aiError('Invalid work journal identity');
    const snapshot=structuredClone(value);if(Buffer.byteLength(JSON.stringify(snapshot))>8*1024*1024)throw aiError('Work journal exceeds storage budget');
    const task=this.flight.catch(()=>{}).then(()=>atomicJson(join(this.root,id.slice(10)+'.json'),snapshot));this.flight=task;return task;
  }
}

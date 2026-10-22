import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {atomicJson} from '../local-files/files.mjs';
export class Notifications {
 constructor(path){this.path=path;this.items=[];this.queue=Promise.resolve();}
 async load(){try{const v=JSON.parse(await readFile(this.path,'utf8'));if(v.version!==1||!Array.isArray(v.items))throw Error('Invalid notification history');this.items=v.items.slice(-200);}catch(e){if(e.code!=='ENOENT')throw e;}return this;}
 run(data){const task=this.queue.then(async()=>{if(data.action==='add'){if(!['info','success','error'].includes(data.type)||typeof data.message!=='string'||data.message.length>1000)throw Object.assign(Error('Invalid notification'),{code:'invalidRequest'});this.items.push({id:randomUUID(),type:data.type,message:data.message,createdAt:new Date().toISOString(),readAt:null});this.items=this.items.slice(-200);}else if(data.action==='read'){for(const item of this.items)if(!data.id||item.id===data.id)item.readAt??=new Date().toISOString();}else throw Object.assign(Error('Invalid notification action'),{code:'invalidRequest'});await atomicJson(this.path,{version:1,items:this.items});return this.items;});this.queue=task.catch(()=>{});return task;}
}

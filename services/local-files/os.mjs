import {spawn} from 'node:child_process';
import {lstat,realpath,writeFile,rename,rm} from 'node:fs/promises';
import {dirname,basename,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {pickNativePath} from './dialogs.mjs';
export async function openFolder(path,{platform=process.platform,start=spawn}={}){
 const folder=await realpath(path);if(!(await lstat(folder)).isDirectory())throw Error('Choose a project folder');
 await new Promise((yes,no)=>{const child=start(platform==='win32'?'explorer.exe':platform==='darwin'?'open':'xdg-open',[folder],{windowsHide:false,shell:false,stdio:'ignore'});child.once('error',no);child.once('spawn',()=>{child.unref();yes();});});return {opened:true};
}
export async function saveDownload({name,text},{pick=pickNativePath}={}){
 if(typeof name!=='string'||name!==basename(name)||name.length>128||typeof text!=='string'||Buffer.byteLength(text)>1024*1024)throw Object.assign(Error('Export exceeds the supported file budget'),{code:'invalidRequest'});
 const {path}=await pick({mode:'save',name});if(!path)return {cancelled:true};
 try{const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1)throw Error('Choose an ordinary file');}catch(e){if(e.code!=='ENOENT')throw e;}
 const parent=await realpath(dirname(path)),target=join(parent,basename(path)),temp=target+'.'+randomUUID()+'.tmp';
 try{await writeFile(temp,text,{flag:'wx',mode:0o600});await rename(temp,target);}finally{await rm(temp,{force:true});}return {saved:true};
}

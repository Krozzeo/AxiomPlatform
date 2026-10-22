import {open,mkdir,rename,rm,lstat,realpath,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,dirname,relative,isAbsolute,join,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
const within=(root,path)=>{const r=relative(root,path);return r===''||!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep);};
export async function atomicJson(path,value){
  await mkdir(dirname(path),{recursive:true});const temporary=path+'.'+randomUUID()+'.tmp';let file;
  try{file=await open(temporary,'wx',0o600);await file.writeFile(JSON.stringify(value,null,2)+'\n');await file.sync();await file.close();file=null;await rename(temporary,path);}
  finally{await file?.close();await rm(temporary,{force:true});}
}
export async function copyProjectFiles({source,destination,paths,maxFiles=2048,maxBytes=16*1024*1024}){
  const sourceInfo=await lstat(source);if(!sourceInfo.isDirectory()||sourceInfo.isSymbolicLink())throw Error('Choose an ordinary project directory.');
  source=await realpath(source);destination=await realpath(destination);
  if(within(source,destination))throw Error('The import destination must be outside its source.');
  const files=[];let bytes=0;
  async function scan(rel){
    const path=resolve(source,rel);if(!within(source,path)||!within(source,await realpath(path)))throw Error('Project files escape the source directory.');
    const info=await lstat(path);if(info.isSymbolicLink()||!info.isFile()&&!info.isDirectory()||info.isFile()&&info.nlink!==1)throw Error('Project files cannot contain links or special files.');
    if(info.isDirectory()){for(const name of await readdir(path))await scan(join(rel,name));return;}
    bytes+=info.size;if(files.length>=maxFiles||bytes>maxBytes)throw Error('Import exceeds 2048 files or 16 MiB.');files.push({rel,path,ino:info.ino,size:info.size});
  }
  for(const rel of paths){if(typeof rel!=='string'||isAbsolute(rel)||rel.split(/[\\/]/).some(p=>!p||p==='.'||p==='..'))throw Error('Invalid project source path.');await scan(rel);}
  if(new Set(files.map(f=>f.path)).size!==files.length)throw Error('Duplicate project source path.');
  for(const file of files){
    const handle=await open(file.path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
    let data;try{const current=await handle.stat();if(current.ino!==file.ino||current.nlink!==1||current.size!==file.size)throw Error('Source changed during import.');data=await handle.readFile();if(data.length!==file.size)throw Error('Source changed during import.');}finally{await handle.close();}
    const target=resolve(destination,file.rel);if(!within(destination,target))throw Error('Invalid import destination.');await mkdir(dirname(target),{recursive:true});const out=await open(target,'wx',0o600);try{await out.writeFile(data);await out.sync();}finally{await out.close();}
  }
  return {files:files.length,bytes};
}

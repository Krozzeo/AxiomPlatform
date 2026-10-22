import {open,lstat,readFile,mkdir,rm,rmdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {failure} from '../../packages/contracts/index.mjs';

// Only a positively dead PID can be recovered. PID reuse/permission failures
// remain busy rather than risking a live profile. Legacy PID-only locks work too.
function dead(pid){try{process.kill(pid,0);return false;}catch(error){return error.code==='ESRCH';}}
async function inspect(path){
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size>1024)throw failure('projectBusy','Unsafe settings lock. Leave it in place and inspect it before recovery.');
  const text=await readFile(path,'utf8');let pid;
  if(/^[1-9]\d*$/.test(text))pid=Number(text);
  else try{const value=JSON.parse(text);if(value.version===1&&typeof value.token==='string'&&value.token.length===36)pid=value.pid;}catch{}
  if(!Number.isSafeInteger(pid)||pid<1||pid>2147483647)throw failure('projectBusy','Unreadable settings lock. Leave it in place and inspect it before recovery.');
  return {stat,text,pid};
}
function same(a,b){return a.stat.dev===b.stat.dev&&a.stat.ino===b.stat.ino&&a.text===b.text;}
export async function acquireProfileLock(root){
  const path=join(root,'platform.lock'),gate=join(root,'platform.lock.recovery');
  const content=JSON.stringify({version:1,pid:process.pid,token:randomUUID()});
  async function create(){
    const handle=await open(path,'wx',0o600);
    try{await handle.writeFile(content);await handle.sync();}finally{await handle.close();}
    let released=false;
    return {async close(){
      if(released)return;released=true;
      try{if((await inspect(path)).text===content)await rm(path);}catch(error){if(error.code!=='ENOENT')throw error;}
    }};
  }
  try{return await create();}catch(error){if(error.code!=='EEXIST')throw error;}
  let previous;
  try{previous=await inspect(path);}catch(error){if(error.code==='ENOENT')return acquireProfileLock(root);throw error;}
  if(!dead(previous.pid))throw failure('projectBusy',`Another Platform instance owns these settings (PID ${previous.pid}). Close its console before starting another version.`);
  // Serialize stale recovery. Never remove an existing recovery gate: a crash
  // during this very short operation needs explicit inspection, not a guess.
  try{await mkdir(gate);}catch(error){if(error.code==='EEXIST')throw failure('projectBusy','Settings lock recovery is in progress or was interrupted. Retry; if it persists, inspect platform.lock.recovery.');throw error;}
  try{
    let current;try{current=await inspect(path);}catch(error){if(error.code==='ENOENT')return await create();throw error;}
    if(!same(previous,current)||!dead(current.pid))throw failure('projectBusy','Settings ownership changed. Retry startup.');
    await rm(path);
    try{return await create();}catch(error){if(error.code==='EEXIST')throw failure('projectBusy','Another Platform instance started during recovery.');throw error;}
  }finally{await rmdir(gate);}
}

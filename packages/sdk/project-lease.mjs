import {open,readFile,rm,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

const filename = root => join(root,'.axiom-platform-session.lock');
const busy = () => Object.assign(Error('This project folder belongs to an active or interrupted Platform session. Close its session or recover the stale lease explicitly.'),{code:'AX_PROJECT_0004'});
export async function assertPlatformLease(root) {
  try {
    const info=await lstat(filename(root));
    if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size>2048)throw busy();
    const lease=JSON.parse(await readFile(filename(root),'utf8'));
    if(lease.pid!==process.pid)throw busy();
  }catch(error){if(error.code==='ENOENT')return;throw busy();}
}
export async function acquireLease(root,sessionId) {
  const path=filename(root),nonce=randomUUID();let handle;
  try{handle=await open(path,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw busy();throw error;}
  try{await handle.writeFile(JSON.stringify({pid:process.pid,sessionId,nonce})+'\n');await handle.sync();}finally{await handle.close();}
  return async()=>{try{const lease=JSON.parse(await readFile(path,'utf8'));if(lease.nonce===nonce)await rm(path);}catch(error){if(error.code!=='ENOENT')throw error;}};
}

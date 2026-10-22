import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
export async function openBrowser(url,{platform=process.platform,run=execute}={}){
 const value=new URL(url);if(value.protocol!=='http:'||value.hostname!=='127.0.0.1')throw Error('Only the local Platform URL can be opened.');
 if(platform==='win32')await run('powershell.exe',['-NoProfile','-NonInteractive','-Command','Start-Process -FilePath $env:AXIOM_OPEN_URL'],{windowsHide:true,env:{...process.env,AXIOM_OPEN_URL:url},timeout:15000});
 else await run(platform==='darwin'?'open':'xdg-open',[url],{timeout:15000});
}

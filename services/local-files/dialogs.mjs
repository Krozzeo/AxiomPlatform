import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const execute=promisify(execFile),source=fileURLToPath(new URL('./windows/CommonDialogs.cs',import.meta.url));
export const nativeScript='Add-Type -AssemblyName System.Windows.Forms; Add-Type -Path $env:AXIOM_DIALOG_SOURCE -ReferencedAssemblies System.Windows.Forms,System.Drawing; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); if($env:AXIOM_DIALOG_ACTION -eq "recycle"){[Axiom.Native.CommonDialogs]::Recycle($env:AXIOM_DIALOG_INITIAL)}else{[Console]::Write([Axiom.Native.CommonDialogs]::Choose($env:AXIOM_DIALOG_ACTION,$env:AXIOM_DIALOG_INITIAL,$env:AXIOM_DIALOG_NAME))}';
export async function pickNativePath({initial='',mode='folder',name='',platform=process.platform,run=execute,signal,timeoutMs=120000}={}){
 if(!['folder','file','save'].includes(mode)||typeof initial!=='string'||initial.length>2048||typeof name!=='string'||name.length>255)throw Object.assign(Error('Invalid native dialog request'),{code:'invalidRequest'});
 try{let result;const options={windowsHide:true,maxBuffer:8192,timeout:timeoutMs,signal};
  if(platform==='win32')result=await run('powershell.exe',['-NoProfile','-STA','-Command',nativeScript],{...options,env:{...process.env,AXIOM_DIALOG_SOURCE:source,AXIOM_DIALOG_ACTION:mode,AXIOM_DIALOG_INITIAL:initial,AXIOM_DIALOG_NAME:name}});
  else if(platform==='linux')result=await run('zenity',['--file-selection',...(mode==='folder'?['--directory']:mode==='save'?['--save','--confirm-overwrite']:[]),'--title=Axiom '+mode,...(initial?['--filename='+initial+(mode==='folder'?'/':'')]:[])],options);
  else {const script=mode==='folder'?'POSIX path of (choose folder)':mode==='save'?'POSIX path of (choose file name)':'POSIX path of (choose file)';result=await run('osascript',['-e',script],options);}
  return {path:result.stdout.trim()||null};
 }catch(error){if(signal?.aborted||error.code===1&&!error.stderr||platform==='darwin'&&String(error.stderr).includes('(-128)'))return {path:null};throw Object.assign(Error(error.killed||error.code==='ETIMEDOUT'?'File selection timed out. Try again or enter the path manually.':'The native file dialog is unavailable. Enter the path manually or retry.'),{code:'operationFailed'});}
}
export async function recycleNative(path,{platform=process.platform,run=execute}={}){
 try{if(platform==='win32')await run('powershell.exe',['-NoProfile','-STA','-Command',nativeScript],{windowsHide:true,timeout:120000,env:{...process.env,AXIOM_DIALOG_SOURCE:source,AXIOM_DIALOG_ACTION:'recycle',AXIOM_DIALOG_INITIAL:path,AXIOM_DIALOG_NAME:''}});
 else if(platform==='linux')await run('gio',['trash','--',path],{timeout:120000});else await run('osascript',['-e','on run argv','-e','tell application "Finder" to delete (POSIX file (item 1 of argv))','-e','end run',path],{timeout:120000});
 }catch{throw Object.assign(Error('The project could not be moved to the Recycle Bin. No permanent-delete fallback was attempted.'),{code:'operationFailed'});}
}

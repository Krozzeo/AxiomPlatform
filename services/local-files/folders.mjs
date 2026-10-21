import {homedir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
// Native selection stays in the local daemon. User paths never become shell code.
export async function pickFolder({initial='',platform=process.platform,run=execute,signal,timeoutMs=120000}={}){
 if(typeof initial!=='string'||initial.length>1024)throw Error('Invalid initial folder');
 try{
  let result;
  const options={windowsHide:true,maxBuffer:8192,timeout:timeoutMs,signal};
  if(platform==='win32')result=await run('powershell.exe',['-NoProfile','-STA','-Command','Add-Type -AssemblyName System.Windows.Forms; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $owner=New-Object System.Windows.Forms.Form; $owner.Text="Axiom folder selection"; $owner.TopMost=$true; $owner.ShowInTaskbar=$false; $owner.StartPosition="CenterScreen"; $owner.Size=New-Object System.Drawing.Size(1,1); $picker=New-Object System.Windows.Forms.FolderBrowserDialog; $picker.Description="Choose an Axiom folder"; $picker.SelectedPath=$env:AXIOM_PICKER_INITIAL; try { $owner.Show(); $owner.Activate(); $owner.BringToFront(); if($picker.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK){[Console]::Write($picker.SelectedPath)} } finally {$picker.Dispose(); $owner.Close(); $owner.Dispose()}'],{...options,env:{...process.env,AXIOM_PICKER_INITIAL:initial}});
  else if(platform==='darwin')result=await run('osascript',['-e','POSIX path of (choose folder with prompt "Choose an Axiom project folder")'],options);
  else result=await run('zenity',['--file-selection','--directory','--title=Choose an Axiom project folder',...(initial?['--filename='+initial+'/']:[])],options);
  return {path:result.stdout.trim()||null};
 }catch(error){if(signal?.aborted||error.code===1||platform==='darwin'&&String(error.stderr).includes('(-128)'))return {path:null};throw Object.assign(Error(error.killed||error.code==='ETIMEDOUT'?'Folder selection timed out. Try again or enter the path manually.':'The native folder chooser is unavailable. Enter the folder path manually.'),{code:'operationFailed'});}
}
export function documentsFolder({platform=process.platform,home=homedir(),env=process.env,run=execFileSync}={}){
 if(platform==='win32'){try{const path=run('powershell.exe',['-NoProfile','-NonInteractive','-Command','[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); [Environment]::GetFolderPath("MyDocuments")'],{encoding:'utf8',windowsHide:true,timeout:5000}).trim();if(path)return path;}catch{}}
 return env.XDG_DOCUMENTS_DIR?.replace('$HOME',home)??join(home,'Documents');
}

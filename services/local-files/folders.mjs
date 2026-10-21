import {homedir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
// Native selection stays in the local daemon. User paths never become shell code.
export async function pickFolder({initial='',platform=process.platform,run=execute}={}){
 if(typeof initial!=='string'||initial.length>1024)throw Error('Invalid initial folder');
 try{
  let result;
  if(platform==='win32')result=await run('powershell.exe',['-NoProfile','-STA','-Command','Add-Type -AssemblyName System.Windows.Forms; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $picker=New-Object System.Windows.Forms.FolderBrowserDialog; $picker.Description="Choose an Axiom project folder"; $picker.SelectedPath=$env:AXIOM_PICKER_INITIAL; try { if($picker.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){[Console]::Write($picker.SelectedPath)} } finally {$picker.Dispose()}'],{windowsHide:true,env:{...process.env,AXIOM_PICKER_INITIAL:initial},maxBuffer:8192});
  else if(platform==='darwin')result=await run('osascript',['-e','POSIX path of (choose folder with prompt "Choose an Axiom project folder")'],{maxBuffer:8192});
  else result=await run('zenity',['--file-selection','--directory','--title=Choose an Axiom project folder',...(initial?['--filename='+initial+'/']:[])],{maxBuffer:8192});
  return {path:result.stdout.trim()||null};
 }catch(error){if(error.code===1||platform==='darwin'&&String(error.stderr).includes('(-128)'))return {path:null};throw Error('The native folder chooser is unavailable. Enter the folder path manually.');}
}
export function documentsFolder({platform=process.platform,home=homedir(),env=process.env,run=execFileSync}={}){
 if(platform==='win32'){try{const path=run('powershell.exe',['-NoProfile','-NonInteractive','-Command','[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); [Environment]::GetFolderPath("MyDocuments")'],{encoding:'utf8',windowsHide:true,timeout:5000}).trim();if(path)return path;}catch{}}
 return env.XDG_DOCUMENTS_DIR?.replace('$HOME',home)??join(home,'Documents');
}

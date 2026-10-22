import {homedir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pickNativePath} from './dialogs.mjs';
export const pickFolder=options=>pickNativePath({...options,mode:'folder'});
export function documentsFolder({platform=process.platform,home=homedir(),env=process.env,run=execFileSync}={}){
 if(platform==='win32'){try{const path=run('powershell.exe',['-NoProfile','-NonInteractive','-Command','[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); [Environment]::GetFolderPath("MyDocuments")'],{encoding:'utf8',windowsHide:true,timeout:5000}).trim();if(path)return path;}catch{}}
 return env.XDG_DOCUMENTS_DIR?.replace('$HOME',home)??join(home,'Documents');
}

import {readFileSync} from 'node:fs';
import {copyFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
export function hubLauncherBytes(){return readFileSync(new URL('./windows/Axiom Hub.exe',import.meta.url));}
export async function createHubShortcut(folder){await mkdir(folder,{recursive:true});await copyFile(new URL('./windows/Axiom Hub.exe',import.meta.url),join(folder,'Axiom Hub.exe'));return join(folder,'Axiom Hub.exe');}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename)console.log(await createHubShortcut(resolve(process.argv[2]??'.')));

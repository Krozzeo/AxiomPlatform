import {readFileSync} from 'node:fs';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
// A portable Shell Link uses a deliberately unavailable fallback target plus a
// relative target. It never retains the build machine’s checkout as a destination.
export function shortcutBytes(){
 const header=readFileSync(new URL('./windows/hub-link-header.bin',import.meta.url));
 const fields=['Axiom Hub','.\\Start Axiom.cmd','.\\Axiom.ico'].map(s=>{const b=Buffer.from(s,'utf16le'),n=Buffer.alloc(2);n.writeUInt16LE(s.length);return Buffer.concat([n,b]);});return Buffer.concat([header,...fields,Buffer.alloc(4)]);
}
export async function createHubShortcut(folder){await mkdir(folder,{recursive:true});await copyFile(new URL('../apps/hub/icons/axiom.ico',import.meta.url),join(folder,'Axiom.ico'));await writeFile(join(folder,'Axiom Hub.lnk'),shortcutBytes());return join(folder,'Axiom Hub.lnk');}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename)console.log(await createHubShortcut(resolve(process.argv[2]??'.')));

import {readdir,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
async function inspect(folder){for(const e of await readdir(folder,{withFileTypes:true})){const path=join(folder,e.name);if(e.isDirectory())await inspect(path);else if(/\.(mjs|js)$/.test(e.name)){const text=await readFile(path,'utf8');if(/(?:from\s*|import\s*\()['"][^'"]*(?:AxiomEngine|AxiomGameEngine|engine\/|SceneWorkspace)/.test(text))throw Error('Platform must not import product internals: '+path);}}}
for(const folder of ['services','packages','apps'])await inspect(join(root,folder));
console.log('Platform dependency boundary passed.');

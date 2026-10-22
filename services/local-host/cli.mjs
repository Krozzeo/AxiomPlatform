import {resolve,join} from 'node:path';
import {homedir} from 'node:os';
import {startHost} from './server.mjs';
import {openBrowser} from '../local-files/browser.mjs';

const args=process.argv.slice(2),manifests=[];let root,port=4320,open=false,stateRoot=join(process.env.APPDATA??join(homedir(),'.config'),'AxiomPlatform');
for(let i=0;i<args.length;i++){
  if(args[i]==='--product')manifests.push(resolve(args[++i]));
  else if(args[i]==='--projects-root')root=resolve(args[++i]);
  else if(args[i]==='--port')port=Number(args[++i]);
  else if(args[i]==='--settings-root')stateRoot=resolve(args[++i]);
  else if(args[i]==='--open')open=true;
  else throw Error('Usage: npm start -- --product <installation/product.json> --projects-root <directory> [--port 4320]');
}
const host=await startHost({root,manifests,port,stateRoot});
console.log('Axiom Platform 0.1.5 — local session. Browser URL:');
console.log(host.url);
if(open)try{await openBrowser(host.url);}catch(error){console.error('The browser could not be opened automatically: '+error.message);console.error('Open the URL above manually.');}
let closing=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
  if(closing)return;closing=true;
  if(host.manager.catalog().sessions.some(s=>s.status?.dirty))console.warn('Closing with unsaved edits. Only previously saved project data is persistent.');
  void host.close().then(()=>process.exit(0),()=>process.exit(1));
});

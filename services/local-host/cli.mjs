import {resolve} from 'node:path';
import {startHost} from './server.mjs';

const args=process.argv.slice(2),manifests=[];let root,port=4320;
for(let i=0;i<args.length;i++){
  if(args[i]==='--product')manifests.push(resolve(args[++i]));
  else if(args[i]==='--projects-root')root=resolve(args[++i]);
  else if(args[i]==='--port')port=Number(args[++i]);
  else throw Error('Usage: npm start -- --product <installation/product.json> --projects-root <directory> [--port 4320]');
}
if(!root||!manifests.length)throw Error('Explicit --projects-root and --product installation are required. See docs/P1_GUIDE.md.');
const host=await startHost({root,manifests,port});
console.log('Axiom Platform 0.1.0 — local session. Open this URL in your browser:');
console.log(host.url);
let closing=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
  if(closing)return;closing=true;
  if(host.manager.catalog().sessions.some(s=>s.status?.dirty))console.warn('Closing with unsaved edits. Only previously saved project data is persistent.');
  void host.close().then(()=>process.exit(0),()=>process.exit(1));
});

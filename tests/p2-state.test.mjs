import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {PlatformState} from '../services/local-host/state.mjs';
import {copyProjectFiles} from '../services/local-files/files.mjs';
import {GitHubAccount} from '../services/integrations/github/account.mjs';
import {GitHubClient} from '../services/integrations/github/client.mjs';
import {pickFolder} from '../services/local-files/folders.mjs';
async function root(t){const p=await mkdtemp(join(tmpdir(),'axiom-p2-state-'));t.after(()=>rm(p,{recursive:true,force:true}));return p;}
test('P2 settings/catalog persist, reject concurrent ownership and retain invalid data for recovery',async t=>{
  const p=await root(t),settings=join(p,'state'),projects=join(p,'projects');
  const s=await PlatformState.load(settings,{root:projects,manifests:[join(p,'product.json')]});
  await assert.rejects(PlatformState.load(settings),e=>e.code==='projectBusy');
  await s.remember({projectId:'project://test',productId:'axiom.fixture',path:join(projects,'project.json'),name:'Remember me'});
  await s.update(v=>{v.preferences.defaultProduct='axiom.fixture';});await s.close();
  const reopened=await PlatformState.load(settings);assert.equal(reopened.value.recents[0].name,'Remember me');assert.equal(reopened.value.preferences.defaultProduct,'axiom.fixture');await reopened.close();
  await writeFile(join(settings,'platform.json'),'broken');await assert.rejects(PlatformState.load(settings));assert.equal(await readFile(join(settings,'platform.json'),'utf8'),'broken');
});
test('P2 bounded copy preserves source bytes and refuses linked data',async t=>{
  const p=await root(t),source=join(p,'source'),dest=join(p,'dest');await mkdir(source);await mkdir(dest);await writeFile(join(source,'project.json'),'original');
  await copyProjectFiles({source,destination:dest,paths:['project.json']});assert.equal(await readFile(join(source,'project.json'),'utf8'),'original');assert.equal(await readFile(join(dest,'project.json'),'utf8'),'original');
  await assert.rejects(copyProjectFiles({source,destination:dest,paths:['../outside']}));
  const other=join(p,'other');await mkdir(other);await writeFile(join(other,'secret'),'private');
  try{await symlink(other,join(source,'linked'),process.platform==='win32'?'junction':'dir');}catch(e){if(e.code==='EPERM')return;throw e;}
  await assert.rejects(copyProjectFiles({source,destination:dest,paths:['linked']}));
});
test('P2 account epochs reject stale requests and revoked accounts broadcast disconnect without leaking credentials',async()=>{
  const states=[];let revoked=false;
  const client=new GitHubClient({fetchImpl:async url=>new Response(JSON.stringify(revoked?{message:'sensitive upstream response'}:url.endsWith('/user')?{id:7,login:'fixture'}:[]),{status:revoked?401:200})});
  const account=new GitHubAccount({client,onChange:s=>states.push(s)});const connected=await account.connect('fake-token-keep-in-memory');
  await account.disconnect();await account.connect('another-fake-token');
  await assert.rejects(account.invoke('request',{path:'/user',epoch:connected.epoch}),/changed/);
  revoked=true;await assert.rejects(account.invoke('request',{path:'/user',epoch:account.epoch}),e=>!e.message.includes('sensitive'));
  assert.equal(account.status().connected,false);assert.equal(JSON.stringify(states).includes('fake-token'),false);
});
test('P2 Windows folder picker sends paths as data and cancellation has no effect',async()=>{
  let seen;
  const selected=await pickFolder({initial:'C:\\Project $(not-code)',platform:'win32',run:async(...args)=>{seen=args;return {stdout:'C:\\Chosen\n'};}});
  assert.equal(selected.path,'C:\\Chosen');assert.equal(seen[2].env.AXIOM_PICKER_INITIAL,'C:\\Project $(not-code)');assert.equal(seen[2].windowsHide,true);assert.equal(seen[1].some(s=>s.includes('not-code')),false);
  assert.deepEqual(await pickFolder({platform:'win32',run:async()=>{throw {code:1};}}),{path:null});
});

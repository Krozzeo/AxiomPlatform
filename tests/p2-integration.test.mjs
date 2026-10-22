import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {startHost} from '../services/local-host/server.mjs';
import {GitHubClient} from '../services/integrations/github/client.mjs';
import {GitHubHTTPFixture} from './fixtures/github-http.mjs';
const engine=process.env.AXIOM_ENGINE_PATH&&resolve(process.env.AXIOM_ENGINE_PATH),opts={skip:!engine,timeout:120000};
async function fixture(t){
  const base=await mkdtemp(join(tmpdir(),'axiom-p2-real-')),stateRoot=join(base,'state'),root=join(base,'projects'),remote=new GitHubHTTPFixture();
  let host=await startHost({root,stateRoot,manifests:[join(engine,'platform/product.json')],githubClient:new GitHubClient({fetchImpl:remote.fetch}),folderPicker:async()=>({path:null})});
  t.after(async()=>{await host.close();await rm(base,{recursive:true,force:true});});
  const post=async(path,data)=>{
    const r=await fetch(host.origin+path,{method:'POST',headers:{Origin:host.origin,Authorization:'Bearer '+host.token,'Content-Type':'application/json'},body:JSON.stringify(data)}),v=await r.json();
    if(!r.ok)throw Object.assign(Error(v.message),{code:v.code});return v;
  };
  const session=data=>post('/v1/sessions',{...data,operationId:randomUUID()});
  const restart=async()=>{await host.close();host=await startHost({stateRoot,githubClient:new GitHubClient({fetchImpl:remote.fetch})});return host;};
  return {base,root,stateRoot,remote,post,session,restart,host:()=>host};
}
async function game(s,action,data,method='POST'){
  const url=new URL(s.editorUrl),token=new URLSearchParams(url.hash.slice(1)).get('token');
  const r=await fetch(url.origin+'/v1/github/'+action,{method,headers:{Origin:url.origin,Authorization:'Bearer '+token,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(data??{})}:{})});
  const v=await r.json();if(!r.ok)throw Object.assign(Error(v.cause),{code:v.code});return v;
}
async function allText(root){let text='';for(const e of await readdir(root,{withFileTypes:true})){const p=join(root,e.name);text+=e.isDirectory()?await allText(p):await readFile(p,'utf8');}return text;}
test('P2 real catalog/root survive restart; local import preserves source and native picker cancellation changes nothing',opts,async t=>{
  const f=await fixture(t),{ProjectStore}=await import(pathToFileURL(join(engine,'daemon/bootstrap/project-store.mjs')));
  const source=join(f.base,'source');const created=(await new ProjectStore(source).run('project.create',{name:'Imported original'})).project;
  const sourceFile=join(source,created.id.slice(10)+'.json'),before=await readFile(sourceFile);
  const imported=await f.session({action:'import',kind:'local',productId:'axiom.game-engine',sourcePath:source});
  assert.deepEqual(await readFile(sourceFile),before);assert.notEqual(imported.path,sourceFile);
  assert.equal(f.host().manager.catalog().recents.length,1);
  const again=await f.session({action:'import',kind:'local',productId:'axiom.game-engine',sourcePath:source});assert.equal(again.alreadyRegistered,true);assert.equal(f.host().manager.catalog().recents.length,1);
  assert.deepEqual(await f.post('/v1/folders/pick',{}),{path:null});assert.equal(f.host().manager.root,f.root);
  const opened=await f.session({action:'open',productId:'axiom.game-engine',path:dirname(imported.path)});
  await assert.rejects(f.post('/v1/settings',{projectRoot:join(f.base,'next')}),e=>e.code==='projectBusy');
  await f.session({action:'close',sessionId:opened.sessionId,expectedRevision:opened.status.revision,decision:'save'});
  const next=join(f.base,'next');await f.post('/v1/settings',{projectRoot:next});await f.restart();assert.equal(f.host().manager.root,next);
  await f.post('/v1/settings',{projectRoot:f.root});assert.equal(f.host().manager.catalog().recents[0].projectId,created.id);
  assert.deepEqual(await readFile(sourceFile),before);
});
test('P2 shared account reaches two real editors; destinations/preferences survive independently without tokens; closing one leaves the other connected',opts,async t=>{
  const f=await fixture(t);f.remote.repo('fixture-player/first');f.remote.repo('fixture-player/second');
  await f.post('/v1/github',{action:'connect',token:'fake-secret-never-persist'});
  const a=await f.session({action:'create',productId:'axiom.game-engine',name:'First'}),b=await f.session({action:'create',productId:'axiom.game-engine',name:'Second'});
  assert.equal((await game(a,'status',null,'GET')).connected,true);assert.equal((await game(b,'status',null,'GET')).connected,true);
  await game(a,'configure',{id:a.status.projectId,repository:'fixture-player/first',branch:'main'});
  await game(a,'preferences',{id:a.status.projectId,autoMilestones:false,allowAgent:false});
  await game(b,'configure',{id:b.status.projectId,repository:'fixture-player/second',branch:'main'});
  await assert.rejects(game(a,'disconnect'),/Platform Settings/);await f.post('/v1/github',{action:'disconnect'});assert.equal((await game(b,'status',null,'GET')).connected,false);
  await f.post('/v1/github',{action:'connect',token:'reconnected-fake-token'});assert.equal((await game(b,'status',null,'GET')).connected,true);
  await f.session({action:'close',sessionId:a.sessionId,expectedRevision:a.status.revision,decision:'save'});
  assert.equal((await game(b,'status',null,'GET')).connected,true);
  assert.equal((await game(b,'status',null,'GET')).repository,'fixture-player/second');
  await f.session({action:'close',sessionId:b.sessionId,expectedRevision:b.status.revision,decision:'save'});
  assert.equal((await allText(f.stateRoot)).includes('fake-secret'),false);
  await f.restart();assert.equal(f.host().account.status().connected,false);
  await f.post('/v1/github',{action:'connect',token:'new-fake-secret'});
  const reopened=await f.session({action:'open',productId:'axiom.game-engine',path:join(f.root,a.path)}),status=await game(reopened,'status',null,'GET');
  assert.equal(status.repository,'fixture-player/first');assert.equal(status.autoMilestones,false);assert.equal(status.allowAgent,false);
  await f.post('/v1/github',{action:'disconnect'});assert.equal(f.host().account.status().connected,false);
});
test('P2 real publication recovers an unconfirmed commit once and rejects divergence; remote import uses product validation',opts,async t=>{
  const f=await fixture(t);f.remote.repo('fixture-player/game');await f.post('/v1/github',{action:'connect',token:'controlled-github-token'});
  const a=await f.session({action:'create',productId:'axiom.game-engine',name:'Publication'});
  await game(a,'configure',{id:a.status.projectId,repository:'fixture-player/game',branch:'main'});
  const preview=await game(a,'preview',{id:a.status.projectId});f.remote.failAfterCommit=true;
  await assert.rejects(game(a,'publish',{id:a.status.projectId,planId:preview.planId}));assert.equal(f.remote.calls,1);
  await f.session({action:'close',sessionId:a.sessionId,expectedRevision:a.status.revision,decision:'save'});
  const reopened=await f.session({action:'open',productId:'axiom.game-engine',path:join(f.root,a.path)});
  assert.equal((await game(reopened,'status',null,'GET')).ambiguous,true);
  assert.equal((await game(reopened,'reconcile',{id:a.status.projectId})).ambiguous,false);assert.equal(f.remote.calls,1);
  const listed=await f.session({action:'github-projects',productId:'axiom.game-engine',repository:'fixture-player/game',branch:'main'});assert.equal(listed.items.length,1);
  const imported=await f.session({action:'import',kind:'github',productId:'axiom.game-engine',repository:'fixture-player/game',branch:'main',path:listed.items[0].path});assert.equal(imported.alreadyRegistered,true);
  const oldPlan=await game(reopened,'preview',{id:a.status.projectId});
  await f.post('/v1/github',{action:'disconnect'});await f.post('/v1/github',{action:'connect',token:'new-controlled-github-token'});
  await assert.rejects(game(reopened,'publish',{id:a.status.projectId,planId:oldPlan.planId}),/review/i);
  f.remote.repo('fixture-player/game').head='f'.repeat(40);await assert.rejects(game(reopened,'preview',{id:a.status.projectId}),/diverged/);assert.equal(f.remote.calls,1);
});

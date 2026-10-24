import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {OpenAiProvider} from '../services/ai/provider.mjs';
import {startHost} from '../services/local-host/server.mjs';
import {AiHTTPFixture,aiMessage,aiTool} from './fixtures/ai-http.mjs';
const engine=process.env.AXIOM_ENGINE_PATH&&resolve(process.env.AXIOM_ENGINE_PATH),options={skip:!engine,timeout:120000};
const envelope=engine?(await import(pathToFileURL(join(engine,'protocol/src/protocol.ts')))).envelope:null;
async function setup(t){
 const base=await mkdtemp(join(tmpdir(),'axiom-p3-real-')),http=new AiHTTPFixture(),stateRoot=join(base,'state'),root=join(base,'projects');
 const host=await startHost({root,stateRoot,manifests:[join(engine,'platform/product.json')],aiProvider:new OpenAiProvider({fetchImpl:http.fetch})});
 t.after(async()=>{http.release?.([aiMessage('released for cleanup')]);await host.close();await rm(base,{recursive:true,force:true});});
 const session=async data=>{const r=await fetch(host.origin+'/v1/sessions',{method:'POST',headers:{Origin:host.origin,Authorization:'Bearer '+host.token,'Content-Type':'application/json'},body:JSON.stringify({...data,operationId:randomUUID()})}),value=await r.json();if(!r.ok)throw Error(JSON.stringify(value));return value;};
 const create=name=>session({action:'create',productId:'axiom.game-engine',name});return {base,root,stateRoot,http,host,session,create};
}
async function hub(f,data){const r=await fetch(f.host.origin+'/v1/ai',{method:'POST',headers:{Origin:f.host.origin,Authorization:'Bearer '+f.host.token,'Content-Type':'application/json'},body:JSON.stringify(data)});const value=await r.json();assert.equal(r.ok,true,JSON.stringify(value));return value;}
export async function editor(s,path,data){const url=new URL(s.editorUrl),token=new URLSearchParams(url.hash.slice(1)).get('token');const r=await fetch(url.origin+path,{method:data?'POST':'GET',headers:{Origin:url.origin,Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})}),value=await r.json();if(!r.ok)throw Object.assign(Error(value.cause??value.message??JSON.stringify(value)),{code:value.code});return value;}
export async function terminal(s,id){const deadline=Date.now()+60000;while(Date.now()<deadline){const value=await editor(s,'/v1/ai/tasks?id='+encodeURIComponent(id));if(value.status!=='running'&&!(await editor(s,'/v1/ai/status')).working)return value;await new Promise(r=>setTimeout(r,40));}throw Error('AI task did not finish');}
const command=(s,type,data)=>editor(s,'/v1/commands',envelope('command',{type,data},{actor:{kind:'human',id:'p3-test'}}));
test('P3 real hosted AI shares credential, preserves manual approval, reviews/applies isolated edits and reopens saved result',options,async t=>{
 const f=await setup(t),a=await f.create('AI A'),b=await f.create('AI B');
 await hub(f,{action:'connect',apiKey:'sk-controlled-p3-secret'});await editor(a,'/v1/ai/configure',{action:'update',model:'gpt-4.1'});assert.equal((await editor(b,'/v1/ai/status')).hasCredential,true);
 await editor(b,'/v1/ai/configure',{action:'update',model:'gpt-4.1'});
 let state=(await command(a,'scene.get',{})).payload.data;
 state=(await command(a,'scene.entity.create',{id:state.project.id,expectedSceneRevision:state.sceneRevision,name:'Cube'})).payload.data;
 const entity=state.project.scene.entities[0];
 state=(await command(a,'scene.entity.update',{id:state.project.id,expectedSceneRevision:state.sceneRevision,entityId:entity.id,transform:{position:[1,0,0]}})).payload.data;
 state=(await command(a,'scene.save',{id:state.project.id,expectedSceneRevision:state.sceneRevision})).payload.data;
 const manualTransform=state.project.scene.entities[0].transform;assert.equal(manualTransform.position[0],1);
 f.http.outputs.push([aiTool('work_propose',{steps:['Move the selected entity to X=2 and verify its transform']},'propose')]);
 const first=await terminal(a,(await editor(a,'/v1/ai/tasks',{text:'Move '+entity.name+' to X=2'})).id);assert.equal(first.status,'awaiting-approval',JSON.stringify(first.error));assert.equal(first.workspaceId,null);
 f.http.outputs.push([aiTool('work_plan',{mode:'authoring',steps:[{id:'move',title:'Move entity',checks:[{kind:'entity',selector:entity.name,property:'transform.position.0',expected:2}]}]},'plan'),aiTool('scene_entity_update',{entityId:entity.id,transform:{position:[2,0,0]}},'move')],[aiTool('work_check',{stepId:'move'},'check')],[aiMessage('Posición verificada en la propuesta')]);
 const done=await terminal(a,(await editor(a,'/v1/ai/tasks',{text:'Sí, adelante'})).id);assert.equal(done.status,'completed',JSON.stringify(done.error));
 const main=(await command(a,'scene.get',{})).payload.data;assert.deepEqual(main.project.scene.entities.find(e=>e.id===entity.id).transform,manualTransform);
 const review=await editor(a,'/v1/ai/proposals?id='+encodeURIComponent(done.workspaceId));assert.ok(review.changes.length);
 await assert.rejects(editor(b,'/v1/ai/proposals?id='+encodeURIComponent(done.workspaceId)),/unavailable|identity/i);
 await editor(a,'/v1/ai/apply',{workspaceId:review.workspace.id,expectedWorkspaceRevision:review.workspace.revision,expectedMainRevision:review.mainRevision,mainHash:review.mainHash,reviewHash:review.reviewHash});
 const applied=(await command(a,'scene.get',{})).payload.data;assert.equal(applied.project.scene.entities.find(e=>e.id===entity.id).transform.position[0],2);
 assert.ok(Object.keys(f.host.ai.usage).length>=2);const closing=await f.session({action:'status',sessionId:a.sessionId});await f.session({action:'close',sessionId:a.sessionId,expectedRevision:closing.status.revision,decision:'discard'});assert.equal((await editor(b,'/v1/ai/status')).connected,true);
 const reopened=await f.session({action:'open',productId:'axiom.game-engine',path:a.status.projectId&&f.host.manager.sessions.get(a.sessionId).path});assert.equal((await command(reopened,'scene.get',{})).payload.data.project.scene.entities.find(e=>e.id===entity.id).transform.position[0],2);const restored=await editor(reopened,'/v1/ai/status');assert.equal(restored.model,'gpt-4.1');assert.equal(restored.connected,true);
 await assert.rejects(editor(b,'/v1/ai/configure',{action:'disconnect'}),/Platform Settings/);await hub(f,{action:'disconnect'});assert.equal((await editor(reopened,'/v1/ai/status')).hasCredential,false);
 const walk=async root=>{let s='';for(const e of await readdir(root,{withFileTypes:true})){const path=join(root,e.name);s+=e.isDirectory()?await walk(path):await readFile(path,'utf8');}return s;};assert.equal((await walk(f.base)).includes('sk-controlled-p3-secret'),false);
});
test('P3 real hosted cancellation rejects a late response and provider failure cannot mutate MAIN',options,async t=>{
 const f=await setup(t),a=await f.create('Cancel');await hub(f,{action:'connect',apiKey:'sk-controlled-p3-secret'});await editor(a,'/v1/ai/configure',{action:'update',model:'gpt-4.1'});
 const before=(await command(a,'scene.get',{})).payload.data.project;f.http.waiting=true;
 const started=await editor(a,'/v1/ai/tasks',{text:'Describe this project'}),deadline=Date.now()+30000;while(!f.http.release){assert.ok(Date.now()<deadline,'Task must reach the provider');await new Promise(r=>setTimeout(r,20));}await editor(a,'/v1/ai/cancel',{id:started.id});
 f.http.release([aiTool('scene_entity_create',{name:'Late mutation'},'late')]);f.http.waiting=false;
 const cancelled=await terminal(a,started.id);assert.equal(cancelled.status,'cancelled');assert.equal(cancelled.toolCalls,0);assert.deepEqual((await command(a,'scene.get',{})).payload.data.project,before);
 f.http.failStatus=429;const failed=await terminal(a,(await editor(a,'/v1/ai/tasks',{text:'Describe again'})).id);assert.equal(failed.status,'failed');assert.match(failed.error.message,/429/);assert.equal(JSON.stringify(failed).includes('upstream private detail'),false);
});
test('P3 real manual proposal uses shared review gates and preserves concurrent MAIN and stale proposal edits',options,async t=>{
 const f=await setup(t),a=await f.create('Manual conflict');let main=(await command(a,'scene.get',{})).payload.data;
 main=(await command(a,'scene.entity.create',{id:main.project.id,expectedSceneRevision:main.sceneRevision,name:'Original'})).payload.data;
 main=(await command(a,'scene.save',{id:main.project.id,expectedSceneRevision:main.sceneRevision})).payload.data;
 const entity=main.project.scene.entities[0],proposal=(await command(a,'workspace.begin',{id:main.project.id,expectedSceneRevision:main.sceneRevision,name:'Manual proposal'})).payload.data;
 await command(a,'scene.entity.update',{id:main.project.id,workspaceId:proposal.id,expectedSceneRevision:proposal.revision,entityId:entity.id,name:'Proposal value'});
 const review=await editor(a,'/v1/ai/proposals?id='+encodeURIComponent(proposal.id)),apply={workspaceId:proposal.id,expectedWorkspaceRevision:review.workspace.revision,expectedMainRevision:review.mainRevision,mainHash:review.mainHash,reviewHash:review.reviewHash};
 await command(a,'scene.entity.update',{id:main.project.id,expectedSceneRevision:main.sceneRevision,entityId:entity.id,name:'Concurrent MAIN'});
 await assert.rejects(editor(a,'/v1/ai/apply',apply),/Review changed/);
 assert.equal((await command(a,'scene.get',{})).payload.data.project.scene.entities[0].name,'Concurrent MAIN');
 const next=await editor(a,'/v1/ai/proposals?id='+encodeURIComponent(proposal.id));assert.equal(next.mainDiverged,true);
 await assert.rejects(editor(a,'/v1/ai/apply',{...apply,expectedMainRevision:next.mainRevision,mainHash:next.mainHash,reviewHash:next.reviewHash}),/explicit replacement/);
 await command(a,'scene.entity.update',{id:main.project.id,workspaceId:proposal.id,expectedSceneRevision:next.workspace.revision,entityId:entity.id,name:'New proposal value'});
 await assert.rejects(editor(a,'/v1/ai/apply',{...apply,expectedMainRevision:next.mainRevision,mainHash:next.mainHash,reviewHash:next.reviewHash}),/Proposal changed/);
 assert.equal((await command(a,'scene.get',{})).payload.data.project.scene.entities[0].name,'Concurrent MAIN');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,readdir,mkdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {startHost} from '../services/local-host/server.mjs';

const engine=process.env.AXIOM_ENGINE_PATH&&resolve(process.env.AXIOM_ENGINE_PATH);
const options={skip:!engine,timeout:90000};
async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'axiom-platform-real-'));
  const host=await startHost({root,manifests:[join(engine,'platform/product.json')]});
  t.after(async()=>{await host.close();await rm(root,{recursive:true,force:true});});
  const request=async(data,headers={})=>{
    const r=await fetch(host.origin+'/v1/sessions',{method:'POST',headers:{Origin:host.origin,Authorization:'Bearer '+host.token,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
    const result=await r.json();if(!r.ok)throw Object.assign(Error(result.message),{code:result.code,status:r.status});return result;
  };
  const change=data=>request({...data,operationId:randomUUID()});
  return {root,host,request,change};
}
async function command(session,type,data={}){
  const url=new URL(session.editorUrl),token=new URLSearchParams(url.hash.slice(1)).get('token');
  const r=await fetch(url.origin+'/v1/commands',{method:'POST',headers:{Origin:url.origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({protocolVersion:1,messageId:randomUUID(),correlationId:randomUUID(),traceId:randomUUID(),actor:{kind:'human',id:'integration'},kind:'command',payload:{type,data}})});
  const reply=await r.json();if(!r.ok||reply.kind==='error')throw Object.assign(Error(reply.payload?.cause??reply.cause??JSON.stringify(reply)),{code:reply.payload?.code??reply.code});return reply.payload.data;
}
test('real engine: create, edit, cancel close, reject stale save, save, close, reopen and standalone',options,async t=>{
  const {root,host,request,change}=await fixture(t);
  const create={action:'create',productId:'axiom.game-engine',name:'P1 acceptance',operationId:randomUUID()};
  const created=await request(create);assert.equal(created.state,'ready');assert.equal(created.status.dirty,false);
  const repeated=await request(create);assert.equal(repeated.sessionId,created.sessionId);assert.equal(host.manager.catalog().sessions.length,1);
  const path=join(root,created.path),before=await readFile(path);
  await command(created,'scene.entity.create',{id:created.status.projectId,expectedSceneRevision:created.status.revision,name:'Saved from editor'});
  const edited=await request({action:'status',sessionId:created.sessionId});assert.equal(edited.status.dirty,true);
  await assert.rejects(change({action:'save',sessionId:created.sessionId,expectedRevision:created.status.revision}),e=>e.code==='revisionConflict');
  assert.deepEqual(await readFile(path),before);
  const cancelled=await change({action:'close',sessionId:created.sessionId,expectedRevision:edited.status.revision,decision:'cancel'});
  assert.equal(cancelled.state,'ready');assert.equal(cancelled.cancelled,true);assert.equal(cancelled.status.dirty,true);
  await assert.rejects(change({action:'open',productId:'axiom.game-engine',path:created.path}),e=>e.code==='projectBusy');
  const save={action:'save',sessionId:created.sessionId,expectedRevision:edited.status.revision,operationId:randomUUID()};
  const saved=await request(save);assert.equal(saved.status.dirty,false);await request(save);
  assert.equal(JSON.parse(await readFile(path)).revision,1);
  await assert.rejects(command(created,'project.close',{id:saved.status.projectId,expectedSceneRevision:saved.status.revision}),/Platform/);
  await change({action:'close',sessionId:created.sessionId,expectedRevision:saved.status.revision,decision:'save'});
  const reopened=await change({action:'open',productId:'axiom.game-engine',path:created.path});
  assert.equal(reopened.status.projectId,created.status.projectId);assert.equal((await command(reopened,'scene.get')).project.scene.entities[0].name,'Saved from editor');
  const {startServer}=await import(pathToFileURL(join(engine,'daemon/bootstrap/server.mjs')));
  await assert.rejects(startServer({projectRoot:dirname(path)}),/active or interrupted Platform/);
  await change({action:'close',sessionId:reopened.sessionId,expectedRevision:reopened.status.revision,decision:'discard'});
  const standalone=await startServer({projectRoot:dirname(path)});
  try{
    const url=standalone.editorUrl;
    const native=await command({editorUrl:url},'project.open',{id:created.status.projectId});assert.equal(native.project.id,created.status.projectId);
  }finally{await standalone.close();}
  assert.equal((await readdir(dirname(path))).includes('.axiom-platform-session.lock'),false);
});
test('real engine: incompatible project does not write; host denies foreign origin and missing credential',options,async t=>{
  const {root,host,request,change}=await fixture(t);
  const folder=join(root,'future');await mkdir(folder);const path=join(folder,randomUUID()+'.json');
  const bytes=JSON.stringify({schemaVersion:99,id:'project://'+randomUUID(),name:'Future'});await writeFile(path,bytes);
  const files=await readdir(folder);
  await assert.rejects(change({action:'open',productId:'axiom.game-engine',path}),e=>e.code==='incompatibleVersion');
  assert.equal(await readFile(path,'utf8'),bytes);assert.deepEqual(await readdir(folder),files);
  await assert.rejects(request({action:'status'},{Origin:'https://untrusted.invalid'}),e=>e.status===403);
  await assert.rejects(request({action:'status'},{Authorization:'Bearer wrong'}),e=>e.status===401);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm,symlink,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {validateManifest,CAPABILITIES} from '../packages/contracts/index.mjs';
import {SessionManager} from '../services/local-host/manager.mjs';
import {authorizedPath} from '../services/local-host/paths.mjs';
import {ProductClient} from '../packages/sdk/client.mjs';

const manifest=()=>({manifestVersion:1,protocolVersion:1,productId:'axiom.fixture',displayName:'Fixture',productVersion:'1.0.0',platformApiRange:'>=0.1.0 <0.2.0',projectFormats:[{id:'fixture',versions:[1]}],capabilities:CAPABILITIES,launch:{adapter:'official-local',entry:'adapter.mjs'}});
async function temp(t){const root=await mkdtemp(join(tmpdir(),'axiom-platform-contract-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
test('descriptor rejects incompatible protocol/API and incomplete capabilities before launching',()=>{
  assert.equal(validateManifest(manifest()).productId,'axiom.fixture');
  for(const change of [{protocolVersion:2},{platformApiRange:'*'},{capabilities:['project.open']},{productId:'untrusted/command'}])assert.throws(()=>validateManifest({...manifest(),...change}));
});
test('project paths reject traversal and linked targets outside the authorized root',async t=>{
  const root=await temp(t),granted=join(root,'projects');await mkdir(granted);await writeFile(join(root,'private.json'),'{}');
  await assert.rejects(authorizedPath(granted,'../private.json'),e=>e.code==='permissionDenied');
  await writeFile(join(granted,'valid.json'),'{}');assert.equal(await authorizedPath(granted,'valid.json'),await realpath(join(granted,'valid.json')));
  try{await symlink(root,join(granted,'escape'),process.platform==='win32'?'junction':'dir');}catch(error){if(error.code==='EPERM'){t.diagnostic('OS denies test symlink creation; traversal assertion still ran.');return;}throw error;}
  await assert.rejects(authorizedPath(granted,'escape/private.json'),e=>e.code==='permissionDenied');
  const alias=join(root,'authorized-alias');await symlink(granted,alias,process.platform==='win32'?'junction':'dir');
  assert.equal(await authorizedPath(alias,'valid.json'),await realpath(join(granted,'valid.json')));
});
test('registration rejects adapter paths escaping the explicit installation',async t=>{
  const root=await temp(t),installation=join(root,'install');await mkdir(installation);await writeFile(join(root,'adapter.mjs'),'');
  await writeFile(join(installation,'product.json'),JSON.stringify({...manifest(),launch:{adapter:'official-local',entry:'../adapter.mjs'}}));
  await assert.rejects(SessionManager.create({root:join(root,'projects'),manifests:[join(installation,'product.json')]}),e=>e.code==='permissionDenied');
});
test('dead and unresponsive product processes reject requests instead of reporting ready',async t=>{
  const root=await temp(t);const dead=join(root,'dead.mjs'),hang=join(root,'hang.mjs');
  await writeFile(dead,'process.exit(1)');await writeFile(hang,"process.on('message',()=>{});process.on('disconnect',()=>process.exit(0));");
  for(const entry of [dead,hang]){
    const client=new ProductClient(entry,{timeoutMs:300});
    await assert.rejects(client.call('initialize',{},'session-test'),e=>e.code==='resultUnknown');await client.stop();
  }
});

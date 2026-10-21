import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,writeFile,readFile,access,symlink} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {Installations} from '../services/local-host/installations.mjs';
import {CAPABILITIES} from '../packages/contracts/index.mjs';
import {pickFolder} from '../services/local-files/folders.mjs';
import {openBrowser} from '../services/local-files/browser.mjs';
import {startHost} from '../services/local-host/server.mjs';
const engine=process.env.AXIOM_ENGINE_PATH&&resolve(process.env.AXIOM_ENGINE_PATH);
async function temp(t){const p=await mkdtemp(join(tmpdir(),'axiom-p4-'));t.after(()=>rm(p,{recursive:true,force:true}));return p;}
const manifest=version=>({manifestVersion:1,protocolVersion:1,productId:'axiom.fixture',displayName:'Fixture',productVersion:version,platformApiRange:'>=0.1.0 <0.2.0',projectFormats:[{id:'fixture',versions:[1]}],capabilities:CAPABILITIES,launch:{adapter:'official-local',entry:'adapter.mjs'}});
async function installation(root,version,change={}){const p=join(root,version);await mkdir(p);await writeFile(join(p,'adapter.mjs'),'// '+version);await writeFile(join(p,'product.json'),JSON.stringify({...manifest(version),...change}));return join(p,'product.json');}
function memory(){return {value:{recents:[],preferences:{}},fail:false,async update(fn){if(this.fail)throw Error('Disk unavailable');const copy=structuredClone(this.value);await fn(copy);this.value=copy;}};}
test('P4 compatible installations defer activation, preserve running selection, persist rollback and reject incompatible or changed packages',async t=>{
 const root=await temp(t),a=await installation(root,'1.0.0'),b=await installation(root,'1.1.0'),invalid=await installation(root,'2.0.0',{protocolVersion:2}),store=memory(),r=await Installations.load(store,[a]);
 const first=r.selected['axiom.fixture'],next=await r.add(b),before=structuredClone(store.value);await assert.rejects(r.add(invalid));assert.deepEqual(store.value,before);
 await r.activate(next,()=>true);assert.equal(r.selected['axiom.fixture'],first);assert.equal(r.pending['axiom.fixture'],next);await r.flush(()=>true);assert.equal(r.products.get('axiom.fixture').version,'1.0.0');
 await r.flush(()=>false);assert.equal(r.products.get('axiom.fixture').version,'1.1.0');assert.equal(r.previous['axiom.fixture'],first);
 const restart=await Installations.load(store,[]);await restart.activate(first,()=>false);assert.equal(restart.products.get('axiom.fixture').version,'1.0.0');
 store.fail=true;await assert.rejects(restart.activate(next,()=>false),/Disk unavailable/);assert.equal(restart.selected['axiom.fixture'],first);store.fail=false;
 await writeFile(join(dirname(b),'adapter.mjs'),'changed');await assert.rejects(restart.activate(next,()=>false),e=>e.code==='incompatibleVersion');assert.equal(restart.products.get('axiom.fixture').version,'1.0.0');
 const bad=await Installations.load(store,[],{allowUnavailable:true});assert.match(bad.view().find(i=>i.id===next).error,/changed/);
});
test('P4 failed registration does not leave an installation in memory or settings',async t=>{const root=await temp(t),a=await installation(root,'1.0.0'),store=memory(),r=await Installations.load(store,[]);store.fail=true;await assert.rejects(r.add(a));assert.equal(r.items.size,0);assert.deepEqual(store.value.installations,[]);});
test('P4 Windows chooser has an owned foreground window, timeout, cancellation and recoverable native errors',async()=>{
 const signal=new AbortController().signal;let observed;assert.deepEqual(await pickFolder({platform:'win32',initial:'C:\\Axiom $folder',signal,timeoutMs:125,run:async(...args)=>{observed=args;return {stdout:'C:\\Chosen'};}}),{path:'C:\\Chosen'});
 assert.match(observed[1].at(-1),/ShowDialog\(\$owner\)/);assert.match(observed[1].at(-1),/TopMost=\$true/);assert.equal(observed[2].timeout,125);assert.equal(observed[2].signal,signal);assert.equal(observed[2].env.AXIOM_PICKER_INITIAL,'C:\\Axiom $folder');assert.equal(observed[1].at(-1).includes('C:\\Axiom'),false);
 await assert.rejects(pickFolder({platform:'win32',run:async()=>{throw {killed:true};}}),/timed out/);await assert.rejects(pickFolder({platform:'win32',run:async()=>{throw {code:'ENOENT'};}}),/Enter the folder path manually/);
 const c=new AbortController();c.abort();assert.deepEqual(await pickFolder({platform:'win32',signal:c.signal,run:async()=>{throw {name:'AbortError'};}}),{path:null});
});
test('P4 browser opening sends the authenticated local URL as data and rejects nonlocal destinations',async()=>{let options;const url='http://127.0.0.1:4320/#token=controlled';await openBrowser(url,{platform:'win32',run:async(_exe,args,opts)=>{assert.equal(args.at(-1),'Start-Process -FilePath $env:AXIOM_OPEN_URL');options=opts;}});assert.equal(options.env.AXIOM_OPEN_URL,url);assert.equal(options.windowsHide,true);await assert.rejects(openBrowser('https://example.com/'));});
test('P4 Windows launcher verifies official hashes and refuses ZIP traversal', {skip:process.platform!=='win32'},async t=>{
 const root=await temp(t),script=join(root,'launcher-test.ps1'),module=resolve('scripts/windows/Bootstrap.psm1');
 const source=`$ErrorActionPreference='Stop'\nImport-Module $env:AXIOM_TEST_MODULE -Force -DisableNameChecking\n$item=Get-NodeArchive ('a'*64+'  node-v24.1.0-win-x64.zip') 'x64'\nif($item.Name -ne 'node-v24.1.0-win-x64.zip'){throw 'Wrong Node archive'}\n$rejected=$false;try {Assert-ContainedPath $env:AXIOM_TEST_ROOT (Join-Path $env:AXIOM_TEST_ROOT '../escape') | Out-Null}catch{$rejected=$true};if(-not $rejected){throw 'Traversal accepted'}\n$file=Join-Path $env:AXIOM_TEST_ROOT 'download';Set-Content -LiteralPath $file -Value 'payload'\n$hash=(Get-AxiomFileHash $file 'SHA256');Test-DownloadHash $file $hash 'SHA256'\n$rejected=$false;try{Test-DownloadHash $file ('0'*64) 'SHA256'}catch{$rejected=$true};if(-not $rejected){throw 'Corrupt download accepted'}\nAdd-Type -AssemblyName System.IO.Compression\nAdd-Type -AssemblyName System.IO.Compression.FileSystem\n$zip=Join-Path $env:AXIOM_TEST_ROOT 'hostile.zip';$archive=[IO.Compression.ZipFile]::Open($zip,[IO.Compression.ZipArchiveMode]::Create);$archive.CreateEntry('../escape.txt') | Out-Null;$archive.Dispose()\n$rejected=$false;try{Expand-VerifiedZip $zip (Join-Path $env:AXIOM_TEST_ROOT 'unpacked')}catch{$rejected=$true};if(-not $rejected){throw 'Hostile ZIP accepted'}\nWrite-Output 'launcher helpers passed'`;
 await writeFile(script,source);const result=await promisify(execFile)('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script],{windowsHide:true,env:{...process.env,AXIOM_TEST_MODULE:module,AXIOM_TEST_ROOT:root}});assert.match(result.stdout,/launcher helpers passed/);const cmd=await readFile('Start-Axiom.cmd','utf8');assert.match(cmd,/pause/i);assert.match(cmd,/%~dp0/);
});
async function real(t){const base=await temp(t),root=join(base,'projects'),host=await startHost({root,stateRoot:join(base,'state'),manifests:[join(engine,'platform/product.json')]});t.after(()=>host.close());return {base,root,host,run:data=>host.manager.execute({...data,operationId:randomUUID()})};}
test('P4 real project rename/save/close/remove/re-add/delete preserve identity and require reviewed confirmation', {skip:!engine,timeout:60000},async t=>{
 const f=await real(t),s=await f.run({action:'create',productId:'axiom.game-engine',name:'Before rename'}),key={productId:s.productId,projectId:s.status.projectId},file=join(f.root,s.path),original=JSON.parse(await readFile(file));assert.equal(original.scene.entities.length,3);
 await assert.rejects(f.run({action:'remove',...key}),e=>e.code==='projectBusy');await assert.rejects(f.run({action:'delete-review',...key}),e=>e.code==='projectBusy');
 await assert.rejects(f.run({action:'rename',...key,name:'Stale',expectedRevision:-1}),e=>e.code==='revisionConflict');const renamed=await f.run({action:'rename',...key,name:'After rename',expectedRevision:s.status.revision});assert.equal(renamed.projectId,key.projectId);const saved=JSON.parse(await readFile(file));assert.equal(saved.name,'After rename');assert.deepEqual(saved.scene,original.scene);
 const status=await f.run({action:'status',sessionId:s.sessionId});await f.run({action:'close',sessionId:s.sessionId,expectedRevision:status.status.revision,decision:'save'});
 await f.run({action:'rename',...key,name:'Closed rename'});assert.equal(JSON.parse(await readFile(file)).name,'Closed rename');
 await f.run({action:'remove',...key});assert.equal(f.host.manager.catalog().recents.length,0);await access(file);
 await f.run({action:'add-local',productId:s.productId,sourcePath:dirname(file)});assert.equal(f.host.manager.catalog().recents[0].path,file);
 const plan=await f.run({action:'delete-review',...key});await assert.rejects(f.run({action:'delete',...key,planId:plan.planId,confirmName:'Wrong'}),e=>e.code==='invalidRequest');await access(file);
 await writeFile(join(dirname(file),'late.txt'),'changed since review');await assert.rejects(f.run({action:'delete',...key,planId:plan.planId,confirmName:'Closed rename'}),e=>e.code==='revisionConflict');await access(file);
 const fresh=await f.run({action:'delete-review',...key});await f.run({action:'delete',...key,planId:fresh.planId,confirmName:'Closed rename'});await assert.rejects(access(file),e=>e.code==='ENOENT');assert.equal(f.host.manager.catalog().recents.length,0);await access(f.root);
});
test('P4 real installation update is deferred through a live session and rollback reopens unchanged saved project', {skip:!engine,timeout:60000},async t=>{
 const f=await real(t),s=await f.run({action:'create',productId:'axiom.game-engine',name:'Update survival'}),file=join(f.root,s.path),bytes=await readFile(file),registry=f.host.manager.registry,old=registry.selected[s.productId],folder=join(f.base,'compatible-installation');await mkdir(folder);
 const descriptor=JSON.parse(await readFile(join(engine,'platform/product.json')));descriptor.productVersion='0.0.54';descriptor.launch.entry='adapter.mjs';
 // Test wrapper delegates the real adapter, changing only its advertised package version.
 const moduleUrl=new URL('file:///');moduleUrl.pathname=resolve(engine,'platform/adapter.mjs').replaceAll('\\','/');
 await writeFile(join(folder,'product.json'),JSON.stringify(descriptor));await writeFile(join(folder,'adapter.mjs'),`import {GameEngineAdapter} from ${JSON.stringify(moduleUrl.href)};const adapter=new GameEngineAdapter();let queue=Promise.resolve();process.on('message',msg=>{if(msg.kind){adapter.sharedGitHub?.receive(msg);adapter.sharedAi?.receive(msg);return;}queue=queue.then(async()=>{let reply;try{const result=await adapter.request(msg);if(msg.method==='initialize')result.productVersion='0.0.54';reply={ok:true,result};}catch(e){reply={ok:false,error:{code:e.code,message:e.message}}}if(process.connected)process.send({protocolVersion:1,requestId:msg.requestId,correlationId:msg.correlationId,sessionId:msg.sessionId,productId:msg.productId,...reply});});});process.on('disconnect',()=>void queue.finally(()=>adapter.shutdown()).finally(()=>process.exit(0)));`);
 const next=await registry.add(join(folder,'product.json'));await f.host.manager.installations({action:'activate',installationId:next});assert.equal(registry.selected[s.productId],old);assert.equal(registry.pending[s.productId],next);assert.equal(f.host.manager.catalog().sessions[0].productVersion,'0.0.53');
 await f.run({action:'close',sessionId:s.sessionId,expectedRevision:s.status.revision,decision:'save'});assert.equal(registry.selected[s.productId],next);assert.deepEqual(await readFile(file),bytes);
 const upgraded=await f.run({action:'open',productId:s.productId,path:file});assert.equal(upgraded.productVersion,'0.0.54');assert.equal(upgraded.status.projectId,s.status.projectId);await f.run({action:'close',sessionId:upgraded.sessionId,expectedRevision:upgraded.status.revision,decision:'save'});await f.host.manager.installations({action:'rollback',productId:s.productId});assert.equal(registry.selected[s.productId],old);const opened=await f.run({action:'open',productId:s.productId,path:file});assert.equal(opened.status.projectId,s.status.projectId);assert.deepEqual(await readFile(file),bytes);
});

test('P4 deletion refuses storage roots, nested registered projects, linked data and expired plans',async t=>{
 const {ProjectDeletion}=await import('../services/local-host/deletion.mjs'),root=await temp(t),folder=join(root,'game');await mkdir(folder);const file=join(folder,'project.json');await writeFile(file,'{}');const entry={projectId:'game',path:file,name:'Game'},store=memory(),manager={root,store},deletion=new ProjectDeletion(manager);store.value.recents=[entry];
 const rootFile=join(root,'root.json');await writeFile(rootFile,'{}');await assert.rejects(deletion.review({...entry,path:rootFile}),e=>e.code==='permissionDenied');
 store.value.recents.push({projectId:'other',path:join(folder,'nested','other.json')});await assert.rejects(deletion.review(entry),e=>e.code==='projectBusy');store.value.recents.pop();
 const plan=await deletion.review(entry);deletion.plans.get(plan.planId).expires=0;await assert.rejects(deletion.remove(entry,{planId:plan.planId,confirmName:'Game'}),e=>e.code==='invalidRequest');await access(file);
 const target=join(root,'outside');await mkdir(target);await symlink(target,join(folder,'linked'),process.platform==='win32'?'junction':'dir');await assert.rejects(deletion.review(entry),e=>e.code==='permissionDenied');await access(file);await access(target);
});

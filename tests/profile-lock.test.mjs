import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,link,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {acquireProfileLock} from '../services/local-host/profile-lock.mjs';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'axiom-lock-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
function stoppedChild(){const child=spawnSync(process.execPath,['-e','process.stdout.write(String(process.pid))'],{encoding:'utf8'});assert.equal(child.status,0);return Number(child.stdout);}
test('abrupt process exit is recovered, including legacy P4/P5 PID locks',async t=>{
  const root=await fixture(t),url=new URL('../services/local-host/profile-lock.mjs',import.meta.url).href;
  const child=spawnSync(process.execPath,['--input-type=module','-e',`import {acquireProfileLock} from ${JSON.stringify(url)};await acquireProfileLock(process.argv[1]);process.exit(0);`,root],{encoding:'utf8'});
  assert.equal(child.status,0,child.stderr);
  let lock=await acquireProfileLock(root);await lock.close();
  await writeFile(join(root,'platform.lock'),String(stoppedChild()));
  lock=await acquireProfileLock(root);await lock.close();
});
test('live owner is never displaced and settings are untouched',async t=>{
  const root=await fixture(t),path=join(root,'platform.lock');
  await writeFile(join(root,'platform.json'),'user settings');await writeFile(path,String(process.pid));
  await assert.rejects(acquireProfileLock(root),e=>e.code==='projectBusy'&&e.message.includes('Another Platform'));
  assert.equal(await readFile(path,'utf8'),String(process.pid));assert.equal(await readFile(join(root,'platform.json'),'utf8'),'user settings');
});
test('simultaneous stale recovery grants at most one owner',async t=>{
  const root=await fixture(t);await writeFile(join(root,'platform.lock'),String(stoppedChild()));
  const results=await Promise.allSettled(Array.from({length:12},()=>acquireProfileLock(root)));
  const owners=results.filter(r=>r.status==='fulfilled');assert.equal(owners.length,1);
  for(const r of results)if(r.status==='rejected')assert.equal(r.reason.code,'projectBusy');
  await owners[0].value.close();const next=await acquireProfileLock(root);await next.close();
});
test('repeated close cannot remove a replacement owner lock',async t=>{
  const root=await fixture(t),first=await acquireProfileLock(root);await first.close();
  const second=await acquireProfileLock(root);await first.close();
  await assert.rejects(acquireProfileLock(root),e=>e.code==='projectBusy');await second.close();
});
test('independent processes racing stale recovery cannot both enter the profile',async t=>{
  const root=await fixture(t),url=new URL('../services/local-host/profile-lock.mjs',import.meta.url).href;
  await writeFile(join(root,'platform.lock'),String(stoppedChild()));
  const children=Array.from({length:6},()=>spawn(process.execPath,['--input-type=module','-e',`import {acquireProfileLock} from ${JSON.stringify(url)};try{await acquireProfileLock(process.argv[1]);console.log('owner');process.stdin.resume();}catch(e){console.log(e.code);}`,root],{stdio:['pipe','pipe','pipe']}));
  const exits=children.map(c=>new Promise(resolve=>c.on('exit',resolve)));
  t.after(async()=>{for(const c of children)c.stdin.end();await Promise.all(exits);});
  const answers=await Promise.all(children.map(c=>new Promise((resolve,reject)=>{c.stdout.once('data',data=>resolve(String(data).trim()));c.once('error',reject);})));
  assert.equal(answers.filter(a=>a==='owner').length,1);assert(answers.every(a=>a==='owner'||a==='projectBusy'));
});
test('malformed, linked and interrupted recovery locks fail closed',async t=>{
  const root=await fixture(t),path=join(root,'platform.lock');await writeFile(path,'broken');
  await assert.rejects(acquireProfileLock(root),e=>e.code==='projectBusy');assert.equal(await readFile(path,'utf8'),'broken');await rm(path);
  const target=join(root,'other');await writeFile(target,String(stoppedChild()));await link(target,path);
  await assert.rejects(acquireProfileLock(root),e=>e.code==='projectBusy');assert.equal(await readFile(path,'utf8'),await readFile(target,'utf8'));await rm(path);
  await writeFile(path,String(stoppedChild()));await mkdir(join(root,'platform.lock.recovery'));
  await assert.rejects(acquireProfileLock(root),e=>e.code==='projectBusy'&&e.message.includes('recovery'));
});

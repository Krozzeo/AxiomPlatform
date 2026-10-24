import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationContext} from '../scripts/release-context.mjs';
import {hubLauncherBytes,createHubShortcut} from '../scripts/hub-shortcut.mjs';
import {publicationFiles} from '../scripts/publish-release.mjs';
import {fixture} from './fixtures/releases.mjs';
import {mkdtemp,rm,writeFile,readFile,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const repository='Krozzeo/AxiomGameEngine',commit='a'.repeat(40),run={id:123,head_sha:commit,head_branch:'feat/example',head_repository:{full_name:repository},event:'pull_request',conclusion:'success'},pull={number:60,state:'open',head:{sha:commit,ref:'feat/example',repo:{full_name:repository}},base:{repo:{full_name:repository}}};
test('publication is exact-CI gated, rejects forks/stale PRs and never overwrites a published version',async()=>{
 let existing=null,current=pull;const get=async path=>path.includes('/pulls')?[current]:path.includes('/contents/')?{encoding:'base64',content:Buffer.from('{"name":"axiom-engine","version":"0.0.57"}').toString('base64')}:path.includes('/releases/')?existing:undefined;
 const args={event:'workflow_run',payload:{workflow_run:run},repository,get};const result=await publicationContext(args);assert.equal(result.tag,'experimental-pr-60-'+commit);assert.equal(result.pullRequest,60);assert.equal(result.runId,123);
 assert.equal(await publicationContext({...args,payload:{workflow_run:{...run,conclusion:'failure'}}}),null);assert.equal(await publicationContext({...args,payload:{workflow_run:{...run,head_repository:{full_name:'other/fork'}}}}),null);
 current={...pull,head:{...pull.head,sha:'b'.repeat(40)}};assert.equal(await publicationContext(args),null);current=pull;existing={draft:false};assert.equal(await publicationContext(args),null);
});
test('publisher rejects checksum/provenance changes before it uploads any executable package',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-publish-'));t.after(()=>rm(root,{recursive:true,force:true}));const build={channel:'experimental',commit,branch:'feat/example',pullRequest:60,runId:123},f=fixture('0.0.57',undefined,{build});await writeFile(join(root,'axiom-release.json'),JSON.stringify(f.manifest));await writeFile(join(root,'Engine.zip'),f.archive);assert.equal((await publicationFiles(root,{...build,version:'0.0.57'})).length,2);await assert.rejects(publicationFiles(root,{...build,version:'0.0.57',commit:'b'.repeat(40)}),/provenance/);await writeFile(join(root,'Engine.zip'),'broken');await assert.rejects(publicationFiles(root,{...build,version:'0.0.57'}),/checksum/);
});
test('Hub shortcut contains a relative launcher and own valid Axiom icon without checkout paths',async()=>{
 const b=hubLauncherBytes();assert.equal(b.toString('ascii',0,2),'MZ');assert.ok(b.includes(Buffer.from('Start Axiom.cmd','utf16le')));assert.equal(b.includes(Buffer.from(process.cwd(),'utf16le')),false);const ico=await readFile(new URL('../apps/hub/icons/axiom.ico',import.meta.url));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),1);assert.equal(ico.readUInt32LE(18),22);const record=JSON.parse(await readFile(new URL('../scripts/windows/launcher-build.json',import.meta.url),'utf8'));assert.equal(createHash('sha256').update(b).digest('hex'),record.executableSha256);const source=(await readFile(new URL('../scripts/windows/AxiomHub.cs',import.meta.url),'utf8')).replaceAll('\r\n','\n');assert.equal(createHash('sha256').update(source).digest('hex'),record.sourceSha256);
});
test('Windows Hub shortcut follows its copied directory even while the original launcher exists',{skip:process.platform!=='win32'},async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-shortcut-'));t.after(()=>rm(root,{recursive:true,force:true}));const original=join(root,'original'),relocated=join(root,'relocated with spaces');await createHubShortcut(original);await createHubShortcut(relocated);await writeFile(join(original,'Start Axiom.cmd'),'@echo off\r\necho ORIGINAL>"%~dp0proof.txt"\r\n');await writeFile(join(relocated,'Start Axiom.cmd'),'@echo off\r\necho RELOCATED>"%~dp0proof.txt"\r\n');await promisify(execFile)(join(relocated,'Axiom Hub.exe'),[],{windowsHide:true,timeout:20000});assert.equal((await readFile(join(relocated,'proof.txt'),'utf8')).trim(),'RELOCATED');await assert.rejects(readFile(join(original,'proof.txt')),e=>e.code==='ENOENT');
});

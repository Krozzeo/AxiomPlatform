import {fixture} from './fixtures/releases.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ReleaseCatalog,validateRelease,compareVersions,sources} from '../services/local-host/releases.mjs';
import {zipEntries} from '../scripts/prepare-release.mjs';
import {extractRelease} from '../services/local-files/release-zip.mjs';
import {startHost} from '../services/local-host/server.mjs';
import {CAPABILITIES} from '../packages/contracts/index.mjs';
async function temp(t){const p=await mkdtemp(join(tmpdir(),'axiom-release-'));t.after(()=>rm(p,{recursive:true,force:true}));return p;}
test('release catalog validates official identity, numeric versions, platform and cache, retains data offline',async()=>{
 const f=fixture(),catalog=new ReleaseCatalog({fetchImpl:f.fetchImpl,platform:'win32',arch:'x64'});await catalog.refresh();assert.deepEqual(catalog.view([{productId:'axiom.game-engine',version:'0.0.55',active:true}]).pending,['axiom.game-engine']);assert.equal(catalog.view([{productId:'axiom.game-engine',version:'0.0.56',active:true}]).pending.length,0);const count=f.requests.length;await catalog.refresh();assert.equal(f.requests.length,count);f.broken=true;await catalog.refresh(true);assert.equal(catalog.items.length,1);assert(catalog.errors.length);assert.equal(compareVersions('0.0.100','0.0.56'),1);
 assert.throws(()=>validateRelease({...f.manifest,productId:'axiom.other'},f.source,f.release));const bad=structuredClone(f.release);bad.assets[1].browser_download_url='https://example.com/code.zip';assert.throws(()=>validateRelease(f.manifest,f.source,bad));
 const linux=new ReleaseCatalog({fetchImpl:f.fetchImpl,platform:'linux',arch:'x64'});linux.items=catalog.items;assert.equal(linux.view().items[0].artifact,null);
});
test('prepared download installs in persistent product storage, verifies handshake, preserves selection on restart and supports rollback',async t=>{
 const root=await temp(t),f=fixture(),releases=new ReleaseCatalog({fetchImpl:f.fetchImpl,platform:'win32',arch:'x64'});await releases.refresh();let host=await startHost({root:join(root,'projects'),stateRoot:join(root,'profile'),manifests:[],releaseCatalog:releases});t.after(()=>host.close());
 const storage=join(root,'products with spaces');await host.manager.configure({productRoot:storage});await host.manager.installRelease('axiom.game-engine@0.0.56');assert.equal(host.manager.catalog().products[0].productVersion,'0.0.56');assert.equal(host.manager.catalog().releases.pending.length,0);assert.equal(JSON.parse(await readFile(join(storage,'axiom.game-engine-0.0.56/platform/product.json'),'utf8')).productVersion,'0.0.56');
 await assert.rejects(host.manager.installRelease('axiom.game-engine@0.0.56'),/already exists/);await host.close();host=await startHost({stateRoot:join(root,'profile')});assert.equal(host.manager.catalog().productRoot,await realpath(storage));assert.equal(host.manager.catalog().products[0].productVersion,'0.0.56');const report=host.manager.diagnostics();assert(!JSON.stringify(report).includes(root));assert.equal(report.installations[0].version,'0.0.56');
});
test('bad checksum and unsafe ZIP paths do not install or touch sibling files',async t=>{
 const root=await temp(t),f=fixture(),catalog=new ReleaseCatalog({fetchImpl:f.fetchImpl,platform:'win32',arch:'x64'});await catalog.refresh();catalog.items[0].artifacts[0].sha256='0'.repeat(64);const host=await startHost({root:join(root,'projects'),stateRoot:join(root,'profile'),manifests:[],releaseCatalog:catalog});t.after(()=>host.close());await assert.rejects(host.manager.installRelease('axiom.game-engine@0.0.56'),/checksum/);assert.equal(host.manager.registry.items.size,0);
 for(const name of ['../escape','C:/escape','foo:stream','CON.txt','folder\\escape','case/../escape']){const zip=zipEntries([{name,data:Buffer.from('x')}]);await assert.rejects(extractRelease(zip,root));}
 const zip=zipEntries([{name:'same.txt',data:Buffer.from('x')},{name:'SAME.txt',data:Buffer.from('x')}]);await assert.rejects(extractRelease(zip,root));assert.deepEqual((await readdir(root)).sort(),['profile','projects']);
});

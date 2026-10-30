import {controlledCatalog} from './fixtures/catalog.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ReleaseCatalog,sources} from '../services/local-host/releases.mjs';
import {selectReleaseBuilds} from '../services/local-host/release-selection.mjs';
import {releaseOptions,releaseFeedback} from '../apps/hub/installations-view.mjs';
import {releaseArtifactBase} from '../scripts/prepare-release.mjs';
import {startHost} from '../services/local-host/server.mjs';
import {fixture} from './fixtures/releases.mjs';
const build=(commit,pr=5)=>({channel:'experimental',commit:commit.repeat(40),branch:'feat/test',pullRequest:pr,runId:123});

const temporary=async t=>{const root=await mkdtemp(join(tmpdir(),'axiom-catalog-history-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;};
test('latest builds are grouped by repository, product and PR, with deterministic dates and no loss of stable history',()=>{
 const item=(id,date,pr=5,product='axiom.game-engine',repository='Krozzeo/AxiomGameEngine')=>({id,version:'0.0.62',channel:'experimental',publishedAt:date,repository,productId:product,build:build(id,pr)});
 const original=[item('a','2026-01-01'),item('b','2026-02-01'),item('c','2026-01-01',6),item('d','2026-01-01',5,'axiom.math-lab'),item('e','2026-01-01',5,'axiom.game-engine','Other/Engine'),{id:'stable',version:'0.0.57',channel:'stable'}],copy=structuredClone(original),selected=selectReleaseBuilds(original);
 assert.deepEqual(original,copy);assert.deepEqual(selected.filter(r=>r.isHistorical).map(r=>r.id),['a']);assert.equal(selectReleaseBuilds([...original].reverse()).find(r=>r.id==='b').isHistorical,false);
});
test('historical builds remain installable and installed, but never inflate update badges or the default picker',async t=>{
 const root=await temporary(t),a=fixture('0.0.62',sources[1],{build:build('a')}),b=fixture('0.0.62',sources[1],{build:build('b')});a.release.published_at='2026-01-01';b.release.published_at='2026-02-01';const releases=controlledCatalog([a,b]);await releases.refresh();const h=await startHost({root:join(root,'projects'),stateRoot:join(root,'state'),manifests:[],releaseCatalog:releases});t.after(()=>h.close());await h.startup;
 const latest=b.source.productId+'@0.0.62~'+build('b').commit,old=a.source.productId+'@0.0.62~'+build('a').commit;
 assert.deepEqual(h.manager.catalog().releases.newReleaseIds,[latest]);assert.deepEqual(releaseOptions(h.manager.catalog()).map(r=>r.value),[latest]);assert.deepEqual(releaseOptions(h.manager.catalog(),'all',true).map(r=>r.value),[old]);
 await h.manager.installRelease(old);assert.equal(h.manager.catalog().installations[0].releaseId,old);assert.equal(releaseOptions(h.manager.catalog(),'all',true)[0].installed,true);await h.manager.readRelease(latest);assert.deepEqual(h.manager.catalog().releases.newReleaseIds,[]);await h.close();
 const reopened=await startHost({stateRoot:join(root,'state'),releaseCatalog:controlledCatalog([a,b])});t.after(()=>reopened.close());await reopened.startup;assert.deepEqual(reopened.manager.catalog().releases.newReleaseIds,[]);assert.equal(reopened.manager.catalog().installations[0].releaseId,old);
});
test('startup forces fresh discovery despite warm cache, removes missing installations and activates a valid pending version without a browser',async t=>{
 const root=await temporary(t),f=fixture('0.0.56'),next=fixture('0.0.57'),releases=controlledCatalog([f,next]);let h=await startHost({root:join(root,'projects'),stateRoot:join(root,'state'),manifests:[],releaseCatalog:releases});await h.startup;await h.manager.installRelease('axiom.game-engine@0.0.56');await h.manager.installRelease('axiom.game-engine@0.0.57');const installed=h.manager.catalog().installations,old=installed.find(i=>i.version==='0.0.56'),pending=installed.find(i=>i.version==='0.0.57');await h.close();
 const path=join(root,'state/platform.json'),saved=JSON.parse(await readFile(path,'utf8'));saved.selectedInstallations['axiom.game-engine']=old.id;saved.pendingInstallations['axiom.game-engine']=pending.id;await writeFile(path,JSON.stringify(saved));await rm(join(root,'state/products/axiom.game-engine-0.0.56'),{recursive:true,force:true});await writeFile(join(root,'projects/keep.txt'),'preserved');
 const newer=fixture('0.0.58'),calls=[],fresh=controlledCatalog([f,next,newer],calls);h=await startHost({stateRoot:join(root,'state'),releaseCatalog:fresh,checkReleases:true});t.after(()=>h.close());await h.startup;const c=h.manager.catalog();assert.equal(c.startupRefresh.state,'completed');assert(c.releases.items.some(r=>r.version==='0.0.58'));assert(calls.some(u=>u.includes('/releases?')));assert.equal(c.installations.length,1);assert.equal(c.installations[0].id,pending.id);assert.equal(c.installations[0].active,true);assert.equal(c.products[0].productVersion,'0.0.57');assert.equal(await readFile(join(root,'projects/keep.txt'),'utf8'),'preserved');
});
test('Engineer CAD is discoverable/configurable while planned and automatically accepts a future compatible product release',async t=>{
 const root=await temporary(t),cad=sources.find(s=>s.productId==='axiom.engineer-cad');assert.equal(cad.repository,'Krozzeo/AxiomEngineerCAD');assert.equal(releaseArtifactBase(cad.productId),'AxiomEngineerCAD');const fixtures=[],releases=controlledCatalog(fixtures),h=await startHost({root:join(root,'projects'),stateRoot:join(root,'state'),manifests:[],releaseCatalog:releases});t.after(()=>h.close());await h.startup;
 assert.equal(h.manager.catalog().products.length,0);assert.equal(releaseFeedback(h.manager.catalog(),cad.productId).state,'empty');assert.match(releaseFeedback(h.manager.catalog(),cad.productId).message,/in preparation/);
 await h.manager.configure({releaseSources:{[cad.productId]:'https://github.com/Example/FutureCAD'}});assert.equal(h.manager.releases.sources.find(s=>s.productId===cad.productId).repository,'Example/FutureCAD');await h.manager.configure({releaseSources:null});
 fixtures.push(fixture('0.0.1',cad));await releases.refresh(true);await h.manager.installRelease(cad.productId+'@0.0.1');assert.equal(h.manager.catalog().products[0].productId,cad.productId);assert.equal(h.manager.catalog().installations[0].active,true);
});

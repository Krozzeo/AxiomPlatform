import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fixture} from './fixtures/releases.mjs';
import {ReleaseCatalog,sources} from '../services/local-host/releases.mjs';
import {startHost} from '../services/local-host/server.mjs';
import {GitHubClient} from '../services/integrations/github/client.mjs';
import {releaseFeedback} from '../apps/hub/installations-view.mjs';

async function temp(t){const root=await mkdtemp(join(tmpdir(),'axiom-discovery-'));t.after(()=>rm(root,{recursive:true,force:true}));return join(root,'release-catalog.json');}
const ui=(c,filter='all')=>releaseFeedback({releases:c.view()},filter);

test('saved catalog survives restart, skips fresh automatic checks, retains versions offline and recovers',async t=>{
 const path=await temp(t),f=fixture();let now=1000000,offline=false,calls=0;
 const fetchImpl=async(...a)=>{calls++;if(offline)throw Error('offline');return f.fetchImpl(...a);};
 const first=new ReleaseCatalog({clock:()=>now,fetchImpl});await first.initialize({cachePath:path});await first.refresh();assert.equal(first.items.length,1);const count=calls;
 const second=new ReleaseCatalog({clock:()=>now,fetchImpl});await second.initialize({cachePath:path});assert.equal(second.items.length,1);await second.refresh();assert.equal(calls,count);assert.equal(ui(second).state,'ready');
 now+=600001;offline=true;await second.refresh();assert.equal(second.items.length,1);assert.equal(ui(second).state,'cached');assert.match(ui(second).message,/last saved catalog/);assert.equal(second.errors[0].code,'network');
 const third=new ReleaseCatalog({clock:()=>now,fetchImpl});await third.initialize({cachePath:path});assert.equal(third.items.length,1);assert.equal(ui(third).state,'cached');const failedCalls=calls;await third.refresh(true);assert.equal(calls,failedCalls);
 now+=60001;offline=false;await third.refresh(true);assert.equal(third.errors.length,0);assert.equal(ui(third).state,'ready');
});

test('rate limit is distinguished from empty, shared across sources and honored after restart',async t=>{
 const path=await temp(t);let calls=0,now=1000000;
 const fetchImpl=async()=>{calls++;return new Response('',{status:403,headers:{'x-ratelimit-remaining':'0','x-ratelimit-reset':String((now+120000)/1000)}});};
 const c=new ReleaseCatalog({clock:()=>now,fetchImpl});await c.initialize({cachePath:path});await c.refresh();assert.equal(calls,1);assert.equal(c.errors.length,3);assert(c.errors.every(e=>e.code==='rateLimited'&&e.retryAt===1120000));assert.equal(ui(c).state,'error');assert.equal(ui(c).label,'Version check failed');assert.match(ui(c).message,/does not mean no versions/);await c.refresh(true);assert.equal(calls,1);
 const restart=new ReleaseCatalog({clock:()=>now,fetchImpl});await restart.initialize({cachePath:path});await restart.refresh(true);assert.equal(calls,1);now+=120001;await restart.refresh(true);assert.equal(calls,2);
});

test('authenticated public queries bypass anonymous backoff and never send credentials to downloads or redirects',async()=>{
 const f=fixture();let token=null;const seen=[];
 const c=new ReleaseCatalog({clock:()=>1000000,fetchImpl:async(url,options)=>{seen.push({url,options});if(url.startsWith('https://api.github.com/')&&!options.headers.Authorization)return new Response('',{status:429,headers:{'retry-after':'120'}});return f.fetchImpl(url,options);}});
 await c.initialize({getToken:()=>token});await c.refresh();assert.equal(c.items.length,0);token='sentinel-not-a-real-key';await c.refresh(true);assert.equal(c.items.length,1);assert.equal(c.errors.length,0);
 assert(seen.some(r=>r.url.startsWith('https://api.github.com/')&&r.options.headers.Authorization==='Bearer '+token));assert(seen.filter(r=>r.url.startsWith('https://api.github.com/')).every(r=>r.options.redirect==='error'));assert(seen.filter(r=>!r.url.startsWith('https://api.github.com/')).every(r=>!r.options.headers.Authorization));assert(!JSON.stringify(c.view()).includes(token));
});

test('conditional checks reuse manifests and HTTP304 data without hiding newly published versions',async()=>{
 const old=fixture(),fresh=fixture('0.0.57');let add=false,assets=0,conditional=0;
 const c=new ReleaseCatalog({fetchImpl:async(url,o)=>{if(url.startsWith('https://api.github.com/')){if(!url.includes(sources[1].repository))return Response.json([]);if(o.headers['If-None-Match']&&!add){conditional++;return new Response(null,{status:304});}return Response.json(add?[fresh.release,old.release]:[old.release],{headers:{etag:add?'"new"':'"old"'}});}assets++;return(url.includes('/v0.0.57/')?fresh:old).fetchImpl(url,o);}});
 await c.refresh();assert.equal(assets,1);await c.refresh(true);assert.equal(conditional,1);assert.equal(assets,1);add=true;await c.refresh(true);assert.equal(c.items.length,2);assert.equal(assets,2);
});

test('successful empty results, source-specific errors and malformed responses have different UI states',async()=>{
 let response='empty';const c=new ReleaseCatalog({fetchImpl:async url=>{if(response==='bad')return Response.json({unexpected:true});if(response==='forbidden'&&url.includes(sources[1].repository))return new Response('',{status:403});return Response.json([]);}});
 await c.refresh();assert.equal(ui(c).state,'empty');assert.match(ui(c).message,/check succeeded/);response='forbidden';await c.refresh(true);assert.equal(ui(c,'axiom.game-engine').state,'error');assert.equal(c.errors[0].code,'forbidden');assert.equal(ui(c,'axiom.math-lab').state,'empty');
 const bad=new ReleaseCatalog({fetchImpl:()=>Response.json({unexpected:true})});await bad.refresh();assert.equal(ui(bad).state,'error');assert.equal(bad.errors[0].code,'invalidResponse');
 for(const [status,code]of [[401,'unauthorized'],[404,'notFound'],[503,'serviceUnavailable']]){const x=new ReleaseCatalog({fetchImpl:()=>new Response('',{status})});await x.refresh();assert(x.errors.every(e=>e.code===code));}
});

test('cache is source-bound, validated, bounded and contains no credentials',async t=>{
 const path=await temp(t),f=fixture(),token='sentinel-account-token';const c=new ReleaseCatalog({fetchImpl:f.fetchImpl});await c.initialize({cachePath:path,getToken:()=>token});await c.refresh();assert(!(await readFile(path,'utf8')).includes(token));
 await c.configure({'axiom.game-engine':'https://github.com/Example/AnotherEngine'});assert.equal(c.items.length,0);assert.equal(ui(c).state,'unchecked');
 const cache=JSON.parse(await readFile(path,'utf8'));cache.items[0].artifacts[0].url='https://untrusted.invalid/package.zip';await writeFile(path,JSON.stringify(cache));const corrupt=new ReleaseCatalog();await corrupt.initialize({cachePath:path});assert.equal(corrupt.items.length,0);assert(corrupt.cacheWarning);assert.equal(ui(corrupt).state,'error');
 await writeFile(path,'broken json');const malformed=new ReleaseCatalog();await malformed.initialize({cachePath:path});assert(malformed.cacheWarning);assert.equal(malformed.items.length,0);
});

test('transient manifest failure preserves the last complete catalog instead of replacing it with empty',async()=>{
 const f=fixture();let fail=false;const c=new ReleaseCatalog({fetchImpl:(url,o)=>fail&&url.endsWith('axiom-release.json')?new Response('',{status:503}):f.fetchImpl(url,o)});await c.refresh();assert.equal(c.items.length,1);fail=true;f.release.assets[0].updated_at='changed';await c.refresh(true);assert.equal(c.items.length,1);assert.equal(c.errors.find(e=>e.productId==='axiom.game-engine').code,'serviceUnavailable');
});

test('host waits for saved GitHub account restoration before its first catalog query',async t=>{
 const path=await temp(t),root=join(path,'..'),token='controlled-host-github-key',requests=[],f=fixture();
 const githubClient=new GitHubClient({fetchImpl:async()=>{await new Promise(r=>setTimeout(r,10));return Response.json({id:1,login:'fixture'});}});
 const releases=new ReleaseCatalog({fetchImpl:(url,options)=>{requests.push({url,authorization:options.headers.Authorization});return f.fetchImpl(url,options);}});
 const vault={get:name=>name==='github'?token:null,status:()=>({available:true}),set:async()=>true};
 const h=await startHost({root:join(root,'projects'),stateRoot:join(root,'profile'),manifests:[],credentialVault:vault,githubClient,releaseCatalog:releases});try{await h.restore;await releases.flight;assert.equal(h.account.status().connected,true);assert(requests.filter(r=>r.url.startsWith('https://api.github.com/')).every(r=>r.authorization==='Bearer '+token));assert(requests.some(r=>r.url.startsWith('https://api.github.com/')));assert(requests.filter(r=>!r.url.startsWith('https://api.github.com/')).every(r=>!r.authorization));assert(!(await readFile(join(root,'profile/release-catalog.json'),'utf8')).includes(token));}finally{await h.close();}
});

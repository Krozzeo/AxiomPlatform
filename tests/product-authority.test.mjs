import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {startHost} from '../services/local-host/server.mjs';
import {OpenAiProvider} from '../services/ai/provider.mjs';
import {AiHTTPFixture} from './fixtures/ai-http.mjs';
const engine=process.env.AXIOM_ENGINE_PATH&&resolve(process.env.AXIOM_ENGINE_PATH);
test('hosted Engine inherits live Hub defaults, persists project overrides, cannot mutate accounts and restores shared connection on reopen',{skip:!engine,timeout:60000},async t=>{
 const base=await mkdtemp(join(tmpdir(),'axiom-authority-')),http=new AiHTTPFixture(),host=await startHost({root:join(base,'projects'),stateRoot:join(base,'state'),manifests:[join(engine,'platform/product.json')],aiProvider:new OpenAiProvider({fetchImpl:http.fetch})});t.after(async()=>{await host.close();await rm(base,{recursive:true,force:true});});
 async function api(origin,token,path,data){const r=await fetch(origin+path,{method:data?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})}),v=await r.json();if(!r.ok)throw Error(v.cause??v.message);return v;}
 const hub=(path,data)=>api(host.origin,host.token,path,data),session=data=>hub('/v1/sessions',{...data,operationId:randomUUID()});
 await hub('/v1/ai',{action:'configure',model:'gpt-5-mini',reasoning:'low'});await hub('/v1/ai',{action:'connect',apiKey:'sk-controlled-authority-only'});
 const a=await session({action:'create',productId:'axiom.game-engine',name:'Inherited'}),b=await session({action:'create',productId:'axiom.game-engine',name:'Override'});
 const editor=(s,path,data)=>{const u=new URL(s.editorUrl);return api(u.origin,new URLSearchParams(u.hash.slice(1)).get('token'),path,data);};
 let status=await editor(a,'/v1/ai/status');assert.equal(status.connected,true);assert.equal(status.model,'gpt-5-mini');assert.equal(status.reasoning,'low');assert.equal(status.modelOverride,'');assert.equal(status.reasoningOverride,'platform');assert.equal(status.platformOrigin,host.origin);
 await editor(b,'/v1/ai/configure',{action:'update',model:'gpt-6-astra',reasoning:'platform'});assert.equal((await editor(b,'/v1/ai/status')).reasoning,'low');await editor(b,'/v1/ai/configure',{action:'update',reasoning:'high'});await hub('/v1/ai',{action:'configure',model:'gpt-4.1-nano',reasoning:'default'});
 assert.equal((await editor(a,'/v1/ai/status')).model,'gpt-4.1-nano');assert.equal((await editor(b,'/v1/ai/status')).model,'gpt-6-astra');await editor(b,'/v1/ai/configure',{action:'test-model'});assert.equal(http.requests.at(-1).body.model,'gpt-6-astra');assert.equal(http.requests.at(-1).body.reasoning.effort,'high');
 for(const data of [{action:'connect',apiKey:'sk-other-controlled'},{action:'disconnect'},{action:'models',apiKey:'sk-other-controlled'}])await assert.rejects(editor(a,'/v1/ai/configure',data),/Platform Settings/);
 await assert.rejects(editor(a,'/v1/github/disconnect',{}),/Platform Settings/);assert.equal(host.ai.status().connected,true);
 const path=host.manager.sessions.get(b.sessionId).path;await session({action:'close',sessionId:b.sessionId,expectedRevision:b.status.revision,decision:'save'});const reopened=await session({action:'open',productId:b.productId,path});status=await editor(reopened,'/v1/ai/status');assert.equal(status.model,'gpt-6-astra');assert.equal(status.connected,true);
 await editor(reopened,'/v1/ai/configure',{action:'update',model:'',reasoning:'platform'});assert.equal((await editor(reopened,'/v1/ai/status')).model,'gpt-4.1-nano');await hub('/v1/ai',{action:'disconnect'});assert.equal((await editor(a,'/v1/ai/status')).connected,false);
 assert.equal((await readFile(join(base,'state/platform.json'),'utf8')).includes('sk-controlled'),false);assert.equal(a.productVersion,JSON.parse(await readFile(join(engine,'platform/product.json'),'utf8')).productVersion);
});

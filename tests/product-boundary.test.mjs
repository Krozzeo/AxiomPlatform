import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {productEnvironment} from '../packages/sdk/client.mjs';
import {GitHubClient} from '../services/integrations/github/client.mjs';
import {ProjectDeletion} from '../services/local-host/deletion.mjs';
import {startHost} from '../services/local-host/server.mjs';
test('product process environment strips provider and host credentials while retaining runtime paths',()=>{
 const source={OPENAI_API_KEY:'fake-ai',ANTHROPIC_API_KEY:'fake-anthropic',GOOGLE_API_KEY:'fake-google',GEMINI_API_KEY:'fake-gemini',GOOGLE_APPLICATION_CREDENTIALS:'fake-credential-file',CLAUDE_CODE_OAUTH_TOKEN:'fake-claude',OLLAMA_API_KEY:'fake-ollama',LM_STUDIO_API_TOKEN:'fake-local',GITHUB_TOKEN:'fake-gh',GH_TOKEN:'fake-cli',AXIOM_SESSION_TOKEN:'fake-host',PATH:'runtime-path',DOTNET_ROOT:'runtime-root'};assert.deepEqual(productEnvironment(source),{PATH:'runtime-path',DOTNET_ROOT:'runtime-root'});assert.equal(source.GH_TOKEN,'fake-cli');
});
test('GitHub credentials cannot be sent to a product-controlled origin or redirect-like target',async()=>{
 let calls=0;const client=new GitHubClient({fetchImpl:async url=>{calls++;assert.equal(url,'https://api.github.com/user');return Response.json({id:1});}});client.token='controlled-test-only';
 for(const path of ['@example.com','https://example.com','//example.com','/\\example.com','/user#fragment','/user\n'])await assert.rejects(client.request(path),/request target/);assert.equal(calls,0);await client.request('/user');assert.equal(calls,1);
});
test('invalid grouped settings preserve prior preferences; newly protected product storage blocks a previously reviewed deletion',async t=>{
 const base=await mkdtemp(join(tmpdir(),'axiom-boundary-'));t.after(()=>rm(base,{recursive:true,force:true}));const host=await startHost({root:join(base,'projects'),stateRoot:join(base,'state'),manifests:[]});t.after(()=>host.close());const before=structuredClone(host.manager.store.value.preferences);await assert.rejects(host.manager.configure({aiDefaults:{model:'gpt-5-mini',reasoning:'low'},theme:'invalid'}));assert.deepEqual(host.manager.store.value.preferences,before);
 const folder=join(host.manager.root,'game'),file=join(folder,'project.json'),tools=join(folder,'tools');await mkdir(tools,{recursive:true});await writeFile(file,'{}');const entry={projectId:'fixture',path:file,name:'Fixture',storageRoot:host.manager.root};host.manager.store.value.recents=[entry];const deletion=new ProjectDeletion(host.manager);let moved=0;deletion.recycle=async()=>{moved++;};const plan=await deletion.review(entry);await host.manager.configure({productRoot:tools});await assert.rejects(deletion.remove(entry,{planId:plan.planId,confirm:true}),e=>e.code==='permissionDenied');assert.equal(moved,0);
});

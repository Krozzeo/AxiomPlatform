import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {OpenAiProvider} from '../services/ai/provider.mjs';
import {AiRuntime} from '../services/ai/runtime.mjs';
import {AiAccount} from '../services/ai/account.mjs';
import {TaskJournal} from '../services/ai/journal.mjs';
import {ToolRegistry} from '../packages/sdk/tools.mjs';
import {changes,digest,requireHuman,requireReview} from '../services/changes/review.mjs';
const message=text=>({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text}]}],usage:{input_tokens:2,output_tokens:3,total_tokens:5}});
async function temporary(t){const root=await mkdtemp(join(tmpdir(),'axiom-p3-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
test('P3 provider fixes endpoints and refuses invalid/oversized responses without echoing credentials',async()=>{
  let status=401,text='private-credential';const provider=new OpenAiProvider({fetchImpl:async()=>new Response(text,{status}),key:'private-credential'});
  await assert.rejects(provider.request('/responses'),e=>/401/.test(e.message)&&!e.message.includes(text));
  await assert.rejects(provider.request('//other-host'),/Unsupported/);status=200;text='x'.repeat(2*1024*1024+1);await assert.rejects(provider.request('/models'),/budget/);
  text='broken';await assert.rejects(provider.request('/models'),/invalid JSON/);
});
test('P3 runtime accounts a late result but cannot turn it into tool calls after cancellation',async()=>{
  let release;const provider={key:'fake-test-secret',request:()=>new Promise(r=>release=r)};
  class Runtime extends AiRuntime{syncBudget(){}async persistSession(){}check(s){if(s.controller.signal.aborted)throw Error('cancelled');}}
  const runtime=new Runtime({transport:provider});runtime.sessionUsage={inputTokens:0,outputTokens:0,totalTokens:0,unreportedRequests:0};
  const s={controller:new AbortController(),public:{requests:0,usage:{inputTokens:0,outputTokens:0,totalTokens:0,cachedInputTokens:0,reasoningTokens:0},requestUsage:[]},cumulative:{requests:0,totalTokens:0}},input=[];
  const turn=runtime.runTurn(s,{input,body:{},context:()=>({}),normalize:()=>{throw Error('must not execute');}});s.controller.abort();release(message('late'));
  await assert.rejects(turn,/cancelled/);assert.equal(runtime.sessionUsage.totalTokens,5);assert.deepEqual(input,[]);
});
test('P3 host ledger isolates scopes, persists totals without secrets and rejects disconnected late results',async t=>{
  const root=await temporary(t),usagePath=join(root,'usage.json');let release;
  const provider=new OpenAiProvider({key:'fake-provider-secret',fetchImpl:async(_url,options)=>options.body?.includes('wait')?new Promise(r=>release=r):new Response(JSON.stringify(message('fake-provider-secret')))});
  const account=await new AiAccount({provider,usagePath}).initialize(),request=(owner,scope,body={store:false})=>account.invoke(owner,scope,'request',{requestId:randomUUID(),path:'/responses',epoch:account.epoch,body});
  const a=await request('session-a','project-a'),b=await request('session-b','project-b');assert.equal(JSON.stringify(a).includes('fake-provider-secret'),false);assert.equal(account.usage['project-a'].totalTokens,5);assert.equal(account.usage['project-b'].totalTokens,5);
  const pending=request('session-a','project-a',{store:false,input:'wait'});await new Promise(r=>setImmediate(r));account.disconnect();release(new Response(JSON.stringify(message('late'))));await assert.rejects(pending,/cancelled|replaced/);
  assert.equal(account.usage['project-a'].totalTokens,10);assert.equal((await readFile(usagePath,'utf8')).includes('secret'),false);
  const next=await new AiAccount({provider:new OpenAiProvider(),usagePath}).initialize();assert.equal(next.usage['project-a'].totalTokens,10);assert.equal(next.status().hasCredential,false);
  await assert.rejects(next.invoke('other','project-b','request',{requestId:randomUUID(),path:'/responses',epoch:-1,body:{store:false}}),/changed/);
  provider.key='fake-provider-secret';const late=request('session-a','project-a',{store:false,input:'wait'});const stopped=assert.rejects(late,/closed/);await new Promise(r=>setImmediate(r));await account.close();const closedLedger=await readFile(usagePath,'utf8');release(new Response(JSON.stringify(message('too late after restart'))));await stopped;assert.equal(await readFile(usagePath,'utf8'),closedLedger);assert.equal(JSON.parse(closedLedger).scopes['project-a'].unreportedRequests,1);
});
test('P3 registry validates exact contracts; review gates require human authority and matching content',()=>{
  const definition={name:'fixture.edit',inputSchema:{type:'object',properties:{value:{type:'integer'}},required:['value'],additionalProperties:false}},registry=new ToolRegistry([definition]);
  assert.equal(registry.validate('fixture.edit',{value:2}).name,'fixture.edit');assert.throws(()=>registry.validate('fixture.edit',{value:'2'}),/Invalid/);assert.throws(()=>registry.get('foreign.edit'),/unavailable/);assert.throws(()=>new ToolRegistry([definition,definition]),/duplicate/);
  assert.throws(()=>requireHuman({actor:{kind:'agent'}}),/human/);requireHuman({actor:{kind:'human'}});requireReview({a:1},digest({a:1}));assert.throws(()=>requireReview({a:2},digest({a:1})),/changed/);
  assert.equal(changes({'a/b':1},{'a/b':2},'document')[0].path,'document/a~1b');
});
test('P3 journal retains receipts and pending calls across restart and refuses corrupt or foreign identities',async t=>{
  const root=await temporary(t),journal=new TaskJournal(root),id='ai-task://'+randomUUID(),value={version:1,createdAt:new Date().toISOString(),public:{id},receipts:[{operationId:'already-done',result:2}],pendingCalls:[{call_id:'pending'}]};
  await journal.save(value);assert.deepEqual((await new TaskJournal(root).load())[0],value);assert.throws(()=>journal.save({...value,public:{id:'../../elsewhere'}}),/identity/);
  await writeFile(join(root,id.slice(10)+'.json'),'broken');await assert.rejects(journal.load());
});

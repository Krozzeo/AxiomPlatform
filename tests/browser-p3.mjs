import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {startHost} from '../services/local-host/server.mjs';
import {OpenAiProvider} from '../services/ai/provider.mjs';
import {AiHTTPFixture,aiMessage,aiTool} from './fixtures/ai-http.mjs';
if(!process.env.AXIOM_ENGINE_PATH)throw Error('AXIOM_ENGINE_PATH is required');
const engine=resolve(process.env.AXIOM_ENGINE_PATH),{chromium}=await import(pathToFileURL(join(engine,'node_modules/playwright/index.mjs'))),base=await mkdtemp(join(tmpdir(),'axiom-p3-browser-')),root=join(base,'projects'),evidence=resolve('.axiom/p3-browser');
await mkdir(evidence,{recursive:true});const report={criteria:[],pageErrors:[],provider:'controlled HTTP; no real model acceptance',renderer:'Null — UI acceptance'},http=new AiHTTPFixture();let host,browser,hub,editor;
try{
 host=await startHost({root,stateRoot:join(base,'state'),manifests:[join(engine,'platform/product.json')],aiProvider:new OpenAiProvider({fetchImpl:http.fetch})});
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1500,height:1100}});hub=await context.newPage();hub.on('pageerror',e=>report.pageErrors.push(e.message));await hub.goto(host.url);
 await hub.locator('#product option').waitFor({state:'attached'});await hub.locator('#new-project-button').click();await hub.locator('#name').fill('P3 AI and changes');await hub.locator('#create-form button[type=submit]').click();await hub.locator('#project-rows tr').getByText('Active · saved').waitFor();
 const session=host.manager.catalog().sessions.find(s=>s.state==='ready');editor=await context.newPage();editor.on('pageerror',e=>report.pageErrors.push(e.message));editor.on('dialog',d=>void d.accept());editor.setDefaultTimeout(30000);await editor.goto(session.editorUrl.replace('/#','/?renderer=null#'));
 const ready=()=>editor.waitForFunction(()=>document.querySelector('#editor-workspace').getAttribute('aria-busy')==='false');await editor.locator('#project-title').filter({hasText:'P3 AI and changes'}).waitFor();
 await editor.locator('#create-menu > summary').click();await editor.locator('#scene-add').click();await ready();await editor.locator('#entities .entity').first().click();await editor.locator('#entity-name').fill('Cube P3');await editor.locator('#entity-name').press('Tab');await ready();await editor.locator('#toolbar-save').click();await ready();
 await hub.locator('#ai-toggle').click();await hub.locator('#ai-key').fill('sk-controlled-browser-p3');await hub.locator('#ai-connect-form button[type=submit]').click();await hub.locator('#ai-connected').waitFor();await hub.locator('#ai-model').selectOption('gpt-4.1');
 await editor.waitForFunction(async()=>{const token=new URLSearchParams(location.hash.slice(1)).get('token');const r=await fetch('/v1/ai/status',{headers:{Authorization:'Bearer '+token}});const v=await r.json();return v.connected&&v.model==='gpt-4.1';});await editor.waitForFunction(()=>!document.querySelector('#ai-indicator').classList.contains('disconnected'));await editor.locator('#ai-indicator').click();await editor.waitForFunction(()=>!document.querySelector('#ai-chat-send').disabled);assert.equal(await editor.locator('#ai-api-key').isVisible(),false);report.criteria.push('Hub connects the shared account; Engine inherits the model without a second login or credential input');
 http.outputs.push([aiTool('work_propose',{steps:['Move Cube P3 to X=2 and verify authored position']},'propose')]);
 await editor.locator('#ai-chat-input').fill('Move Cube P3 to X=2');await editor.locator('#ai-chat-send').click();await editor.locator('#ai-chat-messages').filter({hasText:'Move Cube P3 to X=2 and verify authored position'}).waitFor();await editor.waitForFunction(()=>!document.querySelector('#ai-chat-send').disabled);
 const current=JSON.parse(await readFile(host.manager.sessions.get(session.sessionId).path,'utf8')),entity=current.scene.entities.find(e=>e.name==='Cube P3');assert.ok(entity);assert.equal(entity.transform.position[0],0);
 http.outputs.push([aiTool('work_plan',{mode:'authoring',steps:[{id:'move',title:'Move Cube P3',checks:[{kind:'entity',selector:'Cube P3',property:'transform.position.0',expected:2}]}]},'plan'),aiTool('scene_entity_update',{entityId:entity.id,transform:{position:[2,0,0]}},'move')],[aiTool('work_check',{stepId:'move'},'verify')],[aiMessage('Posición X=2 verificada en la propuesta')]);
 await editor.locator('#ai-chat-input').fill('Sí, adelante');await editor.locator('#ai-chat-send').click();await editor.locator('#ai-chat-messages').filter({hasText:'Posición X=2 verificada en la propuesta'}).waitFor();await editor.waitForFunction(()=>!document.querySelector('#ai-chat-review').disabled);
 assert.equal(JSON.parse(await readFile(host.manager.sessions.get(session.sessionId).path,'utf8')).scene.entities.find(e=>e.id===entity.id).transform.position[0],0);
 await editor.locator('#ai-chat-review').click();await editor.locator('#ai-review-diff details').first().waitFor();await editor.screenshot({path:join(evidence,'review.png')});report.criteria.push('AI plan requires human approval; typed tools edit an isolated proposal; persisted MAIN stays unchanged until review');
 await editor.locator('#ai-chat-form [data-ai-action="apply"]').click();await editor.locator('#ai-review-warning').filter({hasText:'Applied and saved to MAIN'}).waitFor();assert.equal(JSON.parse(await readFile(host.manager.sessions.get(session.sessionId).path,'utf8')).scene.entities.find(e=>e.id===entity.id).transform.position[0],2);report.criteria.push('Human Apply adopts and saves reviewed proposal through the shared review gate and domain transaction');
 await hub.locator('#ai-usage').filter({hasText:'250 reported tokens'}).waitFor();await hub.screenshot({path:join(evidence,'platform.png'),fullPage:true});assert.deepEqual(report.pageErrors,[]);report.passed=true;
}catch(error){report.failure=error.stack;if(editor)await editor.screenshot({path:join(evidence,'failure.png')}).catch(()=>{});throw error;}
finally{await writeFile(join(evidence,'report.json'),JSON.stringify(report,null,2));await browser?.close();await host?.close();await rm(base,{recursive:true,force:true});}
console.log(JSON.stringify(report));

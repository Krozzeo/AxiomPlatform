import {DemoJobs} from './demo-jobs.mjs';
import {InstallationJobs} from './installation-jobs.mjs';
import {CredentialVault} from './credential-vault.mjs';
import {ModelProvider,providerConfig,providerCredentialName} from '../ai/providers.mjs';
import {ReleaseCatalog} from './releases.mjs';
import {listenLoopback} from '../../packages/sdk/loopback.mjs';
import {CONNECTION_MODEL,defaultSelection,selection,probe,effortsFor} from '../ai/settings.mjs';
import {Notifications} from './notifications.mjs';
import {EditorLeases} from './editor-leases.mjs';
import {openFolder,saveDownload} from '../local-files/os.mjs';
import {recycleNative,pickNativePath} from '../local-files/dialogs.mjs';
import {randomUUID} from 'node:crypto';
import {isAssistantModel,isVerifiedAssistantModel} from '../ai/models.mjs';
import {textOf} from '../ai/contracts.mjs';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {SessionManager} from './manager.mjs';
import {CODES} from '../../packages/contracts/index.mjs';
import {PlatformState} from './state.mjs';
import {GitHubAccount} from '../integrations/github/account.mjs';
import {AiAccount} from '../ai/account.mjs';
import {pickFolder} from '../local-files/folders.mjs';
import {join,resolve} from 'node:path';

const headers={
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-src http://127.0.0.1:*; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'require-corp', 'Cross-Origin-Resource-Policy':'same-origin',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'
};
export async function startHost({credentialVault,checkReleases=false,releaseCatalog,root,manifests,port=0,timeoutMs,stateRoot,githubClient,aiProvider,folderPicker=pickFolder,filePicker=pickNativePath,recycle=recycleNative,folderOpener=openFolder,downloadSaver=saveDownload}={}) {
  const store=await PlatformState.load(stateRoot??join(resolve(root),'.axiom-platform'),{root,manifests});
  const vault=credentialVault??await new CredentialVault(join(store.root,'accounts.encrypted.json')).load();
  let manager;
  const account=new GitHubAccount({client:githubClient,onChange:state=>manager?.accountChanged(state)});
  let ai;try{ai=await new AiAccount({provider:aiProvider??new ModelProvider(store.value.preferences.aiProvider??'openai',store.value.preferences.aiProviders?.[store.value.preferences.aiProvider??'openai']),transport:store.value.preferences.aiTransport,usagePath:join(store.root,'ai-usage.json'),onChange:state=>manager?.aiChanged(state)}).initialize();manager=await SessionManager.create({root:store.value.projectRoot,manifests:store.value.manifests,timeoutMs,store,account,ai,allowUnavailable:!manifests?.length});}catch(error){await store.close();throw error;}
  const releases=releaseCatalog??new ReleaseCatalog();if(store.value.releaseSources)await releases.configure(store.value.releaseSources);await releases.initialize({cachePath:join(store.root,'release-catalog.json'),getToken:()=>account.status().connected?account.client.token:null});manager.releases=releases;const check=()=>void releases.refresh().catch(()=>{});const releaseTimer=checkReleases?setInterval(check,1800000):null;releaseTimer?.unref();
  ai.selectionConfigured=!!(store.value.preferences.aiDefaults?.model||store.value.preferences.aiModel);ai.saved=!!vault.get(providerCredentialName(ai.provider));ai.storage=vault.status();ai.defaults=selection(store.value.preferences.aiDefaults??{...defaultSelection,...(store.value.preferences.aiModel?{model:store.value.preferences.aiModel}:{})});manager.recycle=recycle;manager.deletion.recycle=recycle;manager.folderOpener=folderOpener;const notifications=await new Notifications(join(store.root,'notifications.json')).load(),editors=new EditorLeases(manager);manager.installJobs=new InstallationJobs(manager,notifications);manager.demoJobs=new DemoJobs(manager,notifications);
  let accountQueue=Promise.resolve();const accountAction=fn=>{const result=accountQueue.then(fn);accountQueue=result.catch(()=>{});return result;};
  const remember=async(name,value)=>{try{return await vault.set(name,value);}catch{vault.error??='Account connected for this session, but Windows could not save it securely.';ai.storage=vault.status();return false;}};
  const token=randomBytes(32).toString('base64url');let origin,closing,picker;
  const reply=(res,status,value)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  const assets=new Map([['/',['index.html','text/html']],['/editor.html',['editor.html','text/html']],['/editor.css',['editor.css','text/css']],['/editor.mjs',['editor.mjs','text/javascript']],['/notifications.mjs',['notifications.mjs','text/javascript']],['/app.mjs',['app.mjs','text/javascript']],['/installations-view.mjs',['installations-view.mjs','text/javascript']],['/styles.css',['styles.css','text/css']],['/ui.mjs',['ui.mjs','text/javascript']],['/platform-ui.mjs',['../../packages/sdk/ui.mjs','text/javascript']]]);
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://127.0.0.1');
      if(req.headers.host!==new URL(origin).host)return reply(res,403,{code:'permissionDenied',message:'Invalid local host.'});
      if(url.pathname.startsWith('/v1/')){
        const same=req.headers.origin ? req.headers.origin===origin : req.headers['sec-fetch-site']==='same-origin';
        if(!same)return reply(res,403,{code:'permissionDenied',message:'Origin is not authorized.'});
        if(req.headers.authorization!==`Bearer ${token}`)return reply(res,401,{code:'permissionDenied',message:'The Platform session is not authenticated.'});
        if(req.method==='GET'&&url.pathname==='/v1/notifications')return reply(res,200,notifications.items);
        if(req.method==='GET'&&url.pathname==='/v1/diagnostics')return reply(res,200,manager.diagnostics());
        if(req.method==='GET'&&url.pathname==='/v1/catalog')return reply(res,200,manager.catalog());
        if(req.method==='POST'&&['/v1/catalog','/v1/editor','/v1/notifications','/v1/download','/v1/sessions','/v1/settings','/v1/folders/pick','/v1/github','/v1/ai','/v1/installations','/v1/releases'].includes(url.pathname)){
          const chunks=[];let bytes=0;
          for await(const part of req){bytes+=part.length;if(bytes>16384)return reply(res,413,{code:'invalidRequest',message:'Request exceeds 16 KiB.'});chunks.push(part);}
          let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply(res,400,{code:'invalidRequest',message:'Malformed JSON.'});}
          if(url.pathname==='/v1/catalog')return reply(res,200,await manager.reconcile());
          if(url.pathname==='/v1/editor')return reply(res,200,editors.claim(data));
          if(url.pathname==='/v1/notifications')return reply(res,200,await notifications.run(data));
          if(url.pathname==='/v1/download')return reply(res,200,await downloadSaver(data));
          if(url.pathname==='/v1/settings')return reply(res,200,await manager.configure(data));
          if(url.pathname==='/v1/folders/pick'){
            if(picker)return reply(res,409,{code:'projectBusy',message:'A folder chooser is already open.'});const controller=new AbortController();picker=controller;res.on('close',()=>{if(!res.writableEnded)controller.abort();});
            try{return reply(res,200,await (data.mode==='file'?filePicker:folderPicker)({initial:data.initial??manager.root,mode:data.mode==='file'?'file':'folder',signal:controller.signal}));}finally{picker=null;}
          }
          if(url.pathname==='/v1/releases'){if(data.action==='refresh'){await manager.reconcile();await releases.refresh(data.force!==false);return reply(res,200,manager.catalog());}if(data.action==='read')return reply(res,200,await manager.readRelease(data.releaseId));if(data.action==='install')return reply(res,202,manager.installJobs.start(data.releaseId,{activate:data.activate!==false}));throw Object.assign(Error('Unknown release action.'),{code:'invalidRequest'});}
          if(url.pathname==='/v1/installations'){if(data.action==='load-demos')return reply(res,202,manager.demoJobs.start(data.installationId));return reply(res,200,await manager.installations(data));}
          if(url.pathname==='/v1/ai'){
            if(data.action==='disconnect')return reply(res,200,await accountAction(async()=>{if(vault.available&&!await remember(providerCredentialName(ai.provider),null))throw Object.assign(Error('Windows could not forget the saved credential. Retry Disconnect; the live connection was kept.'),{code:'AX_AI_0001'});ai.saved=false;if(ai.provider.id==='local')await store.update(v=>v.preferences.aiLocalConnected=false);return ai.disconnect();}));
            if(data.action==='provider')return reply(res,200,await accountAction(async()=>{const before={id:ai.provider.id??'openai',key:ai.provider.key,verified:ai.verified,endpoint:ai.provider.config?.endpoint,backend:ai.provider.config?.backend};const id=data.provider,config=providerConfig(id,{...store.value.preferences.aiProviders?.[id],...data.config});const nextProvider=new ModelProvider(id,config,{fetchImpl:aiProvider?.fetchImpl}),defaults=selection({model:config.model||'not-selected',reasoning:config.reasoning??'default'});ai.disconnect();ai.provider=nextProvider;ai.defaults=defaults;ai.selectionConfigured=!!config.model;await store.update(v=>{v.preferences.aiProvider=id;v.preferences.aiProviders??={};v.preferences.aiProviders[id]=config;v.preferences.aiDefaults=ai.defaults;});const same=before.id===id&&(id!=='local'||before.endpoint===config.endpoint&&before.backend===config.backend);ai.provider.key=same?before.key:(vault.get(providerCredentialName(ai.provider))??'');ai.verified=same&&before.verified;ai.saved=!!vault.get(providerCredentialName(ai.provider));ai.storage=vault.status();ai.changed();if(!same&&(ai.provider.key||id==='local'&&store.value.preferences.aiLocalConnected)){try{await ai.invoke('platform-settings','platform-settings','request',{requestId:randomUUID(),epoch:ai.epoch,path:'/models'});ai.connectionError=null;}catch(e){ai.connectionError=e.code==='AX_AI_0001'?e.message:'The saved provider connection could not be verified.';}}return ai.status();}));
            if(data.action==='configure'){
              const next=selection(data);await manager.configure({aiDefaults:next});await store.update(v=>{v.preferences.aiProviders??={};v.preferences.aiProviders[ai.provider.id??'openai']={...(v.preferences.aiProviders[ai.provider.id??'openai']??{}),...next};});return reply(res,200,{...ai.status(),test:null});
            }
            if(data.action==='test-model'){
              if(!ai.status().connected)throw Object.assign(Error('Connect the selected AI provider before testing a model.'),{code:'AX_AI_0001'});
              const selected=selection(data);if(JSON.stringify(selected)===JSON.stringify(ai.defaults)){ai.modelTest=null;ai.onChange(ai.status());}const test=await probe(ai,selected);if(JSON.stringify(selected)===JSON.stringify(ai.defaults))ai.modelTest=test;return reply(res,200,{test});
            }
            if(data.action==='connect'){
              return reply(res,200,await accountAction(async()=>{try{await ai.invoke('platform-settings','platform-settings','request',{requestId:randomUUID(),epoch:ai.epoch,path:'/models',key:data.apiKey});}catch(e){if(e.upstreamStatus!==403||!store.value.preferences.aiDefaults?.model||!ai.defaults?.model||ai.defaults.model==='not-selected')throw e;await probe(ai,ai.defaults,{apiKey:data.apiKey});}if(ai.provider.id==='local')await store.update(v=>v.preferences.aiLocalConnected=true);ai.connectionError=null;const key=ai.provider.key;if(key)ai.saved=await remember(providerCredentialName(ai.provider),key);ai.storage=vault.status();return ai.status();}));
            }
            if(data.action!=='models')return reply(res,400,{code:'invalidRequest',message:'Unknown AI account action.'});
            const result=await ai.invoke('platform-settings','platform-settings','request',{requestId:randomUUID(),epoch:ai.epoch,path:'/models',key:data.apiKey});
            const models=[...new Set((result.response.data??[]).map(i=>i.id).filter(isAssistantModel))].sort();return reply(res,200,{models,untestedModels:models.filter(id=>!isVerifiedAssistantModel(id)),efforts:Object.fromEntries(models.map(id=>[id,effortsFor(id,ai.provider.id??'openai')]))});
          }
          if(url.pathname==='/v1/github'){
            if(!['status','connect','disconnect','repositories'].includes(data.action))return reply(res,400,{code:'invalidRequest',message:'Unknown GitHub account action.'});
            return reply(res,200,await accountAction(async()=>{if(data.action==='disconnect'&&vault.available&&!await remember('github',null))throw Object.assign(Error('Windows could not forget the saved GitHub credential. Retry Disconnect.'),{code:'invalidRequest'});const result=await account.invoke(data.action,data);if(data.action==='connect')await remember('github',data.token);return Array.isArray(result)?result:{...result,storage:vault.status()};}));
          }
          return reply(res,200,await manager.execute(data));
        }
        return reply(res,404,{code:'invalidRequest',message:'Unknown Platform route.'});
      }
      const asset=url.pathname.startsWith('/editor/')?assets.get('/editor.html'):url.pathname.startsWith('/settings')||url.pathname==='/installations'?assets.get('/'):assets.get(url.pathname);
      if(req.method==='GET'&&/^\/icons\/[a-z0-9-]+\.(svg|png)$/.test(url.pathname)){const content=await readFile(new URL('../../apps/hub'+url.pathname,import.meta.url));res.writeHead(200,{...headers,'Content-Type':url.pathname.endsWith('.svg')?'image/svg+xml':'image/png'});return res.end(content);}
      if(req.method==='GET'&&asset){const content=await readFile(new URL('../../apps/hub/'+asset[0],import.meta.url));res.writeHead(200,{...headers,'Content-Type':asset[1]+'; charset=utf-8'});return res.end(content);}
      return reply(res,404,{code:'invalidRequest',message:'Not found.'});
    }catch(error){const known=CODES.includes(error.code)||/^AX_(?:GITHUB|AI)_\d{4}$/.test(error.code??'');reply(res,known?409:500,{code:known?error.code:'operationFailed',message:known?error.message:'Platform could not complete the operation. Check the local project and product installation.'});}
  });
  try{await listenLoopback(server,port);}
  catch(error){await manager.shutdown();await store.close();throw error;}
  origin=`http://127.0.0.1:${server.address().port}`;manager.platformOrigin=origin;
  const restore=accountAction(async()=>{const githubKey=vault.get('github');if(githubKey)try{await account.connect(githubKey);}catch{}const aiKey=vault.get(providerCredentialName(ai.provider));if(aiKey||ai.provider.id==='local'&&store.value.preferences.aiLocalConnected){ai.provider.key=aiKey??'';try{await ai.invoke('platform-settings','platform-settings','request',{requestId:randomUUID(),epoch:ai.epoch,path:'/models'});ai.connectionError=null;}catch(e){ai.connectionError='The saved AI account could not be verified. Refresh the connection or reconnect.';}}});
  if(checkReleases||releaseCatalog)void restore.then(check,check);
  return {origin,token,restore,url:`${origin}/#token=${token}`,manager,account,ai,close:()=>closing??=(async()=>{
    const done=new Promise(yes=>server.close(yes));server.closeAllConnections();try{clearInterval(releaseTimer);picker?.abort();await restore;await manager.installJobs.close();await manager.demoJobs.close();await releases.flight;await manager.shutdown();await account.disconnect();await ai.close();await done;}finally{await store.close();}
  })()};
}


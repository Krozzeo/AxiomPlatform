import {releaseSources} from './release-sources.mjs';
import {InstallationRemoval} from './installation-removal.mjs';
import {selection} from '../ai/settings.mjs';
import {Installations} from './installations.mjs';
import {ProjectDeletion} from './deletion.mjs';
import {readFile, realpath, mkdir, mkdtemp, rm, lstat} from 'node:fs/promises';
import {dirname, resolve, join, relative} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {validateManifest, PLATFORM_VERSION, PROTOCOL_VERSION, assert, failure} from '../../packages/contracts/index.mjs';
import {ProductClient} from '../../packages/sdk/client.mjs';
import {authorizedPath, inside} from './paths.mjs';

export class SessionManager {
  constructor({root, products, timeoutMs, store, account,ai}) {
    this.root = root; this.products = products; this.timeoutMs = timeoutMs;
    this.sessions = new Map(); this.owners = new Map();
    this.pending = Promise.resolve(); this.receipts = new Map();
    this.store=store;this.account=account;this.ai=ai;
  }
  static async create({root, manifests, timeoutMs,store,account,ai,allowUnavailable=false}) {
    await mkdir(resolve(root), {recursive: true});
    root = await realpath(root);
    store??={root,value:{recents:[],preferences:{}},async update(change){await change(this.value);},async remember(entry){this.value.recents=this.value.recents.filter(p=>p.projectId!==entry.projectId);this.value.recents.unshift(entry);}};
    const registry=await Installations.load(store,manifests,{allowUnavailable});
    const manager=new SessionManager({root,products:registry.products,timeoutMs,store,account,ai});manager.registry=registry;manager.deletion=new ProjectDeletion(manager);manager.installationRemoval=new InstallationRemoval(manager);return manager;
  }
  get busyProducts(){return id=>[...this.sessions.values()].some(s=>s.productId===id&&['starting','ready'].includes(s.state));}
  get busyInstallations(){return (_productId,id)=>[...this.sessions.values()].some(s=>s.installationId===id&&['starting','ready'].includes(s.state));}
  async installations(data){const task=this.pending.then(async()=>{if(data.action==='refresh')await this.registry.reconcile(this.busyInstallations,item=>this.probeEntry(item));else if(data.action==='remove-review')return this.installationRemoval.review(data.installationId);else if(data.action==='remove')return this.installationRemoval.remove(data);else if(data.action==='add')await this.registry.add(data.path);else if(data.action==='activate'){await this.probeInstallation(data.installationId);await this.registry.activate(data.installationId,this.busyProducts);}else if(data.action==='rollback'){const id=this.registry.previous[data.productId];assert(id,'invalidRequest','No previous installation is available.');await this.probeInstallation(id);await this.registry.activate(id,this.busyProducts);}else throw failure('invalidRequest','Unknown installation action.');this.products=this.registry.products;return this.catalog();});this.pending=task.catch(()=>{});return task;}

  async probeInstallation(id){const item=this.registry.items.get(id);assert(item&&!item.error,'incompatibleVersion','Choose an available installation.');return this.probeEntry(item);}
  async probeEntry(item){const client=new ProductClient(item.entry,{timeoutMs:10000,productId:item.productId});try{const hello=await client.call('initialize',{platformVersion:PLATFORM_VERSION,authorizedRoot:this.root},randomUUID());assert(hello.protocolVersion===PROTOCOL_VERSION&&hello.productId===item.productId&&hello.productVersion===item.manifest.productVersion&&Array.isArray(hello.capabilities)&&item.manifest.capabilities.every(c=>hello.capabilities.includes(c)),'incompatibleVersion','Installation handshake does not match its descriptor.');}finally{await client.stop();}}

  catalog() {
    return {version: PLATFORM_VERSION, productRoot:this.store?.value.productRoot, releases:this.releaseView(), projectRoot:this.root, preferences:this.store?.value.preferences??{},recents:(this.store?.value.recents??[]).map(p=>({...p,...this.projectHealth?.get(p.path)})),installationJobs:this.installJobs?.view()??[],github:this.account?.status(),ai:this.ai?{...this.ai.status(),usage:structuredClone(this.ai.usage)}:null,products:[...this.products.values()].map(p => p.manifest), installations:this.registry?.view()??[],sessions:[...this.sessions.values()].map(s => this.view(s))};
  }
  view(s) {
    return {sessionId:s.id,installationId:s.installationId,productId:s.productId,productVersion:s.productVersion,state:s.state,path:s.path ? relative(this.root,s.path) : null,status:s.status ?? null,error:s.error ?? null,editorUrl:s.state === 'ready' ? s.editorUrl : null};
  }
  execute(data) {
    const task = this.pending.then(() => this.perform(data));
    this.pending = task.catch(() => {}); return task;
  }
  async perform(data) {
    assert(data && ['open','create','import','github-projects','status','save','close','rename','remove','delete-review','delete','open-folder','add-local'].includes(data.action), 'invalidRequest','Unknown session action.');
    const mutation = data.action !== 'status';
    if (mutation) {
      assert(typeof data.operationId === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(data.operationId), 'invalidRequest','A unique operationId is required.');
      const prior = this.receipts.get(data.operationId), key = JSON.stringify(data);
      if (prior) { assert(prior.key === key, 'invalidRequest','An operationId cannot be reused for a different request.'); if(prior.error)throw failure(prior.error.code,prior.error.message);return structuredClone(prior.result); }
      assert(this.receipts.size < 256, 'projectBusy','Session operation limit reached. Restart Platform after closing projects.');
    }
    try {
      const result = ['rename','remove','delete-review','delete','open-folder','add-local'].includes(data.action)?await this.manageProject(data):['import','github-projects'].includes(data.action)?await this.importProject(data):['open','create'].includes(data.action) ? await this.launch(data) : await this.operate(data);
      if (mutation) this.receipts.set(data.operationId,{key:JSON.stringify(data),result:structuredClone(result)});
      return result;
    }catch(error){if(mutation)this.receipts.set(data.operationId,{key:JSON.stringify(data),error:{code:error.code??'operationFailed',message:error.message}});throw error;}
  }
  async launch(data) {
    const product = this.products.get(data.productId);
    assert(product, 'unsupportedCapability','The selected product is not registered.');
    let path,grantedRoot=this.root;
    if (data.action === 'open') {
      assert(typeof data.path==='string','invalidRequest','Choose a project path.');
      grantedRoot=this.projectGrant(data.path,data.productId);path = await authorizedPath(grantedRoot, resolve(this.root,data.path),{directory:(await lstat(resolve(this.root,data.path))).isDirectory()});
      const existing=this.sessions.get(this.owners.get(path.toLowerCase()));if(existing?.state==='ready'&&existing.productId===data.productId)return this.view(existing);assert(!existing,'projectBusy','This project is already open in Platform.');
    } else {
      assert(typeof data.name === 'string' && data.name.trim().length > 0 && data.name.length <= 128, 'invalidRequest','Enter a project name of 1–128 characters.');
    }
    assert([...this.sessions.values()].filter(s=>['starting','ready'].includes(s.state)).length < 8,'projectBusy','Close a product before opening another session (limit 8).');
    const s = {id:randomUUID(),installationId:product.id, productId:data.productId,productVersion:product.manifest.productVersion, path, state:'starting'};
    const client = new ProductClient(product.entry,{timeoutMs:this.timeoutMs,productId:data.productId,onExit:()=>{
      this.ai?.cancelOwner(s.id);
      if (!['closed','failed'].includes(s.state)) { s.state='failed'; s.error={code:'operationFailed',message:'Product process exited. Unsaved edits may be lost; reopen saved data.'}; }
      if (s.path) this.owners.delete(s.path.toLowerCase());
      if(!this.shuttingDown&&s.state==='failed'){const next=this.pending.then(async()=>{await this.registry.flush(this.busyProducts);this.products=this.registry.products;});this.pending=next.catch(()=>{});}
    },onService:value=>{assert(s.state==='starting'||s.state==='ready','permissionDenied','Product session is closed.');if(value.service==='ai'){assert(this.ai&&s.state==='ready'&&s.status?.projectId,'permissionDenied','Open a project before using AI.');if(value.action==='request')assert(this.ai.status().connected,'permissionDenied','Connect an AI provider in Axiom Platform Settings first.');return (assert(!['connect','disconnect'].includes(value.action)&&(!value.data?.key||value.data.key==='platform-session')&&!value.data?.apiKey,'permissionDenied','Account credentials are managed only by Platform.'),this.ai.invoke(s.id,s.productId+':'+s.status.projectId,value.action,value.data)).then(result=>value.action==='request'?result:{response:result,state:this.ai.status()});}assert(value.service==='github'&&this.account,'unsupportedCapability','Shared service is not available.');assert(!['connect','disconnect'].includes(value.action),'permissionDenied','Account credentials are managed only by Platform.');return this.account.invoke(value.action,value.data);}});
    s.client = client; this.sessions.set(s.id,s);
    try {
      const hello = await client.call('initialize',this.initialize({authorizedRoot:grantedRoot}),s.id);
      assert(hello.protocolVersion === PROTOCOL_VERSION && hello.productId === data.productId && hello.productVersion === product.manifest.productVersion, 'incompatibleVersion','Product handshake does not match its registered descriptor.');
      assert(Array.isArray(hello.capabilities)&&product.manifest.capabilities.every(c=>hello.capabilities.includes(c)),'unsupportedCapability','Product handshake is missing required lifecycle capabilities.');
      if (path) {
        const detected = await client.call('project.detect',{path},s.id);
        path=await authorizedPath(grantedRoot,detected.path);s.path=path;
        assert(!this.owners.has(path.toLowerCase()),'projectBusy','This project is already open in Platform.');
        const known=this.store?.value.recents.find(p=>p.projectId===detected.projectId&&p.productId===data.productId);
        assert(!known||known.path.toLowerCase()===path.toLowerCase(),'projectBusy','This identity is already registered. Open its catalog entry.');
        const format = product.manifest.projectFormats.find(f=>f.id===detected.formatId);
        assert(format?.versions.includes(detected.formatVersion),'incompatibleVersion','The product does not support this project format version.');
      } else {
        // Create only in a new directory beneath the granted root; no user-supplied executable or path.
        path = await mkdtemp(join(this.root,'project-')); s.path=path;
      }
      this.owners.set(path.toLowerCase(),s.id);
      const opened = await client.call('project.'+data.action,{path,name:data.name,operationId:data.operationId},s.id);
      s.path=await authorizedPath(grantedRoot,opened.path);s.storageRoot=grantedRoot; s.status=opened.status; s.editorUrl=opened.editorUrl;
      const url = new URL(s.editorUrl);
      assert(url.protocol==='http:' && url.hostname==='127.0.0.1' && url.port && !url.username && !url.password,'permissionDenied','The product must expose a loopback editor.');
      s.state='ready'; this.owners.delete(path.toLowerCase()); this.owners.set(s.path.toLowerCase(),s.id);
      await this.store?.remember({productId:s.productId,projectId:s.status.projectId,name:s.status.name,path:s.path,storageRoot:s.storageRoot,savedRevision:s.status.savedRevision,productVersion:s.productVersion});
      return this.view(s);
    } catch (error) {
      s.state='failed'; s.error={code:error.code ?? 'operationFailed',message:error.message};
      if (path) this.owners.delete(path.toLowerCase());
      if(s.path)this.owners.delete(s.path.toLowerCase());
      await client.stop(); throw error;
    }
  }
  initialize(extra={}){return {platformVersion:PLATFORM_VERSION,platformOrigin:this.platformOrigin,authorizedRoot:this.root,...(this.store?{projectStateRoot:join(this.store.root,'projects')}:{}),services:{...(this.account?{github:this.account.status()}:{}),...(this.ai?{ai:this.ai.status()}: {})},...extra};}
  aiChanged(state){for(const s of this.sessions.values())s.client?.notify({kind:'service.ai',state});}
  accountChanged(state){for(const s of this.sessions.values())s.client?.notify({kind:'service.account',state});}
  configure(data){const task=this.pending.then(()=>this.applySettings(data));this.pending=task.catch(()=>{});return task;}
  async applySettings(data){
    assert(data&&typeof data==='object','invalidRequest','Invalid settings.');
    const preferences={};
    if(data.aiDefaults!==undefined)preferences.aiDefaults=selection(data.aiDefaults);
    if(data.aiTransport!==undefined){const t=data.aiTransport;assert(t&&Number.isInteger(t.timeoutSeconds)&&t.timeoutSeconds>=15&&t.timeoutSeconds<=300&&Number.isInteger(t.maxConcurrentRequests)&&t.maxConcurrentRequests>=1&&t.maxConcurrentRequests<=8&&Number.isInteger(t.maxResponseBytes)&&t.maxResponseBytes>=262144&&t.maxResponseBytes<=2097152,'invalidRequest','AI transport settings are outside supported limits.');preferences.aiTransport={...t};}
    if(data.theme!==undefined){assert(['dark','light','system'].includes(data.theme),'invalidRequest','Choose a supported theme.');preferences.theme=data.theme;}
    if(data.sortBy!==undefined){assert(['recent','name'].includes(data.sortBy),'invalidRequest','Choose a supported sort order.');preferences.sortBy=data.sortBy;}
    if(data.defaultProduct!==undefined){assert(this.products.has(data.defaultProduct),'invalidRequest','Select a registered product.');preferences.defaultProduct=data.defaultProduct;}
    if(data.projectRoot!==undefined)assert(![...this.sessions.values()].some(s=>['starting','ready'].includes(s.state)),'projectBusy','Close active projects before changing project storage.');
    if(data.releaseSources!==undefined)releaseSources(data.releaseSources??{});
    const roots={};for(const key of ['projectRoot','productRoot'])if(data[key]!==undefined){assert(typeof data[key]==='string'&&data[key].trim().length>0,'invalidRequest','Choose a storage directory.');const path=resolve(data[key]);await mkdir(path,{recursive:true});assert(!(await lstat(path)).isSymbolicLink(),'permissionDenied','Storage cannot be a symbolic link.');roots[key]=await realpath(path);}
    await this.store.update(v=>{Object.assign(v,roots);Object.assign(v.preferences,preferences);if(data.releaseSources!==undefined)v.releaseSources=Object.fromEntries(releaseSources(data.releaseSources??{}).map(s=>[s.productId,s.url]));});this.root=this.store.value.projectRoot;if(data.releaseSources!==undefined&&this.releases)await this.releases.configure(this.store.value.releaseSources);
    if(preferences.aiDefaults){this.ai.defaults=preferences.aiDefaults;this.ai.modelTest=null;}if(preferences.aiTransport)this.ai.setTransport(preferences.aiTransport);if(preferences.aiDefaults||preferences.aiTransport)this.ai.onChange(this.ai.status());return this.catalog();
  }
  releaseView(){if(!this.releases)return null;const view=this.releases.view(this.registry.view()),read=new Set(this.store.value.releaseReadIds??[]);for(const r of view.items){const installed=this.registry.view().some(i=>!i.error&&i.productId===r.productId&&(i.releaseId===r.id||r.channel==='stable'&&i.channel!=='experimental'&&i.version===r.version));r.isNew=r.productId!=='axiom.platform'&&!!r.artifact&&!installed&&!read.has(r.repository+'#'+r.id);}view.newReleaseIds=view.items.filter(r=>r.isNew).map(r=>r.id);return view;}
  async readRelease(id){const release=this.releases.items.find(r=>r.id===id);assert(release,'invalidRequest','Unknown published release.');await this.store.update(v=>v.releaseReadIds=[...new Set([...(v.releaseReadIds??[]),release.repository+'#'+id])].slice(-10000));return this.catalog();}
  reconcile(){const task=this.pending.then(async()=>{await this.registry.reconcile(this.busyInstallations,item=>this.probeEntry(item));this.products=this.registry.products;this.projectHealth=new Map();for(const p of this.store.value.recents){try{const stat=await lstat(p.path);this.projectHealth.set(p.path,{missing:!stat.isFile()||stat.isSymbolicLink()});}catch(e){this.projectHealth.set(p.path,{missing:true});}}return this.catalog();});this.pending=task.catch(()=>{});return task;}
  installRelease(id,options={}){return this.releases.install(id,this,options);}
  commitInstallation(target,activate){const task=this.pending.then(async()=>{const id=await this.registry.add(target);if(activate)await this.registry.activate(id,this.busyProducts);this.products=this.registry.products;return id;});this.pending=task.catch(()=>{});return task;}
  diagnostics(){return {schemaVersion:1,generatedAt:new Date().toISOString(),compatibility:{protocol:PROTOCOL_VERSION,platformApi:'0.1'},errors:[...this.sessions.values()].filter(s=>s.error).slice(-20).map(s=>({productId:s.productId,code:s.error.code??'operationFailed'})),platformVersion:PLATFORM_VERSION,nodeVersion:process.versions.node,os:process.platform,arch:process.arch,accounts:{ai:!!this.ai?.status().connected,github:!!this.account?.status().connected},installations:this.registry.view().map(({productId,version,active,pending,error})=>({productId,version,active,pending,available:!error})),sessions:[...this.sessions.values()].map(s=>({productId:s.productId,version:s.productVersion,state:s.state,dirty:!!s.status?.dirty})),releaseChecks:this.releases?{checkedAt:this.releases.checkedAt,errors:this.releases.errors}:null};}
  async importProject(data){
    const product=this.products.get(data.productId);assert(product?.manifest.capabilities.includes('project.import'),'unsupportedCapability','Install a product adapter with P2 import support.');
    if(data.kind!=='github'&&data.action!=='github-projects')assert(typeof data.sourcePath==='string'&&data.sourcePath.length>0,'invalidRequest','Choose the project folder to import.');
    let destination;
    const id=randomUUID(),client=new ProductClient(product.entry,{productId:data.productId,timeoutMs:60000,onService:value=>{assert(value.service==='github'&&this.account,'unsupportedCapability','Shared GitHub is not available.');assert(['status','request'].includes(value.action),'permissionDenied','Import cannot change the GitHub account.');assert((value.data?.options?.method??'GET')==='GET','permissionDenied','Import is read-only on GitHub.');assert(!['connect','disconnect'].includes(value.action),'permissionDenied','Account credentials are managed only by Platform.');return this.account.invoke(value.action,value.data);}});
    try{
      await client.call('initialize',this.initialize({readSources:data.sourcePath?[await realpath(data.sourcePath)]:[]}),id);
      if(data.action==='github-projects')return await client.call('project.github.list',data,id);
      destination=await mkdtemp(join(this.root,'import-'));
      const imported=await client.call('project.import',{...data,destination},id);
      const path=await authorizedPath(this.root,imported.path),old=this.store.value.recents.find(p=>p.projectId===imported.projectId&&p.productId===data.productId);
      if(old){await rm(destination,{recursive:true,force:true});destination=null;return {...old,alreadyRegistered:true};}
      const entry={productId:data.productId,projectId:imported.projectId,name:imported.name,path};await this.store.remember(entry);return entry;
    }catch(error){if(destination&&inside(this.root,destination))await rm(destination,{recursive:true,force:true});throw error;}
    finally{await client.stop();}
  }
  projectGrant(path,productId){
    const target=resolve(this.root,path);if(inside(this.root,target))return this.root;
    const entry=this.store.value.recents.find(p=>p.productId===productId&&(resolve(p.path)===target||dirname(resolve(p.path))===target));
    assert(entry&&typeof entry.storageRoot==='string'&&inside(entry.storageRoot,target),'permissionDenied','This project location has not been registered.');return entry.storageRoot;
  }
  async inspectProject(productId,path,run){const product=this.products.get(productId);assert(product,'unsupportedCapability','Select a compatible installed product.');const client=new ProductClient(product.entry,{productId,timeoutMs:30000}),id=randomUUID();try{await client.call('initialize',this.initialize({authorizedRoot:this.projectGrant(path,productId)}),id);const detected=await client.call('project.detect',{path},id);return await run({client,id,detected,product});}finally{await client.stop();}}
  async manageProject(data){
    if(data.action==='add-local'){
      const source=await realpath(data.sourcePath);if(!inside(this.root,source))return this.importProject({...data,sourcePath:source,action:'import',kind:'local'});
      const path=await authorizedPath(this.root,source,{directory:(await lstat(source)).isDirectory()});return this.inspectProject(data.productId,path,async({detected})=>{const file=await authorizedPath(this.root,detected.path),entry={productId:data.productId,projectId:detected.projectId,name:detected.name,path:file,savedRevision:detected.projectRevision};await this.store.remember(entry);return entry;});
    }
    const entry=this.store.value.recents.find(p=>p.projectId===data.projectId&&p.productId===data.productId);assert(entry,'invalidRequest','Select a registered project.');
    const active=[...this.sessions.values()].find(s=>s.state==='ready'&&s.productId===entry.productId&&s.status.projectId===entry.projectId);
    if(data.action==='open-folder'){await this.folderOpener(dirname(await authorizedPath(this.projectGrant(entry.path,entry.productId),entry.path)));return {opened:true};}
    if(data.action==='rename'){
      assert(typeof data.name==='string'&&data.name.trim()&&data.name.length<=128,'invalidRequest','Enter a project name of 1–128 characters.');let saved;
      if(active){const result=await active.client.call('project.rename',{name:data.name.trim(),expectedRevision:data.expectedRevision,operationId:data.operationId},active.id);active.status=result.status;saved={...entry,name:result.status.name,savedRevision:result.status.savedRevision};}
      else saved=await this.inspectProject(entry.productId,entry.path,async({client,id,detected})=>{assert(detected.projectId===entry.projectId,'revisionConflict','Project identity changed.');const result=await client.call('project.rename',{path:detected.path,name:data.name.trim(),operationId:data.operationId},id);return {...entry,name:result.name,savedRevision:result.projectRevision};});
      await this.store.remember(saved);return saved;
    }
    assert(!active,'projectBusy','Close the project before removing or deleting it.');
    if(data.action==='remove'){await this.store.update(v=>{v.recents=v.recents.filter(p=>p.path!==entry.path);});return {removed:entry.projectId};}
    if(data.action==='delete-review')return this.inspectProject(entry.productId,entry.path,async({detected})=>{assert(detected.projectId===entry.projectId,'revisionConflict','Project identity changed.');return this.deletion.review(entry);});
    return this.deletion.remove(entry,data);
  }
  async operate(data) {
    const s=this.sessions.get(data.sessionId);
    assert(s && s.state==='ready','operationFailed','The selected session is not available.');
    const result=await s.client.call('project.'+data.action,{expectedRevision:data.expectedRevision,decision:data.decision,operationId:data.operationId},s.id);
    s.status=result.status;
    if(data.action==='close' && result.closed){s.state='closed';this.ai?.cancelOwner(s.id);this.owners.delete(s.path.toLowerCase());await s.client.stop();}
    if(data.action==='save')await this.store.remember({productId:s.productId,projectId:s.status.projectId,name:s.status.name,path:s.path,storageRoot:s.storageRoot,savedRevision:s.status.savedRevision,productVersion:s.productVersion});await this.registry.flush(this.busyProducts);this.products=this.registry.products;return {...this.view(s),cancelled:result.cancelled === true};
  }
  async shutdown() {
    this.shuttingDown=true;
    await this.pending;
    await Promise.all([...this.sessions.values()].map(s=>s.client.stop()));
  }
}

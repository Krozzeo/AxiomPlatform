import {readFile, realpath, mkdir, mkdtemp} from 'node:fs/promises';
import {dirname, resolve, join, relative} from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateManifest, PLATFORM_VERSION, PROTOCOL_VERSION, assert, failure} from '../../packages/contracts/index.mjs';
import {ProductClient} from '../../packages/sdk/client.mjs';
import {authorizedPath, inside} from './paths.mjs';

export class SessionManager {
  constructor({root, products, timeoutMs}) {
    this.root = root; this.products = products; this.timeoutMs = timeoutMs;
    this.sessions = new Map(); this.owners = new Map();
    this.pending = Promise.resolve(); this.receipts = new Map();
  }
  static async create({root, manifests, timeoutMs}) {
    await mkdir(resolve(root), {recursive: true});
    root = await realpath(root);
    const products = new Map();
    for (const source of manifests) {
      const file = await realpath(source);
      const manifest = validateManifest(JSON.parse(await readFile(file, 'utf8')));
      const entry = await realpath(resolve(dirname(file), manifest.launch.entry));
      assert(inside(dirname(file), entry), 'permissionDenied','Adapter entry must remain inside its registered installation directory.');
      assert(!products.has(manifest.productId), 'invalidRequest','Duplicate registered product.');
      products.set(manifest.productId, {manifest,entry});
    }
    assert(products.size > 0, 'invalidRequest','Register at least one product installation.');
    return new SessionManager({root,products,timeoutMs});
  }
  catalog() {
    return {version: PLATFORM_VERSION, projectRoot:this.root, products:[...this.products.values()].map(p => p.manifest), sessions:[...this.sessions.values()].map(s => this.view(s))};
  }
  view(s) {
    return {sessionId:s.id,productId:s.productId,state:s.state,path:s.path ? relative(this.root,s.path) : null,status:s.status ?? null,error:s.error ?? null,editorUrl:s.state === 'ready' ? s.editorUrl : null};
  }
  execute(data) {
    const task = this.pending.then(() => this.perform(data));
    this.pending = task.catch(() => {}); return task;
  }
  async perform(data) {
    assert(data && ['open','create','status','save','close'].includes(data.action), 'invalidRequest','Unknown session action.');
    const mutation = data.action !== 'status';
    if (mutation) {
      assert(typeof data.operationId === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(data.operationId), 'invalidRequest','A unique operationId is required.');
      const prior = this.receipts.get(data.operationId), key = JSON.stringify(data);
      if (prior) { assert(prior.key === key, 'invalidRequest','An operationId cannot be reused for a different request.'); if(prior.error)throw failure(prior.error.code,prior.error.message);return structuredClone(prior.result); }
      assert(this.receipts.size < 256, 'projectBusy','Session operation limit reached. Restart Platform after closing projects.');
    }
    try {
      const result = ['open','create'].includes(data.action) ? await this.launch(data) : await this.operate(data);
      if (mutation) this.receipts.set(data.operationId,{key:JSON.stringify(data),result:structuredClone(result)});
      return result;
    }catch(error){if(mutation)this.receipts.set(data.operationId,{key:JSON.stringify(data),error:{code:error.code??'operationFailed',message:error.message}});throw error;}
  }
  async launch(data) {
    const product = this.products.get(data.productId);
    assert(product, 'unsupportedCapability','The selected product is not registered.');
    let path;
    if (data.action === 'open') {
      path = await authorizedPath(this.root, data.path);
      assert(!this.owners.has(path.toLowerCase()), 'projectBusy','This project is already open in Platform.');
    } else {
      assert(typeof data.name === 'string' && data.name.trim().length > 0 && data.name.length <= 128, 'invalidRequest','Enter a project name of 1–128 characters.');
    }
    assert([...this.sessions.values()].filter(s=>['starting','ready'].includes(s.state)).length < 8,'projectBusy','Close a product before opening another session (limit 8).');
    const s = {id:randomUUID(), productId:data.productId, path, state:'starting'};
    const client = new ProductClient(product.entry,{timeoutMs:this.timeoutMs,productId:data.productId,onExit:()=>{
      if (!['closed','failed'].includes(s.state)) { s.state='failed'; s.error={code:'operationFailed',message:'Product process exited. Unsaved edits may be lost; reopen saved data.'}; }
      if (s.path) this.owners.delete(s.path.toLowerCase());
    }});
    s.client = client; this.sessions.set(s.id,s);
    try {
      const hello = await client.call('initialize',{platformVersion:PLATFORM_VERSION,authorizedRoot:this.root},s.id);
      assert(hello.protocolVersion === PROTOCOL_VERSION && hello.productId === data.productId && hello.productVersion === product.manifest.productVersion, 'incompatibleVersion','Product handshake does not match its registered descriptor.');
      assert(Array.isArray(hello.capabilities)&&product.manifest.capabilities.every(c=>hello.capabilities.includes(c)),'unsupportedCapability','Product handshake is missing required lifecycle capabilities.');
      if (path) {
        const detected = await client.call('project.detect',{path},s.id);
        const format = product.manifest.projectFormats.find(f=>f.id===detected.formatId);
        assert(format?.versions.includes(detected.formatVersion),'incompatibleVersion','The product does not support this project format version.');
      } else {
        // Create only in a new directory beneath the granted root; no user-supplied executable or path.
        path = await mkdtemp(join(this.root,'project-')); s.path=path;
      }
      this.owners.set(path.toLowerCase(),s.id);
      const opened = await client.call('project.'+data.action,{path,name:data.name,operationId:data.operationId},s.id);
      s.path=await authorizedPath(this.root,opened.path); s.status=opened.status; s.editorUrl=opened.editorUrl;
      const url = new URL(s.editorUrl);
      assert(url.protocol==='http:' && url.hostname==='127.0.0.1' && url.port && !url.username && !url.password,'permissionDenied','The product must expose a loopback editor.');
      s.state='ready'; this.owners.delete(path.toLowerCase()); this.owners.set(s.path.toLowerCase(),s.id);
      return this.view(s);
    } catch (error) {
      s.state='failed'; s.error={code:error.code ?? 'operationFailed',message:error.message};
      if (path) this.owners.delete(path.toLowerCase());
      await client.stop(); throw error;
    }
  }
  async operate(data) {
    const s=this.sessions.get(data.sessionId);
    assert(s && s.state==='ready','operationFailed','The selected session is not available.');
    const result=await s.client.call('project.'+data.action,{expectedRevision:data.expectedRevision,decision:data.decision,operationId:data.operationId},s.id);
    s.status=result.status;
    if(data.action==='close' && result.closed){s.state='closed';this.owners.delete(s.path.toLowerCase());await s.client.stop();}
    return {...this.view(s),cancelled:result.cancelled === true};
  }
  async shutdown() {
    await this.pending;
    await Promise.all([...this.sessions.values()].map(s=>s.client.stop()));
  }
}

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
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Resource-Policy':'same-origin',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'
};
export async function startHost({root,manifests,port=0,timeoutMs,stateRoot,githubClient,aiProvider,folderPicker=pickFolder}={}) {
  const store=await PlatformState.load(stateRoot??join(resolve(root),'.axiom-platform'),{root,manifests});
  let manager;
  const account=new GitHubAccount({client:githubClient,onChange:state=>manager?.accountChanged(state)});
  let ai;try{ai=await new AiAccount({provider:aiProvider,usagePath:join(store.root,'ai-usage.json'),onChange:state=>manager?.aiChanged(state)}).initialize();manager=await SessionManager.create({root:store.value.projectRoot,manifests:store.value.manifests,timeoutMs,store,account,ai,allowUnavailable:!manifests?.length});}catch(error){await store.close();throw error;}
  const token=randomBytes(32).toString('base64url');let origin,closing,picker;
  const reply=(res,status,value)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  const assets=new Map([['/',['index.html','text/html']],['/app.mjs',['app.mjs','text/javascript']],['/styles.css',['styles.css','text/css']],['/ui.mjs',['ui.mjs','text/javascript']],['/platform-ui.mjs',['../../packages/sdk/ui.mjs','text/javascript']]]);
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://127.0.0.1');
      if(req.headers.host!==new URL(origin).host)return reply(res,403,{code:'permissionDenied',message:'Invalid local host.'});
      if(url.pathname.startsWith('/v1/')){
        const same=req.headers.origin ? req.headers.origin===origin : req.headers['sec-fetch-site']==='same-origin';
        if(!same)return reply(res,403,{code:'permissionDenied',message:'Origin is not authorized.'});
        if(req.headers.authorization!==`Bearer ${token}`)return reply(res,401,{code:'permissionDenied',message:'The Platform session is not authenticated.'});
        if(req.method==='GET'&&url.pathname==='/v1/catalog')return reply(res,200,manager.catalog());
        if(req.method==='POST'&&['/v1/sessions','/v1/settings','/v1/folders/pick','/v1/github','/v1/ai','/v1/installations'].includes(url.pathname)){
          const chunks=[];let bytes=0;
          for await(const part of req){bytes+=part.length;if(bytes>16384)return reply(res,413,{code:'invalidRequest',message:'Request exceeds 16 KiB.'});chunks.push(part);}
          let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply(res,400,{code:'invalidRequest',message:'Malformed JSON.'});}
          if(url.pathname==='/v1/settings')return reply(res,200,await manager.configure(data));
          if(url.pathname==='/v1/folders/pick'){
            if(picker)return reply(res,409,{code:'projectBusy',message:'A folder chooser is already open.'});const controller=new AbortController();picker=controller;res.on('close',()=>{if(!res.writableEnded)controller.abort();});
            try{return reply(res,200,await folderPicker({initial:data.initial??manager.root,signal:controller.signal}));}finally{picker=null;}
          }
          if(url.pathname==='/v1/installations')return reply(res,200,await manager.installations(data));
          if(url.pathname==='/v1/ai'){
            if(data.action==='disconnect')return reply(res,200,ai.disconnect());
            if(!['models','connect'].includes(data.action))return reply(res,400,{code:'invalidRequest',message:'Unknown AI account action.'});
            if(data.action==='connect'&&!isAssistantModel(data.model))return reply(res,400,{code:'invalidRequest',message:'Choose a compatible model.'});
            const result=await ai.invoke('platform-settings','platform-settings', 'request',{requestId:randomUUID(),epoch:ai.epoch,path:data.action==='models'?'/models':'/responses',key:data.apiKey,...(data.action==='connect'?{body:{model:data.model,store:false,input:[{role:'user',content:'Reply with OK. This is a connection test.'}],tools:[],tool_choice:'none',max_output_tokens:512}}:{})});
            if(data.action==='models'){const models=[...new Set((result.response.data??[]).map(i=>i.id).filter(isAssistantModel))].sort();return reply(res,200,{models,untestedModels:models.filter(id=>!isVerifiedAssistantModel(id))});}
            if(result.response.status!=='completed'||!textOf(result.response))throw Object.assign(Error('The model did not finish its connection test.'),{code:'AX_AI_0001'});
            await store.update(v=>{v.preferences.aiModel=data.model;});ai.model=data.model;ai.changed();return reply(res,200,ai.status());
          }
          if(url.pathname==='/v1/github'){
            if(!['status','connect','disconnect','repositories'].includes(data.action))return reply(res,400,{code:'invalidRequest',message:'Unknown GitHub account action.'});
            return reply(res,200,await account.invoke(data.action,data));
          }
          return reply(res,200,await manager.execute(data));
        }
        return reply(res,404,{code:'invalidRequest',message:'Unknown Platform route.'});
      }
      const asset=url.pathname.startsWith('/settings')||url.pathname==='/installations'?assets.get('/'):assets.get(url.pathname);
      if(req.method==='GET'&&/^\/icons\/[a-z0-9-]+\.(svg|png)$/.test(url.pathname)){const content=await readFile(new URL('../../apps/hub'+url.pathname,import.meta.url));res.writeHead(200,{...headers,'Content-Type':url.pathname.endsWith('.svg')?'image/svg+xml':'image/png'});return res.end(content);}
      if(req.method==='GET'&&asset){const content=await readFile(new URL('../../apps/hub/'+asset[0],import.meta.url));res.writeHead(200,{...headers,'Content-Type':asset[1]+'; charset=utf-8'});return res.end(content);}
      return reply(res,404,{code:'invalidRequest',message:'Not found.'});
    }catch(error){const known=CODES.includes(error.code)||/^AX_(?:GITHUB|AI)_\d{4}$/.test(error.code??'');reply(res,known?409:500,{code:known?error.code:'operationFailed',message:known?error.message:'Platform could not complete the operation. Check the local project and product installation.'});}
  });
  try{await new Promise((yes,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',yes);});}
  catch(error){await manager.shutdown();await store.close();throw error;}
  origin=`http://127.0.0.1:${server.address().port}`;
  return {origin,token,url:`${origin}/#token=${token}`,manager,account,ai,close:()=>closing??=(async()=>{
    const done=new Promise(yes=>server.close(yes));server.closeAllConnections();try{picker?.abort();await manager.shutdown();await account.disconnect();await ai.close();await done;}finally{await store.close();}
  })()};
}


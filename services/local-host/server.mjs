import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {SessionManager} from './manager.mjs';
import {CODES} from '../../packages/contracts/index.mjs';
import {PlatformState} from './state.mjs';
import {GitHubAccount} from '../integrations/github/account.mjs';
import {pickFolder} from '../local-files/folders.mjs';
import {join,resolve} from 'node:path';

const headers={
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Resource-Policy':'same-origin',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'
};
export async function startHost({root,manifests,port=0,timeoutMs,stateRoot,githubClient,folderPicker=pickFolder}={}) {
  const store=await PlatformState.load(stateRoot??join(resolve(root),'.axiom-platform'),{root,manifests});
  let manager;
  const account=new GitHubAccount({client:githubClient,onChange:state=>manager?.accountChanged(state)});
  try{manager=await SessionManager.create({root:store.value.projectRoot,manifests:store.value.manifests,timeoutMs,store,account});}catch(error){await store.close();throw error;}
  const token=randomBytes(32).toString('base64url');let origin,closing;
  const reply=(res,status,value)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  const assets=new Map([['/',['index.html','text/html']],['/app.mjs',['app.mjs','text/javascript']],['/styles.css',['styles.css','text/css']],['/p2.css',['p2.css','text/css']]]);
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://127.0.0.1');
      if(req.headers.host!==new URL(origin).host)return reply(res,403,{code:'permissionDenied',message:'Invalid local host.'});
      if(url.pathname.startsWith('/v1/')){
        const same=req.headers.origin ? req.headers.origin===origin : req.headers['sec-fetch-site']==='same-origin';
        if(!same)return reply(res,403,{code:'permissionDenied',message:'Origin is not authorized.'});
        if(req.headers.authorization!==`Bearer ${token}`)return reply(res,401,{code:'permissionDenied',message:'The Platform session is not authenticated.'});
        if(req.method==='GET'&&url.pathname==='/v1/catalog')return reply(res,200,manager.catalog());
        if(req.method==='POST'&&['/v1/sessions','/v1/settings','/v1/folders/pick','/v1/github'].includes(url.pathname)){
          const chunks=[];let bytes=0;
          for await(const part of req){bytes+=part.length;if(bytes>16384)return reply(res,413,{code:'invalidRequest',message:'Request exceeds 16 KiB.'});chunks.push(part);}
          let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply(res,400,{code:'invalidRequest',message:'Malformed JSON.'});}
          if(url.pathname==='/v1/settings')return reply(res,200,await manager.configure(data));
          if(url.pathname==='/v1/folders/pick')return reply(res,200,await folderPicker({initial:data.initial??manager.root}));
          if(url.pathname==='/v1/github'){
            if(!['status','connect','disconnect','repositories'].includes(data.action))return reply(res,400,{code:'invalidRequest',message:'Unknown GitHub account action.'});
            return reply(res,200,await account.invoke(data.action,data));
          }
          return reply(res,200,await manager.execute(data));
        }
        return reply(res,404,{code:'invalidRequest',message:'Unknown Platform route.'});
      }
      const asset=assets.get(url.pathname);
      if(req.method==='GET'&&asset){const content=await readFile(new URL('../../apps/hub/'+asset[0],import.meta.url));res.writeHead(200,{...headers,'Content-Type':asset[1]+'; charset=utf-8'});return res.end(content);}
      return reply(res,404,{code:'invalidRequest',message:'Not found.'});
    }catch(error){const known=CODES.includes(error.code)||/^AX_GITHUB_\d{4}$/.test(error.code??'');reply(res,known?409:500,{code:known?error.code:'operationFailed',message:known?error.message:'Platform could not complete the operation. Check the local project and product installation.'});}
  });
  try{await new Promise((yes,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',yes);});}
  catch(error){await manager.shutdown();await store.close();throw error;}
  origin=`http://127.0.0.1:${server.address().port}`;
  return {origin,token,url:`${origin}/#token=${token}`,manager,account,close:()=>closing??=(async()=>{
    const done=new Promise(yes=>server.close(yes));server.closeAllConnections();try{await manager.shutdown();await account.disconnect();await done;}finally{await store.close();}
  })()};
}

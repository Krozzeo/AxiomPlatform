import {createHash} from 'node:crypto';
import {sources} from '../../services/local-host/releases.mjs';
import {zipEntries} from '../../scripts/prepare-release.mjs';
import {CAPABILITIES} from '../../packages/contracts/index.mjs';
export function fixture(version='0.0.56',source=sources[1]){
 const descriptor={manifestVersion:1,protocolVersion:1,productId:source.productId,displayName:source.name,productVersion:version,platformApiRange:'>=0.1.0 <0.2.0',projectFormats:[{id:'fixture',versions:[1]}],capabilities:CAPABILITIES,launch:{adapter:'official-local',entry:'adapter.mjs'}};
 const adapter=`process.on('message',m=>process.send({...m,ok:true,result:${JSON.stringify({protocolVersion:1,productId:source.productId,productVersion:version,capabilities:CAPABILITIES})}}));process.on('disconnect',()=>process.exit(0));`;
 const archive=zipEntries([{name:'platform/product.json',data:Buffer.from(JSON.stringify(descriptor))},{name:'platform/adapter.mjs',data:Buffer.from(adapter)}]),base=`https://github.com/${source.repository}/releases/download/v${version}/`,name='Engine.zip',manifest={schemaVersion:1,productId:source.productId,version,platformApiRange:'>=0.1.0 <0.2.0',artifacts:[{platform:'win32',arch:'x64',name,bytes:archive.length,sha256:createHash('sha256').update(archive).digest('hex')}]},release={tag_name:'v'+version,assets:[{name:'axiom-release.json',browser_download_url:base+'axiom-release.json'},{name,size:archive.length,browser_download_url:base+name}]};
 let broken=false;const requests=[];return {archive,manifest,release,source,requests,set broken(v){broken=v;},fetchImpl:async url=>{requests.push(url);if(broken)return new Response('',{status:503});if(url.startsWith('https://api.github.com/'))return Response.json(url.includes(source.repository)?[release]:[]);if(url.endsWith('axiom-release.json'))return Response.json(manifest);return new Response(archive);}};
}

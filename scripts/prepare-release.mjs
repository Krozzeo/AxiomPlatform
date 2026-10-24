import {shortcutBytes} from './hub-shortcut.mjs';
import {distribution} from '../services/local-host/distribution.mjs';
import {readFile,readdir,lstat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {crc32,deflateRawSync} from 'node:zlib';
export function zipEntries(entries){
 const local=[],central=[];let offset=0;
 for(const {name,data} of entries){const n=Buffer.from(name),packed=deflateRawSync(data),crc=crc32(data),h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(packed.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(n.length,26);local.push(h,n,packed);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(packed.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);central.push(c,n);offset+=h.length+n.length+packed.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,directory,end]);
}
export async function prepareRelease(root,out,{platform='win32',arch='x64',build={channel:'stable'}}={}){
 build=distribution(build);root=resolve(root);out=resolve(out);const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8')),isHost=pkg.name==='axiom-platform',descriptor=isHost?{productId:'axiom.platform',productVersion:pkg.version}:JSON.parse(await readFile(join(root,'platform/product.json'),'utf8'));
 if(descriptor.productVersion!==pkg.version)throw Error('Package/descriptor version mismatch.');
 const tracked=execFileSync('git',['-c','safe.directory='+root,'-C',root,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),files=new Map();
 async function add(path){const info=await lstat(path);if(info.isSymbolicLink())throw Error('Prepared packages cannot contain links: '+relative(root,path));if(info.isDirectory()){for(const n of await readdir(path))await add(join(path,n));}else if(info.isFile())files.set(relative(root,path).replaceAll('\\','/'),await readFile(path));}
 for(const name of tracked){if(name.startsWith('.github/')||name.startsWith('.axiom/'))continue;await add(join(root,name));}
 if(!isHost){await add(join(root,'node_modules'));if(descriptor.productId==='axiom.game-engine')await add(join(root,'dist/editor'));}
 files.set('axiom-build.json',Buffer.from(JSON.stringify(build,null,2)+'\n'));if(isHost){files.set('Axiom Hub.lnk',shortcutBytes());files.set('Axiom.ico',await readFile(new URL('../apps/hub/icons/axiom.ico',import.meta.url)));}
 const data=zipEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,data])=>({name,data}))),name=(isHost?'AxiomPlatform':descriptor.productId==='axiom.game-engine'?'AxiomGameEngine':'AxiomMathLab')+'-'+pkg.version+(build.channel==='experimental'?'-experimental-'+build.commit.slice(0,12):'')+'-'+platform+'-'+arch+'.zip';
 if(data.length>128*1024*1024)throw Error('Prepared release exceeds download budget.');await mkdir(out,{recursive:true});await writeFile(join(out,name),data);
 const manifest={schemaVersion:1,channel:build.channel,...(build.channel==='experimental'?{build}:{}),productId:descriptor.productId,version:pkg.version,platformApiRange:'>=0.1.0 <0.2.0',artifacts:[{platform,arch,name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')}]};await writeFile(join(out,'axiom-release.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename){const [root='.',out='.axiom/release']=process.argv.slice(2);console.log(JSON.stringify(await prepareRelease(root,out,{build:process.env.AXIOM_RELEASE_CHANNEL==='experimental'?{channel:'experimental',commit:process.env.AXIOM_RELEASE_COMMIT,branch:process.env.AXIOM_RELEASE_BRANCH,pullRequest:Number(process.env.AXIOM_RELEASE_PR),runId:Number(process.env.AXIOM_RELEASE_RUN_ID)}:{channel:'stable'}})));}

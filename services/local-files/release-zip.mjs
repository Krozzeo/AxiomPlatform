import {inflateRawSync,crc32} from 'node:zlib';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {assert} from '../../packages/contracts/index.mjs';
import {inside} from '../local-host/paths.mjs';
// Parse the central directory before writing anything. No ZIP64, encrypted files,
// links, device names, alternate streams, case aliases or archive traversal.
export async function extractRelease(data,root,{onProgress,signal}={}){
 let end=-1;for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(data.readUInt32LE(i)===0x06054b50&&i+22+data.readUInt16LE(i+20)===data.length){end=i;break;}
 assert(end>=0,'invalidRequest','Invalid release ZIP.');const count=data.readUInt16LE(end+10),start=data.readUInt32LE(end+16),size=data.readUInt32LE(end+12);
 assert(!data.readUInt16LE(end+4)&&!data.readUInt16LE(end+6)&&count===data.readUInt16LE(end+8)&&count<=20000&&start+size===end,'invalidRequest','Unsupported ZIP directory.');let p=start,total=0;const files=[],seen=new Set();
 for(let i=0;i<count;i++){
  assert(p+46<=end&&data.readUInt32LE(p)===0x02014b50,'invalidRequest','Invalid ZIP entry.');const flags=data.readUInt16LE(p+8),method=data.readUInt16LE(p+10),crc=data.readUInt32LE(p+16),compressed=data.readUInt32LE(p+20),bytes=data.readUInt32LE(p+24),n=data.readUInt16LE(p+28),extra=data.readUInt16LE(p+30),comment=data.readUInt16LE(p+32),mode=(data.readUInt32LE(p+38)>>>16)&0xf000,offset=data.readUInt32LE(p+42);
  assert(p+46+n+extra+comment<=end,'invalidRequest','Invalid ZIP name length.');const name=data.subarray(p+46,p+46+n).toString('utf8'),directory=name.endsWith('/'),parts=(directory?name.slice(0,-1):name).split('/');
  assert(!(flags&1)&&[0,8].includes(method)&&[0,0x8000,0x4000].includes(mode)&&!name.includes('\\')&&!name.includes('\ufffd')&&parts.every(part=>part&&part!=='.'&&part!=='..'&&!/[\x00-\x1f:<>"|?*]/.test(part)&&!/[. ]$/.test(part)&&! /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)),'invalidRequest','Unsafe ZIP path or file type.');
  const key=name.replace(/\/$/,'').toLowerCase();assert(!seen.has(key),'invalidRequest','Duplicate ZIP path.');seen.add(key);total+=bytes;assert(total<=512*1024*1024&&bytes<=64*1024*1024,'invalidRequest','Expanded release exceeds the limit.');
  assert(offset+30<=start&&data.readUInt32LE(offset)===0x04034b50,'invalidRequest','Invalid ZIP local entry.');const localName=data.readUInt16LE(offset+26),localExtra=data.readUInt16LE(offset+28),from=offset+30+localName+localExtra;
  assert(from+compressed<=start&&data.subarray(offset+30,offset+30+localName).toString('utf8')===name&&data.readUInt16LE(offset+8)===method,'invalidRequest','ZIP local entry mismatch.');
  const raw=data.subarray(from,from+compressed),value=method===0?raw:inflateRawSync(raw,{maxOutputLength:Math.max(1,bytes)});assert(value.length===bytes&&crc32(value)===crc,'invalidRequest','ZIP content checksum mismatch.');files.push({name,directory,value});p+=46+n+extra+comment;
 }
 assert(p===end,'invalidRequest','ZIP directory mismatch.');let completed=0;for(const file of files){signal?.throwIfAborted();const target=resolve(root,file.name);assert(inside(root,target),'permissionDenied','ZIP destination escapes storage.');if(file.directory)await mkdir(target,{recursive:true});else{await mkdir(dirname(target),{recursive:true});await writeFile(target,file.value,{flag:'wx',mode:0o600});}onProgress?.(++completed,files.length);}
 return files.length;
}

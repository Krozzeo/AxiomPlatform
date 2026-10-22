import {createHash} from 'node:crypto';
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function changes(before,after,rootPath='scene'){
 const out=[];
 function add(path,a,b){const left=JSON.stringify(a)??'',right=JSON.stringify(b)??'';const n=Math.max(left.length,right.length);for(let offset=0;offset<Math.max(n,1);offset+=1536)out.push({path,offset,before:left.slice(offset,offset+1536),after:right.slice(offset,offset+1536),continued:offset+1536<n});}
 function visit(a,b,path){if(JSON.stringify(a)===JSON.stringify(b))return;
  if(Array.isArray(a)&&Array.isArray(b)&&[...a,...b].every(x=>x&&typeof x==='object'&&typeof x.id==='string')){const aa=Object.fromEntries(a.map(x=>[x.id,x])),bb=Object.fromEntries(b.map(x=>[x.id,x]));return visit(aa,bb,path);}
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){for(const key of [...new Set([...Object.keys(a),...Object.keys(b)])].sort())visit(a[key],b[key],path+'/'+key.replaceAll('~','~0').replaceAll('/','~1'));return;}
  add(path,a,b);
 }
 visit(before,after,rootPath);return out;
}

export function requireHuman(context,error=message=>new Error(message)){if(context?.actor?.kind!=='human')throw error('Only human review can apply a proposal');}
export function requireReview(actual,expected,error=message=>new Error(message)){if(digest(actual)!==expected)throw error('Review changed; inspect the current proposal again');}

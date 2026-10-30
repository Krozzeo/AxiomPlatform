// Keep the full catalog immutable; presentation and update counts use one build per PR.
export function releaseOrder(a,b){
 const date=(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0);if(date)return date;
 const av=a.version.split('.').map(Number),bv=b.version.split('.').map(Number);for(let i=0;i<3;i++)if(av[i]!==bv[i])return bv[i]-av[i];
 return String(b.build?.commit??b.id).localeCompare(String(a.build?.commit??a.id));
}
export function selectReleaseBuilds(items){
 const ordered=[...items].sort(releaseOrder),seen=new Set();
 return ordered.map(item=>{if(item.channel!=='experimental')return {...item,isHistorical:false};
  const key=JSON.stringify([item.repository,item.productId,item.build.pullRequest]),isHistorical=seen.has(key);seen.add(key);return {...item,isHistorical};});
}

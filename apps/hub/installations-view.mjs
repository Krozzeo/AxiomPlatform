export function isInstalled(release,items){return items.find(i=>!i.error&&i.productId===release.productId&&(i.releaseId===release.id||release.channel!=='experimental'&&i.channel!=='experimental'&&i.version===release.version));}
export function releaseOptions(catalog,filter='all'){
 return(catalog.releases?.items??[]).filter(r=>r.productId!=='axiom.platform'&&(filter==='all'||r.productId===filter)).map(r=>{const item=isInstalled(r,catalog.installations),marks=[item?'Installed':null,item?.active?'Active':null,r.channel==='experimental'?'Experimental':null].filter(Boolean);return {value:r.id,label:r.name+' '+r.version+marks.map(m=>' ('+m+')').join('')+(r.build?' · PR #'+r.build.pullRequest+' · '+r.build.commit.slice(0,8):'')+(r.artifact?'':' · unavailable on this computer')};});
}

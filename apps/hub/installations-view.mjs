export function isInstalled(release,items){return items.find(i=>!i.error&&i.productId===release.productId&&(i.releaseId===release.id||release.channel!=='experimental'&&i.channel!=='experimental'&&i.version===release.version));}
export function releaseOptions(catalog,filter='all'){
 return(catalog.releases?.items??[]).filter(r=>r.productId!=='axiom.platform'&&(filter==='all'||r.productId===filter)).map(r=>{const item=isInstalled(r,catalog.installations),marks=[item?'Installed':null,item?.active?'Active':null,r.channel==='experimental'?'Experimental':r.channel==='stable'?'Stable':null].filter(Boolean);return {value:r.id,installed:!!item,isNew:!!r.isNew,label:r.name+' '+r.version+marks.map(m=>' ('+m+')').join('')+(r.build?' · PR #'+r.build.pullRequest+' · '+r.build.commit.slice(0,8):'')+(r.artifact?'':' · unavailable on this computer')};});
}
export function releaseFeedback(catalog,filter='all'){
 const releases=catalog.releases??{},relevant=id=>id!=='axiom.platform'&&(filter==='all'||id===filter),errors=(releases.errors??[]).filter(e=>relevant(e.productId)),items=(releases.items??[]).filter(i=>relevant(i.productId)),states=(releases.sourceStatus??[]).filter(s=>relevant(s.productId));
 let state,message,label;
 if(errors.length){state=items.length?'cached':'error';label=items.length?'Saved published versions':'Version check failed';message=errors.map(e=>(releases.products??[]).find(p=>p.productId===e.productId)?.name??e.productId).filter((v,i,a)=>a.indexOf(v)===i).join(', ')+': '+[...new Set(errors.map(e=>e.message))].join(' ');const retry=Math.max(0,...errors.map(e=>e.retryAt??0));if(retry)message+=' Retry after '+new Date(retry).toLocaleString()+'.';message+=items.length?' Showing the last saved catalog; it may be out of date.':' No saved catalog is available yet. This does not mean no versions are published.';}
 else if(releases.checking){state='loading';label='Checking published versions…';message=items.length?'Checking GitHub; saved versions remain available.':'Checking GitHub for published versions…';}
 else if(states.length&&states.every(s=>s.checkedAt!=null)){state=items.length?'ready':'empty';label=items.length?'Select a version':'No published versions available';message=items.length?'Last successful check '+new Date(Math.min(...states.map(s=>s.checkedAt))).toLocaleString()+'.':'The check succeeded. No prepared versions are published for the selected product.';}
 else{state='unchecked';label='Versions have not been checked';message='Check published versions using Refresh. You can also add a local installation.';}
 if(releases.cacheWarning)message+=' '+releases.cacheWarning;
 return {state,label,message};
}

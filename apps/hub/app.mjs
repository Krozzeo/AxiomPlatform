const $=id=>document.getElementById(id);
const supplied=new URLSearchParams(location.hash.slice(1)).get('token');
let token=supplied;
try{if(supplied)sessionStorage.setItem('axiom.platform.session',supplied);else token=sessionStorage.getItem('axiom.platform.session');}catch{ /* The one-time URL still works without browser storage. */ }
history.replaceState(null,'',location.pathname);
let catalog,working=false,closeSession,repositories=[],accountEpoch=-1;
let actionQueue=Promise.resolve();
async function api(path,data){
  const response=await fetch(path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
  const value=await response.json();if(!response.ok)throw Error(value.message??'No se pudo completar la operación.');return value;
}
function action(fn,silent=false){
  if(silent&&working)return Promise.resolve();
  const task=actionQueue.then(()=>performAction(fn,silent));actionQueue=task.catch(()=>{});return task;
}
async function performAction(fn,silent=false){
  working=true;if(!silent){$('error').hidden=true;$('notice').hidden=true;}
  if(!silent)for(const b of document.querySelectorAll('button'))b.disabled=true;
  try{await fn();await refresh();}catch(error){$('error').textContent=error.message;$('error').hidden=false;}
  finally{working=false;for(const b of document.querySelectorAll('button'))b.disabled=false;updateControls();}
}
const mutate=data=>api('/v1/sessions',{...data,operationId:crypto.randomUUID()});
function button(label,fn,kind='secondary'){const b=document.createElement('button');b.textContent=label;b.className=kind;b.onclick=()=>void action(fn);return b;}
function render(){
  $('root').textContent=catalog.projectRoot;$('sessions').replaceChildren();$('empty').hidden=catalog.sessions.length>0;
  if(document.activeElement!==$('storage'))$('storage').value=catalog.projectRoot;
  $('recent-projects').replaceChildren();$('recent-empty').hidden=catalog.recents.length>0;
  for(const project of catalog.recents){
    const card=document.createElement('article'),info=document.createElement('div'),title=document.createElement('h3'),path=document.createElement('p');card.dataset.projectId=project.projectId;
    title.textContent=project.name;path.textContent=project.path;info.append(title,path);card.append(info);
    const active=catalog.sessions.find(s=>s.status?.projectId===project.projectId&&s.state==='ready');
    if(active){const a=document.createElement('a');a.textContent='Abrir editor';a.className='editor-link';a.href=active.editorUrl;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
    else card.append(button('Abrir',()=>mutate({action:'open',productId:project.productId,path:project.path})));$('recent-projects').append(card);
  }
  const connected=catalog.github?.connected===true;
  $('github-connect-form').hidden=connected;$('github-connected').hidden=!connected;
  $('github-account-name').textContent=connected?'Conectado como '+catalog.github.account.login:'';
  $('github-toggle').textContent=connected?'GitHub · '+catalog.github.account.login:'GitHub · Sin conexión';
  for(const session of catalog.sessions){
    const card=document.createElement('article');card.dataset.sessionId=session.sessionId;
    const info=document.createElement('div'),title=document.createElement('h3'),description=document.createElement('p'),path=document.createElement('p');
    title.textContent=session.status?.name??'Sesión del producto';
    description.textContent=session.state==='ready'?(session.status?.busy?'Tarea en curso':session.status?.dirty?'Cambios sin guardar':'Guardado'):session.state==='closed'?'Sesión cerrada':session.error?.message??'Iniciando…';
    path.textContent=session.path??session.productId;info.append(title,description,path);card.append(info);
    if(session.state==='ready'){
      const nav=document.createElement('nav'),link=document.createElement('a');link.className='editor-link';link.textContent='Abrir editor';link.href=session.editorUrl;link.target='_blank';link.rel='noopener noreferrer';nav.append(link);
      nav.append(button('Guardar',async()=>{const current=await api('/v1/sessions',{action:'status',sessionId:session.sessionId});await mutate({action:'save',sessionId:session.sessionId,expectedRevision:current.status.revision});}));
      nav.append(button('Cerrar',async()=>{closeSession=await api('/v1/sessions',{action:'status',sessionId:session.sessionId});$('close-description').textContent=closeSession.status.dirty?'Hay cambios pendientes en este proyecto.':'El proyecto está guardado.';$('close-dialog').showModal();},'quiet'));card.append(nav);
    }
    $('sessions').append(card);
  }
}
function updateControls(){
  const connected=catalog?.github?.connected===true;
  for(const id of ['repositories-refresh','account-refresh','account-disconnect','find-projects'])$(id).disabled=!connected;
  $('github-import-submit').disabled=!connected||!$('source-project').value;
}
async function loadRepositories(){
  if(!catalog.github?.connected){repositories=[];$('source-repository').replaceChildren();return;}
  const previous=$('source-repository').value;repositories=await api('/v1/github',{action:'repositories'});$('source-repository').replaceChildren();
  for(const repo of repositories){const option=document.createElement('option');option.value=repo.name;option.textContent=repo.name;$('source-repository').append(option);}
  if(repositories.some(r=>r.name===previous))$('source-repository').value=previous;
  $('source-project').replaceChildren();
}
async function refresh(){
  catalog=await api('/v1/catalog');
  if(accountEpoch!==catalog.github.epoch){accountEpoch=catalog.github.epoch;await loadRepositories();}
  for(const session of catalog.sessions.filter(s=>s.state==='ready')){
    try{const value=await api('/v1/sessions',{action:'status',sessionId:session.sessionId});Object.assign(session,value);}catch(error){session.state='failed';session.error={message:error.message};}
  }
  render();
}
$('create-form').onsubmit=event=>{event.preventDefault();void action(()=>mutate({action:'create',productId:$('product').value,name:$('name').value.trim()}));};
$('open-form').onsubmit=event=>{event.preventDefault();void action(()=>mutate({action:'open',productId:$('product').value,path:$('path').value.trim()}));};
$('refresh').onclick=()=>void action(refresh);
$('github-toggle').onclick=()=>{$('github-account').open=!$('github-account').open;if($('github-account').open)$('github-account').scrollIntoView({block:'nearest',behavior:'smooth'});};
for(const b of document.querySelectorAll('[data-browse]'))b.onclick=()=>void action(async()=>{
  const input=$(b.dataset.browse),selected=await api('/v1/folders/pick',{initial:input.value||catalog.projectRoot});
  if(!selected.path)return;input.value=selected.path;
  if(input.id==='storage')await api('/v1/settings',{projectRoot:selected.path});
});
$('storage').onchange=()=>{const projectRoot=$('storage').value.trim();void action(()=>api('/v1/settings',{projectRoot}));};
$('product').onchange=()=>void action(()=>api('/v1/settings',{defaultProduct:$('product').value}));
$('import-form').onsubmit=event=>{event.preventDefault();void action(async()=>{const result=await mutate({action:'import',kind:'local',productId:$('product').value,sourcePath:$('import-path').value.trim()});$('notice').textContent=result.alreadyRegistered?'Este proyecto ya está en tu catálogo.':'Proyecto importado. El original se conservó.';$('notice').hidden=false;});};
$('github-connect-form').onsubmit=event=>{event.preventDefault();void action(async()=>{const secret=$('github-token').value;$('github-token').value='';await api('/v1/github',{action:'connect',token:secret});});};
$('account-disconnect').onclick=()=>void action(()=>api('/v1/github',{action:'disconnect'}));
for(const id of ['account-refresh','repositories-refresh'])$(id).onclick=()=>void action(loadRepositories);
$('source-repository').onchange=()=>{$('source-branch').value=repositories.find(r=>r.name===$('source-repository').value)?.branch??'main';$('source-project').replaceChildren();updateControls();};
$('source-branch').onchange=()=>{$('source-project').replaceChildren();updateControls();};
const source=()=>({productId:$('product').value,repository:$('source-repository').value,branch:$('source-branch').value.trim()});
$('find-projects').onclick=()=>void action(async()=>{const result=await mutate({action:'github-projects',...source()});$('source-project').replaceChildren();for(const item of result.items){const option=document.createElement('option');option.value=item.path;option.textContent=item.path;$('source-project').append(option);}updateControls();});
$('source-project').onchange=updateControls;
$('github-import-form').onsubmit=event=>{event.preventDefault();void action(async()=>{await mutate({action:'import',kind:'github',...source(),path:$('source-project').value});$('notice').textContent='Proyecto agregado desde GitHub. El repositorio original no se modificó.';$('notice').hidden=false;});};
$('close-dialog').addEventListener('close',()=>{
  const decision=$('close-dialog').returnValue||'cancel';
  if(closeSession)void action(()=>mutate({action:'close',sessionId:closeSession.sessionId,expectedRevision:closeSession.status.revision,decision}));
});
try{catalog=await api('/v1/catalog');for(const p of catalog.products){const option=document.createElement('option');option.value=p.productId;option.textContent=p.displayName+' · '+p.productVersion;$('product').append(option);}if(catalog.preferences.defaultProduct)$('product').value=catalog.preferences.defaultProduct;await refresh();updateControls();}
catch(error){$('error').textContent=error.message;$('error').hidden=false;}
setInterval(()=>{if(!working&&!$('close-dialog').open)void action(refresh,true);},3000);

const $=id=>document.getElementById(id);
const supplied=new URLSearchParams(location.hash.slice(1)).get('token');
let token=supplied;
try{if(supplied)sessionStorage.setItem('axiom.platform.session',supplied);else token=sessionStorage.getItem('axiom.platform.session');}catch{ /* The one-time URL still works without browser storage. */ }
history.replaceState(null,'',location.pathname);
let catalog,working=false,closeSession;
async function api(path,data){
  const response=await fetch(path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
  const value=await response.json();if(!response.ok)throw Error(value.message??'No se pudo completar la operación.');return value;
}
async function action(fn){
  if(working)return;working=true;$('error').hidden=true;
  for(const b of document.querySelectorAll('button'))b.disabled=true;
  try{await fn();await refresh();}catch(error){$('error').textContent=error.message;$('error').hidden=false;}
  finally{working=false;for(const b of document.querySelectorAll('button'))b.disabled=false;}
}
const mutate=data=>api('/v1/sessions',{...data,operationId:crypto.randomUUID()});
function button(label,fn,kind='secondary'){const b=document.createElement('button');b.textContent=label;b.className=kind;b.onclick=()=>void action(fn);return b;}
function render(){
  $('root').textContent=catalog.projectRoot;$('sessions').replaceChildren();$('empty').hidden=catalog.sessions.length>0;
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
async function refresh(){
  catalog=await api('/v1/catalog');
  for(const session of catalog.sessions.filter(s=>s.state==='ready')){
    try{const value=await api('/v1/sessions',{action:'status',sessionId:session.sessionId});Object.assign(session,value);}catch(error){session.state='failed';session.error={message:error.message};}
  }
  render();
}
$('create-form').onsubmit=event=>{event.preventDefault();void action(()=>mutate({action:'create',productId:$('product').value,name:$('name').value.trim()}));};
$('open-form').onsubmit=event=>{event.preventDefault();void action(()=>mutate({action:'open',productId:$('product').value,path:$('path').value.trim()}));};
$('refresh').onclick=()=>void action(refresh);
$('close-dialog').addEventListener('close',()=>{
  const decision=$('close-dialog').returnValue||'cancel';
  if(closeSession)void action(()=>mutate({action:'close',sessionId:closeSession.sessionId,expectedRevision:closeSession.status.revision,decision}));
});
try{catalog=await api('/v1/catalog');for(const p of catalog.products){const option=document.createElement('option');option.value=p.productId;option.textContent=p.displayName+' · '+p.productVersion;$('product').append(option);}await refresh();}
catch(error){$('error').textContent=error.message;$('error').hidden=false;}
setInterval(()=>{if(!working&&!$('close-dialog').open)void action(refresh);},3000);

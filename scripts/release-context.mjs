import {readFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const check=(value,message)=>{if(!value)throw Error(message);};
export async function publicationContext({event,payload,repository,sha,ref,workflowFile,get}){
 check(/^[\w.-]+\/[\w.-]+$/.test(repository),'Invalid repository');let commit=sha,run,pr,branch,channel;
 if(event==='workflow_run'){
  run=payload.workflow_run;if(run?.conclusion!=='success'||run.head_repository?.full_name!==repository)return null;commit=run.head_sha;branch=run.head_branch;
  if(run.event==='push'&&branch==='main')channel='stable';else if(run.event==='pull_request')channel='experimental';else return null;
 }else if(event==='push'&&ref?.startsWith('refs/tags/')){
  const tag=ref.slice(10);channel=tag.startsWith('experimental-pr-')?'experimental':'stable';
  if(channel==='experimental'){const m=tag.match(/^experimental-pr-(\d+)-([a-f0-9]{40})$/);check(m&&m[2]===commit,'Experimental tag must pin the exact commit');pr=Number(m[1]);}
  else{check(/^v\d+\.\d+\.\d+$/.test(tag),'Invalid stable tag');const comparison=await get(`/repos/${repository}/compare/${commit}...main`);check(['ahead','identical'].includes(comparison.status),'Stable publication requires a commit included in main');}
  const runs=await get(`/repos/${repository}/actions/workflows/${workflowFile}/runs?head_sha=${commit}&status=success&per_page=100`);run=runs.workflow_runs?.find(r=>r.head_sha===commit&&r.conclusion==='success'&&(channel==='experimental'?r.event==='pull_request':r.event==='push'));
  check(run,'Exact-commit acceptance must pass before publishing');branch=run.head_branch;
 }else return null;
 check(/^[a-f0-9]{40}$/.test(commit)&&Number.isSafeInteger(run.id),'Invalid CI identity');
 if(channel==='experimental'){
  const pulls=pr?[await get(`/repos/${repository}/pulls/${pr}`)]:await get(`/repos/${repository}/commits/${commit}/pulls`);
  const pull=pulls.find(p=>p.state==='open'&&p.head.sha===commit&&p.head.repo?.full_name===repository&&p.base.repo?.full_name===repository);if(!pull)return null;pr=pull.number;branch=pull.head.ref;
 }
 const file=await get(`/repos/${repository}/contents/package.json?ref=${commit}`);check(file.encoding==='base64'&&file.content.length<131072,'Invalid package declaration');const pkg=JSON.parse(Buffer.from(file.content,'base64').toString());check(/^\d+\.\d+\.\d+$/.test(pkg.version),'Numeric product version is required');
 const tag=channel==='experimental'?`experimental-pr-${pr}-${commit}`:'v'+pkg.version;if(event==='push')check(ref==='refs/tags/'+tag,'Tag and package version differ');
 const existing=await get(`/repos/${repository}/releases/tags/${tag}`,true);if(existing&&!existing.draft)return null;
 return {channel,commit,branch,pullRequest:pr??0,runId:run.id,tag,version:pkg.version,repository};
}
export async function github(path,{token=process.env.GH_TOKEN,method='GET',body,allow404=false}={}){
 check(path.startsWith('/repos/')&&!path.includes('..'),'Invalid GitHub API path');const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(response.status===404&&allow404)return null;check(response.ok,'GitHub publication request failed: HTTP '+response.status);return response.status===204?null:response.json();
}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename){
 const value=await publicationContext({event:process.env.GITHUB_EVENT_NAME,payload:JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8')),repository:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,workflowFile:process.env.ACCEPTANCE_WORKFLOW,get:(p,allow404)=>github(p,{allow404})});
 const output=value?{eligible:'true',...value}:{eligible:'false'};await appendFile(process.env.GITHUB_OUTPUT,Object.entries(output).map(([k,v])=>{check(!/[\r\n]/.test(String(v)),'Invalid workflow output');return k+'='+v;}).join('\n')+'\n');console.log(value?'Verified '+value.channel+' publication for '+value.commit:'No new eligible publication.');
}

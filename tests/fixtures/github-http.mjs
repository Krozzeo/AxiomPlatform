import {createHash} from 'node:crypto';
export class GitHubHTTPFixture{
  constructor(){this.repos=new Map();this.failAfterCommit=false;this.calls=0;}
  repo(name){if(!this.repos.has(name))this.repos.set(name,{head:'1'.repeat(40),files:new Map(),history:[]});return this.repos.get(name);}
  fetch=async(url,options={})=>{
    const u=new URL(url),path=u.pathname,method=options.method??'GET',body=options.body?JSON.parse(options.body):null;
    const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
    if(path==='/user')return reply({id:42,login:'fixture-player'});
    if(path==='/user/repos')return reply([...this.repos.keys()].map(name=>({full_name:name,private:true,default_branch:'main',permissions:{push:true}})));
    if(path==='/graphql'){
      if(body.variables.input){const i=body.variables.input,repo=this.repo(i.branch.repositoryNameWithOwner);if(repo.head!==i.expectedHeadOid)return reply({errors:[{message:'diverged'}]});
        for(const f of i.fileChanges.additions)repo.files.set(f.path,Buffer.from(f.contents,'base64'));for(const f of i.fileChanges.deletions)repo.files.delete(f.path);
        repo.head=createHash('sha1').update(repo.head+i.message.body).digest('hex');repo.history.unshift({oid:repo.head,message:i.message.headline+'\n'+i.message.body});this.calls++;
        if(this.failAfterCommit){this.failAfterCommit=false;throw Error('Simulated lost reply');}return reply({data:{createCommitOnBranch:{commit:{oid:repo.head}}}});
      }
      const repo=this.repo(body.variables.owner+'/'+body.variables.name);return reply({data:{repository:{ref:{target:{history:{nodes:repo.history}}}}}});
    }
    const match=path.match(/^\/repos\/([^/]+\/[^/]+)(.*)$/);if(!match)return reply({},404);
    const name=match[1],rest=match[2],repo=this.repo(name);
    if(!rest)return reply({full_name:name,default_branch:'main',permissions:{push:true},archived:false,disabled:false});
    if(rest.startsWith('/git/ref/heads/'))return reply({object:{sha:repo.head}});
    const blobHash=bytes=>createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
    if(rest.startsWith('/git/trees/'))return reply({tree:[...repo.files].map(([path,bytes])=>({path,type:'blob',mode:'100644',size:bytes.length,sha:blobHash(bytes)})),truncated:false});
    if(rest.startsWith('/contents/')){const bytes=repo.files.get(decodeURIComponent(rest.slice(10)));return bytes?reply({type:'file',size:bytes.length,encoding:'base64',content:bytes.toString('base64')}):reply({},404);}
    if(rest.startsWith('/git/blobs/')){const bytes=[...repo.files.values()].find(b=>blobHash(b)===rest.slice(11));return bytes?reply({encoding:'base64',content:bytes.toString('base64')}):reply({},404);}
    return reply({message:'unsupported fixture request'},404);
  };
}

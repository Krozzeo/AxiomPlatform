import {GitHubClient,githubError} from './client.mjs';
export class GitHubAccount{
  constructor({client=new GitHubClient(),onChange=()=>{}}={}){this.client=client;this.user=null;this.epoch=0;this.onChange=onChange;this.pending=Promise.resolve();}
  status(){return {account:this.user,connected:!!this.user&&!!this.client.token,epoch:this.epoch};}
  serialize(fn){const task=this.pending.then(fn);this.pending=task.catch(()=>{});return task;}
  changed(){this.epoch++;this.onChange(this.status());return this.status();}
  connect(token){return this.serialize(async()=>{try{this.user=await this.client.connect(token);return this.changed();}catch(error){this.user=null;this.client.disconnect();this.changed();throw error;}});}
  disconnect(){return this.serialize(async()=>{this.client.disconnect();this.user=null;return this.changed();});}
  invoke(action,data={}){
    if(action==='status')return Promise.resolve(this.status());
    if(action==='connect')return this.connect(data.token);
    if(action==='disconnect')return this.disconnect();
    return this.serialize(async()=>{
      if(!this.status().connected)throw githubError('Connect GitHub in Platform first.','AX_GITHUB_0002');
      if(data.epoch!==undefined&&data.epoch!==this.epoch)throw githubError('The GitHub account changed. Review this operation again.','AX_GITHUB_0002');
      try{
        if(action==='repositories')return this.client.repositories();
        if(action!=='request'||typeof data.path!=='string'||!/^\/(?:user(?:[/?]|$)|repos\/|graphql$)/.test(data.path)||data.path.length>2048||/[\\#\r\n]/.test(data.path)||!['GET','POST'].includes(data.options?.method??'GET'))throw githubError('Unsupported GitHub service request.');
        return await this.client.request(data.path,data.options);
      }catch(error){if(!this.client.token){this.user=null;this.changed();}throw error;}
    });
  }
}

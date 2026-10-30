import {assert} from '../../packages/contracts/index.mjs';
export function distribution(value){
 assert(value&&['stable','experimental'].includes(value.channel),'invalidRequest','Invalid distribution channel.');
 if(value.channel==='experimental')assert(/^[a-f0-9]{40}$/.test(value.commit)&&typeof value.branch==='string'&&value.branch.length>0&&value.branch.length<=255&&!/[\u0000-\u001f]/.test(value.branch)&&Number.isSafeInteger(value.pullRequest)&&value.pullRequest>0&&Number.isSafeInteger(value.runId)&&value.runId>0,'invalidRequest','Experimental builds require an exact commit, branch, PR and passing CI run.');
 return {channel:value.channel,...(value.channel==='experimental'?{commit:value.commit,branch:value.branch,pullRequest:value.pullRequest,runId:value.runId}:{})};
}

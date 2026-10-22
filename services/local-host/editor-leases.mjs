import {randomUUID} from 'node:crypto';
export class EditorLeases {
 constructor(manager){this.manager=manager;this.claims=new Map();}
 claim({productId,projectId,owner,secret}){const entry=this.manager.store.value.recents.find(p=>p.productId===productId&&p.projectId===projectId);if(!entry||typeof owner!=='string'||owner.length>100)throw Object.assign(Error('Unknown editor project'),{code:'invalidRequest'});const key=productId+':'+projectId,prior=this.claims.get(key);if(prior&&prior.expires>Date.now()&&(prior.owner!==owner||prior.secret!==secret))return {occupied:true};const lease=prior&&prior.owner===owner&&prior.secret===secret?prior:{owner,secret:randomUUID()};lease.expires=Date.now()+15000;this.claims.set(key,lease);const session=[...this.manager.sessions.values()].find(s=>s.state==='ready'&&s.productId===productId&&s.status?.projectId===projectId);return {secret:lease.secret,session:session?this.manager.view(session):null};}
}

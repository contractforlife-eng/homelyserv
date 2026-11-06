import test from 'node:test';
import assert from 'node:assert/strict';
import {isStaffRole,getStaffIdentityTitle,STAFF_NAME_CLASS} from './staffIdentityPolicy.js';
test('staff identity follows roles for every account, without name matching',()=>{
 for(const [role,title] of Object.entries({ADMIN:'Co-Admin',SUPPORT:'Sup-Admin',SUP_ADMIN:'Sup-Admin',SUPPORT_HELPER:'Sup-Help'})){
  assert.equal(isStaffRole(role),true);assert.equal(getStaffIdentityTitle(role),title);
 }
 assert.match(STAFF_NAME_CLASS,/text-red-600/);
 assert.equal(isStaffRole('EMPLOYER'),false);assert.equal(getStaffIdentityTitle('WORKER'),'');
});

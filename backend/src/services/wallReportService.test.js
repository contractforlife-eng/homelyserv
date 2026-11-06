import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWallComplaint, deliverWallReport } from './wallReportService.js';
import { serializeComplaint } from '../controllers/complaintController.js';
const report={_id:'507f1f77bcf86cd799439001',userId:'507f1f77bcf86cd799439002',contentId:'507f1f77bcf86cd799439003',postId:'507f1f77bcf86cd799439004',reporterRole:'WORKER',reason:'Abusive content',contentType:'POST',snapshot:{authorId:'507f1f77bcf86cd799439005',authorName:'Author',text:'Reported text',image:'https://res.cloudinary.com/demo/image/upload/post.jpg'}};
function makeDependencies(){
 let stored=null,creates=0,marks=0,tickets=0;const notices=new Map();
 const db={complaint:{findUnique:async()=>stored,upsert:async({create})=>{if(!stored){stored={...create};creates++;}return stored;}},user:{findMany:async()=>[{id:'admin',role:'ADMIN'},{id:'support',role:'SUPPORT'}]}};
 return {db,nextTicket:async()=>`HS-2026-${++tickets}`,notify:async(id,payload)=>{notices.set(payload.eventKey,{id,payload});return {id:payload.eventKey};},markDelivered:async()=>{marks++;},stats:()=>({stored,creates,marks,tickets,notices})};
}
test('post and comment reports create Abuse complaints with preserved content snapshots',()=>{
 const post=buildWallComplaint(report,'HS-2026-001');assert.equal(post.id,report._id);assert.equal(post.category,'Abuse');assert.equal(post.status,'NEW');assert.equal(post.userId,report.userId);assert.equal(post.reportedUserId,report.snapshot.authorId);assert.equal(post.wallSnapshot.text,'Reported text');assert.deepEqual(post.attachments,[]);
 const comment=buildWallComplaint({...report,contentType:'COMMENT'},'HS-2026-002');assert.equal(comment.wallContentType,'COMMENT');assert.ok(comment.subject.includes('Comment'));assert.equal(comment.wallPostId,report.postId);
});
test('retries and simultaneous handoffs create one complaint and stable admin/support alerts',async()=>{
 const deps=makeDependencies();await Promise.all([deliverWallReport(report,deps),deliverWallReport(report,deps),deliverWallReport(report,deps)]);await deliverWallReport(report,deps);
 const stats=deps.stats();assert.equal(stats.creates,1);assert.equal(stats.notices.size,2);assert.equal(stats.stored.wallContentId,report.contentId);assert.ok([...stats.notices.values()].some(n=>n.payload.link===`/admin/complaints?id=${report._id}`));assert.ok([...stats.notices.values()].some(n=>n.payload.link===`/support-complaints?id=${report._id}`));
});
test('a notification failure leaves the handoff retryable without duplicating its complaint',async()=>{
 const deps=makeDependencies();const notify=deps.notify;deps.notify=async()=>null;await deliverWallReport(report,deps);assert.equal(deps.stats().marks,0);assert.equal(deps.stats().creates,1);
 deps.notify=notify;await deliverWallReport(report,deps);assert.equal(deps.stats().creates,1);assert.equal(deps.stats().marks,1);
});
test('report snapshots stay available to staff and are not exposed through non-internal serialization',()=>{
 const complaint={...buildWallComplaint(report,'HS-2026-001'),Timeline:[]};assert.equal(serializeComplaint(complaint).wallSnapshot,undefined);assert.equal(serializeComplaint(complaint,{includeInternal:true}).wallSnapshot.text,'Reported text');
});
test('an existing unrelated complaint cannot be overwritten by a report',async()=>{
 const deps=makeDependencies();await deliverWallReport(report,deps);await assert.rejects(()=>deliverWallReport({...report,userId:'507f1f77bcf86cd799439099'},deps),/WALL_COMPLAINT_CONFLICT/);assert.equal(deps.stats().creates,1);
});

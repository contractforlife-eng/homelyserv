import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeWallGiftQueue} from './wallGiftQueue.js';
const gift=i=>({eventId:String(i),id:'rose',emoji:'🌹'});
test('three simultaneous sends are retained in arrival order and never overlap the active item',()=>{
 let queue=[];for(const i of [1,2,3])queue=mergeWallGiftQueue(queue,[gift(i)]);
 assert.deepEqual(queue.map(g=>g.eventId),['1','2','3']);assert.equal(queue[0].eventId,'1');assert.equal(queue.slice(1)[0].eventId,'2');
});
test('ten gifts received while closed replay once, duplicates from polling and sockets are removed',()=>{
 const inbox=Array.from({length:10},(_,i)=>gift(i));let queue=mergeWallGiftQueue([],inbox);queue=mergeWallGiftQueue(queue,[gift(0),gift(4)]);assert.equal(queue.length,10);
 const completed=new Set();while(queue.length){completed.add(queue[0].eventId);queue=mergeWallGiftQueue(queue.slice(1),inbox,completed);}assert.equal(completed.size,10);assert.deepEqual(mergeWallGiftQueue([],inbox,completed),[]);
});
test('replaying a partially acknowledged inbox preserves new gifts and ignores malformed events',()=>{
 const queue=mergeWallGiftQueue([gift(3)],[gift(1),gift(3),gift(4),{}],new Set(['1']));assert.deepEqual(queue.map(g=>g.eventId),['3','4']);
});

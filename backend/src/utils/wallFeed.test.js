import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWallFeedFilter } from './wallFeed.js';
test('my wall uses authenticated identity and keeps visible top-level posts', () => {
 const f=buildWallFeedFilter({userId:'me',scope:'mine',authorId:'other',blocked:['other'],beforeId:'cursor'});
 assert.deepEqual(f,{postId:null,deleted:false,hidden:false,authorId:'me',_id:{$lt:'cursor'}});
});
test('public wall includes own posts even if block data contains self',()=>{
 assert.deepEqual(buildWallFeedFilter({userId:'me',blocked:['me','other']}).authorId,{$nin:['other']});
});
test('invalid scope is rejected',()=>assert.throws(()=>buildWallFeedFilter({userId:'me',scope:'other'}),{message:'INVALID_WALL_VIEW'}));

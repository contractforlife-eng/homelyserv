import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import router from './wall.js';
import { WallEntry, WallSettings } from '../models/Wall.js';
import User from '../models/User.js';
import { DEFAULT_WALL_GIFTS, MIN_WALL_GIFT_PRICE, dinarPurchase, wallCrown } from '../config/wall.js';
import { wallGifts } from '../services/wallService.js';
import { wallNotificationPayload } from '../services/wallNotificationService.js';
const original = { find:WallEntry.find, count:WallEntry.countDocuments, update:WallEntry.updateMany, users:User.find, settings:WallSettings.findById };
let server,base,readFilter,writeFilter;
const eventId='507f1f77bcf86cd799439099',postId='507f1f77bcf86cd799439095';
process.env.JWT_SECRET='isolated-wall-queue-tests-secret-2026';
before(async()=>{
 WallEntry.find=filter=>{readFilter=filter;return {sort:()=>({limit:()=>({lean:async()=>[{_id:eventId,userId:'507f1f77bcf86cd799439091',recipientId:'viewer',giftId:'rose',giftEmoji:'🌹',postId}]})})};};
 WallEntry.countDocuments=async()=>1;
 WallEntry.updateMany=async(filter)=>{writeFilter=filter;return {modifiedCount:1};};
 User.find=()=>({select:()=>({lean:async()=>[{_id:'507f1f77bcf86cd799439091',fullName:'Emad'}]})});
 WallSettings.findById=()=>({lean:async()=>({pricingVersion:1,prices:{rose:1}})});
 const app=express();app.use(express.json());app.use('/wall',router);server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/wall`;
});
after(async()=>{WallEntry.find=original.find;WallEntry.countDocuments=original.count;WallEntry.updateMany=original.update;User.find=original.users;WallSettings.findById=original.settings;await new Promise(r=>server.close(r));});
const request=async(path,body)=>{
 const token=jwt.sign({userId:'viewer',role:'WORKER'},process.env.JWT_SECRET);
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};
};
test('all 24 gifts have distinct prices and minimum gift costs exactly EGP 10',async()=>{
 assert.equal(DEFAULT_WALL_GIFTS.length,24);assert.equal(Math.min(...DEFAULT_WALL_GIFTS.map(g=>g.price)),100);assert.equal(MIN_WALL_GIFT_PRICE/10,10);
 assert.equal(new Set(DEFAULT_WALL_GIFTS.map(g=>g.price)).size,24);assert.equal(dinarPurchase(100).amount,10);
 assert.equal((await wallGifts()).find(g=>g.id==='rose').price,100);
});
test('legacy pricing cannot retain a gift below the new minimum',async()=>{
 const old=WallSettings.findById;WallSettings.findById=()=>({lean:async()=>({pricingVersion:3,prices:{rose:1}})});
 assert.equal((await wallGifts()).find(g=>g.id==='rose').price,100);WallSettings.findById=old;
});
test('persisted inbox is scoped to authenticated recipient, oldest first and only unseen gifts',async()=>{
 const r=await request('/gifts/inbox');assert.equal(r.status,200);assert.equal(r.data.total,1);assert.equal(r.data.gifts[0].senderName,'Emad');assert.equal(r.data.gifts[0].eventId,eventId);
 assert.deepEqual(readFilter,{recipientId:'viewer',type:'GIFT',animationSeenAt:null});
});
test('acknowledgment cannot mark another recipient’s gifts and invalid IDs cannot mutate',async()=>{
 const r=await request('/gifts/ack',{ids:[eventId],recipientId:'someone-else'});assert.equal(r.status,200);assert.equal(writeFilter.recipientId,'viewer');assert.equal(writeFilter.type,'GIFT');assert.equal(writeFilter.animationSeenAt,null);
 const previous=writeFilter;assert.equal((await request('/gifts/ack',{ids:['invalid']})).status,400);assert.equal(writeFilter,previous);assert.equal((await request('/gifts/ack',{ids:[]})).status,400);
});
test('gift and comment bell notifications carry actor, stable dedup keys and a post link',()=>{
 const item={_id:eventId,postId,userId:'sender',authorId:'commenter',giftId:'rose',giftEmoji:'🌹'};
 const gift=wallNotificationPayload('GIFT',item,'عماد','ar');assert.equal(gift.message,'عماد أرسل لك هدية');assert.equal(gift.type,'WALL_GIFT');assert.equal(gift.eventKey,`wall:gift:${eventId}`);assert.equal(gift.link,`/wall?post=${postId}`);
 const comment=wallNotificationPayload('COMMENT',item,'عماد','ar');assert.equal(comment.message,'عماد علّق على بوستك');assert.equal(comment.type,'WALL_COMMENT');assert.equal(comment.data.actorId,'commenter');assert.equal(comment.eventKey,`wall:comment:${eventId}`);assert.ok(comment.link.includes(`comment=${eventId}`));
});
test('crown progression remains gift count based, independent of new gift prices',()=>{assert.deepEqual(wallCrown(1000),{level:4,gems:1,gifts:1000});});

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import router from '../src/routes/wall.js';
import paymentRouter from '../src/routes/payment.js';
import { WallContent, WallWallet, WallEntry, WallLike, WallReport, WallBlock, WallSettings } from '../src/models/Wall.js';
import User from '../src/models/User.js';
import { fulfillDinarPayment } from '../src/services/wallService.js';
import { wallCrown, dinarPurchase, validateWallText, DEFAULT_WALL_GIFTS } from '../src/config/wall.js';

let mongo, server, base;
const buyer = '507f1f77bcf86cd799439091';
const seller = '507f1f77bcf86cd799439092';
const admin = '507f1f77bcf86cd799439093';
const post = new mongoose.Types.ObjectId();
process.env.JWT_SECRET = 'isolated-wall-integration-secret-2026';
process.env.VODAFONE_CASH_NUMBER = '01000000000';
const token = (userId, role='WORKER') => jwt.sign({ userId, role, tokenVersion: 0 }, process.env.JWT_SECRET);
async function request(path, { userId=buyer, role='WORKER', method='GET', body, key, auth=true } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(auth ? { Authorization: `Bearer ${token(userId, role)}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.14' } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([WallContent, WallWallet, WallEntry, WallLike, WallReport, WallBlock, WallSettings, User].map(m => m.init()));
  await User.collection.insertMany([buyer, seller, admin].map(_id => ({ _id: new mongoose.Types.ObjectId(_id), fullName: 'Test user', role: _id === admin ? 'ADMIN' : 'WORKER', tokenVersion: 0 })));
  await WallContent.create({ _id: post, authorId: seller, text: 'Hello wall' });
  const app = express(); app.use(express.json()); app.use('/wall', router); app.use('/payments', paymentRouter);
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); if (mongo) await mongo.stop(); });

test('pricing, text boundaries and every crown threshold follow business rules', () => {
  assert.deepEqual(dinarPurchase(50), { quantity:50, amount:5, currency:'EGP' });
  for (const invalid of [0,-1,1.2,'1e3','',null,1000001]) assert.throws(() => dinarPurchase(invalid));
  assert.equal(validateWallText('word '.repeat(500)).split(/\s+/).length,500);
  assert.throws(() => validateWallText('word '.repeat(501)));
  for (const [count,level,gems] of [[49,0,0],[50,1,0],[100,2,0],[250,3,0],[500,4,0],[999,4,0],[1000,4,1],[1500,4,2]]) assert.deepEqual(wallCrown(count), {level,gems,gifts:count});
  assert.equal(new Set(DEFAULT_WALL_GIFTS.map(g => g.price)).size,DEFAULT_WALL_GIFTS.length);
});
test('anonymous access denied; buyer receives server-derived manual instructions', async () => {
  assert.equal((await request('/wall/store',{auth:false})).status,401);
  const result = await request('/payments/manual/instructions?purpose=DINAR_PURCHASE&paymentMethod=vodafone_cash&dinarQuantity=75&amount=0.01');
  assert.equal(result.status,200); assert.equal(result.data.payment.amount,7.5); assert.equal(result.data.payment.purpose,'DINAR_PURCHASE');
  assert.equal(await WallEntry.countDocuments(),0);
});
test('verified purchase is credited exactly once under concurrent callback retries', async () => {
  const payment = { id:'purchase-1', purpose:'DINAR_PURCHASE', userId:buyer, status:'completed', amount:50, currency:'EGP', metadata:{dinarQuantity:500} };
  await Promise.all(Array.from({length:5}, () => fulfillDinarPayment(payment)));
  assert.equal((await WallWallet.findById(buyer)).balance,500);
  assert.equal(await WallEntry.countDocuments({type:'PURCHASE'}),1);
  await assert.rejects(() => fulfillDinarPayment({...payment,id:'bad',status:'pending'}));
  await assert.rejects(() => fulfillDinarPayment({...payment,id:'bad',amount:1}));
});
test('gift retries debit once, increment one crown gift and never mint recipient balance', async () => {
  const attempts = await Promise.all(Array.from({length:5}, () => request(`/wall/posts/${post}/gifts`, { method:'POST', body:{giftId:'red_heart'}, key:'same-attempt-12345678' })));
  assert.deepEqual(attempts.map(r=>r.status),[200,200,200,200,200]);
  assert.equal((await WallWallet.findById(buyer)).balance,380);
  const recipient = await WallWallet.findById(seller); assert.equal(recipient.balance,0); assert.equal(recipient.receivedGifts,1);
  assert.equal((await request(`/wall/posts/${post}/gifts`, {method:'POST',body:{giftId:'rose'},key:'same-attempt-12345678'})).status,409);
});
test('concurrent different gifts cannot overspend and insufficient balance is side-effect free', async () => {
  await WallWallet.updateOne({_id:buyer},{$set:{balance:200}});
  const result = await Promise.all([1,2,3].map(i=>request(`/wall/posts/${post}/gifts`,{method:'POST',body:{giftId:'red_heart'},key:`distinct-attempt-1234-${i}`})));
  assert.equal(result.filter(r=>r.status===200).length,1);
  assert.equal(result.filter(r=>r.data.code==='INSUFFICIENT_BALANCE').length,2);
  assert.equal((await WallWallet.findById(buyer)).balance,80);
  assert.equal((await WallWallet.findById(seller)).receivedGifts,2);
});
test('self gifts, forged gifts, flags, unrelated deletion and price mutation rejected', async () => {
  assert.equal((await request(`/wall/posts/${post}/gifts`,{userId:seller,method:'POST',body:{giftId:'rose'},key:'self-gift-attempt-1234'})).data.code,'SELF_GIFT');
  assert.equal((await request(`/wall/posts/${post}/gifts`,{method:'POST',body:{giftId:'forged',price:-10},key:'fake-gift-attempt-1234'})).status,400);
  assert.equal((await request(`/wall/posts/${post}/gifts`,{method:'POST',body:{giftId:'flag',flag:'XX'},key:'flag-gift-attempt-1234'})).status,400);
  assert.equal((await request(`/wall/content/${post}`,{method:'DELETE'})).status,404);
  assert.equal((await request('/wall/admin/gifts',{method:'PUT',body:{prices:{rose:0}}})).status,403);
});
test('likes are idempotent and removable; comments enforce 500 words and parent existence', async () => {
  for (let i=0;i<2;i++) assert.equal((await request(`/wall/posts/${post}/like`,{method:'PUT',body:{liked:true}})).status,200);
  assert.equal(await WallLike.countDocuments({postId:post}),1);
  assert.equal((await request(`/wall/posts/${post}/like`,{method:'PUT',body:{liked:false}})).status,200);
  assert.equal(await WallLike.countDocuments({postId:post}),0);
  assert.equal((await request(`/wall/posts/${post}/comments`,{method:'POST',body:{text:'word '.repeat(501)}})).status,400);
  assert.equal((await request(`/wall/posts/${post}/comments`,{method:'POST',body:{text:'hello'}})).status,201);
  assert.equal((await request(`/wall/posts/${new mongoose.Types.ObjectId()}/comments`,{method:'POST',body:{text:'hello'}})).status,404);
});
test('moderation hides parent and comments; blocks stop gifts in both directions', async () => {
  const report = await request(`/wall/content/${post}/report`,{method:'POST',body:{reason:'test'}}); assert.equal(report.status,200);
  assert.equal((await request('/wall/admin/reports')).status,403);
  assert.equal((await request('/wall/admin/reports',{userId:admin,role:'ADMIN'})).data.reports.length,1);
  await request(`/wall/admin/content/${post}`,{userId:admin,role:'ADMIN',method:'PUT',body:{hidden:true}});
  assert.equal((await request(`/wall/posts/${post}/comments`)).status,404);
  await request(`/wall/admin/content/${post}`,{userId:admin,role:'ADMIN',method:'PUT',body:{hidden:false}});
  await request(`/wall/blocks/${seller}`,{method:'PUT',body:{blocked:true}});
  assert.equal((await request(`/wall/posts/${post}/gifts`,{method:'POST',body:{giftId:'rose'},key:'blocked-attempt-123456'})).status,404);
  await request(`/wall/blocks/${seller}`,{method:'PUT',body:{blocked:false}});
});
test('admin gift price is authoritative; invalid price rejected', async () => {
  const prices=Object.fromEntries(DEFAULT_WALL_GIFTS.map(g=>[g.id,g.price]));
  prices.rose=500;
  assert.equal((await request('/wall/admin/gifts',{userId:admin,role:'ADMIN',method:'PUT',body:{prices}})).status,200);
  assert.equal((await request(`/wall/posts/${post}/gifts`,{method:'POST',body:{giftId:'rose',price:0},key:'new-price-attempt-1234'})).data.code,'INSUFFICIENT_BALANCE');
  prices.rose=0; assert.equal((await request('/wall/admin/gifts',{userId:admin,role:'ADMIN',method:'PUT',body:{prices}})).status,400);
});

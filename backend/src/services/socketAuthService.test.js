import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocketAuthMiddleware, joinAuthenticatedUserRoom, joinGenericRoom, privateUserRoom } from './socketAuthService.js';

const makeSocket = (auth = {}) => ({ handshake: { auth }, joined: [], join(room) { this.joined.push(room); } });

const makeUserSocket = (userId) => {
  const socket = makeSocket({ token: 'valid' });
  socket.user = { userId, role: 'WORKER' };
  return socket;
};

test('valid handshake attaches identity and joins only its private room', async () => {
  const socket = makeSocket({ token: 'valid' });
  await createSocketAuthMiddleware(async () => ({ userId: 'A', role: 'EMPLOYER' }))(socket, (error) => assert.equal(error, undefined));
  assert.deepEqual(socket.user, { userId: 'A', role: 'EMPLOYER' });
  assert.equal(joinAuthenticatedUserRoom(socket), true);
  assert.deepEqual(socket.joined, [privateUserRoom('A')]);
});

for (const [name, auth] of [['missing token', {}], ['invalid token', { token: 'invalid' }], ['expired token', { token: 'expired' }]]) {
  test(`${name} rejects the socket`, async () => {
    const socket = makeSocket(auth);
    await createSocketAuthMiddleware(async () => { throw new Error('invalid'); })(socket, (error) => {
      assert.match(error.message, /Authentication|required/);
    });
  });
}

test('a requested different user id cannot change the authenticated room', () => {
  const socket = makeSocket({ token: 'valid' });
  socket.user = { userId: 'A', role: 'WORKER' };
  joinAuthenticatedUserRoom(socket, 'B');
  assert.deepEqual(socket.joined, [privateUserRoom('A')]);
  assert.equal(socket.joined.includes(privateUserRoom('B')), false);
});

test('public support mode is the only unauthenticated exception', async () => {
  const socket = makeSocket({ publicSupport: true });
  await createSocketAuthMiddleware(async () => null)(socket, (error) => assert.equal(error, undefined));
  assert.equal(joinAuthenticatedUserRoom(socket), false);
});

test('unauthenticated public-support guest cannot use generic join_room', () => {
  const socket = makeSocket({ publicSupport: true });
  assert.equal(joinGenericRoom(socket, 'general'), false);
  assert.equal(joinGenericRoom(socket, 'some-room'), false);
  assert.equal(joinGenericRoom(socket, privateUserRoom('A')), false);
  assert.deepEqual(socket.joined, []);
});

test('unauthenticated generic socket cannot use generic join_room', () => {
  const socket = makeSocket();
  assert.equal(joinGenericRoom(socket, 'general'), false);
  assert.equal(joinGenericRoom(socket, 'some-room'), false);
  assert.deepEqual(socket.joined, []);
});

test("authenticated user can join ordinary rooms but not another user's private room", () => {
  const socket = makeUserSocket('A');
  assert.equal(joinGenericRoom(socket, 'general'), true);
  assert.equal(joinGenericRoom(socket, 'hire_123'), true);
  assert.equal(joinGenericRoom(socket, privateUserRoom('B')), false);
  assert.deepEqual(socket.joined, ['general', 'hire_123']);
});

test('authenticated user can join only their own private room', () => {
  const socket = makeUserSocket('A');
  assert.equal(joinGenericRoom(socket, privateUserRoom('A')), true);
  assert.equal(joinGenericRoom(socket, privateUserRoom('B')), false);
  assert.deepEqual(socket.joined, [privateUserRoom('A')]);
});

test('authenticated user cannot join a private user room through a non-string roomId', () => {
  const socket = makeUserSocket('A');
  assert.equal(joinGenericRoom(socket, 42), false);
  assert.equal(joinGenericRoom(socket, { toString: () => privateUserRoom('A') }), false);
  assert.deepEqual(socket.joined, []);
});
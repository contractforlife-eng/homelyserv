import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOptimisticLike,
  reconcileLikeFailure,
  mergeFeedWithOptimisticLikes,
  addPendingComment,
  replacePendingComment,
  markCommentFailed,
  removePendingComment
} from './wallFeedbackState.js';

test('applyOptimisticLike immediately updates heart and count', () => {
  const initial = [
    { id: 'post-1', likes: 5, liked: false },
    { id: 'post-2', likes: 10, liked: true }
  ];

  const res1 = applyOptimisticLike(initial, 'post-1', 0);
  assert.equal(res1.newLiked, true);
  assert.equal(res1.targetSeq, 1);
  assert.equal(res1.updatedPosts[0].likes, 6);
  assert.equal(res1.updatedPosts[0].liked, true);
  assert.equal(res1.updatedPosts[0]._likeSeq, 1);
  assert.equal(res1.updatedPosts[1].likes, 10, 'Other posts unmodified');

  const res2 = applyOptimisticLike(res1.updatedPosts, 'post-1', 1);
  assert.equal(res2.newLiked, false);
  assert.equal(res2.targetSeq, 2);
  assert.equal(res2.updatedPosts[0].likes, 5);
  assert.equal(res2.updatedPosts[0].liked, false);
});

test('rapid like toggles: out-of-order stale response cannot overwrite latest user intent', () => {
  const posts = [{ id: 'post-1', likes: 0, liked: false }];

  // 1. User clicks Like -> seq 1 (liked: true, likes: 1)
  const act1 = applyOptimisticLike(posts, 'post-1', 0);
  // 2. User quickly clicks Unlike -> seq 2 (liked: false, likes: 0)
  const act2 = applyOptimisticLike(act1.updatedPosts, 'post-1', act1.targetSeq);

  // Now suppose request 1 fails or returns delayed response (seq 1).
  // Request 1 attempt was to turn liked from false -> true. Rollback would want liked: false.
  const reconciled = reconcileLikeFailure(act2.updatedPosts, 'post-1', act1.targetSeq, false);

  // Because current post has seq 2 > 1, stale response is ignored and latest user intent is preserved
  assert.equal(reconciled[0].liked, false);
  assert.equal(reconciled[0].likes, 0);
  assert.equal(reconciled[0]._likeSeq, 2);
});

test('reconcileLikeFailure rolls back when matching current sequence', () => {
  const posts = [{ id: 'post-1', likes: 1, liked: true, _likeSeq: 1 }];

  // Request 1 failed, user did not click again. Roll back to liked: false.
  const rolledBack = reconcileLikeFailure(posts, 'post-1', 1, false);
  assert.equal(rolledBack[0].liked, false);
  assert.equal(rolledBack[0].likes, 0);
});

test('mergeFeedWithOptimisticLikes protects in-flight optimistic interactions from background refresh', () => {
  const localPosts = [{ id: 'post-1', likes: 11, liked: true, _likeSeq: 1 }];
  const backgroundIncoming = [{ id: 'post-1', likes: 10, liked: false }]; // Older server snapshot

  const pendingMap = new Map([['post-1', 1]]);
  const merged = mergeFeedWithOptimisticLikes(localPosts, backgroundIncoming, pendingMap);

  assert.equal(merged[0].liked, true, 'Optimistic liked state must be preserved');
  assert.equal(merged[0].likes, 11, 'Optimistic like count must be preserved');
});

test('pending comment lifecycle: add, replace with server version without duplicates, and handle failure', () => {
  let commentsState = {
    'post-1': { comments: [{ id: 'c-old', text: 'Old comment' }], next: null }
  };

  const pendingId = 'pending-123';
  const pendingComment = {
    id: pendingId,
    text: 'Hello world',
    author: { id: 'user-1', displayName: 'Ahmed' },
    _pending: true,
  };

  // Add pending
  commentsState = addPendingComment(commentsState, 'post-1', pendingComment);
  assert.equal(commentsState['post-1'].comments.length, 2);
  assert.equal(commentsState['post-1'].comments[0].id, pendingId);

  // Server confirms with permanent id
  const serverComment = {
    id: 'c-server-456',
    text: 'Hello world',
    author: { id: 'user-1', displayName: 'Ahmed' },
    createdAt: new Date().toISOString()
  };

  commentsState = replacePendingComment(commentsState, 'post-1', pendingId, serverComment);
  assert.equal(commentsState['post-1'].comments.length, 2);
  assert.equal(commentsState['post-1'].comments[0].id, 'c-server-456');
  assert.equal(commentsState['post-1'].comments[0]._pending, undefined);

  // Failure flow
  commentsState = addPendingComment(commentsState, 'post-1', { id: 'pending-fail', text: 'Will fail' });
  commentsState = markCommentFailed(commentsState, 'post-1', 'pending-fail', 'NETWORK_ERROR');
  assert.equal(commentsState['post-1'].comments[0]._failed, true);
  assert.equal(commentsState['post-1'].comments[0]._error, 'NETWORK_ERROR');

  // Removal of failed draft
  commentsState = removePendingComment(commentsState, 'post-1', 'pending-fail');
  assert.equal(commentsState['post-1'].comments.some(c => c.id === 'pending-fail'), false);
});

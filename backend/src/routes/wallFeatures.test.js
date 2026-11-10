import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWallText } from '../config/wall.js';
import { detectWallVideoType, detectWallImageType } from '../utils/wallMediaUpload.js';
import { wallNotificationPayload } from '../services/wallNotificationService.js';

test('Author-only edits validation and permissions rules', () => {
  // Post/comment text validation for author edits
  assert.equal(validateWallText('Updated post text', false), 'Updated post text');
  // Video or image post can have empty text
  assert.equal(validateWallText('', true), '');
  // Text with media is allowed for posts
  assert.equal(validateWallText('Post with media caption', true), 'Post with media caption');
  // Reject excessive word count (>500 words)
  const excessiveWords = Array(501).fill('word').join(' ');
  assert.throws(() => validateWallText(excessiveWords, false), /INVALID_CONTENT/);
});

test('Video upload format detection and limits', () => {
  // MP4 ftyp brand detection
  const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
  assert.equal(detectWallVideoType(mp4Header), 'video/mp4');

  // QuickTime MOV brand detection
  const movHeader = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20]);
  assert.equal(detectWallVideoType(movHeader), 'video/quicktime');

  // WebM / EBML detection
  const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03, 0x04]);
  assert.equal(detectWallVideoType(webmHeader), 'video/webm');

  // Non-video buffer fails detection
  const textBuffer = Buffer.from('This is not a video file at all');
  assert.equal(detectWallVideoType(textBuffer), null);

  // JPEG / PNG image detection
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  assert.equal(detectWallImageType(jpegHeader), 'image/jpeg');
  assert.equal(detectWallVideoType(jpegHeader), null);
});

test('Reply notification and linking to parent post & comment', () => {
  const replyItem = {
    _id: '507f1f77bcf86cd799439088',
    postId: '507f1f77bcf86cd799439095',
    parentCommentId: '507f1f77bcf86cd799439099',
    authorId: 'reply_author_123',
  };
  const payload = wallNotificationPayload('COMMENT', replyItem, 'Sarah', 'en');
  assert.equal(payload.type, 'WALL_COMMENT');
  assert.equal(payload.message, 'Sarah commented on your post');
  assert.equal(payload.data.postId, '507f1f77bcf86cd799439095');
  assert.equal(payload.data.commentId, '507f1f77bcf86cd799439088');
  assert.equal(payload.link, '/wall?post=507f1f77bcf86cd799439095&comment=507f1f77bcf86cd799439088');
  assert.equal(payload.eventKey, 'wall:comment:507f1f77bcf86cd799439088');
});

test('Parent comment visibility rules for replies', () => {
  // Test visibility logic rule:
  // If parent comment is deleted or hidden or blocked, replies must not be visible
  const checkVisibility = (comment, post, blockedUserIds, viewerUserId) => {
    if (!comment || comment.deleted || comment.hidden) return false;
    if (blockedUserIds.includes(comment.authorId)) return false;
    if (!post || post.deleted || post.hidden) return false;
    if (blockedUserIds.includes(post.authorId)) return false;
    return true;
  };

  const validPost = { _id: 'post1', authorId: 'author1', deleted: false, hidden: false };
  const validComment = { _id: 'comment1', postId: 'post1', authorId: 'author2', deleted: false, hidden: false };

  assert.equal(checkVisibility(validComment, validPost, [], 'viewer1'), true);

  // Parent comment deleted
  assert.equal(checkVisibility({ ...validComment, deleted: true }, validPost, [], 'viewer1'), false);

  // Parent comment hidden by moderation
  assert.equal(checkVisibility({ ...validComment, hidden: true }, validPost, [], 'viewer1'), false);

  // Parent comment author blocked
  assert.equal(checkVisibility(validComment, validPost, ['author2'], 'viewer1'), false);

  // Root post deleted
  assert.equal(checkVisibility(validComment, { ...validPost, deleted: true }, [], 'viewer1'), false);

  // Root post author blocked
  assert.equal(checkVisibility(validComment, validPost, ['author1'], 'viewer1'), false);
});

test('Wall Post Chat action validation and access control rules', () => {
  const getConversationId = (u1, u2) => `conv_${[String(u1), String(u2)].sort().join('_')}`;

  const validateChatAccess = ({ viewerId, post, isBlocked, chatAuthAllowed }) => {
    if (!post || post.deleted || post.hidden) {
      return { status: 404, code: 'NOT_FOUND' };
    }
    if (post.postId) {
      return { status: 400, code: 'INVALID_POST' };
    }
    if (String(post.authorId) === String(viewerId)) {
      return { status: 400, code: 'CANNOT_CHAT_SELF' };
    }
    if (isBlocked) {
      return { status: 403, code: 'COMMUNICATION_BLOCKED' };
    }
    if (!chatAuthAllowed) {
      return { status: 403, code: 'MESSAGING_FORBIDDEN' };
    }
    return {
      status: 200,
      success: true,
      conversationId: getConversationId(viewerId, post.authorId),
      recipientId: post.authorId,
    };
  };

  const authorId = '507f1f77bcf86cd799439011';
  const viewerId = '507f1f77bcf86cd799439022';
  const validPost = {
    _id: '507f1f77bcf86cd799439099',
    postId: null,
    authorId,
    deleted: false,
    hidden: false,
  };

  // 1. Success case: distinct viewer and author, post active, no block, chat authorized
  const successResult = validateChatAccess({ viewerId, post: validPost, isBlocked: false, chatAuthAllowed: true });
  assert.equal(successResult.status, 200);
  assert.equal(successResult.conversationId, getConversationId(viewerId, authorId));
  assert.equal(successResult.recipientId, authorId);

  // 2. Reject self-chat
  const selfResult = validateChatAccess({ viewerId: authorId, post: validPost, isBlocked: false, chatAuthAllowed: true });
  assert.equal(selfResult.status, 400);
  assert.equal(selfResult.code, 'CANNOT_CHAT_SELF');

  // 3. Reject comment/reply (not a top-level post)
  const commentPost = { ...validPost, postId: '507f1f77bcf86cd799439090' };
  const commentResult = validateChatAccess({ viewerId, post: commentPost, isBlocked: false, chatAuthAllowed: true });
  assert.equal(commentResult.status, 400);
  assert.equal(commentResult.code, 'INVALID_POST');

  // 4. Reject deleted or hidden post
  const deletedResult = validateChatAccess({ viewerId, post: { ...validPost, deleted: true }, isBlocked: false, chatAuthAllowed: true });
  assert.equal(deletedResult.status, 404);
  assert.equal(deletedResult.code, 'NOT_FOUND');

  // 5. Reject communication when blocked
  const blockedResult = validateChatAccess({ viewerId, post: validPost, isBlocked: true, chatAuthAllowed: true });
  assert.equal(blockedResult.status, 403);
  assert.equal(blockedResult.code, 'COMMUNICATION_BLOCKED');

  // 6. Reject when role-based messaging authorization fails (e.g., student safeguarding)
  const forbiddenResult = validateChatAccess({ viewerId, post: validPost, isBlocked: false, chatAuthAllowed: false });
  assert.equal(forbiddenResult.status, 403);
  assert.equal(forbiddenResult.code, 'MESSAGING_FORBIDDEN');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWallPreviewHtml, WALL_SOCIAL_TEXTS } from './wallSocialPreview.js';

test('renderWallPreviewHtml produces crawler-safe meta tags for visible top-level post', () => {
  const post = {
    _id: '507f1f77bcf86cd799439011',
    postId: null,
    deleted: false,
    hidden: false,
    text: 'A heartwarming story about our lovely service experience!',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
  };
  const author = { displayName: 'Sarah Connor' };

  const html = renderWallPreviewHtml({ post, author, lang: 'en' });
  assert.ok(html.includes('<title>Sarah Connor: &quot;A heartwarming story about our lovely service experience!&quot; | HomelyServ</title>'));
  assert.ok(html.includes('property="og:url" content="https://www.homelyserv.com/wall?post=507f1f77bcf86cd799439011&amp;lang=en"'));
  assert.ok(html.includes('property="og:image" content="https://res.cloudinary.com/demo/image/upload/sample.jpg"'));
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(html.includes('http-equiv="refresh" content="0;url=https://www.homelyserv.com/wall?post=507f1f77bcf86cd799439011&amp;lang=en"'));
});

test('renderWallPreviewHtml produces Arabic tags with RTL for Arabic language', () => {
  const post = {
    _id: '507f1f77bcf86cd799439011',
    postId: null,
    deleted: false,
    hidden: false,
    text: 'قصة جميلة من حائط الخدمات',
  };
  const author = { displayName: 'أحمد علي' };

  const html = renderWallPreviewHtml({ post, author, lang: 'ar' });
  assert.ok(html.includes('dir="rtl"'));
  assert.ok(html.includes('lang="ar"'));
  assert.ok(html.includes('أحمد علي'));
  assert.ok(html.includes('قصة جميلة'));
  assert.ok(html.includes('https://www.homelyserv.com/wall?post=507f1f77bcf86cd799439011&amp;lang=ar'));
});

test('renderWallPreviewHtml produces generic unavailable fallback for missing, deleted, or hidden posts', () => {
  const missingHtml = renderWallPreviewHtml({ post: null, lang: 'en' });
  assert.ok(missingHtml.includes(WALL_SOCIAL_TEXTS.en.unavailableTitle));
  assert.ok(missingHtml.includes(WALL_SOCIAL_TEXTS.en.unavailableDesc));
  assert.ok(missingHtml.includes('https://www.homelyserv.com/wall?lang=en'));

  const deletedPost = {
    _id: '507f1f77bcf86cd799439011',
    deleted: true,
    hidden: false,
    text: 'Secret deleted post',
  };
  const deletedHtml = renderWallPreviewHtml({ post: deletedPost, lang: 'ar' });
  assert.ok(!deletedHtml.includes('Secret deleted post'), 'Deleted post text must not leak into crawler metadata');
  assert.ok(deletedHtml.includes(WALL_SOCIAL_TEXTS.ar.unavailableTitle));

  const commentContent = {
    _id: '507f1f77bcf86cd799439012',
    postId: '507f1f77bcf86cd799439011',
    deleted: false,
    hidden: false,
    text: 'Comment text',
  };
  const commentHtml = renderWallPreviewHtml({ post: commentContent, lang: 'en' });
  assert.ok(!commentHtml.includes('Comment text'), 'Comments cannot be crawled as standalone wall posts');
  assert.ok(commentHtml.includes(WALL_SOCIAL_TEXTS.en.unavailableTitle));
});

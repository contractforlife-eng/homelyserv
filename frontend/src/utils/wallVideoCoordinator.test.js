// frontend/src/utils/wallVideoCoordinator.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { wallVideoCoordinator, getWallVideoPosterUrl } from './wallVideoCoordinator.js';

class MockVideoElement {
  constructor(id) {
    this.id = id;
    this.paused = true;
    this.currentTime = 0;
  }
  play() {
    this.paused = false;
  }
  pause() {
    this.paused = true;
  }
}

test('1. Playing video A and then video B automatically pauses video A', () => {
  const vidA = new MockVideoElement('vidA');
  const vidB = new MockVideoElement('vidB');

  wallVideoCoordinator.register('vidA', vidA);
  wallVideoCoordinator.register('vidB', vidB);

  // Play video A
  vidA.play();
  vidA.currentTime = 14.5;
  wallVideoCoordinator.notifyPlay('vidA', vidA);

  assert.equal(vidA.paused, false);
  assert.equal(wallVideoCoordinator.getActiveId(), 'vidA');

  // Play video B
  vidB.play();
  wallVideoCoordinator.notifyPlay('vidB', vidB);

  // video A must now be paused, but currentTime preserved
  assert.equal(vidA.paused, true);
  assert.equal(vidA.currentTime, 14.5);
  assert.equal(vidB.paused, false);
  assert.equal(wallVideoCoordinator.getActiveId(), 'vidB');
});

test('2. Replaying video A automatically pauses video B and preserves position', () => {
  const vidA = wallVideoCoordinator.elements.get('vidA');
  const vidB = wallVideoCoordinator.elements.get('vidB');

  vidB.currentTime = 30.2;

  // Replay video A
  vidA.play();
  wallVideoCoordinator.notifyPlay('vidA', vidA);

  assert.equal(vidB.paused, true);
  assert.equal(vidB.currentTime, 30.2);
  assert.equal(vidA.paused, false);
  assert.equal(vidA.currentTime, 14.5);
  assert.equal(wallVideoCoordinator.getActiveId(), 'vidA');
});

test('3. stopAll pauses all active playing elements and clears activeId', () => {
  const vidA = wallVideoCoordinator.elements.get('vidA');
  assert.equal(vidA.paused, false);

  wallVideoCoordinator.stopAll();

  assert.equal(vidA.paused, true);
  assert.equal(wallVideoCoordinator.getActiveId(), null);
});

test('4. unregister pauses the active element if it was playing', () => {
  const vidC = new MockVideoElement('vidC');
  wallVideoCoordinator.register('vidC', vidC);

  vidC.play();
  wallVideoCoordinator.notifyPlay('vidC', vidC);
  assert.equal(wallVideoCoordinator.getActiveId(), 'vidC');
  assert.equal(vidC.paused, false);

  wallVideoCoordinator.unregister('vidC', vidC);
  assert.equal(vidC.paused, true);
  assert.equal(wallVideoCoordinator.getActiveId(), null);
});

test('5. getWallVideoPosterUrl transforms Cloudinary URLs correctly', () => {
  const cl1 = 'https://res.cloudinary.com/homelyserv/video/upload/v1731140000/homelyserv/wall/videos/abc.mp4';
  const expected1 = 'https://res.cloudinary.com/homelyserv/video/upload/so_0,f_jpg,q_auto/v1731140000/homelyserv/wall/videos/abc.jpg';
  assert.equal(getWallVideoPosterUrl(cl1), expected1);

  const cl2 = 'https://res.cloudinary.com/homelyserv/video/upload/homelyserv/wall/videos/xyz.webm';
  const expected2 = 'https://res.cloudinary.com/homelyserv/video/upload/so_0,f_jpg,q_auto/homelyserv/wall/videos/xyz.jpg';
  assert.equal(getWallVideoPosterUrl(cl2), expected2);

  const cl3 = 'https://res.cloudinary.com/homelyserv/video/upload/v1/homelyserv/wall/videos/mov_vid.mov?extra=1';
  const expected3 = 'https://res.cloudinary.com/homelyserv/video/upload/so_0,f_jpg,q_auto/v1/homelyserv/wall/videos/mov_vid.jpg';
  assert.equal(getWallVideoPosterUrl(cl3), expected3);
});

test('6. getWallVideoPosterUrl falls back gracefully for non-Cloudinary videos', () => {
  assert.equal(getWallVideoPosterUrl('https://example.com/stream.mp4'), 'https://example.com/stream.mp4#t=0.001');
  assert.equal(getWallVideoPosterUrl('https://example.com/stream.mp4#t=2'), 'https://example.com/stream.mp4#t=2');
  assert.equal(getWallVideoPosterUrl(''), '');
  assert.equal(getWallVideoPosterUrl(null), '');
});

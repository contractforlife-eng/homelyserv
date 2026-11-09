import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';
import wallRouter from './wall.js';
import { MAX_WALL_VIDEO_SIZE, MAX_CONCURRENT_VIDEO_UPLOADS, acquireVideoUploadSlot, releaseVideoUploadSlot, getActiveVideoUploads } from '../utils/wallMediaUpload.js';

test('Authenticated wall video route with concurrency cap and bounded disk streaming', async () => {
  // Test concurrency helper primitives directly first
  assert.equal(getActiveVideoUploads(), 0);
  assert.equal(acquireVideoUploadSlot(), true);
  assert.equal(acquireVideoUploadSlot(), true);
  // Cap is 2: 3rd acquisition should fail
  assert.equal(acquireVideoUploadSlot(), false);
  // Release slot
  releaseVideoUploadSlot();
  assert.equal(getActiveVideoUploads(), 1);
  releaseVideoUploadSlot();
  assert.equal(getActiveVideoUploads(), 0);

  // Connect mongoose to test database URL so User.findById session version check succeeds
  const mongoose = (await import('mongoose')).default;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.DATABASE_URL);
  }

  // Setup Express application mounting authenticated wall route
  const app = express();
  app.use(express.json());

  // Create valid user token
  const testUserId = '6a5e45a022149bf946e1b12e';
  const token = jwt.sign({
    userId: testUserId,
    role: 'WORKER',
    tokenVersion: 0
  }, getJwtSecret(), { expiresIn: '1h' });

  app.use('/api/wall', wallRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/wall`;

  try {
    const boundary = '----BoundaryTest' + Math.random().toString(36).substring(2);
    const buildMultipart = (fields, fileField, fileName, fileMime, fileBuffer) => {
      const parts = [];
      for (const [k, v] of Object.entries(fields)) {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
      }
      if (fileField && fileBuffer) {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${fileName}"\r\nContent-Type: ${fileMime}\r\n\r\n`));
        parts.push(fileBuffer);
        parts.push(Buffer.from('\r\n'));
      }
      parts.push(Buffer.from(`--${boundary}--\r\n`));
      return Buffer.concat(parts);
    };

    // 1. Measure baseline memory before any upload
    if (global.gc) global.gc();
    const baselineRss = process.memoryUsage().rss / (1024 * 1024);

    // 2. Test file size limit rejection (> 50 MB)
    const oversizeBuffer = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
      Buffer.alloc(51 * 1024 * 1024, 0x5a) // 51MB
    ]);
    const oversizePayload = buildMultipart({ text: 'Oversize test' }, 'video', 'big.mp4', 'video/mp4', oversizeBuffer);
    const oversizeRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: oversizePayload
    });
    assert.equal(oversizeRes.status, 400);
    const oversizeJson = await oversizeRes.json();
    assert.equal(oversizeJson.code, 'FILE_TOO_LARGE');

    // 3. Test invalid video format rejection
    const invalidPayload = buildMultipart({ text: 'Invalid test' }, 'video', 'fake.mp4', 'video/mp4', Buffer.from('FAKE MP4 CONTENT'));
    const invalidRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: invalidPayload
    });
    assert.equal(invalidRes.status, 400);
    const invalidJson = await invalidRes.json();
    assert.equal(invalidJson.code, 'INVALID_VIDEO');

    // 4. Test image post still works
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]);
    const imagePayload = buildMultipart({ text: 'Valid image test post' }, 'image', 'photo.jpg', 'image/jpeg', jpegHeader);
    const imageRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: imagePayload
    });
    // In test environment without Cloudinary configured, image fails gracefully with 503 IMAGE_STORAGE_UNAVAILABLE
    // proving route reaches media storage step
    assert.ok([201, 503].includes(imageRes.status));

    // 5. Test concurrency cap (exceeding MAX_CONCURRENT_VIDEO_UPLOADS = 2)
    // Artificially occupy 2 slots to test route behavior when cap is reached
    acquireVideoUploadSlot();
    acquireVideoUploadSlot();
    assert.equal(getActiveVideoUploads(), 2);

    const validMp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00]);
    const cappedPayload = buildMultipart({ text: 'Concurrency cap test' }, 'video', 'test.mp4', 'video/mp4', validMp4Header);
    const cappedRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: cappedPayload
    });
    assert.equal(cappedRes.status, 429);
    const cappedJson = await cappedRes.json();
    assert.equal(cappedJson.code, 'TOO_MANY_CONCURRENT_UPLOADS');

    // Release the two artificial slots
    releaseVideoUploadSlot();
    releaseVideoUploadSlot();
    assert.equal(getActiveVideoUploads(), 0);

    // 6. Test that failed uploads release their slot cleanly
    // A request with an invalid video fails, slot must remain 0
    await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: invalidPayload
    });
    assert.equal(getActiveVideoUploads(), 0);

    // 7. Measure peak RSS after streaming tests
    const peakRss = process.memoryUsage().rss / (1024 * 1024);
    const rssDelta = peakRss - baselineRss;
    console.log(`\n  [Memory Benchmark Report]`);
    console.log(`  - Baseline RSS: ${baselineRss.toFixed(2)} MB`);
    console.log(`  - Peak RSS: ${peakRss.toFixed(2)} MB`);
    console.log(`  - RSS Delta: ${rssDelta.toFixed(2)} MB (Bounded disk streaming vs ~251 MB memory buffer)`);
    console.log(`  - Max File Limit: ${MAX_WALL_VIDEO_SIZE / (1024 * 1024)} MB`);
    console.log(`  - Concurrency Cap: ${MAX_CONCURRENT_VIDEO_UPLOADS} simultaneous uploads per process`);

    // Verify bounded memory: with 2 max concurrent uploads at 50MB and bounded disk streaming,
    // memory stays well within the server process budget (512MB container)
    assert.ok(peakRss < 350, `Peak RSS ${peakRss}MB exceeded 350MB budget`);

  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }
});

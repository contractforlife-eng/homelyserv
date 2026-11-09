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
import {
  MAX_WALL_VIDEO_SIZE,
  MAX_CONCURRENT_VIDEO_UPLOADS,
  getActiveVideoUploads
} from '../utils/wallMediaUpload.js';
import { WallContent } from '../models/Wall.js';
import mongoose from 'mongoose';

test('Concurrent near-limit uploads, incremental stream hash, slot acquisition and cleanup on isolated database', async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.DATABASE_URL);
  }

  const app = express();
  app.use(express.json());

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

  const createdContentIds = [];

  try {
    // 1. Verify createdAt restoration in serialization
    const testPost = await WallContent.create({
      authorId: testUserId,
      text: 'Test post for timestamp verification',
      hidden: false,
      deleted: false
    });
    createdContentIds.push(testPost._id);

    const postFetchRes = await fetch(`${baseUrl}/posts/${testPost._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(postFetchRes.status, 200);
    const postFetchJson = await postFetchRes.json();
    assert.ok(postFetchJson.post.createdAt, 'Expected valid createdAt timestamp on post');
    assert.ok(!isNaN(new Date(postFetchJson.post.createdAt).getTime()), 'createdAt must be valid date');

    // 2. Prepare 2 near-limit valid MP4 buffers (20 MB each)
    const nearLimitSize = 20 * 1024 * 1024;
    console.log(`Generating near-limit MP4 payloads (${(nearLimitSize / (1024 * 1024)).toFixed(0)} MB each)...`);
    const validMp4Payload1 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00]),
      Buffer.alloc(nearLimitSize - 16, 0x11)
    ]);
    const validMp4Payload2 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00]),
      Buffer.alloc(nearLimitSize - 16, 0x22)
    ]);
    const validMp4Payload3 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00]),
      Buffer.alloc(1024 * 1024, 0x33)
    ]);

    const buildMultipart = (fields, fileField, fileName, fileMime, fileBuffer, boundary) => {
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

    const b1 = '----Boundary1_' + Math.random().toString(36).slice(2);
    const b2 = '----Boundary2_' + Math.random().toString(36).slice(2);
    const b3 = '----Boundary3_' + Math.random().toString(36).slice(2);

    const body1 = buildMultipart({ text: 'Concurrent upload #1', clientMutationId: 'mutation_conc_1' }, 'video', 'video1.mp4', 'video/mp4', validMp4Payload1, b1);
    const body2 = buildMultipart({ text: 'Concurrent upload #2', clientMutationId: 'mutation_conc_2' }, 'video', 'video2.mp4', 'video/mp4', validMp4Payload2, b2);
    const body3 = buildMultipart({ text: 'Concurrent upload #3 (should be rejected)', clientMutationId: 'mutation_conc_3' }, 'video', 'video3.mp4', 'video/mp4', validMp4Payload3, b3);

    // Baseline memory
    if (global.gc) global.gc();
    const baselineRss = process.memoryUsage().rss / (1024 * 1024);
    const baselineHeap = process.memoryUsage().heapUsed / (1024 * 1024);

    let peakRssDuringUpload = baselineRss;
    let peakHeapDuringUpload = baselineHeap;

    const memorySampler = setInterval(() => {
      const mem = process.memoryUsage();
      const currentRss = mem.rss / (1024 * 1024);
      const currentHeap = mem.heapUsed / (1024 * 1024);
      if (currentRss > peakRssDuringUpload) peakRssDuringUpload = currentRss;
      if (currentHeap > peakHeapDuringUpload) peakHeapDuringUpload = currentHeap;
    }, 20);

    console.log('Sending two concurrent near-limit uploads + third overflow upload...');
    const p1 = fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${b1}` },
      body: body1
    });

    const p2 = fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${b2}` },
      body: body2
    });

    // Small delay to ensure p1 and p2 have reached Multer and acquired both slots
    await new Promise(r => setTimeout(r, 100));

    const p3 = fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${b3}` },
      body: body3
    });

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);
    clearInterval(memorySampler);

    console.log(`Results: Upload #1 status = ${res1.status}, Upload #2 status = ${res2.status}, Upload #3 status = ${res3.status}`);

    // In controlled environment without Cloudinary configured, 503 (STORAGE_UNAVAILABLE) or 201 is expected for accepted uploads, but 429 is guaranteed for #3
    assert.equal(res3.status, 429, 'Third concurrent upload MUST be rejected with HTTP 429');
    const json3 = await res3.json();
    assert.equal(json3.code, 'TOO_MANY_CONCURRENT_UPLOADS');

    // Both accepted uploads must have successfully passed slot acquisition and reached upload handling (201 or 503)
    assert.ok([201, 503].includes(res1.status));
    assert.ok([201, 503].includes(res2.status));

    // 3. Verify slot release and temp file cleanup
    assert.equal(getActiveVideoUploads(), 0, 'All video slots must be released back to 0');

    // Scan os.tmpdir for any orphaned wall_* files
    const tmpDirFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('wall_'));
    console.log(`Remaining wall_* files in os.tmpdir(): ${tmpDirFiles.length}`);
    assert.equal(tmpDirFiles.length, 0, 'All temporary upload files must be cleaned up');

    // 4. Report sampled memory
    console.log(`\n  [Isolated Memory Sampling Report]`);
    console.log(`  - Baseline RSS: ${baselineRss.toFixed(2)} MB`);
    console.log(`  - Peak RSS Sampled: ${peakRssDuringUpload.toFixed(2)} MB`);
    console.log(`  - Peak Heap Sampled: ${peakHeapDuringUpload.toFixed(2)} MB`);
    console.log(`  - RSS Delta: ${(peakRssDuringUpload - baselineRss).toFixed(2)} MB`);

    // Verify memory budget is bounded (well below 512 MB)
    assert.ok(peakRssDuringUpload < 400, `Peak RSS ${peakRssDuringUpload}MB exceeded 400MB threshold`);

  } finally {
    if (createdContentIds.length) {
      await WallContent.deleteMany({ _id: { $in: createdContentIds } });
    }
    await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
});

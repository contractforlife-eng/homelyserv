import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';
import wallRouter from './wall.js';
import {
  MAX_WALL_VIDEO_SIZE,
  MAX_CONCURRENT_VIDEO_UPLOADS,
  getActiveVideoUploads,
  setVideoStorageAdapter,
  resetVideoStorageAdapter,
  setCustomTempDir,
  resetCustomTempDir
} from '../utils/wallMediaUpload.js';
import { WallContent } from '../models/Wall.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

test('Provision and seed isolated MongoDB database, isolated temp dir, 201/201/429 concurrency and 503 cleanup', async () => {
  try {
    // 1. Provision a distinct isolated MongoDB database for this test run (max 38 bytes)
  const baseUri = process.env.DATABASE_URL;
  const dbUrl = new URL(baseUri);
  const testDbName = `test_up_${Date.now()}`;
  dbUrl.pathname = `/${testDbName}`;
  const isolatedDatabaseUrl = dbUrl.toString();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(isolatedDatabaseUrl);
  console.log(`Connected to isolated test database: ${mongoose.connection.name}`);

  // Seed required test user in the isolated database
  const testUserId = new mongoose.Types.ObjectId();
  try {
    await User.create({
      _id: testUserId,
      fullName: 'Isolated Test Worker',
      email: `worker_${Date.now()}@homelyserv.test`,
      password: 'hashed_password_123',
      role: 'WORKER',
      tokenVersion: 0,
      isSuspended: false
    });
    console.log('Seeded test worker successfully:', testUserId);
  } catch (seedErr) {
    console.error('SEED ERROR DETAILS:', seedErr);
    throw seedErr;
  }

  // 2. Setup a dedicated test-owned temporary directory
  const testTempDir = path.join(os.tmpdir(), `homelyserv_wall_test_tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(testTempDir, { recursive: true });
  setCustomTempDir(testTempDir);
  console.log(`Using test-owned temporary directory: ${testTempDir}`);

  const app = express();
  app.use(express.json());

  const token = jwt.sign({
    userId: String(testUserId),
    role: 'WORKER',
    tokenVersion: 0
  }, getJwtSecret(), { expiresIn: '1h' });

  app.use('/api/wall', wallRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/wall`;

  try {
    console.log('Inside try block, preparing files...');
    // 3. Configure controlled storage adapter returning successful Cloudinary-like payload
    setVideoStorageAdapter(async (filePath) => {
      // Simulate network / Cloudinary latency
      await new Promise(r => setTimeout(r, 600));
      const stats = fs.statSync(filePath);
      return {
        secure_url: `https://res.cloudinary.com/homelyserv/video/upload/v12345/wall/videos/test_${Date.now()}.mp4`,
        public_id: `homelyserv/wall/videos/test_${Date.now()}`,
        bytes: stats.size
      };
    });

    console.log('Writing test video files...');
    // 4. Prepare two valid MP4 files close to the 50 MiB limit (45 MiB each)
    const targetSize = 45 * 1024 * 1024;
    console.log(`Generating two valid near-limit MP4 payloads (${(targetSize / (1024 * 1024)).toFixed(0)} MiB each)...`);

    const mp4Head = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00]);
    const file1 = path.join(testTempDir, 'client_upload_1.mp4');
    const file2 = path.join(testTempDir, 'client_upload_2.mp4');
    const file3 = path.join(testTempDir, 'client_upload_3.mp4');

    fs.writeFileSync(file1, Buffer.concat([mp4Head, Buffer.alloc(targetSize - 16, 0x11)]));
    console.log('Wrote file1');
    fs.writeFileSync(file2, Buffer.concat([mp4Head, Buffer.alloc(targetSize - 16, 0x22)]));
    console.log('Wrote file2');
    fs.writeFileSync(file3, Buffer.concat([mp4Head, Buffer.alloc(1024 * 1024, 0x33)]));
    console.log('Wrote file3');

    // Script for separate worker process to send concurrent multipart uploads
    const clientScript = path.join(testTempDir, 'upload_client_runner.mjs');
    fs.writeFileSync(clientScript, `
      import fs from 'node:fs';

      const [,, baseUrl, token, f1, f2, f3] = process.argv;

      const buildMultipart = (fields, fileField, filePath, fileMime, boundary) => {
        const parts = [];
        for (const [k, v] of Object.entries(fields)) {
          parts.push(Buffer.from(\`--\${boundary}\\r\\nContent-Disposition: form-data; name="\${k}"\\r\\n\\r\\n\${v}\\r\\n\`));
        }
        parts.push(Buffer.from(\`--\${boundary}\\r\\nContent-Disposition: form-data; name="\${fileField}"; filename="\${filePath}"\\r\\nContent-Type: \${fileMime}\\r\\n\\r\\n\`));
        parts.push(fs.readFileSync(filePath));
        parts.push(Buffer.from('\\r\\n'));
        parts.push(Buffer.from(\`--\${boundary}--\\r\\n\`));
        return Buffer.concat(parts);
      };

      const b1 = '----Boundary1_' + Math.random().toString(36).slice(2);
      const b2 = '----Boundary2_' + Math.random().toString(36).slice(2);
      const b3 = '----Boundary3_' + Math.random().toString(36).slice(2);

      const body1 = buildMultipart({ text: 'Valid near-limit post #1', clientMutationId: 'mutation_45mb_1' }, 'video', f1, 'video/mp4', b1);
      const body2 = buildMultipart({ text: 'Valid near-limit post #2', clientMutationId: 'mutation_45mb_2' }, 'video', f2, 'video/mp4', b2);
      const body3 = buildMultipart({ text: 'Overflow post #3', clientMutationId: 'mutation_overflow_3' }, 'video', f3, 'video/mp4', b3);

      const p1 = fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + b1 },
        body: body1
      }).then(async r => ({ status: r.status, data: await r.json() }));

      await new Promise(r => setTimeout(r, 50));

      const p2 = fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + b2 },
        body: body2
      }).then(async r => ({ status: r.status, data: await r.json() }));

      await new Promise(r => setTimeout(r, 100));

      const p3 = fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + b3 },
        body: body3
      }).then(async r => ({ status: r.status, data: await r.json() }));

      try {
        const results = await Promise.all([p1, p2, p3]);
        process.send(results);
      } catch (e) {
        console.error('CLIENT SCRIPT FETCH ERROR:', e);
        process.exit(1);
      }
    `);

    // Baseline server memory before uploads
    if (global.gc) global.gc();
    const baselineRss = process.memoryUsage().rss / (1024 * 1024);
    let peakRss = baselineRss;

    const sampler = setInterval(() => {
      const currentRss = process.memoryUsage().rss / (1024 * 1024);
      if (currentRss > peakRss) peakRss = currentRss;
    }, 25);

    console.log('Spawning client process...');
    const clientProc = fork(clientScript, [baseUrl, token, file1, file2, file3], { stdio: 'inherit' });

    let results;
    try {
      results = await new Promise((resolve, reject) => {
        clientProc.on('message', resolve);
        clientProc.on('error', reject);
        clientProc.on('exit', (code) => {
          if (code !== 0) reject(new Error('Client process exited with ' + code));
        });
      });
    } catch (clientErr) {
      console.error('CLIENT FORK ERROR:', clientErr);
      throw clientErr;
    }

    clearInterval(sampler);

    // Clean client payload files
    try {
      fs.unlinkSync(file1);
      fs.unlinkSync(file2);
      fs.unlinkSync(file3);
      fs.unlinkSync(clientScript);
    } catch {}

    const [res1, res2, res3] = results;
    console.log(`Results: Upload #1 status = ${res1.status}, Upload #2 status = ${res2.status}, Upload #3 status = ${res3.status}`);

    // Verify 201 / 201 / 429
    assert.equal(res1.status, 201, 'Upload #1 must return 201 Created');
    assert.equal(res2.status, 201, 'Upload #2 must return 201 Created');
    assert.equal(res3.status, 429, 'Upload #3 must return 429 Too Many Requests');
    assert.equal(res3.data.code, 'TOO_MANY_CONCURRENT_UPLOADS');

    // Both posts persist and can be fetched with valid createdAt and video URLs
    assert.ok(res1.data.content?.id);
    assert.ok(res2.data.content?.id);

    const fetch1 = await fetch(`${baseUrl}/posts/${res1.data.content.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(fetch1.status, 200);
    const post1 = (await fetch1.json()).post;
    assert.ok(post1.createdAt, 'Post #1 must have valid createdAt timestamp');
    assert.ok(!isNaN(new Date(post1.createdAt).getTime()), 'Post #1 createdAt must be valid parseable date');
    assert.ok(post1.video && post1.video.startsWith('https://res.cloudinary.com'), 'Post #1 must have valid video URL');

    const fetch2 = await fetch(`${baseUrl}/posts/${res2.data.content.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(fetch2.status, 200);
    const post2 = (await fetch2.json()).post;
    assert.ok(post2.createdAt, 'Post #2 must have valid createdAt timestamp');
    assert.ok(!isNaN(new Date(post2.createdAt).getTime()), 'Post #2 createdAt must be valid parseable date');
    assert.ok(post2.video && post2.video.startsWith('https://res.cloudinary.com'), 'Post #2 must have valid video URL');

    // Verify slots released back to 0
    assert.equal(getActiveVideoUploads(), 0, 'Active slots must be 0 after successful uploads');

    // Verify server temp files cleaned up in testTempDir
    const testDirFiles = fs.readdirSync(testTempDir).filter(f => f.startsWith('wall_'));
    console.log(`Remaining wall_* files in test-owned directory: ${testDirFiles.length}`);
    assert.equal(testDirFiles.length, 0, 'No temp files should remain in test-owned directory after successful uploads');

    // 5. Test 503 separately as a failure case
    console.log('Testing 503 storage failure handling...');
    setVideoStorageAdapter(async () => {
      throw new Error('Controlled storage failure');
    });

    const boundaryFail = '----BoundaryFail_' + Math.random().toString(36).slice(2);
    const failBuffer = Buffer.concat([
      mp4Head,
      Buffer.alloc(1024 * 1024, 0x44)
    ]);
    const failParts = [
      Buffer.from(`--${boundaryFail}\r\nContent-Disposition: form-data; name="text"\r\n\r\nFail test\r\n`),
      Buffer.from(`--${boundaryFail}\r\nContent-Disposition: form-data; name="video"; filename="fail.mp4"\r\nContent-Type: video/mp4\r\n\r\n`),
      failBuffer,
      Buffer.from('\r\n'),
      Buffer.from(`--${boundaryFail}--\r\n`)
    ];

    const failRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundaryFail}` },
      body: Buffer.concat(failParts)
    });

    assert.equal(failRes.status, 503, 'Storage failure must return 503');
    const failJson = await failRes.json();
    assert.equal(failJson.code, 'VIDEO_STORAGE_UNAVAILABLE');

    // Verify slot released after 503
    assert.equal(getActiveVideoUploads(), 0, 'Slot must be released after 503 storage failure');

    // Verify temp files cleaned up after 503
    const postFailTemp = fs.readdirSync(testTempDir).filter(f => f.startsWith('wall_'));
    assert.equal(postFailTemp.length, 0, 'Temporary files must be cleaned up in test-owned directory after 503 storage failure');

    // Server memory report
    console.log(`\n  [Server Memory Sampling with External Upload Client]`);
    console.log(`  - Baseline Server RSS: ${baselineRss.toFixed(2)} MB`);
    console.log(`  - Peak Server RSS Sampled: ${peakRss.toFixed(2)} MB`);
    console.log(`  - Server RSS Delta: ${(peakRss - baselineRss).toFixed(2)} MB (for 2x 45 MiB near-limit uploads)`);

    assert.ok(peakRss < 450, `Peak server RSS ${peakRss}MB exceeded 450MB threshold`);

  } finally {
    resetVideoStorageAdapter();
    resetCustomTempDir();
    // Drop the provisioned isolated database
    if (mongoose.connection.readyState === 1) {
      console.log(`Dropping isolated test database: ${mongoose.connection.name}`);
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
    // Remove the test-owned temporary directory
    try {
      fs.rmSync(testTempDir, { recursive: true, force: true });
      console.log('Removed test-owned temporary directory.');
    } catch {}
    await new Promise(resolve => server.close(resolve));
  }
} catch (outerErr) {
  console.error('OUTER TEST ERROR:', outerErr);
  throw outerErr;
}
});

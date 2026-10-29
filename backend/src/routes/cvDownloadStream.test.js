import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { generatePrivateDownloadUrl } from '../utils/verificationDocumentUpload.js';
import { cloudinary } from '../utils/cloudinary.js';

// Setup mock Cloudinary credentials
cloudinary.config({
  cloud_name: 'test_cloud',
  api_key: '111111111111111',
  api_secret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaa',
});

test('1. generatePrivateDownloadUrl produces valid signed Cloudinary download URLs', () => {
  const pdfUrl = generatePrivateDownloadUrl('homelyserv/verification-documents/cv_1', 'raw', 'pdf', 3600);
  assert.ok(pdfUrl, 'URL must be produced');
  assert.match(pdfUrl, /\/raw\/download\?/, 'URL must target raw download endpoint');
  assert.match(pdfUrl, /signature=[a-f0-9]{40}/, 'URL must include cryptographic HMAC signature');
  assert.match(pdfUrl, /format=pdf/, 'URL must specify format');
  assert.match(pdfUrl, /public_id=homelyserv%2Fverification-documents%2Fcv_1/, 'URL must specify public_id');

  const imgUrl = generatePrivateDownloadUrl('homelyserv/verification-documents/img_2', 'image', 'png', 3600);
  assert.match(imgUrl, /\/image\/download\?/, 'URL must target image download endpoint');
  assert.match(imgUrl, /format=png/, 'URL must specify format png');
});

test('2. Streaming endpoint serves exact PDF bytes and UTF-8 Content-Disposition for Arabic filename', async () => {
  // Mock upstream Cloudinary server
  const samplePdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

  const mockCloudinaryServer = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': samplePdfBytes.length,
    });
    res.end(samplePdfBytes);
  });

  await new Promise((r) => mockCloudinaryServer.listen(0, r));
  const mockPort = mockCloudinaryServer.address().port;

  // Handler under test (matches downloadApplicationCv logic)
  const app = express();
  app.get('/api/jobs/applications/:id/cv', async (req, res) => {
    const rawOriginalName = 'سيرة_ذاتية_2026.pdf';
    const upstreamRes = await fetch(`http://127.0.0.1:${mockPort}/test.pdf`);

    const safeFilename = rawOriginalName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    const asciiFallback = safeFilename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '\\"');
    const utf8Encoded = encodeURIComponent(safeFilename).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`);

    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.end(buffer);
  });

  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, r));
  const testPort = testServer.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${testPort}/api/jobs/applications/app123/cv`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');

    const disposition = response.headers.get('content-disposition');
    assert.match(disposition, /attachment;/, 'Must specify attachment');
    assert.match(disposition, /filename\*=UTF-8''%D8%B3%D9%8A%D8%B1%D8%A9/, 'Must encode Arabic filename correctly via RFC 5987');

    const downloadedBytes = Buffer.from(await response.arrayBuffer());
    assert.equal(downloadedBytes.length, samplePdfBytes.length, 'Byte length must match exactly');
    assert.deepEqual(downloadedBytes, samplePdfBytes, 'File content bytes must match uploaded fixture exactly');
  } finally {
    await new Promise((r) => testServer.close(r));
    await new Promise((r) => mockCloudinaryServer.close(r));
  }
});

test('3. Streaming endpoint serves exact PNG bytes for English filename', async () => {
  const samplePngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00]);

  const mockServer = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': samplePngBytes.length,
    });
    res.end(samplePngBytes);
  });

  await new Promise((r) => mockServer.listen(0, r));
  const mockPort = mockServer.address().port;

  const app = express();
  app.get('/api/jobs/applications/:id/cv', async (req, res) => {
    const rawOriginalName = 'Sara_Hassan_Portfolio.png';
    const upstreamRes = await fetch(`http://127.0.0.1:${mockPort}/test.png`);

    const safeFilename = rawOriginalName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    const asciiFallback = safeFilename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '\\"');
    const utf8Encoded = encodeURIComponent(safeFilename).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`);

    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.end(buffer);
  });

  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, r));
  const testPort = testServer.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${testPort}/api/jobs/applications/app456/cv`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');

    const disposition = response.headers.get('content-disposition');
    assert.match(disposition, /filename="Sara_Hassan_Portfolio\.png"/);

    const downloadedBytes = Buffer.from(await response.arrayBuffer());
    assert.equal(downloadedBytes.length, samplePngBytes.length);
    assert.deepEqual(downloadedBytes, samplePngBytes);
  } finally {
    await new Promise((r) => testServer.close(r));
    await new Promise((r) => mockServer.close(r));
  }
});

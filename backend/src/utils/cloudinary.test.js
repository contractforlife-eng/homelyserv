import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';

const ENV_KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

test('missing Cloudinary configuration fails safely before provider upload', async () => {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  const { uploadFromBuffer } = await import('./cloudinary.js');
  assert.throws(
    () => uploadFromBuffer(Buffer.from('image')),
    (error) => error.code === 'CLOUDINARY_NOT_CONFIGURED' && !error.message.includes('API_SECRET')
  );
  for (const key of ENV_KEYS) if (saved[key] !== undefined) process.env[key] = saved[key];
});

test('Cloudinary config is applied lazily after environment loading and a valid buffer streams successfully', async () => {
  const { cloudinary, uploadFromBuffer } = await import('./cloudinary.js');
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  const originalUploadStream = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_options, callback) => new Writable({
    write(_chunk, _encoding, done) { done(); },
    final(done) { callback(null, { secure_url: 'https://images.example.test/profile.png' }); done(); },
  });
  try {
    const result = await uploadFromBuffer(Buffer.from('valid-image-buffer'));
    assert.equal(result.secure_url, 'https://images.example.test/profile.png');
  } finally {
    cloudinary.uploader.upload_stream = originalUploadStream;
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

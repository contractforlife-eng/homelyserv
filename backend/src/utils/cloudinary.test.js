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

test('upload options preserve the default folder but do not duplicate a path-qualified public_id', async () => {
  const { cloudinary, uploadFromBuffer } = await import('./cloudinary.js');
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  const originalUploadStream = cloudinary.uploader.upload_stream;
  const receivedOptions = [];
  cloudinary.uploader.upload_stream = (options, callback) => {
    receivedOptions.push(options);
    return new Writable({
      write(_chunk, _encoding, done) { done(); },
      final(done) { callback(null, { public_id: options.public_id || 'generated' }); done(); },
    });
  };

  try {
    await uploadFromBuffer(Buffer.from('image'));
    await uploadFromBuffer(Buffer.from('document'), {
      public_id: 'homelyserv/course-materials/course_123',
      resource_type: 'raw',
    });
    await uploadFromBuffer(Buffer.from('proof'), { folder: 'homelyserv/manual-payment-proofs' });

    assert.equal(receivedOptions[0].folder, 'homelyserv');
    assert.equal(receivedOptions[1].folder, undefined);
    assert.equal(receivedOptions[1].public_id, 'homelyserv/course-materials/course_123');
    assert.equal(receivedOptions[2].folder, 'homelyserv/manual-payment-proofs');
  } finally {
    cloudinary.uploader.upload_stream = originalUploadStream;
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test('material uploads persist Cloudinary returned public_id', async () => {
  const { cloudinary } = await import('./cloudinary.js');
  const { uploadMaterialDocument } = await import('./courseMaterialUpload.js');
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  const originalUploadStream = cloudinary.uploader.upload_stream;
  let receivedOptions;
  cloudinary.uploader.upload_stream = (options, callback) => {
    receivedOptions = options;
    return new Writable({
      write(_chunk, _encoding, done) { done(); },
      final(done) {
        callback(null, { public_id: 'provider/authoritative-id', version: 42, bytes: 12 });
        done();
      },
    });
  };

  try {
    const result = await uploadMaterialDocument(Buffer.from('%PDF-content'), {
      entityType: 'course',
      entityId: 'course-id',
      originalFilename: 'lesson.pdf',
    });

    assert.equal(receivedOptions.folder, undefined);
    assert.match(receivedOptions.public_id, /^homelyserv\/course-materials\//);
    assert.equal(result.public_id, 'provider/authoritative-id');
    assert.equal(result.version, 42);
    assert.equal(result.resource_type, 'raw');
  } finally {
    cloudinary.uploader.upload_stream = originalUploadStream;
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { triggerFileDownload, DownloadError } from './fileDownload.js';

const originalGlobals = {};
let clicked;
let createdBlob;

beforeEach(() => {
  for (const key of ['fetch', 'window', 'document', 'setTimeout']) {
    originalGlobals[key] = globalThis[key];
  }

  clicked = false;
  createdBlob = null;
  globalThis.window = {
    open: () => {},
    URL: {
      createObjectURL: (blob) => {
        createdBlob = blob;
        return 'blob:test';
      },
      revokeObjectURL: () => {}
    }
  };
  globalThis.document = {
    createElement: () => ({
      click: () => { clicked = true; },
      style: {}
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };
  globalThis.setTimeout = (callback) => { callback(); return 0; };
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
});

test('downloads a valid PDF and inspects only the five-byte signature', async () => {
  const pdf = new Blob(['%PDF-1.7\nrest of document'], { type: 'application/pdf' });
  const originalSlice = pdf.slice.bind(pdf);
  let sliceArgs;
  pdf.slice = (...args) => {
    sliceArgs = args;
    return originalSlice(...args);
  };
  globalThis.fetch = async () => ({ ok: true, status: 200, blob: async () => pdf });

  await triggerFileDownload('https://example.test/material', 'lesson.pdf', { expectedType: 'pdf' });

  assert.deepEqual(sliceArgs, [0, 5]);
  assert.equal(createdBlob, pdf);
  assert.equal(clicked, true);
});

test('rejects an empty PDF response', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, blob: async () => new Blob([]) });
  await assert.rejects(
    triggerFileDownload('https://example.test/empty', 'empty.pdf', { expectedType: 'pdf' }),
    (error) => error instanceof DownloadError && /Empty content/.test(error.message)
  );
  assert.equal(clicked, false);
});

for (const [label, body] of [['HTML', '<html>error</html>'], ['JSON', '{"error":"denied"}']]) {
  test(`rejects an HTTP 200 ${label} body when PDF validation is enabled`, async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, blob: async () => new Blob([body]) });
    await assert.rejects(
      triggerFileDownload('https://example.test/not-pdf', 'material.pdf', { expectedType: 'pdf' }),
      (error) => error instanceof DownloadError && /not a valid PDF/.test(error.message)
    );
    assert.equal(clicked, false);
  });
}

test('rejects an HTTP failure without opening the failed response', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 403 });
  await assert.rejects(
    triggerFileDownload('https://example.test/forbidden', 'material.pdf', { expectedType: 'pdf' }),
    (error) => error instanceof DownloadError && /HTTP 403/.test(error.message)
  );
  assert.equal(clicked, false);
});

test('rejects PDF network or CORS failures without opening the signed URL', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(
    triggerFileDownload('https://example.test/cors-failure', 'material.pdf', { expectedType: 'pdf' }),
    (error) => error instanceof DownloadError && /network or CORS error/.test(error.message)
  );
  assert.equal(clicked, false);
});

test('preserves direct-link fallback for generic network failures', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };

  await triggerFileDownload('https://example.test/archive', 'files.zip');

  assert.equal(clicked, true);
});

test('allows non-PDF content when validation is disabled', async () => {
  const archive = new Blob(['not a PDF'], { type: 'application/zip' });
  globalThis.fetch = async () => ({ ok: true, status: 200, blob: async () => archive });

  await triggerFileDownload('https://example.test/archive', 'files.zip');

  assert.equal(createdBlob, archive);
  assert.equal(clicked, true);
});

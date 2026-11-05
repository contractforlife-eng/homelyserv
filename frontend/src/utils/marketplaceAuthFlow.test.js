import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('shared marketplace links preserve the safe destination through supported authentication flows', () => {
  assert.match(read('../App.jsx'), /storeMarketplaceReturnPath/);
  for (const page of ['../pages/Login.jsx', '../pages/VerifyEmail.jsx', '../pages/SocialOnboarding.jsx']) {
    assert.match(read(page), /consumeMarketplaceReturnPath/, `${page} does not resume the listing destination`);
  }
});

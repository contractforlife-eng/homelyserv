import test from 'node:test';
import assert from 'node:assert/strict';
import fsPromises from 'node:fs/promises';

test('UserAvatar & resolveAvatarUrl Suite', async (t) => {
  const { resolveAvatarUrl } = await import('../../../frontend/src/utils/avatarUtils.js');
  const mockApiBase = 'http://localhost:5000';

  await t.test('1. absolute HTTPS image remains unchanged', () => {
    const url = 'https://example.com/avatar/user123.png';
    assert.equal(resolveAvatarUrl(url, mockApiBase), 'https://example.com/avatar/user123.png');
  });

  await t.test('2. Cloudinary HTTPS image remains unchanged', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v123456789/sample.jpg';
    assert.equal(resolveAvatarUrl(cloudinaryUrl, mockApiBase), cloudinaryUrl);
  });

  await t.test('3. /uploads/file.jpg resolves against canonical backend/API origin', () => {
    const relativeUrl = '/uploads/profiles/user-photo.jpg';
    assert.equal(resolveAvatarUrl(relativeUrl, mockApiBase), 'http://localhost:5000/uploads/profiles/user-photo.jpg');

    const prodApiBase = 'https://api.homelyserv.com';
    assert.equal(resolveAvatarUrl(relativeUrl, prodApiBase), 'https://api.homelyserv.com/uploads/profiles/user-photo.jpg');

    const apiBaseWithSlash = 'https://api.homelyserv.com/api/';
    assert.equal(resolveAvatarUrl(relativeUrl, apiBaseWithSlash), 'https://api.homelyserv.com/uploads/profiles/user-photo.jpg');
  });

  await t.test('4. uploads/file.jpg without leading slash resolves safely', () => {
    const unslashed = 'uploads/avatars/test.jpg';
    assert.equal(resolveAvatarUrl(unslashed, mockApiBase), 'http://localhost:5000/uploads/avatars/test.jpg');
  });

  await t.test('5. null and undefined image => null (fallback to initials)', () => {
    assert.equal(resolveAvatarUrl(null, mockApiBase), null);
    assert.equal(resolveAvatarUrl(undefined, mockApiBase), null);
  });

  await t.test('6. empty string image => null (fallback to initials)', () => {
    assert.equal(resolveAvatarUrl('', mockApiBase), null);
    assert.equal(resolveAvatarUrl('   ', mockApiBase), null);
  });

  await t.test('7. data: and blob: URLs remain intact', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    assert.equal(resolveAvatarUrl(dataUrl, mockApiBase), dataUrl);

    const blobUrl = 'blob:http://localhost:5173/1234-5678-9012';
    assert.equal(resolveAvatarUrl(blobUrl, mockApiBase), blobUrl);
  });

  await t.test('8. UserAvatar component implements error state, onError handler, and image change reset', async () => {
    const userAvatarContent = await fsPromises.readFile(new URL('../../../frontend/src/components/users/UserAvatar.jsx', import.meta.url), 'utf8');
    assert.ok(userAvatarContent.includes('resolveAvatarUrl'), 'UserAvatar must use resolveAvatarUrl');
    assert.ok(userAvatarContent.includes('const [hasError, setHasError] = useState(false)'), 'UserAvatar must maintain error state');
    assert.ok(userAvatarContent.includes('onError={() => setHasError(true)}'), 'UserAvatar must catch image loading errors');
    assert.ok(userAvatarContent.includes('useEffect(') && userAvatarContent.includes('setHasError(false)'), 'UserAvatar must reset error state on image prop change');
  });

  await t.test('9. AdminUsers page imports and references shared UserAvatar', async () => {
    const adminUsersContent = await fsPromises.readFile(new URL('../../../frontend/src/pages/AdminUsers.jsx', import.meta.url), 'utf8');
    assert.ok(adminUsersContent.includes('UserAvatar'), 'AdminUsers must import UserAvatar');
    assert.ok(adminUsersContent.includes('<UserAvatar'), 'AdminUsers table and modal must render UserAvatar');
    assert.ok(!adminUsersContent.includes('w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0 text-white font-semibold overflow-hidden'), 'Custom inline img avatar div in table must be replaced');
  });
});

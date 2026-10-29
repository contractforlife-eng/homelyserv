import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('all complaint and reply write paths use centralized attachment authorization', async () => {
  const source = await readFile(new URL('./complaintController.js', import.meta.url), 'utf8');
  assert.match(source, /verifiedAttachments = await validateComplaintAttachments\(attachments, userId\)/);
  assert.equal((source.match(/await authorizeComplaintAttachments\(attachments, (?:userId|supportId|adminId|helperId)\)/g) || []).length, 4);
  assert.equal((source.match(/^\s{6}attachmentAuthorization,$/gm) || []).length, 4, 'all four reply calls pass centralized authorization');
  assert.match(source, /getAuthorizedComplaintAttachmentUrls\(attachmentAuthorization\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('used marketplace navigation is available to every existing account role', () => {
  const source = readFileSync(new URL('./navigationConfig.js', import.meta.url), 'utf8');
  for (const role of ['WORKER','EMPLOYER','ADMIN','DOCTOR','TEACHER','STUDENT','SUPPORT','SUPPORT_HELPER']) {
    const start = source.indexOf(`case '${role}':`);
    const end = source.indexOf("case '", start + 6);
    const roleBlock = source.slice(start, end === -1 ? source.indexOf('default:', start) : end);
    assert.match(roleBlock, /id: 'marketplace'.*path: '\/marketplace'/s, `missing marketplace navigation for ${role}`);
  }
});

test('homelyserv wall navigation is available to every existing account role near the dashboard entry', () => {
  const source = readFileSync(new URL('./navigationConfig.js', import.meta.url), 'utf8');
  for (const role of ['WORKER','EMPLOYER','ADMIN','DOCTOR','TEACHER','STUDENT','SUPPORT','SUPPORT_HELPER']) {
    const start = source.indexOf(`case '${role}':`);
    const end = source.indexOf("case '", start + 6);
    const roleBlock = source.slice(start, end === -1 ? source.indexOf('default:', start) : end);
    assert.match(roleBlock, /id: 'dashboard'.*id: 'wall'.*path: '\/wall'/s, `missing wall navigation near dashboard for ${role}`);
  }
});

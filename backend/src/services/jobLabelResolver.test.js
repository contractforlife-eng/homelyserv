import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanonicalJobLabel } from './jobLabelResolver.js';

test('recognizes exact translated labels for the canonical driver job', () => {
  for (const label of ['driver', 'Driver', 'سائق', 'Chauffeur', 'Водитель', 'Şoför', 'Fahrer']) {
    assert.equal(resolveCanonicalJobLabel(label), 'driver');
  }
});

test('does not classify arbitrary phrases or partial text as a job label', () => {
  assert.equal(resolveCanonicalJobLabel(' محمد '), null);
  assert.equal(resolveCanonicalJobLabel('محمد سائق ممتاز'), null);
  assert.equal(resolveCanonicalJobLabel('driver needed'), null);
});

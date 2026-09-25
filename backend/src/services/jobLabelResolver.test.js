import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanonicalJobLabel } from './jobLabelResolver.js';

test('recognizes exact translated labels for the canonical driver job', () => {
  for (const label of ['driver', 'Driver', 'سائق', 'Chauffeur', 'Водитель', 'Şoför', 'Fahrer']) {
    assert.equal(resolveCanonicalJobLabel(label), 'driver');
  }
});

test('recognizes exact translated labels for new canonical jobs', () => {
  assert.equal(resolveCanonicalJobLabel('Mechanic'), 'mechanic');
  assert.equal(resolveCanonicalJobLabel('ميكانيكي'), 'mechanic');
  assert.equal(resolveCanonicalJobLabel('Mécanicien'), 'mechanic');
  assert.equal(resolveCanonicalJobLabel('Автомеханик'), 'mechanic');
  assert.equal(resolveCanonicalJobLabel('Tamirci'), 'mechanic');
  assert.equal(resolveCanonicalJobLabel('Mechaniker'), 'mechanic');

  assert.equal(resolveCanonicalJobLabel('Doctor'), 'doctor');
  assert.equal(resolveCanonicalJobLabel('طبيب'), 'doctor');
  assert.equal(resolveCanonicalJobLabel('Médecin'), 'doctor');
  assert.equal(resolveCanonicalJobLabel('Врач'), 'doctor');
  assert.equal(resolveCanonicalJobLabel('Doktor'), 'doctor');
  assert.equal(resolveCanonicalJobLabel('Arzt'), 'doctor');

  assert.equal(resolveCanonicalJobLabel('Butcher'), 'butcher');
  assert.equal(resolveCanonicalJobLabel('جزار'), 'butcher');

  assert.equal(resolveCanonicalJobLabel('Excavation Worker'), 'excavation_worker');
  assert.equal(resolveCanonicalJobLabel('عامل حفر'), 'excavation_worker');

  assert.equal(resolveCanonicalJobLabel('Construction Worker'), 'construction_worker');
  assert.equal(resolveCanonicalJobLabel('عامل بناء'), 'construction_worker');

  assert.equal(resolveCanonicalJobLabel('Satellite Dish Installation Technician'), 'satellite_dish_technician');
  assert.equal(resolveCanonicalJobLabel('فني تركيب دش'), 'satellite_dish_technician');
});


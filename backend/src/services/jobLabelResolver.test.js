import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanonicalJobLabel, resolveWorkerProfession } from './jobLabelResolver.js';

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

test('resolveWorkerProfession maps canonical jobs, custom jobs, and empty fallbacks correctly', () => {
  // Predefined canonical English titles
  assert.equal(resolveWorkerProfession('Nanny'), 'nanny');
  assert.equal(resolveWorkerProfession('cleaner'), 'cleaner');
  assert.equal(resolveWorkerProfession('Cleaner'), 'cleaner');
  assert.equal(resolveWorkerProfession('Elderly Caregiver'), 'elderly_caregiver');
  assert.equal(resolveWorkerProfession('elderly_caregiver'), 'elderly_caregiver');
  assert.equal(resolveWorkerProfession('Satellite Dish Installation Technician'), 'satellite_dish_technician');

  // Predefined canonical localized titles
  assert.equal(resolveWorkerProfession('مربية أطفال'), 'nanny');
  assert.equal(resolveWorkerProfession('طبيب'), 'doctor');
  assert.equal(resolveWorkerProfession('Aide aux personnes âgées'), 'elderly_caregiver');

  // Custom non-canonical profession titles
  assert.equal(resolveWorkerProfession('Pool Cleaning Specialist'), 'Pool Cleaning Specialist');
  assert.equal(resolveWorkerProfession('  Executive Chauffeur & VIP Security  '), 'Executive Chauffeur & VIP Security');
  assert.equal(resolveWorkerProfession('Custom Artisan Baker'), 'Custom Artisan Baker');

  // Missing, empty, or invalid titles fall back to 'other' safely
  assert.equal(resolveWorkerProfession(''), 'other');
  assert.equal(resolveWorkerProfession('   '), 'other');
  assert.equal(resolveWorkerProfession(null), 'other');
  assert.equal(resolveWorkerProfession(undefined), 'other');
  assert.equal(resolveWorkerProfession(123), 'other');
});


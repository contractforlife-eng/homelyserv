// backend/src/constants/doctorSpecialties.js
// Canonical Doctor Specialty constants and validator.

export const CANONICAL_DOCTOR_SPECIALTIES = Object.freeze([
  'general_practitioner',
  'internal_medicine',
  'pediatrics',
  'obstetrics_gynecology',
  'general_surgery',
  'orthopedics',
  'dentistry',
  'dermatology',
  'ent',
  'ophthalmology',
  'cardiology',
  'neurology',
  'urology',
  'psychiatry',
  'physiotherapy',
  'radiology',
  'anesthesiology',
  'family_medicine',
  'emergency_medicine',
  'other'
]);

export const isCanonicalDoctorSpecialty = (value) =>
  typeof value === 'string' && CANONICAL_DOCTOR_SPECIALTIES.includes(value);

export default CANONICAL_DOCTOR_SPECIALTIES;

// frontend/src/constants/doctorSpecialties.js
// Canonical Doctor Specialty constants and helper functions.

export const DOCTOR_SPECIALTIES = Object.freeze([
  { value: 'general_practitioner', labelKey: 'doctorSpecialties.general_practitioner' },
  { value: 'internal_medicine', labelKey: 'doctorSpecialties.internal_medicine' },
  { value: 'pediatrics', labelKey: 'doctorSpecialties.pediatrics' },
  { value: 'obstetrics_gynecology', labelKey: 'doctorSpecialties.obstetrics_gynecology' },
  { value: 'general_surgery', labelKey: 'doctorSpecialties.general_surgery' },
  { value: 'orthopedics', labelKey: 'doctorSpecialties.orthopedics' },
  { value: 'dentistry', labelKey: 'doctorSpecialties.dentistry' },
  { value: 'dermatology', labelKey: 'doctorSpecialties.dermatology' },
  { value: 'ent', labelKey: 'doctorSpecialties.ent' },
  { value: 'ophthalmology', labelKey: 'doctorSpecialties.ophthalmology' },
  { value: 'cardiology', labelKey: 'doctorSpecialties.cardiology' },
  { value: 'neurology', labelKey: 'doctorSpecialties.neurology' },
  { value: 'urology', labelKey: 'doctorSpecialties.urology' },
  { value: 'psychiatry', labelKey: 'doctorSpecialties.psychiatry' },
  { value: 'physiotherapy', labelKey: 'doctorSpecialties.physiotherapy' },
  { value: 'radiology', labelKey: 'doctorSpecialties.radiology' },
  { value: 'anesthesiology', labelKey: 'doctorSpecialties.anesthesiology' },
  { value: 'family_medicine', labelKey: 'doctorSpecialties.family_medicine' },
  { value: 'emergency_medicine', labelKey: 'doctorSpecialties.emergency_medicine' },
  { value: 'other', labelKey: 'doctorSpecialties.other' },
]);

export const resolveDoctorSpecialty = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (DOCTOR_SPECIALTIES.some(opt => opt.value === trimmed)) {
    return trimmed;
  }
  return null;
};

export const getDoctorSpecialtyLabel = (value, customValue, t) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed === 'other') {
    if (customValue && typeof customValue === 'string' && customValue.trim()) {
      return customValue.trim();
    }
    return t ? t('doctorSpecialties.other', 'Other') : 'Other';
  }

  const option = DOCTOR_SPECIALTIES.find(opt => opt.value === trimmed);
  if (option && t) {
    return t(option.labelKey, trimmed);
  }
  return customValue && typeof customValue === 'string' && customValue.trim()
    ? customValue.trim()
    : trimmed;
};

export default DOCTOR_SPECIALTIES;

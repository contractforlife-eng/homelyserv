// src/constants/jobOptions.js
export const JOB_OPTIONS = [
  { value: 'nanny', label: 'Nanny' },
  { value: 'baby_sitter', label: 'Baby Sitter' },
  { value: 'elderly_caregiver', label: 'Elderly Caregiver' },
  { value: 'driver', label: 'Driver' },
  { value: 'cook', label: 'Cook' },
  { value: 'house_manager', label: 'House Manager' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'housekeeper', label: 'Housekeeper' },
  { value: 'personal_assistant', label: 'Personal Assistant' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'security_guard', label: 'Security Guard' },
  { value: 'maintenance_worker', label: 'Maintenance Worker' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'other', label: 'Other' }
];

export const getJobLabel = (value) => {
  const job = JOB_OPTIONS.find(j => j.value === value);
  return job ? job.label : value || 'Not specified';
};

export const getJobValue = (label) => {
  const job = JOB_OPTIONS.find(j => j.label === label);
  return job ? job.value : label || '';
};
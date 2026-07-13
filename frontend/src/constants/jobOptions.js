// src/constants/jobOptions.js
export const JOB_OPTIONS = [
  { value: 'nanny', label: 'Nanny' },
  { value: 'maid', label: 'Maid' },
  { value: 'cook', label: 'Cook' },
  { value: 'driver', label: 'Driver' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'elderly_care', label: 'Elderly Care' },
  { value: 'child_care', label: 'Child Care' },
  { value: 'housekeeper', label: 'Housekeeper' },
  { value: 'personal_assistant', label: 'Personal Assistant' },
  { value: 'security', label: 'Security' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'painter', label: 'Painter' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'carpenter', label: 'Carpenter' },
];

export const getJobLabel = (value) => {
  const job = JOB_OPTIONS.find(j => j.value === value);
  return job ? job.label : value || 'Service Provider';
};

export const getJobValue = (label) => {
  const job = JOB_OPTIONS.find(j => j.label === label);
  return job ? job.value : label;
};
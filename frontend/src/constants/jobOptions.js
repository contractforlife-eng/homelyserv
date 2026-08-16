// src/constants/jobOptions.js
export const JOB_OPTIONS = [
  { value: 'nanny', label: 'Nanny' },
  { value: 'elderly_caregiver', label: 'Elderly Caregiver' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'driver', label: 'Driver' },
  { value: 'security_guard', label: 'Security Guard' },
  { value: 'bodyguard', label: 'Bodyguard' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'cook', label: 'Cook' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'portrait_painter', label: 'Portrait Painter' },
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'dog_trainer', label: 'Dog Trainer' },
  { value: 'cat_trainer', label: 'Cat Trainer' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'personal_assistant', label: 'Personal Assistant' },
  { value: 'event_planner', label: 'Event Planner' },
  { value: 'fitness_trainer', label: 'Fitness Trainer' },
  { value: 'psychotherapist', label: 'Psychotherapist' },
  { value: 'other', label: 'Other' },
];

export const getJobLabel = (value) => {
  const job = JOB_OPTIONS.find(j => j.value === value);
  return job ? job.label : value || 'Service Provider';
};

export const getJobValue = (label) => {
  const job = JOB_OPTIONS.find(j => j.label === label);
  return job ? job.value : label;
};
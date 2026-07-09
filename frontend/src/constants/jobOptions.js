// src/constants/jobOptions.js
export const JOB_OPTIONS = [
  { value: 'nanny', label: 'Nanny / Childcare' },
  { value: 'elderly_care', label: 'Elderly Caregiver' },
  { value: 'housekeeper', label: 'Housekeeper / Maid' },
  { value: 'cook', label: 'Cook / Chef' },
  { value: 'driver', label: 'Private Driver' },
  { value: 'gardener', label: 'Gardener / Landscaper' },
  { value: 'house_manager', label: 'House Manager' },
  { value: 'tutor', label: 'Tutor / Teacher' },
  { value: 'pet_care', label: 'Pet Care / Sitter' },
  { value: 'maintenance', label: 'Maintenance / Handyman' },
  { value: 'security', label: 'Security Guard' },
  { value: 'personal_assistant', label: 'Personal Assistant' },
  { value: 'event_planner', label: 'Event Planner' },
  { value: 'fitness_trainer', label: 'Fitness Trainer' },
  { value: 'nurse', label: 'Registered Nurse' },
  { value: 'therapist', label: 'Therapist / Counselor' },
  { value: 'cleaner', label: 'Deep Cleaner' },
  { value: 'other', label: 'Other' }
];

// Helper function to get job label by value
export const getJobLabel = (value) => {
  const job = JOB_OPTIONS.find(j => j.value === value);
  return job ? job.label : value || 'Not specified';
};

// Get just the labels for dropdowns (for search filters)
export const getJobLabels = () => {
  return JOB_OPTIONS.map(job => job.label);
};

// Get just the values
export const getJobValues = () => {
  return JOB_OPTIONS.map(job => job.value);
};
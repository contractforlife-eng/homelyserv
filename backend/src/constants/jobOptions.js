const CANONICAL_WORKER_JOBS = [
  'nanny',
  'elderly_caregiver',
  'nurse',
  'driver',
  'security_guard',
  'bodyguard',
  'plumber',
  'carpenter',
  'electrician',
  'cleaner',
  'cook',
  'tutor',
  'gardener',
  'portrait_painter',
  'interior_designer',
  'dog_trainer',
  'cat_trainer',
  'housekeeping',
  'personal_assistant',
  'event_planner',
  'fitness_trainer',
  'psychotherapist',
  'mechanic',
  'excavation_worker',
  'butcher',
  'construction_worker',
  'doctor',
  'satellite_dish_technician',
  'other'
];

export const isCanonicalWorkerJob = (value) =>
  typeof value === 'string' && CANONICAL_WORKER_JOBS.includes(value);

export default CANONICAL_WORKER_JOBS;

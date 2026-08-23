export const JOB_DEFAULT_LIFETIME_DAYS = 30;
export const JOB_DEFAULT_LIFETIME_MS = JOB_DEFAULT_LIFETIME_DAYS * 24 * 60 * 60 * 1000;

export const getJobExpirationAt = (createdAt) =>
  new Date(new Date(createdAt).getTime() + JOB_DEFAULT_LIFETIME_MS);

export const createJobLifecycleFields = (createdAt = new Date()) => ({
  createdAt,
  expiresAt: getJobExpirationAt(createdAt),
  status: 'open',
});

const isPast = (value, now) => value !== null && value !== undefined && new Date(value).getTime() <= now.getTime();

export const isJobSystemExpired = (job, now = new Date()) =>
  (job.status === 'open' || job.status === 'expired') && isPast(job.expiresAt, now);

export const getEffectiveJobStatus = (job, now = new Date()) =>
  isJobSystemExpired(job, now) ? 'expired' : job.status;

export const isJobWorkerEligible = (job, now = new Date()) =>
  job.status === 'open' &&
  !isPast(job.expiresAt, now) &&
  !isPast(job.deadline, now);

export const canReopenJob = (job, now = new Date()) =>
  job.expiresAt === null || job.expiresAt === undefined || !isPast(job.expiresAt, now);

export const REPOSTABLE_JOB_FIELDS = [
  'jobTitle',
  'description',
  'location',
  'salaryMin',
  'salaryMax',
  'compensationCurrency',
  'employmentType',
  'contractType',
  'workingHoursPerDay',
  'workingDaysPerWeek',
  'weeklyDaysOff',
  'workStartTime',
  'workEndTime',
  'employmentStartDate',
  'requirements',
  'benefits',
  'isUrgent',
  'isFeatured',
];

export const buildRepostData = (source, employerId, createdAt = new Date()) => {
  const data = { employerId: String(employerId), ...createJobLifecycleFields(createdAt) };
  for (const field of REPOSTABLE_JOB_FIELDS) {
    if (source[field] !== undefined) data[field] = source[field];
  }
  // An expired application deadline must not make a fresh repost undiscoverable.
  data.deadline = source.deadline && new Date(source.deadline).getTime() > createdAt.getTime()
    ? source.deadline
    : null;
  return data;
};

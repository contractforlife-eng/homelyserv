export const REGISTRATION_GEOGRAPHY_FIELDS = Object.freeze([
  'registrationIp',
  'registrationCountryCode',
  'registrationCountryName',
  'registrationLocationCapturedAt',
]);

const WORKER_PROFILE_FIELDS = Object.freeze([
  'fullName', 'phone', 'location', 'bio', 'skills', 'experience', 'profileImage', 'desiredJob',
]);

export const buildWorkerProfileUpdate = (body = {}) => Object.fromEntries(
  WORKER_PROFILE_FIELDS
    .filter((field) => Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined)
    .map((field) => [field, body[field]])
);

export const profileUpdateErrorResponse = (error) => {
  if (error?.name === 'ValidationError') {
    return { status: 400, body: { success: false, message: 'Worker profile validation failed', error: error.message } };
  }
  if (error?.name === 'CastError') {
    return { status: 400, body: { success: false, message: 'Invalid user ID', error: error.message } };
  }
  return { status: 500, body: { success: false, message: 'Failed to update profile' } };
};

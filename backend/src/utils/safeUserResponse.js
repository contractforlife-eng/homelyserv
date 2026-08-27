const SENSITIVE_USER_FIELDS = [
  'password',
  'passwordResetToken',
  'passwordResetTokenHash',
  'passwordResetExpiresAt',
  'passwordResetAt',
  'emailVerificationToken',
  'emailVerificationTokenHash',
  'emailVerificationExpiresAt',
  'emailVerificationLastSentAt',
  'tokenVersion',
  'oauthTokens',
  'refreshToken',
  'refreshTokenHash',
];

export const sanitizeUserResponse = (value) => {
  const sanitized = { ...(value || {}) };
  for (const field of SENSITIVE_USER_FIELDS) delete sanitized[field];
  return sanitized;
};

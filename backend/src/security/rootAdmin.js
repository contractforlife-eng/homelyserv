export const ROOT_ADMIN_EMAIL = 'emad@homelyserv.com';

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const isRootAdmin = (user) => normalizeEmail(user?.email) === ROOT_ADMIN_EMAIL;

export const getRecoveryEmail = () => {
  const configured = normalizeEmail(process.env.ROOT_ADMIN_RECOVERY_EMAIL);
  return configured && configured !== ROOT_ADMIN_EMAIL ? configured : '';
};

export const isRecoveryEmail = (email) => {
  const configured = getRecoveryEmail();
  return Boolean(configured) && normalizeEmail(email) === configured;
};

export const isRootRecoveryRequest = (req) => req?.authContext === 'ROOT_RECOVERY';

export const isRootRecoveryTarget = (req, targetUserId) => (
  isRootRecoveryRequest(req) && String(req?.userId || '') === String(targetUserId || '')
);

export const createRootRecoveryTokenClaims = (user) => ({
  userId: String(user?._id || ''),
  role: 'ADMIN',
  authContext: 'ROOT_RECOVERY',
  tokenVersion: user?.tokenVersion || 0
});

export const isRootAdminRequest = async (req, User) => (
  isRootRecoveryRequest(req) || isRootAdminId(User, req?.userId)
);

export const isRootAdminId = async (User, userId) => {
  if (!userId) return false;
  const user = /^[0-9a-fA-F]{24}$/.test(String(userId))
    ? await User.findById(userId).select('email role')
    : await User.findOne({ email: normalizeEmail(userId) }).select('email role');
  return isRootAdmin(user);
};

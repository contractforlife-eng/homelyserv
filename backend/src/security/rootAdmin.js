export const ROOT_ADMIN_EMAIL = 'emad@homelyserv.com';
export const ROOT_RECOVERY_USER_ID = 'ROOT_RECOVERY';

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

export const isRootAdminRequest = async (req, User) => (
  isRootRecoveryRequest(req) || isRootAdminId(User, req?.userId)
);

export const isRootRecoveryUserId = (userId) => String(userId || '') === ROOT_RECOVERY_USER_ID;

export const isRootAdminId = async (User, userId) => {
  if (!userId) return false;
  const user = /^[0-9a-fA-F]{24}$/.test(String(userId))
    ? await User.findById(userId).select('email role')
    : await User.findOne({ email: normalizeEmail(userId) }).select('email role');
  return isRootAdmin(user);
};

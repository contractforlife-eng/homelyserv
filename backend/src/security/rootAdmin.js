export const ROOT_ADMIN_EMAIL = 'emad@homelyserv.com';

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const isRootAdmin = (user) => normalizeEmail(user?.email) === ROOT_ADMIN_EMAIL;

export const isRootAdminId = async (User, userId) => {
  if (!userId) return false;
  const user = /^[0-9a-fA-F]{24}$/.test(String(userId))
    ? await User.findById(userId).select('email role')
    : await User.findOne({ email: normalizeEmail(userId) }).select('email role');
  return isRootAdmin(user);
};

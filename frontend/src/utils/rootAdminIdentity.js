// frontend/src/utils/rootAdminIdentity.js
// Mirrors the backend isRootAdminRequest(...) pattern (see
// backend/src/security/rootAdmin.js) so the frontend can reuse the
// SAME root-admin identity check already used by AdminUsers.jsx.
//
// The canonical Root Admin account is emad@homelyserv.com. The
// Root Recovery login additionally sets authContext === 'ROOT_RECOVERY'
// on the authenticated identity. Both are recognized here; this is for
// UI visibility only — backend authorization remains authoritative.
//
// Do NOT hardcode or expose the recovery email (ROOT_ADMIN_RECOVERY_*).
import useAuthStore from '../store/authStore';

export const ROOT_ADMIN_EMAIL = 'emad@homelyserv.com';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const isRootAdminIdentity = (user) => {
  if (!user) return false;
  return user?.authContext === 'ROOT_RECOVERY' || normalizeEmail(user?.email) === ROOT_ADMIN_EMAIL;
};

export const isCurrentRootAdmin = () => {
  const { user } = useAuthStore.getState();
  return isRootAdminIdentity(user);
};

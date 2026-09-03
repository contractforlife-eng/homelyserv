// frontend/src/utils/userDisplay.js
// ============================================================
// CENTRALIZED USER DISPLAY SYSTEM
// Single source of truth for user names, role labels, role
// colors, and role badges across the entire frontend.
//
// Database roles remain unchanged: ADMIN, SUPPORT, EMPLOYER, WORKER
// ============================================================
import i18n from '../i18n';

// ============================================================
// ROLE LABELS
// Database roles are converted into readable labels here.
// SUP_ADMIN is supported as an alias of the support tier so any
// future role split keeps working without code changes.
// ============================================================
const ROLE_LABEL_KEYS = {
  ADMIN: 'sharedUserDisplay.roles.coAdmin',
  SUPPORT: 'sharedUserDisplay.roles.supportAdmin',
  SUP_ADMIN: 'sharedUserDisplay.roles.supportAdmin',
  SUPPORT_HELPER: 'sharedUserDisplay.roles.supportHelper',
  EMPLOYER: 'sharedUserDisplay.roles.employer',
  WORKER: 'sharedUserDisplay.roles.worker',
  USER: 'sharedUserDisplay.roles.user',
  GUEST: 'sharedUserDisplay.roles.guest'
};

const getUserFallback = () => i18n.t('sharedUserDisplay.fallbacks.user');

// ============================================================
// ROLE COLORS (Tailwind classes)
// ============================================================
const ROLE_COLORS = {
  ADMIN: 'purple',
  SUPPORT: 'green',
  SUPPORT_HELPER: 'red',
  EMPLOYER: 'blue',
  WORKER: 'orange'
};

// ============================================================
// ROLE BADGE CLASSES (full badge styling with dark mode)
// ============================================================
const ROLE_BADGE_CLASSES = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SUPPORT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  SUPPORT_HELPER: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  EMPLOYER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  WORKER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
};

// ============================================================
// OFFICIAL STAFF - Admin & Support visual distinction
// ============================================================
// Offical staff - Admin, Support & support-helper tier.
// SUPPORT_HELPER is display/identity staff only (see backend staffIdentity.js);
// it is intentionally absent from authorization STAFF_ROLES sets.
const STAFF_ROLES = ['ADMIN', 'SUPPORT', 'SUP_ADMIN', 'SUPPORT_HELPER'];

const STAFF_IDENTITY_TITLES = {
  ADMIN: 'Co-Admin',
  SUPPORT: 'Sup-Admin',
  SUP_ADMIN: 'Sup-Admin',
  SUPPORT_HELPER: 'Sup-Help'
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Get the display name for a user.
 *
 * ADMIN   -> "Emad (Co-Admin)"
 * SUPPORT -> "Ahmed (Sup-Admin)"
 * EMPLOYER -> "Rania"
 * WORKER  -> "Ali"
 *
 * @param {Object} user - User object with fullName and role
 * @returns {string} Formatted display name
 */
export const getDisplayName = (user) => {
  if (!user) return getUserFallback();
  const name = user.fullName || user.name || getUserFallback();
  const role = (user.role || '').toUpperCase();

  if (STAFF_ROLES.includes(role)) {
    return `${name} (${getStaffIdentityTitle(role)})`;
  }
  return name;
};

/**
 * Format a staff identity as "{name} ({RoleLabel})".
 * Universal renderer for any place a staff member appears:
 * complaint replies, chat messages, support conversations, etc.
 *
 * Accepts either an identity object ({ name|fullName, role }) or
 * separate (name, role) arguments. Non-staff roles return just
 * the name. NEVER hardcode a staff name — always feed this from
 * API data.
 *
 * Examples:
 *   formatStaffIdentity('Rania', 'SUPPORT')   -> "Rania (Sup-Admin)"
 *   formatStaffIdentity({ name: 'Sara', role: 'ADMIN' }) -> "Sara (Co-Admin)"
 *
 * @param {Object|string} userOrName - identity object or raw name
 * @param {string} [roleArg] - role when first arg is a raw name
 * @returns {string} Formatted identity
 */
export const formatStaffIdentity = (userOrName, roleArg = null) => {
  if (userOrName && typeof userOrName === 'object') {
    return getDisplayName(userOrName);
  }
  return getDisplayName({ fullName: userOrName, role: roleArg });
};

/**
 * Get the human-readable label for a role.
 *
 * ADMIN -> Co-Admin
 * SUPPORT -> Sup-Admin
 * EMPLOYER -> Employer
 * WORKER -> Worker
 *
 * @param {string} role - Database role (ADMIN, SUPPORT, EMPLOYER, WORKER)
 * @returns {string} Human-readable role label
 */
export const getRoleLabel = (role) => {
  const normalized = (role || '').toUpperCase();
  const labelKey = ROLE_LABEL_KEYS[normalized];
  return labelKey ? i18n.t(labelKey) : (normalized || getUserFallback());
};

/**
 * Get the language-invariant title used only as part of a staff identity.
 * Normal role fields and badges must continue to use getRoleLabel().
 */
export const getStaffIdentityTitle = (role) => {
  const normalized = (role || '').toUpperCase();
  return STAFF_IDENTITY_TITLES[normalized] || '';
};

/**
 * Get the Tailwind color name for a role.
 *
 * ADMIN -> purple
 * SUPPORT -> green
 * EMPLOYER -> blue
 * WORKER -> orange
 *
 * @param {string} role - Database role
 * @returns {string} Tailwind color name
 */
export const getRoleColor = (role) => {
  const normalized = (role || '').toUpperCase();
  return ROLE_COLORS[normalized] || 'gray';
};

/**
 * Get full badge styling classes for a role (with dark mode).
 *
 * @param {string} role - Database role
 * @returns {string} Tailwind classes for role badge
 */
export const getRoleBadgeClasses = (role) => {
  const normalized = (role || '').toUpperCase();
  return ROLE_BADGE_CLASSES[normalized] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
};

/**
 * Check if a role is an official staff role (ADMIN or SUPPORT).
 * @param {string} role - Database role
 * @returns {boolean}
 */
export const isStaffRole = (role) => {
  const normalized = (role || '').toUpperCase();
  return STAFF_ROLES.includes(normalized);
};

/**
 * Whether an identity should receive the active-Premium name treatment.
 * The boolean must come from the server's current entitlement check; this
 * helper deliberately does not infer entitlement from payments or plans.
 */
export const isActivePremiumCustomer = (user, explicitPremium = undefined) => {
  const role = (user?.role || '').toUpperCase();
  if (!['EMPLOYER', 'WORKER'].includes(role)) return false;

  const premium = explicitPremium ?? user?.isPremium ?? user?.subscription?.isPremium;
  return premium === true;
};

/**
 * Get the Tailwind text color for a user's displayed name.
 * ADMIN and SUPPORT are always red (official staff).
 * Other roles return an empty string (use default color).
 * @param {string} role - Database role
 * @returns {string} Tailwind text color classes (or empty)
 */
export const getRoleNameColor = (role) => {
  const normalized = (role || '').toUpperCase();
  if (STAFF_ROLES.includes(normalized)) {
    return 'text-red-600 dark:text-red-400';
  }
  return '';
};

/**
 * Get badge styling for an official staff role (ADMIN/SUPPORT).
 * Both use a consistent red-tinted official style.
 * Non-staff roles fall back to the standard role badge classes.
 * @param {string} role - Database role
 * @returns {string} Tailwind badge classes
 */
export const getOfficialBadgeClass = (role) => {
  const normalized = (role || '').toUpperCase();
  if (STAFF_ROLES.includes(normalized)) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
  return getRoleBadgeClasses(role);
};

export { resolveAvatarUrl } from './avatarUtils.js';

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default {
  getDisplayName,
  formatStaffIdentity,
  getRoleLabel,
  getStaffIdentityTitle,
  getRoleColor,
  getRoleBadgeClasses,
  isStaffRole,
  isActivePremiumCustomer,
  getRoleNameColor,
  getOfficialBadgeClass
};

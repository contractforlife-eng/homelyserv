// frontend/src/utils/userDisplay.js
// ============================================================
// CENTRALIZED USER DISPLAY SYSTEM
// Single source of truth for user names, role labels, role
// colors, and role badges across the entire frontend.
//
// Database roles remain unchanged: ADMIN, SUPPORT, EMPLOYER, WORKER
// ============================================================

// ============================================================
// ROLE LABELS
// ============================================================
const ROLE_LABELS = {
  ADMIN: 'Co-Admin',
  SUPPORT: 'Sup-Admin',
  EMPLOYER: 'Employer',
  WORKER: 'Worker'
};

// ============================================================
// ROLE COLORS (Tailwind classes)
// ============================================================
const ROLE_COLORS = {
  ADMIN: 'purple',
  SUPPORT: 'green',
  EMPLOYER: 'blue',
  WORKER: 'orange'
};

// ============================================================
// ROLE BADGE CLASSES (full badge styling with dark mode)
// ============================================================
const ROLE_BADGE_CLASSES = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SUPPORT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  EMPLOYER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  WORKER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
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
  if (!user) return 'User';
  const name = user.fullName || user.name || 'User';
  const role = (user.role || '').toUpperCase();

  if (role === 'ADMIN') {
    return `${name} (Co-Admin)`;
  }
  if (role === 'SUPPORT') {
    return `${name} (Sup-Admin)`;
  }
  return name;
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
  return ROLE_LABELS[normalized] || normalized || 'User';
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

export default {
  getDisplayName,
  getRoleLabel,
  getRoleColor,
  getRoleBadgeClasses
};
// Display policy only. This module grants no permissions and never matches
// names or account IDs: existing and future staff use their current role.
export const STAFF_IDENTITY_TITLES = Object.freeze({
  ADMIN: 'Co-Admin',
  SUPPORT: 'Sup-Admin',
  SUP_ADMIN: 'Sup-Admin',
  SUPPORT_HELPER: 'Sup-Help',
});
export const STAFF_ROLES = Object.freeze(Object.keys(STAFF_IDENTITY_TITLES));
export const STAFF_NAME_CLASS = 'font-semibold tracking-normal leading-tight text-red-600 dark:text-red-400';
export const isStaffRole = role => Object.hasOwn(STAFF_IDENTITY_TITLES, String(role || '').trim().toUpperCase());
export const getStaffIdentityTitle = role => STAFF_IDENTITY_TITLES[String(role || '').trim().toUpperCase()] || '';

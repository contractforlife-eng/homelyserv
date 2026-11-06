import { isStaffRole } from './staffIdentityPolicy.js';
export const WALL_IDENTITIES = Object.freeze({
  WORKER: { color: '#dc2626', tint: '#fef2f2' },
  EMPLOYER: { color: '#0d9488', tint: '#f0fdfa' },
  DOCTOR: { color: '#dc2626', tint: '#fef2f2' },
  TEACHER: { color: '#dc2626', tint: '#fef2f2' },
  STUDENT: { color: '#dc2626', tint: '#fef2f2' },
  ADMIN: { color: '#d97706', tint: '#fffbeb' },
  SUPPORT: { color: '#16a34a', tint: '#f0fdf4' },
  SUPPORT_HELPER: { color: '#dc2626', tint: '#fef2f2' },
});
export const wallIdentity = role => WALL_IDENTITIES[role] || { color: '#475569', tint: '#f8fafc' };
export const wallIdentityStyle = role => ({ '--wall-accent': wallIdentity(role).color, '--wall-tint': wallIdentity(role).tint });

export const wallAuthorIdentityStyle = role => isStaffRole(role) ? { '--wall-accent': '#dc2626', '--wall-tint': '#fef2f2' } : wallIdentityStyle(role);

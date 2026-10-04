// backend/src/services/hireAuthorization.js
// ============================================================
// HIRE AUTHORIZATION RULES (single source of truth)
// ============================================================
// The hire/offer endpoint is the EXISTING Employer hiring lifecycle and is
// now also open to TEACHER and DOCTOR. These pure rules are shared by the
// route guard and hireController.sendOffer, and are unit-tested.
//
// Rules:
//   - Only EMPLOYER, TEACHER and DOCTOR may open a hire offer at all.
//   - EMPLOYER behaviour is unchanged: any employable service provider
//     (WORKER / DOCTOR / TEACHER) may be the target.
//   - TEACHER and DOCTOR may ONLY ever hire a WORKER account. They can never
//     target an Employer, Teacher, Doctor, Student, Admin, Support or
//     Support Helper account.
// ============================================================

const normalizeRole = (role) => String(role || '').toUpperCase();

export const HIRING_CALLER_ROLES = Object.freeze(['EMPLOYER', 'TEACHER', 'DOCTOR']);

// Unchanged Employer target rule.
export const EMPLOYABLE_PROVIDER_ROLES = Object.freeze(['WORKER', 'DOCTOR', 'TEACHER']);

// Portal callers restricted to hiring WORKER accounts only.
export const PROVIDER_HIRER_ROLES = Object.freeze(['TEACHER', 'DOCTOR']);

export const WORKER_ONLY_TARGET_ROLES = Object.freeze(['WORKER']);

/** Roles allowed to open a hire offer. */
export const canSendHireOffer = (callerRole) => HIRING_CALLER_ROLES.includes(normalizeRole(callerRole));

/** True when the caller is a Teacher/Doctor (Worker-only targets). */
export const isProviderHirerRole = (callerRole) => PROVIDER_HIRER_ROLES.includes(normalizeRole(callerRole));

/** Roles the given caller is allowed to hire. */
export const resolveAllowedOfferTargetRoles = (callerRole) =>
  (isProviderHirerRole(callerRole) ? [...WORKER_ONLY_TARGET_ROLES] : [...EMPLOYABLE_PROVIDER_ROLES]);

/** True when `callerRole` may hire a target account of `targetRole`. */
export const canHireTargetRole = (callerRole, targetRole) =>
  canSendHireOffer(callerRole) && resolveAllowedOfferTargetRoles(callerRole).includes(normalizeRole(targetRole));

export default {
  HIRING_CALLER_ROLES,
  EMPLOYABLE_PROVIDER_ROLES,
  PROVIDER_HIRER_ROLES,
  WORKER_ONLY_TARGET_ROLES,
  canSendHireOffer,
  isProviderHirerRole,
  resolveAllowedOfferTargetRoles,
  canHireTargetRole,
};
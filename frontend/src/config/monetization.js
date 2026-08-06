// src/config/monetization.js
// ============================================================
// SINGLE SOURCE OF TRUTH (frontend) — Recruitment commission = 15%.
// Mirrors backend/src/config/monetization.js. All commission
// calculations MUST use RECRUITMENT_COMMISSION_RATE below.
// Do NOT hardcode commission percentages anywhere else.
// ============================================================
export const CURRENCY = 'EGP';
export const QUICK_HIRE_PREMIUM_FEE = 500; // Fixed fee for quick hire
export const RECRUITMENT_COMMISSION_RATE = 0.15; // 15% commission — single source of truth
export const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee

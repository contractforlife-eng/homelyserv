// backend/src/config/monetization.js
// ============================================================
// SINGLE SOURCE OF TRUTH — Recruitment commission rate.
// Official business rule: recruitment commission = 15%.
// Every backend commission calculation MUST import this constant.
// The frontend mirrors this exact value in
// frontend/src/config/monetization.js (RECRUITMENT_COMMISSION_RATE).
// Do NOT define the commission rate anywhere else.
// ============================================================

export const RECRUITMENT_COMMISSION_RATE = 0.15; // 15%

export default RECRUITMENT_COMMISSION_RATE;

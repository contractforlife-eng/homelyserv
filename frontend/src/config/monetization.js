export const CURRENCY = 'EGP';

// These values are the single source of truth for the initial HomelyServ
// monetization model. Payment confirmation must still be verified server-side.
export const QUICK_HIRE_PREMIUM_FEE = 199;
export const RECRUITMENT_COMMISSION_RATE = 0.10;
export const MONTHLY_RECRUITMENT_FEE = 500;
export const PERMANENT_RECRUITMENT_FEE_RANGE = { min: 1000, max: 3000 };
export const WORKER_VERIFICATION_FEE = 99;
export const ESCROW_COMMISSION_RATE_RANGE = { min: 0.05, max: 0.10 };

export const EMPLOYER_SUBSCRIPTIONS = {
  basic: { price: 299, searches: 5, recruitments: 2 },
  pro: { price: 599, searches: 'unlimited', recruitments: 10 },
  business: { price: 999, searches: 'unlimited', recruitments: 'unlimited', prioritySupport: true }
};

export const WORKER_PREMIUM_SUBSCRIPTION = {
  price: 99,
  interval: 'monthly',
  benefits: ['higher_search_visibility', 'verified_badge', 'featured_job_applications']
};

export const getRecruitmentCommission = (agreedSalary) =>
  Math.round((Number(agreedSalary) || 0) * RECRUITMENT_COMMISSION_RATE);

// src/config/paymentConfig.js
// Public frontend payment configuration (Sandbox + Live)

// Explicit allowlist prevents Vite from bundling unrelated VITE_* variables.
const frontendEnv = {
  VITE_PAYPAL_LIVE_CLIENT_ID: import.meta.env.VITE_PAYPAL_LIVE_CLIENT_ID,
  VITE_PAYPAL_SANDBOX_CLIENT_ID: import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID,
  VITE_PAYPAL_LIVE_BASE_URL: import.meta.env.VITE_PAYPAL_LIVE_BASE_URL,
  VITE_PAYPAL_SANDBOX_BASE_URL: import.meta.env.VITE_PAYPAL_SANDBOX_BASE_URL,
  VITE_PAYPAL_APP_NAME: import.meta.env.VITE_PAYPAL_APP_NAME,
};

// Helper function to safely get environment variables
// For security, sensitive credentials should not have hardcoded fallbacks
const getEnv = (key, fallback = '', isSensitive = false) => {
  const value = frontendEnv[key];
  if (isSensitive && !value) {
    console.warn(`⚠️ Missing sensitive environment variable: ${key}`);
  }
  return value || fallback;
};

// Determine if we're in production mode
const isProduction = import.meta.env?.MODE === 'production' || import.meta.env?.PROD === true;

export const PAYMENT_CONFIG = {
  // ============================================================
  // PAYPAL CONFIGURATION - COMPLETE (Sandbox + Live)
  // ============================================================
  paypal: {
    // Automatically switch between Sandbox and Live based on environment
    clientId: isProduction
      ? getEnv('VITE_PAYPAL_LIVE_CLIENT_ID', '', true)
      : getEnv('VITE_PAYPAL_SANDBOX_CLIENT_ID', '', true),

    // PayPal API Base URL
    baseUrl: isProduction
      ? getEnv('VITE_PAYPAL_LIVE_BASE_URL', 'https://api-m.paypal.com')
      : getEnv('VITE_PAYPAL_SANDBOX_BASE_URL', 'https://api-m.sandbox.paypal.com'),
    
    // Currency
    currency: 'USD',
    
    // App Name
    appName: getEnv('VITE_PAYPAL_APP_NAME', 'HomelyServ'),
    
    // PayPal No-Code Payment Links
    links: {
      // Hiring Fee - One-time payment for hiring a worker
      hiring: getEnv('PAYPAL_HIRING_LINK', 'https://www.paypal.com/ncp/payment/8CQZU4S3QWU52'),
      
      // Employer Premium Membership - Monthly subscription
      premiumEmployer: getEnv('PAYPAL_PREMIUM_EMPLOYER_LINK', 'https://www.paypal.com/ncp/payment/SPLLWW7MJRGBN'),
      
      // Worker Premium Membership - Monthly subscription
      premiumWorker: getEnv('PAYPAL_PREMIUM_WORKER_LINK', 'https://www.paypal.com/ncp/payment/P7CX5UKC332YJ')
    },
    
  },
  
  // ============================================================
  // CURRENCY SETTINGS
  // ============================================================
  currency: {
    code: 'EGP',
    symbol: 'EGP',
    locale: 'en-EG',
    paypalCode: 'USD'
  },
  
  // ============================================================
  // FEES & COMMISSIONS
  // ============================================================
  fees: {
    // NOTE: The recruitment commission rate is NOT defined here.
    // Single source of truth: RECRUITMENT_COMMISSION_RATE in ./monetization.js

    // Quick hire premium fee
    quickHirePremiumFee: 299,
    
    // Display-only subscription prices; backend/src/config/subscription.js is authoritative.
    premium: {
      weekly: { employer: 100, worker: 75 },
      monthly: { employer: 300, worker: 200 }
    },
    
    // Withdrawal fees
    withdrawal: {
      minAmount: 100,
      maxAmount: 50000,
      feePercentage: 0.02 // 2% withdrawal fee
    }
  }
};

// ============================================================
// PAYMENT METHODS
// ============================================================
export const PAYMENT_METHODS = {
  PAYMOB: 'paymob',
  PAYPAL: 'paypal',
  VODAFONE_CASH: 'vodafone_cash',
  INSTAPAY: 'instapay',
  WALLET: 'wallet'  // For future use
};

export const PAYMOB_ENABLED = false;

// ============================================================
// PAYMENT STATUS
// ============================================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  VERIFYING: 'verifying',
  HELD: 'held',
  RELEASED: 'released',
  PROCESSING: 'processing'
};

// ============================================================
// TRANSACTION TYPES
// ============================================================
export const TRANSACTION_TYPES = {
  SUBSCRIPTION: 'subscription',
  COMMISSION: 'commission',
  HIRE: 'hire',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
  WALLET_TOPUP: 'wallet_topup',
  WALLET_PAYOUT: 'wallet_payout',
  PREMIUM: 'premium'
};

// ============================================================
// PAYMENT METHOD DETAILS
// ============================================================
export const PAYMENT_METHOD_DETAILS = {
  [PAYMENT_METHODS.PAYMOB]: {
    name: 'Paymob',
    icon: 'CreditCard',
    description: 'Pay with credit card, debit card, or mobile wallet',
    colors: 'from-blue-500 to-blue-600',
    integrations: {
      card: {
        id: '2662716',
        name: 'TAP ON PHONE',
        description: 'Pay with credit or debit card'
      },
      wallet: {
        id: '2662714',
        name: 'WALLET',
        description: 'Pay with mobile wallet (Vodafone Cash, Orange Money, etc.)'
      },
      link: {
        id: '2662715',
        name: 'PAYMENT LINK',
        description: 'Pay with payment link'
      },
      cash: {
        id: '3584707',
        name: 'Cash Collection',
        description: 'Pay with cash (collect from location)'
      }
    }
  },
  [PAYMENT_METHODS.PAYPAL]: {
    name: 'PayPal',
    icon: 'Wallet',
    description: 'Pay securely with your PayPal account',
    colors: 'from-blue-700 to-blue-800'
  },
  [PAYMENT_METHODS.WALLET]: {
    name: 'Wallet',
    icon: 'Wallet',
    description: 'Pay using your HomelyServ wallet balance',
    colors: 'from-green-500 to-green-600'
  }
};

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================
export const SUBSCRIPTION_PLANS = {
  weekly: {
    id: 'weekly',
    durationDays: 7,
    currency: 'EGP',
    prices: { EMPLOYER: 100, WORKER: 75 }
  },
  monthly: {
    id: 'monthly',
    durationDays: 30,
    currency: 'EGP',
    prices: { EMPLOYER: 300, WORKER: 200 }
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if PayPal is in sandbox mode
 * @returns {boolean} - True if sandbox mode
 */
export const isPayPalSandbox = () => {
  const baseUrl = PAYMENT_CONFIG.paypal.baseUrl;
  return baseUrl.includes('sandbox');
};

/**
 * Get PayPal mode name
 * @returns {string} - 'Sandbox' or 'Production'
 */
export const getPayPalMode = () => {
  return isPayPalSandbox() ? 'Sandbox' : 'Production';
};

/**
 * Get PayPal payment link by type
 * @param {string} type - 'hiring', 'premiumEmployer', or 'premiumWorker'
 * @returns {string} - PayPal payment link
 */
export const getPayPalLink = (type = 'hiring') => {
  const links = PAYMENT_CONFIG.paypal.links;
  return links[type] || links.hiring;
};

/**
 * Get PayPal client ID based on current mode
 * @returns {string} - Client ID
 */
export const getPayPalClientId = () => {
  return PAYMENT_CONFIG.paypal.clientId;
};

/**
 * Get PayPal base URL based on current mode
 * @returns {string} - Base URL
 */
export const getPayPalBaseUrl = () => {
  return PAYMENT_CONFIG.paypal.baseUrl;
};

// ============================================================
// EXPORT DEFAULTS
// ============================================================
export default PAYMENT_CONFIG;

// src/config/paymentConfig.js
// Complete Payment Configuration with ALL credentials (Sandbox + Live)

// Helper function to safely get environment variables
// For security, sensitive credentials should not have hardcoded fallbacks
const getEnv = (key, fallback = '', isSensitive = false) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (isSensitive && !value) {
      console.warn(`⚠️ Missing sensitive environment variable: ${key}`);
    }
    return value || fallback;
  }
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (isSensitive && !value) {
      console.warn(`⚠️ Missing sensitive environment variable: ${key}`);
    }
    return value || fallback;
  }
  if (isSensitive) {
    console.warn(`⚠️ Missing sensitive environment variable: ${key}`);
  }
  return fallback;
};

// Determine if we're in production mode
const isProduction = import.meta.env?.MODE === 'production' || import.meta.env?.PROD === true;

export const PAYMENT_CONFIG = {
  // ============================================================
  // PAYMOB CONFIGURATION - COMPLETE
  // ============================================================
  paymob: {
    // Your Paymob API Key
    apiKey: getEnv('VITE_PAYMOB_API_KEY', '', true),
    
    // HMAC Secret for webhook verification
    hmacSecret: getEnv('VITE_PAYMOB_HMAC_SECRET', '', true),
    
    // Main Integration ID (TAP ON PHONE - Online Card)
    integrationId: getEnv('VITE_PAYMOB_INTEGRATION_ID', '', true),
    
    // IFRAME ID for payment page
    iframeId: getEnv('VITE_PAYMOB_IFRAME_ID', '', true),
    
    // Paymob API Base URL
    baseUrl: getEnv('VITE_PAYMOB_BASE_URL', 'https://accept.paymob.com/api'),
    
    // Currency
    currency: 'EGP',
    
    // All Live Integrations
    integrations: {
      cashCollection: {
        id: '3584707',
        name: 'Cash Collection_DEPOSIT',
        type: 'cash_collection',
        status: 'live'
      },
      tapOnPhone: {
        id: '2662716',
        name: 'TAP ON PHONE',
        type: 'online_card',
        status: 'live'
      },
      paymentLink: {
        id: '2662715',
        name: 'PAYMENT LINK',
        type: 'online_card',
        status: 'live'
      },
      wallet: {
        id: '2662714',
        name: 'WALLET',
        type: 'mobile_wallet',
        status: 'live'
      }
    },
    
    // Default integrations for different payment types
    defaults: {
      card: '2662716',      // TAP ON PHONE
      wallet: '2662714',    // WALLET
      link: '2662715',      // PAYMENT LINK
      cash: '3584707'       // Cash Collection
    },
    
    // Webhook URLs
    webhooks: {
      postPay: getEnv('VITE_PAYMOB_POST_PAY_URL', 'https://accept.paymobsolutions.com/api/acceptance/post_pay'),
      response: getEnv('VITE_PAYMOB_RESPONSE_URL', 'https://accept.paymobsolutions.com/api/acceptance/post_pay')
    },
    
    // Iframe URL template
    iframeUrl: 'https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token={payment_token}'
  },
  
  // ============================================================
  // PAYPAL CONFIGURATION - COMPLETE (Sandbox + Live)
  // ============================================================
  paypal: {
    // Automatically switch between Sandbox and Live based on environment
    clientId: isProduction
      ? getEnv('VITE_PAYPAL_LIVE_CLIENT_ID', '', true)
      : getEnv('VITE_PAYPAL_SANDBOX_CLIENT_ID', '', true),

    clientSecret: isProduction
      ? getEnv('VITE_PAYPAL_LIVE_SECRET', '', true)
      : getEnv('VITE_PAYPAL_SANDBOX_SECRET', '', true),
    
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
    
    // Webhook Configuration
    webhooks: {
      // Webhook URL for payment notifications
      url: getEnv('VITE_PAYPAL_WEBHOOK_URL', '/api/webhooks/paypal'),
      
      // Webhook ID for verification
      id: getEnv('VITE_PAYPAL_WEBHOOK_ID', '')
    }
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
    // Recruitment commission rate (15%)
    recruitmentCommission: 0.15,
    
    // Quick hire premium fee
    quickHirePremiumFee: 299,
    
    // Premium subscription prices
    premium: {
      employer: 200, // EGP per month
      worker: 100    // EGP per month
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
  WALLET: 'wallet'  // For future use
};

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
  EMPLOYER: {
    id: 'employer_premium',
    name: 'Employer Premium',
    price: 200,
    currency: 'EGP',
    interval: 'monthly',
    features: [
      'Verified badge on profile',
      'Priority in search results',
      'Access to premium workers',
      'Priority support',
      'Advanced analytics',
      'Unlimited job postings'
    ]
  },
  WORKER: {
    id: 'worker_premium',
    name: 'Worker Premium',
    price: 100,
    currency: 'EGP',
    interval: 'monthly',
    features: [
      'Verified badge on profile',
      'Priority in search results',
      'Access to premium offers',
      'Priority support',
      'Advanced analytics',
      'Higher visibility'
    ]
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the appropriate Paymob integration ID based on payment type
 * @param {string} paymentType - 'card', 'wallet', 'link', or 'cash'
 * @returns {string} - Integration ID
 */
export const getPaymobIntegrationId = (paymentType = 'card') => {
  const defaults = PAYMENT_CONFIG.paymob.defaults;
  return defaults[paymentType] || defaults.card;
};

/**
 * Get Paymob integration details by ID
 * @param {string} integrationId - Integration ID
 * @returns {object|null} - Integration details
 */
export const getPaymobIntegration = (integrationId) => {
  const integrations = PAYMENT_CONFIG.paymob.integrations;
  for (const key in integrations) {
    if (integrations[key].id === integrationId) {
      return integrations[key];
    }
  }
  return null;
};

/**
 * Get Paymob iframe URL with payment token
 * @param {string} paymentToken - Payment token from Paymob
 * @returns {string} - Full iframe URL
 */
export const getPaymobIframeUrl = (paymentToken) => {
  const { iframeId } = PAYMENT_CONFIG.paymob;
  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
};

/**
 * Get all available Paymob integrations
 * @returns {object} - All integrations
 */
export const getPaymobIntegrations = () => {
  return PAYMENT_CONFIG.paymob.integrations;
};

/**
 * Get Paymob webhook URLs
 * @returns {object} - Webhook URLs
 */
export const getPaymobWebhooks = () => {
  return PAYMENT_CONFIG.paymob.webhooks;
};

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
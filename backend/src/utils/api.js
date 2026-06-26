const axios = require('axios');

// Backend API utility for making external API calls
// This is used for payment gateways, external services, etc.

// Create a reusable API client
const createApiClient = (baseURL, headers = {}) => {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
};

// Paymob API client (for payment processing)
const paymobApi = createApiClient(
  process.env.PAYMOB_API_HOST || 'https://accept.paymob.com/api',
  {
    'Accept': 'application/json'
  }
);

// Google OAuth API client
const googleApi = createApiClient('https://oauth2.googleapis.com');

// Generic API client for external services
const externalApi = createApiClient('');

module.exports = {
  createApiClient,
  paymobApi,
  googleApi,
  externalApi
};
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

// Google OAuth API client
const googleApi = createApiClient('https://oauth2.googleapis.com');

// Generic API client for external services
const externalApi = createApiClient('');

module.exports = {
  createApiClient,
  googleApi,
  externalApi
};
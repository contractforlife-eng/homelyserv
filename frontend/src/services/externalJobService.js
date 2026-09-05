// frontend/src/services/externalJobService.js
// ============================================================
// EXPERIMENTAL EXTERNAL JOBS SERVICE — Phase 1
// Client API for fetching external jobs from HomelyServ backend proxy.
// Never calls Adzuna directly from the browser.
// ============================================================
import api from '../utils/api';

/**
 * Fetch external opportunities from HomelyServ backend proxy
 *
 * @param {Object} params
 * @param {string} [params.what] - Keywords/role/category
 * @param {string} [params.where] - Location query
 * @param {string} [params.country] - 2-letter ISO country code (optional, defaults to user registration country)
 * @param {number} [params.page=1] - Page number
 * @returns {Promise<Object>}
 */
export const getExternalJobs = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = `/api/external-jobs${queryString ? `?${queryString}` : ''}`;
  const response = await api.get(url);
  return response.data;
};

const externalJobService = {
  getExternalJobs
};

export default externalJobService;

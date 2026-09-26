// src/services/healthcareService.js
// Client service for public Healthcare Directory endpoints.
import api from '../utils/api';

/**
 * Fetch paginated healthcare providers with search and filtering.
 * Publicly accessible without authentication.
 */
export const getHealthcareProviders = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All' && value !== 'All Types' && value !== 'All Specialties') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  const url = `/api/healthcare/providers${queryString ? `?${queryString}` : ''}`;
  const response = await api.get(url);
  return response.data;
};

/**
 * Fetch distinct list of available countries.
 */
export const getHealthcareCountries = async () => {
  const response = await api.get('/api/healthcare/countries');
  return response.data?.countries || [];
};

/**
 * Fetch distinct list of available regions/governorates, optionally scoped by country.
 */
export const getHealthcareRegions = async (country) => {
  const query = country && country !== 'All' ? `?country=${encodeURIComponent(country)}` : '';
  const response = await api.get(`/api/healthcare/regions${query}`);
  return response.data?.regions || [];
};

/**
 * Fetch distinct list of available cities, optionally scoped by country and region.
 */
export const getHealthcareCities = async (country, region) => {
  const params = new URLSearchParams();
  if (country && country !== 'All') params.set('country', country);
  if (region && region !== 'All') params.set('region', region);
  const query = params.toString();
  const response = await api.get(`/api/healthcare/cities${query ? `?${query}` : ''}`);
  return response.data?.cities || [];
};

/**
 * Fetch distinct list of medical specialties.
 */
export const getHealthcareSpecialties = async (providerType) => {
  const query = providerType && providerType !== 'All Types' ? `?providerType=${encodeURIComponent(providerType)}` : '';
  const response = await api.get(`/api/healthcare/specialties${query}`);
  return response.data?.specialties || [];
};

/**
 * Request translation of a healthcare provider name via HomelyServ backend.
 * Dedicated backend bridge to local LibreTranslate service.
 */
export const translateHealthcareProviderName = async (text, targetLanguage, sourceLanguage = 'en') => {
  try {
    const response = await api.post('/api/healthcare/translate-provider-name', {
      text,
      targetLanguage,
      sourceLanguage
    });
    if (response.data && response.data.success && response.data.translation) {
      return response.data.translation;
    }
    return null;
  } catch (err) {
    // Graceful fallback: return null on any network or translation service error
    return null;
  }
};


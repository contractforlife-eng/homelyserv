import api from '../utils/api';

export const getOffers = async () => {
  const response = await api.get('/api/hires/offers');
  return response.data;
};

export const getMyHires = async () => {
  const response = await api.get('/api/hires/my-hires');
  return response.data;
};

export const getOffersForUser = async (userId) => {
  const response = await api.get(`/api/hires/offers?userId=${userId}`);
  return response.data;
};

export const respondToOffer = async (offerId, status) => {
  const response = await api.put(`/api/hires/offer/${offerId}/respond`, { status });
  return response.data;
};

export const updateOfferStatus = async (offerId, status) => {
  const response = await api.put(`/api/hires/offer/${offerId}/status`, { status });
  return response.data;
};

export const createHire = async (hireData) => {
  const response = await api.post('/api/hires', hireData);
  return response.data;
};

export const updateHireStatus = async (hireId, status) => {
  const response = await api.put(`/api/hires/${hireId}/status`, { status });
  return response.data;
};

export const getHireById = async (hireId) => {
  const response = await api.get(`/api/hires/${hireId}`);
  return response.data;
};

export const cancelHire = async (hireId) => {
  const response = await api.put(`/api/hires/${hireId}/cancel`);
  return response.data;
};

export const getHireStats = async () => {
  const response = await api.get('/api/hires/stats');
  return response.data;
};

export const completeWork = async (offerId) => {
  const response = await api.put(`/api/hires/offer/${offerId}/status`, { status: 'completed' });
  return response.data;
};

export const acceptOffer = async (offerId) => {
  return respondToOffer(offerId, 'accepted');
};

export const rejectOffer = async (offerId) => {
  return respondToOffer(offerId, 'rejected');
};

const hireService = {
  getOffers,
  getMyHires,
  getOffersForUser,
  respondToOffer,
  updateOfferStatus,
  createHire,
  updateHireStatus,
  getHireById,
  cancelHire,
  getHireStats,
  completeWork,
  acceptOffer,
  rejectOffer
};

export default hireService;

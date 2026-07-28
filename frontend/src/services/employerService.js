import api from '../utils/api';

export const searchWorkers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/api/employers/search?${params}`);
  return response.data;
};

export const getWorkerProfile = async (workerId) => {
  const response = await api.get(`/api/workers/profile/${workerId}`);
  return response.data;
};

export const updateEmployerProfile = async (profileData) => {
  const response = await api.put(`/api/employers/profile/${profileData.userId || profileData.id}`, profileData);
  return response.data;
};

export const saveWorker = async (workerId) => {
  const response = await api.post('/api/employers/save-worker', { workerId });
  return response.data;
};

export const getSavedWorkers = async () => {
  const response = await api.get('/api/employers/saved-workers');
  return response.data;
};

export const sendHireRequest = async (hireData) => {
  const response = await api.post('/api/hires', hireData);
  return response.data;
};

export const getWorkerReviews = async (workerId) => {
  const response = await api.get(`/api/workers/${workerId}/reviews`);
  return response.data;
};

export const reportWorker = async (workerId, reason) => {
  const response = await api.post('/api/employers/report-worker', { workerId, reason });
  return response.data;
};

const employerService = {
  searchWorkers,
  getWorkerProfile,
  updateEmployerProfile,
  saveWorker,
  getSavedWorkers,
  sendHireRequest,
  getWorkerReviews,
  reportWorker
};

export default employerService;

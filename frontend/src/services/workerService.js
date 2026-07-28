import api from '../utils/api';

export const getWorkerProfile = async (userId) => {
  const response = await api.put(`/api/workers/profile/${userId}`);
  return response.data;
};

export const updateWorkerProfile = async (userId, profileData) => {
  const response = await api.put(`/api/workers/profile/${userId}`, profileData);
  return response.data;
};

export const getWorkers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/api/workers?${params}`);
  return response.data;
};

export const getWorkerById = async (workerId) => {
  const response = await api.get(`/api/workers/${workerId}`);
  return response.data;
};

export const updateWorkerAvailability = async (workerId, available) => {
  const response = await api.put(`/api/workers/${workerId}/availability`, { available });
  return response.data;
};

export const getWorkerApplications = async (workerId) => {
  const response = await api.get(`/api/workers/${workerId}/applications`);
  return response.data;
};

export const getWorkerEarnings = async (workerId) => {
  const response = await api.get(`/api/workers/${workerId}/earnings`);
  return response.data;
};

export const submitWorkerReview = async (employerId, reviewData) => {
  const response = await api.post(`/api/workers/${employerId}/review`, reviewData);
  return response.data;
};

const workerService = {
  getWorkerProfile,
  updateWorkerProfile,
  getWorkers,
  getWorkerById,
  updateWorkerAvailability,
  getWorkerApplications,
  getWorkerEarnings,
  submitWorkerReview
};

export default workerService;

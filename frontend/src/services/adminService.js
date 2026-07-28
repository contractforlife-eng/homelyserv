import api from '../utils/api';

export const getUsers = async () => {
  const response = await api.get('/api/admin/users');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/api/admin/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/api/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/admin/users/${userId}`);
  return response.data;
};

export const resetUserPassword = async (userId) => {
  const response = await api.post(`/api/admin/users/${userId}/reset-password`);
  return response.data;
};

export const verifyUser = async (userId) => {
  const response = await api.put(`/api/admin/users/${userId}/verify`);
  return response.data;
};

export const suspendUser = async (userId, reason) => {
  const response = await api.put(`/api/admin/users/${userId}/suspend`, { reason });
  return response.data;
};

export const getAdminStats = async () => {
  const response = await api.get('/api/admin/stats');
  return response.data;
};

export const getAdminSettings = async () => {
  const response = await api.get('/api/admin/settings');
  return response.data;
};

export const updateAdminSettings = async (settings) => {
  const response = await api.put('/api/admin/settings', { settings });
  return response.data;
};

export const getAllHires = async () => {
  const response = await api.get('/api/admin/hires');
  return response.data;
};

export const getAllPayments = async () => {
  const response = await api.get('/api/admin/payments');
  return response.data;
};

export const getAllComplaints = async () => {
  const response = await api.get('/api/admin/complaints');
  return response.data;
};

export const updateComplaintStatus = async (complaintId, status) => {
  const response = await api.put(`/api/admin/complaints/${complaintId}/status`, { status });
  return response.data;
};

const adminService = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
  verifyUser,
  suspendUser,
  getAdminStats,
  getAdminSettings,
  updateAdminSettings,
  getAllHires,
  getAllPayments,
  getAllComplaints,
  updateComplaintStatus
};

export default adminService;

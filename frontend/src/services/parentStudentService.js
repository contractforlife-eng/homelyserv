// frontend/src/services/parentStudentService.js
// ============================================================
// PARENT-STUDENT FRONTEND SERVICE (PHASE 10)
// ============================================================
import api from '../utils/api';

export const getParentChildren = async () => {
  const response = await api.get('/api/parent-students');
  return response.data;
};

export const requestChildLink = async ({ studentEmail, studentUserId, relationshipType, personalNote }) => {
  const response = await api.post('/api/parent-students/request', {
    studentEmail,
    studentUserId,
    relationshipType,
    personalNote
  });
  return response.data;
};

export const cancelParentRequest = async (relationshipId) => {
  const response = await api.post(`/api/parent-students/${relationshipId}/cancel`);
  return response.data;
};

export const endParentStudentRelationship = async (relationshipId) => {
  const response = await api.post(`/api/parent-students/${relationshipId}/end`);
  return response.data;
};

export const getChildOverview = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/overview`);
  return response.data;
};

export const getChildTeachers = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/teachers`);
  return response.data;
};

export const getChildLessons = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/lessons`);
  return response.data;
};

export const getChildProgress = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/progress`);
  return response.data;
};

export const getChildHomework = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/homework`);
  return response.data;
};

export const getChildBookings = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/bookings`);
  return response.data;
};

export const createChildBooking = async (studentId, bookingData) => {
  const response = await api.post(`/api/parent-students/${studentId}/bookings`, bookingData);
  return response.data;
};

export const getStudentParentRequests = async () => {
  const response = await api.get('/api/parent-students/requests');
  return response.data;
};

export const acceptParentRequest = async (relationshipId) => {
  const response = await api.post(`/api/parent-students/${relationshipId}/accept`);
  return response.data;
};

export const rejectParentRequest = async (relationshipId) => {
  const response = await api.post(`/api/parent-students/${relationshipId}/reject`);
  return response.data;
};

export const discoverChildTeachers = async (studentId, params = {}) => {
  const response = await api.get(`/api/parent-students/${studentId}/teachers/discover`, { params });
  return response.data;
};

export const requestChildTeacher = async (studentId, teacherId, message) => {
  const response = await api.post(`/api/parent-students/${studentId}/teachers/${teacherId}/request`, { message });
  return response.data;
};

export const getFamilyTrackingStatus = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/tracking/status`);
  return response.data;
};

export const getFamilyTrackingCurrent = async (studentId) => {
  const response = await api.get(`/api/parent-students/${studentId}/tracking/current`);
  return response.data;
};

export const getFamilyTrackingHistory = async (studentId, date) => {
  const suffix = date ? `history/${date}` : 'history/today';
  const response = await api.get(`/api/parent-students/${studentId}/tracking/${suffix}`);
  return response.data;
};

export const requestFamilyTrackingActivation = async (studentId, activation) => {
  const response = await api.post(`/api/parent-students/${studentId}/tracking/activation/request`, activation);
  return response.data;
};

export const reportFamilyTrackingPermission = async (studentId, permission) => {
  const response = await api.put(`/api/parent-students/${studentId}/tracking/status`, permission);
  return response.data;
};

export const pauseFamilyTracking = async (studentId) => {
  const response = await api.post(`/api/parent-students/${studentId}/tracking/pause`);
  return response.data;
};

export const approveFamilyTrackingSafeguard = async (studentId) => {
  const response = await api.post(`/api/parent-students/${studentId}/tracking/activation/guardian-approve`);
  return response.data;
};

export const disableFamilyTracking = async (studentId) => {
  const response = await api.post(`/api/parent-students/${studentId}/tracking/disable`);
  return response.data;
};

export default {
  getParentChildren,
  requestChildLink,
  cancelParentRequest,
  endParentStudentRelationship,
  getChildOverview,
  getChildTeachers,
  getChildLessons,
  getChildProgress,
  getChildHomework,
  getChildBookings,
  createChildBooking,
  getStudentParentRequests,
  acceptParentRequest,
  rejectParentRequest,
  discoverChildTeachers,
  requestChildTeacher,
  getFamilyTrackingStatus,
  getFamilyTrackingCurrent,
  getFamilyTrackingHistory,
  requestFamilyTrackingActivation,
  reportFamilyTrackingPermission,
  pauseFamilyTracking
};

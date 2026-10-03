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
  createChildBooking
};

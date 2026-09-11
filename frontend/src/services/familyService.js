// frontend/src/services/familyService.js
import api from '../utils/api';

export const getFamilyMembers = async (includeArchived = false) => {
  const response = await api.get(`/api/employer/family-members${includeArchived ? '?includeArchived=true' : ''}`);
  return response.data;
};

export const getFamilyMember = async (id) => {
  const response = await api.get(`/api/employer/family-members/${id}`);
  return response.data;
};

export const createFamilyMember = async (memberData) => {
  const response = await api.post('/api/employer/family-members', memberData);
  return response.data;
};

export const updateFamilyMember = async (id, memberData) => {
  const response = await api.put(`/api/employer/family-members/${id}`, memberData);
  return response.data;
};

export const archiveFamilyMember = async (id) => {
  const response = await api.delete(`/api/employer/family-members/${id}`);
  return response.data;
};

export const getFamilyRelationships = async () => {
  const response = await api.get('/api/employer/family-members/relationships/all');
  return response.data;
};

export const createFamilyRelationship = async (relationshipData) => {
  const response = await api.post('/api/employer/family-members/relationships', relationshipData);
  return response.data;
};

export const deleteFamilyRelationship = async (id) => {
  const response = await api.delete(`/api/employer/family-members/relationships/${id}`);
  return response.data;
};

export const removeMemberFromTree = async (memberId) => {
  const response = await api.delete(`/api/employer/family-members/relationships/member/${memberId}`);
  return response.data;
};

const familyService = {
  getFamilyMembers,
  getFamilyMember,
  createFamilyMember,
  updateFamilyMember,
  archiveFamilyMember,
  getFamilyRelationships,
  createFamilyRelationship,
  deleteFamilyRelationship,
  removeMemberFromTree
};

export default familyService;

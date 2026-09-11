// frontend/src/services/familyTreeService.js
// Dedicated service for Employer Family Tree (independent persons & genealogy relationships)
import api from '../utils/api';

export const getTreePeople = async () => {
  const response = await api.get('/api/employer/family-tree/people');
  return response.data;
};

export const createTreePerson = async (personData) => {
  const response = await api.post('/api/employer/family-tree/people', personData);
  return response.data;
};

export const updateTreePerson = async (id, personData) => {
  const response = await api.put(`/api/employer/family-tree/people/${id}`, personData);
  return response.data;
};

export const deleteTreePerson = async (id) => {
  const response = await api.delete(`/api/employer/family-tree/people/${id}`);
  return response.data;
};

export const getTreeRelationships = async () => {
  const response = await api.get('/api/employer/family-tree/relationships');
  return response.data;
};

export const createTreeRelationship = async (relationshipData) => {
  const response = await api.post('/api/employer/family-tree/relationships', relationshipData);
  return response.data;
};

export const deleteTreeRelationship = async (id) => {
  const response = await api.delete(`/api/employer/family-tree/relationships/${id}`);
  return response.data;
};

const familyTreeService = {
  getTreePeople,
  createTreePerson,
  updateTreePerson,
  deleteTreePerson,
  getTreeRelationships,
  createTreeRelationship,
  deleteTreeRelationship
};

export default familyTreeService;

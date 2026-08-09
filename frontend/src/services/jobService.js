import api from '../utils/api';

export const createJob = async (jobData) => {
  const response = await api.post('/api/jobs', jobData);
  return response.data;
};

export const getJobs = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });
  const query = params.toString();
  const response = await api.get(`/api/jobs${query ? `?${query}` : ''}`);
  return response.data;
};

export const getJobById = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
};

export const getMyJobs = async () => {
  const response = await api.get('/api/jobs/mine');
  return response.data;
};

export const updateJob = async (jobId, jobData) => {
  const response = await api.patch(`/api/jobs/${jobId}`, jobData);
  return response.data;
};

export const updateJobStatus = async (jobId, status) => {
  const response = await api.patch(`/api/jobs/${jobId}/status`, { status });
  return response.data;
};

const jobService = {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  updateJobStatus,
};

export default jobService;

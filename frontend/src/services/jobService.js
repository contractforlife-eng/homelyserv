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

// ============================================================
// JOB APPLICATIONS — Phase 2 Job Marketplace
// ============================================================

// Worker applies to a job
export const applyToJob = async (jobId, coverMessage) => {
  const response = await api.post(`/api/jobs/${jobId}/apply`, { coverMessage });
  return response.data;
};

// Worker's own applications
export const getMyApplications = async () => {
  const response = await api.get('/api/jobs/applications/mine');
  return response.data;
};

// Worker withdraws an application
export const withdrawApplication = async (applicationId) => {
  const response = await api.patch(`/api/jobs/applications/${applicationId}/withdraw`);
  return response.data;
};

// Employer lists applicants for a job
export const getJobApplications = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}/applications`);
  return response.data;
};

// Employer updates application status (shortlist/reject)
export const updateApplicationStatus = async (applicationId, status) => {
  const response = await api.patch(`/api/jobs/applications/${applicationId}/status`, { status });
  return response.data;
};

// Employer sends an offer from an application
export const sendOfferFromApplication = async (applicationId, agreedSalary) => {
  const response = await api.post(`/api/jobs/applications/${applicationId}/send-offer`, { agreedSalary });
  return response.data;
};

const jobService = {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  updateJobStatus,
  applyToJob,
  getMyApplications,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
  sendOfferFromApplication,
};

export default jobService;
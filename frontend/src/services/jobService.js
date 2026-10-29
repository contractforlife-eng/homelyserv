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

// Public endpoint for shared job links — works unauthenticated
export const getPublicJobById = async (jobId) => {
  const response = await api.get(`/api/jobs/public/${jobId}`);
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

export const repostJob = async (jobId) => {
  const response = await api.post(`/api/jobs/${jobId}/repost`);
  return response.data;
};

// ============================================================
// JOB APPLICATIONS — Phase 2 Job Marketplace
// ============================================================

// Worker applies to a job (optionally with CV)
export const applyToJob = async (jobId, coverMessage, cvFile = null) => {
  if (cvFile) {
    const formData = new FormData();
    if (coverMessage) formData.append('coverMessage', coverMessage);
    formData.append('cv', cvFile);
    const response = await api.post(`/api/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await api.post(`/api/jobs/${jobId}/apply`, { coverMessage });
  return response.data;
};

// Public visitor registers and applies (optionally with CV)
export const applyPublicToJob = async (jobId, applicationData) => {
  if (applicationData instanceof FormData) {
    const response = await api.post(`/api/jobs/${jobId}/apply-public`, applicationData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await api.post(`/api/jobs/${jobId}/apply-public`, applicationData);
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

// Employer updates application status (accepted / rejected / shortlisted)
export const updateApplicationStatus = async (applicationId, statusOrPayload) => {
  const payload = typeof statusOrPayload === 'string'
    ? { status: statusOrPayload }
    : statusOrPayload;
  const response = await api.patch(`/api/jobs/applications/${applicationId}/status`, payload);
  return response.data;
};

// Employer sends an offer from an application
export const sendOfferFromApplication = async (applicationId, agreedSalary) => {
  const response = await api.post(`/api/jobs/applications/${applicationId}/send-offer`, { agreedSalary });
  return response.data;
};

// Download CV file for an application (authenticated)
export const downloadApplicationCv = async (applicationId) => {
  const response = await api.get(`/api/jobs/applications/${applicationId}/cv`, {
    responseType: 'blob',
  });
  return response;
};

const jobService = {
  createJob,
  getJobs,
  getJobById,
  getPublicJobById,
  getMyJobs,
  updateJob,
  updateJobStatus,
  repostJob,
  applyToJob,
  applyPublicToJob,
  getMyApplications,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
  sendOfferFromApplication,
  downloadApplicationCv,
};

export default jobService;

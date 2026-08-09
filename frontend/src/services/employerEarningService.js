// frontend/src/services/employerEarningService.js
// Employer side of the Worker earnings ledger — Phase 2.
import api from '../utils/api';

// List earning periods for one owned hire.
export const getHireEarnings = async (hireId) => {
  const response = await api.get(`/api/employer/earnings/hires/${hireId}/earnings`);
  return response.data;
};

// Employer approves a worker-submitted work period.
export const approveWorkerEarning = async (hireId, earningId) => {
  const response = await api.post(
    `/api/employer/earnings/hires/${hireId}/earnings/${earningId}/approve`
  );
  return response.data;
};

// Employer disputes a worker-submitted work period.
export const disputeWorkerEarning = async (hireId, earningId, reason) => {
  const response = await api.post(
    `/api/employer/earnings/hires/${hireId}/earnings/${earningId}/dispute`,
    { reason }
  );
  return response.data;
};

const employerEarningService = {
  getHireEarnings,
  approveWorkerEarning,
  disputeWorkerEarning,
};

export default employerEarningService;
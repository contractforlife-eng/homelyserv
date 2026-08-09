// frontend/src/services/workerEarningService.js
// Worker Earnings ledger — Phase 2.
import api from '../utils/api';

export const getWorkerEarnings = async () => {
  const response = await api.get('/api/worker/earnings');
  return response.data;
};

// Worker submits a PENDING period for employer confirmation.
export const submitWorkerEarning = async (earningId) => {
  const response = await api.post(`/api/worker/earnings/${earningId}/submit`);
  return response.data;
};

const workerEarningService = {
  getWorkerEarnings,
  submitWorkerEarning,
};

export default workerEarningService;
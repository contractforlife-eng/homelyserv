// frontend/src/services/workerPremiumService.js
// Worker-side Premium V2 endpoints (backend-enforced entitlement).
import api from '../utils/api';

// Current availability + premium + (effective) Actively Looking state.
export const getWorkerAvailabilityStatus = async () => {
  const response = await api.get('/api/worker/availability');
  return response.data;
};

// Toggle normal availability. Available to every worker (free or premium).
export const updateWorkerAvailability = async (available) => {
  const response = await api.put('/api/worker/availability', { available });
  return response.data;
};

// Toggle "Actively Looking" — Premium only, enforced by the backend (403 otherwise).
export const updateWorkerActivelyLooking = async (activelyLooking) => {
  const response = await api.put('/api/worker/actively-looking', { activelyLooking });
  return response.data;
};

const workerPremiumService = {
  getWorkerAvailabilityStatus,
  updateWorkerAvailability,
  updateWorkerActivelyLooking
};

export default workerPremiumService;
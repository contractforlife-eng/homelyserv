import {
  getNowPaymentsConfig,
  isNowPaymentsConfigured,
  NOWPAYMENTS_PROVIDER,
} from '../config/nowPayments.js';

export const NOWPAYMENTS_NOT_IMPLEMENTED = 'NOWPayments payment creation is not implemented in this phase';

export const getNowPaymentsServiceConfig = () => {
  const config = getNowPaymentsConfig();
  return {
    provider: NOWPAYMENTS_PROVIDER,
    enabled: isNowPaymentsConfigured(config),
    apiBaseUrl: config.apiBaseUrl,
  };
};

// Deliberately non-operational foundation boundary. No provider request is made
// until the payment creation, IPN, and fulfillment phases are approved.
export const createNowPaymentsPayment = async () => {
  throw new Error(NOWPAYMENTS_NOT_IMPLEMENTED);
};

export default {
  getNowPaymentsServiceConfig,
  createNowPaymentsPayment,
};

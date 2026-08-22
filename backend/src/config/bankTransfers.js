// Server-only configuration for manual bank-transfer receiving instructions.
// No banking values are bundled into the frontend.
export const BANK_TRANSFER_PROVIDER = 'bank_transfer';
export const BANK_TRANSFER_CURRENCY = 'USD';

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const getBankTransferUsdConfig = () => {
  const accountName = readEnv('BANK_TRANSFER_USD_ACCOUNT_NAME');
  const bankName = readEnv('BANK_TRANSFER_USD_BANK_NAME');
  const accountNumber = readEnv('BANK_TRANSFER_USD_ACCOUNT_NUMBER');
  const routingNumber = readEnv('BANK_TRANSFER_USD_ROUTING_NUMBER');
  const accountType = readEnv('BANK_TRANSFER_USD_ACCOUNT_TYPE');

  return {
    accountName,
    bankName,
    accountNumber,
    routingNumber,
    accountType,
    configured: Boolean(accountName && bankName && accountNumber && routingNumber),
  };
};

export const buildBankTransferUsdInstructions = (config, amount, reference) => ({
  method: BANK_TRANSFER_PROVIDER,
  currency: BANK_TRANSFER_CURRENCY,
  amount,
  reference,
  accountName: config.accountName,
  bankName: config.bankName,
  accountNumber: config.accountNumber,
  routingNumber: config.routingNumber,
  ...(config.accountType ? { accountType: config.accountType } : {}),
});

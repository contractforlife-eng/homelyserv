const KNOWN_SENDER_NAMES = {
  'support@homelyserv.com': 'HomelyServ Support',
  'noreply@homelyserv.com': 'HomelyServ Noreply',
  'contact@homelyserv.com': 'HomelyServ Contact',
  'emad@homelyserv.com': 'HomelyServ Owner',
  'info@homelyserv.com': 'HomelyServ Info',
};

export const getEmailFromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@homelyserv.com';

export const getEmailFromName = (fromAddress, customDisplayName) => {
  if (customDisplayName) {
    return customDisplayName;
  }
  if (process.env.EMAIL_FROM_NAME) {
    return process.env.EMAIL_FROM_NAME;
  }
  const address = (fromAddress || getEmailFromAddress()).trim().toLowerCase();
  return KNOWN_SENDER_NAMES[address] || 'HomelyServ';
};

export const buildEmailSenderIdentity = (fromAddress, customDisplayName) => {
  const address = (fromAddress || getEmailFromAddress()).trim();
  const name = getEmailFromName(address, customDisplayName);
  return `"${name}" <${address}>`;
};



export const getEmailFromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;

export const getEmailFromName = () => process.env.EMAIL_FROM_NAME || 'HomelyServ';

export const buildEmailSenderIdentity = () => `"${getEmailFromName()}" <${getEmailFromAddress()}>`;

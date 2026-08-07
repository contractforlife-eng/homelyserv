// backend/src/templates/verificationEmail.js
// ============================================================
// EMAIL VERIFICATION TEMPLATE
// ============================================================
// Builds the email verification message for new users.
// Reuses buildBaseEmail() from baseTemplate.js - no duplicated HTML.
// ============================================================

import { buildBaseEmail, buildTextContent, buildHeading, escapeHtml } from './baseTemplate.js';

/**
 * Build the verification link based on environment.
 * Uses CLIENT_URL environment variable if available.
 * Falls back to NODE_ENV check for backward compatibility.
 * @param {string} rawToken - The raw verification token (URL-safe)
 * @returns {string} - Full verification URL
 */
const buildVerificationUrl = (rawToken) => {
  // Use CLIENT_URL if configured (production deployment)
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    return `${clientUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  }
  
  // Fallback to NODE_ENV check (development)
  // Also check for Railway/production-like environments
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.RAILWAY_ENVIRONMENT === 'production' ||
                       process.env.VERCEL_ENV === 'production';
  const baseUrl = isProduction
    ? 'https://homelyserv.com'
    : 'http://localhost:5173';
  return `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
};

/**
 * Build email verification email
 * @param {Object} user - User object
 * @param {string} user.fullName - User's full name
 * @param {string} user.email - User's email address
 * @param {string} rawToken - The raw verification token (never stored/logged)
 * @returns {Object} - Email data with subject, html, and text
 */
export const buildVerificationEmail = ({ fullName, email, rawToken }) => {
  // Escape user-generated content
  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);

  // Build verification URL
  const verificationUrl = buildVerificationUrl(rawToken);

  // Build email content
  const content = `
    ${buildHeading('Verify your email address')}
    ${buildTextContent(`Hi ${safeFullName},`)}
    ${buildTextContent('Thank you for joining HomelyServ.')}
    ${buildTextContent('Please verify your email address by clicking the button below.')}
  `;

  // Build action button
  const actionButton = {
    text: 'Verify Email',
    url: verificationUrl
  };

  // Build complete email using the shared base template
  const html = buildBaseEmail({
    title: 'Verify your email address',
    previewText: 'Please verify your email address to activate your HomelyServ account',
    content: content,
    actionButton: actionButton,
    footerNote: 'This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.'
  });

  return {
    subject: 'Verify your email address - HomelyServ',
    html: html,
    text: `Hi ${safeFullName},\n\nThank you for joining HomelyServ.\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis verification link will expire in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.\n\n© ${new Date().getFullYear()} HomelyServ\nThis email was sent automatically.`
  };
};

export default {
  buildVerificationEmail
};
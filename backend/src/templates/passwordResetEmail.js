// backend/src/templates/passwordResetEmail.js
// ============================================================
// PASSWORD RESET EMAIL TEMPLATE
// ============================================================
// Builds the password reset email for users who forgot their password.
// Reuses buildBaseEmail() from baseTemplate.js - no duplicated HTML.
// ============================================================

import { buildBaseEmail, buildTextContent, buildHeading, escapeHtml } from './baseTemplate.js';

/**
 * Build the password reset link based on environment.
 * Uses CLIENT_URL environment variable if available.
 * Falls back to NODE_ENV check for backward compatibility.
 * @param {string} rawToken - The raw reset token (URL-safe)
 * @returns {string} - Full reset URL
 */
const buildResetUrl = (rawToken) => {
  // Use CLIENT_URL if configured (production deployment)
  const clientUrl = process.env.CLIENT_URL;

  if (clientUrl) {
    return `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  }

  // Fallback to NODE_ENV check (development)
  // Only use localhost for development - never hardcode production URL
  const isProduction = process.env.NODE_ENV === 'production' ||
                       process.env.RAILWAY_ENVIRONMENT === 'production' ||
                       process.env.VERCEL_ENV === 'production';

  if (isProduction) {
    // In production without CLIENT_URL, log error and use safe fallback
    console.error('❌ CLIENT_URL not set in production environment!');
    return `https://homelyserv.com/reset-password?token=${encodeURIComponent(rawToken)}`;
  }

  // Development: use localhost
  return `http://localhost:5173/reset-password?token=${encodeURIComponent(rawToken)}`;
};

/**
 * Build password reset email
 * @param {Object} user - User object
 * @param {string} user.fullName - User's full name
 * @param {string} user.email - User's email address
 * @param {string} rawToken - The raw reset token (never stored/logged)
 * @returns {Object} - Email data with subject, html, and text
 */
export const buildPasswordResetEmail = ({ fullName, email, rawToken }) => {
  // Escape user-generated content
  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);

  // Build reset URL
  const resetUrl = buildResetUrl(rawToken);

  // Build email content
  const content = `
    ${buildHeading('Reset your password')}
    ${buildTextContent(`Hi ${safeFullName},`)}
    ${buildTextContent('We received a request to reset your HomelyServ password.')}
    ${buildTextContent('Click the button below to choose a new password. This link will expire in 1 hour.')}
  `;

  // Build action button
  const actionButton = {
    text: 'Reset Password',
    url: resetUrl
  };

  // Build complete email using the shared base template
  const html = buildBaseEmail({
    title: 'Reset your HomelyServ password',
    previewText: 'Reset your HomelyServ password',
    content: content,
    actionButton: actionButton,
    footerNote: 'If you did not request a password reset, you can safely ignore this email. Your password will not be changed unless you click the link above and set a new one. For help, contact support@homelyserv.com.'
  });

  return {
    subject: 'Reset your HomelyServ password',
    html: html,
    text: `Hi ${safeFullName},\n\nWe received a request to reset your HomelyServ password.\n\nClick the link below to choose a new password. This link will expire in 1 hour.\n\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email. Your password will not be changed unless you click the link above and set a new one.\n\nFor help, contact support@homelyserv.com.\n\n© ${new Date().getFullYear()} HomelyServ\nThis email was sent automatically.`
  };
};

export default {
  buildPasswordResetEmail
};
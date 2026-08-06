// backend/src/templates/welcomeEmail.js
// ============================================================
// WELCOME EMAIL TEMPLATE
// ============================================================
// Builds personalized welcome emails for new users
// Adapts content based on user role (Employer/Worker)
// ============================================================

import { buildBaseEmail, buildTextContent, buildHeading, escapeHtml } from './baseTemplate.js';

/**
 * Build welcome email for new users
 * @param {Object} user - User object
 * @param {string} user.firstName - User's first name
 * @param {string} user.role - User role (EMPLOYER or WORKER)
 * @param {string} [user.language] - User language preference (future use)
 * @returns {Object} - Email data with subject and html
 */
export const buildWelcomeEmail = ({ firstName, role, language }) => {
  // Escape user input
  const safeFirstName = escapeHtml(firstName);
  const safeRole = escapeHtml(role);
  
  // Normalize role to uppercase
  const normalizedRole = safeRole.toUpperCase();
  
  // Determine role-specific content
  const isEmployer = normalizedRole === 'EMPLOYER';
  
  // Role-specific messaging
  const roleContent = isEmployer ? {
    headline: 'Welcome to HomelyServ!',
    subheadline: 'Start finding trusted domestic professionals today.',
    ctaText: 'Complete Employer Profile',
    ctaUrl: 'https://homelyserv.com/employer/profile',
    description: `Hi ${safeFirstName}, we're excited to have you on board! As an employer, you can now browse qualified workers, post job offers, and manage your hires all in one place.`
  } : {
    headline: 'Welcome to HomelyServ!',
    subheadline: 'Complete your profile to start receiving job offers.',
    ctaText: 'Complete Worker Profile',
    ctaUrl: 'https://homelyserv.com/worker/profile',
    description: `Hi ${safeFirstName}, we're excited to have you on board! As a worker, you can now create your professional profile, showcase your skills, and start receiving job offers from employers.`
  };

  // Build email content
  const content = `
    ${buildHeading(roleContent.headline)}
    ${buildTextContent(roleContent.description)}
    ${buildTextContent(roleContent.subheadline)}
  `;

  // Build action button
  const actionButton = {
    text: roleContent.ctaText,
    url: roleContent.ctaUrl
  };

  // Build complete email
  const html = buildBaseEmail({
    title: 'Welcome to HomelyServ',
    previewText: 'Your account has been created successfully',
    content: content,
    actionButton: actionButton,
    footerNote: 'Need help? Contact our support team at support@homelyserv.com'
  });

  return {
    subject: `Welcome to HomelyServ, ${safeFirstName}!`,
    html: html,
    text: `Hi ${safeFirstName},\n\n${roleContent.description}\n\n${roleContent.subheadline}\n\nComplete your profile: ${roleContent.ctaUrl}\n\nNeed help? Contact us at support@homelyserv.com\n\n© ${new Date().getFullYear()} HomelyServ\nThis email was sent automatically.`
  };
};

export default {
  buildWelcomeEmail
};
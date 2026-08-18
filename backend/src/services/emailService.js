// backend/src/services/emailService.js
// ============================================================
// EMAIL SERVICE - RESEND API INTEGRATION (Primary) / ZOHO SMTP (Fallback)
// ============================================================
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { buildEmailSenderIdentity, getEmailFromAddress } from '../utils/emailSender.js';
import { escapeHtml } from '../templates/baseTemplate.js';
import User from '../models/User.js';

// ============================================================
// PROVIDER SELECTION & CONFIGURATION
// ============================================================

// Determine email provider (default to Resend for production)
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === 'production' ? 'resend' : 'smtp');

// Initialize Resend client if API key is available
let resendClient = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log('[EMAIL] Resend client initialized');
} else {
  console.warn('[EMAIL] RESEND_API_KEY not found - Resend emails will fail');
}

// Validate configuration
const validateResendConfig = () => {
  if (EMAIL_PROVIDER === 'resend') {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM is required when EMAIL_PROVIDER=resend');
    }
  }
};

// ============================================================
// SMTP CONFIGURATION (Fallback)
// ============================================================
const createTransporter = () => {
  const smtpConfig = {
    host: process.env.EMAIL_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Explicit timeouts for diagnostics
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    // Additional settings for better deliverability
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production', // Only enforce in production
    },
  };

  console.log('📧 SMTP Configuration:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user,
  });

  return nodemailer.createTransport(smtpConfig);
};

// Create transporter instance
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const addSMTPReplyTo = (mailOptions) => {
  if (process.env.EMAIL_REPLY_TO) mailOptions.replyTo = process.env.EMAIL_REPLY_TO;
  return mailOptions;
};

// ============================================================
// EMAIL SERVICE FUNCTIONS
// ============================================================

/**
 * Send email via Resend API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} [options.replyTo] - Reply-to address
 * @returns {Promise<Object>} - Result object with success status
 */
const sendViaResend = async ({ to, subject, html, text, replyTo }) => {
  try {
    console.log('[EMAIL] Sending via Resend to:', to);

    const emailData = {
      from: buildEmailSenderIdentity(),
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    if (replyTo) {
      emailData.replyTo = replyTo;
    }

    const { data, error } = await resendClient.emails.send(emailData);

    if (error) {
      console.error('[EMAIL] Resend send failed:', error);
      return {
        success: false,
        message: 'Resend send failed',
        error: error.message,
        code: error.name
      };
    }

    console.log('[EMAIL] Resend accepted request');
    console.log('[EMAIL] Message ID:', data?.id);

    return {
      success: true,
      message: 'Email sent successfully via Resend',
      messageId: data?.id,
      email: to
    };
  } catch (error) {
    console.error('[EMAIL] Resend send failed:', error);
    console.error('[EMAIL] Error name/code/message:', error.name, error.code, error.message);
    return {
      success: false,
      message: 'Resend send failed',
      error: error.message,
      code: error.name
    };
  }
};

/**
 * Send email via SMTP (fallback)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise<Object>} - Result object with success status
 */
const sendViaSMTP = async ({ to, subject, html, text }) => {
  try {
    console.log('[EMAIL] Sending via SMTP to:', to);

    const mailTransporter = getTransporter();

    const mailOptions = addSMTPReplyTo({
      from: buildEmailSenderIdentity(),
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    const info = await mailTransporter.sendMail(mailOptions);

    console.log('[EMAIL] SMTP send successful');
    console.log('[EMAIL] Message ID:', info.messageId);

    return {
      success: true,
      message: 'Email sent successfully via SMTP',
      messageId: info.messageId,
      email: to
    };
  } catch (error) {
    console.error('[EMAIL] SMTP send failed:', error);
    return {
      success: false,
      message: 'SMTP send failed',
      error: error.message,
      code: error.code
    };
  }
};

import { buildWelcomeEmail } from '../templates/welcomeEmail.js';
import { buildVerificationEmail } from '../templates/verificationEmail.js';
import { buildPasswordResetEmail } from '../templates/passwordResetEmail.js';

// ============================================================
// SENDER IDENTITY
// ============================================================
/**
 * Send a test email to verify SMTP configuration
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
export const sendTestEmail = async (to, subject = 'HomelyServ SMTP Test', text = 'This is a test email from HomelyServ.', html = null) => {
  try {
    console.log(`\n📤 Attempting to send test email...`);
    console.log(`   From: ${getEmailFromAddress()}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);

    const mailTransporter = getTransporter();

    const mailOptions = addSMTPReplyTo({
      from: buildEmailSenderIdentity(),
      to: to,
      subject: subject,
      text: text,
      html: html || `<p>${text}</p><p><small>Sent from HomelyServ SMTP Service</small></p>`,
    });

    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      response: info.response,
      from: getEmailFromAddress(),
      to: to,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message,
      code: error.code,
      from: getEmailFromAddress(),
      to: to,
    };
  }
};

/**
 * Send welcome email to newly registered user
 * @param {Object} user - User object
 * @param {string} user.firstName - User's first name
 * @param {string} user.role - User role (EMPLOYER or WORKER)
 * @param {string} [user.language] - User language preference
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendWelcomeEmail = async (user) => {
  try {
    validateResendConfig();

    console.log('[EMAIL] Provider:', EMAIL_PROVIDER);
    console.log('[EMAIL] Sending welcome email to:', user.email);

    const { firstName, role, email } = user;

    if (!firstName || !role || !email) {
      console.error('[EMAIL] Missing required user data for welcome email:', { firstName, role, email });
      return {
        success: false,
        message: 'Missing required user data',
        error: 'firstName, role, and email are required'
      };
    }

    // Build welcome email using template
    const welcomeEmail = buildWelcomeEmail({
      firstName,
      role,
      language: user.language
    });

    // Send via Resend (production) or SMTP (fallback)
    if (EMAIL_PROVIDER === 'resend') {
      return await sendViaResend({
        to: email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
        text: welcomeEmail.text,
        replyTo: process.env.EMAIL_REPLY_TO
      });
    } else {
      return await sendViaSMTP({
        to: email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
        text: welcomeEmail.text
      });
    }

  } catch (error) {
    console.error('[EMAIL] Failed to send welcome email:', error);
    console.error('[EMAIL] Error details:', {
      message: error.message,
      code: error.code,
      userId: user.id || user._id,
      userEmail: user.email
    });

    return {
      success: false,
      message: 'Failed to send welcome email',
      error: error.message,
      code: error.code,
      email: user.email
    };
  }
};

/**
 * Send email verification email to a newly registered user
 * @param {Object} user - User object
 * @param {string} user.fullName - User's full name
 * @param {string} user.email - User's email address
 * @param {string} rawToken - The raw verification token (never stored/logged)
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendVerificationEmail = async (user, rawToken) => {
  try {
    validateResendConfig();

    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[EMAIL] Provider:', EMAIL_PROVIDER);
      console.log('[VERIFY-EMAIL] Sending verification email to:', user.email);
      console.log('[VERIFY-EMAIL] User ID:', user._id || user.id);
      console.log('[VERIFY-EMAIL] Token generated:', !!rawToken);
    }

    const { fullName, email } = user;

    if (!fullName || !email || !rawToken) {
      console.error('[EMAIL] Missing required data for verification email:', { fullName, email, hasToken: !!rawToken });
      return {
        success: false,
        message: 'Missing required data',
        error: 'fullName, email, and rawToken are required'
      };
    }

    // Build verification email using template
    const verificationEmail = buildVerificationEmail({
      fullName,
      email,
      rawToken
    });

    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] Email built successfully');
      console.log('[VERIFY-EMAIL] Subject:', verificationEmail.subject);
    }

    // Send via Resend (production) or SMTP (fallback)
    if (EMAIL_PROVIDER === 'resend') {
      return await sendViaResend({
        to: email,
        subject: verificationEmail.subject,
        html: verificationEmail.html,
        text: verificationEmail.text,
        replyTo: process.env.EMAIL_REPLY_TO
      });
    } else {
      return await sendViaSMTP({
        to: email,
        subject: verificationEmail.subject,
        html: verificationEmail.html,
        text: verificationEmail.text
      });
    }

  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', error);
    console.error('[EMAIL] Error details:', {
      message: error.message,
      code: error.code,
      userId: user.id || user._id,
      userEmail: user.email
    });

    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
      code: error.code,
      email: user.email
    };
  }
};

/**
 * Send password reset email to a user
 * @param {Object} user - User object
 * @param {string} user.fullName - User's full name
 * @param {string} user.email - User's email address
 * @param {string} rawToken - The raw reset token (never stored/logged)
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendPasswordResetEmail = async (user, rawToken) => {
  try {
    validateResendConfig();

    console.log('[EMAIL] Provider: resend');
    console.log('[EMAIL] Sending password reset email');
    console.log('[EMAIL] Recipient:', user.email);

    const { fullName, email } = user;

    if (!fullName || !email || !rawToken) {
      console.error('[EMAIL] Missing required data for password reset email:', { fullName, email, hasToken: !!rawToken });
      return {
        success: false,
        message: 'Missing required data',
        error: 'fullName, email, and rawToken are required'
      };
    }

    // Build password reset email using template
    const passwordResetEmail = buildPasswordResetEmail({
      fullName,
      email,
      rawToken
    });

    // Send via Resend (production) or SMTP (fallback)
    if (EMAIL_PROVIDER === 'resend') {
      return await sendViaResend({
        to: email,
        subject: passwordResetEmail.subject,
        html: passwordResetEmail.html,
        text: passwordResetEmail.text,
        replyTo: process.env.EMAIL_REPLY_TO
      });
    } else {
      return await sendViaSMTP({
        to: email,
        subject: passwordResetEmail.subject,
        html: passwordResetEmail.html,
        text: passwordResetEmail.text
      });
    }

  } catch (error) {
    console.error('[EMAIL] Password reset send failed');
    console.error('[EMAIL] Error name/code/message:', error.name, error.code, error.message);

    return {
      success: false,
      message: 'Failed to send password reset email',
      error: error.message,
      code: error.code,
      email: user.email
    };
  }
};

/**
 * Send security notification email when staff resets a user's password
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.actorRole - Role of staff who reset password (ADMIN/SUPPORT)
 * @param {string} options.reason - Reason for password reset
 * @param {string} [options.tempPassword] - Temporary password (only for ADMIN resets)
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendSecurityNotificationEmail = async ({ to, actorRole, reason, tempPassword }) => {
  try {
    if (!to) {
      console.error('[SECURITY_EMAIL] Missing recipient email');
      return { success: false, message: 'Missing recipient email' };
    }

    const isAdminReset = actorRole === 'ADMIN';
    const actorLabel = isAdminReset ? 'an administrator' : 'a support agent';
    
    let subject, text, html;

    if (isAdminReset && tempPassword) {
      // ADMIN reset: email includes temporary password
      subject = 'Your temporary HomelyServ password';
      
      text = `Your HomelyServ account password was reset by ${actorLabel}.

${reason ? `Reason: ${reason}\n` : ''}
TEMPORARY PASSWORD: ${tempPassword}

Please sign in and change this password immediately.

If you did not expect this change, please contact our support team immediately at support@homelyserv.com.

This is an automated security notification from HomelyServ.`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #f59e0b;">Password Reset Notification</h2>
          <p>Your HomelyServ account password was reset by <strong>${actorLabel}</strong>.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">TEMPORARY PASSWORD:</p>
            <p style="margin: 0; font-size: 18px; font-family: monospace; background: #fff; padding: 8px; border-radius: 4px; word-break: break-all;">${tempPassword}</p>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">Please sign in and change this password immediately.</p>
          
          <p>If you did not expect this change, please contact our support team immediately at <a href="mailto:support@homelyserv.com">support@homelyserv.com</a>.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated security notification from HomelyServ.</p>
        </div>
      `;
    } else {
      // SUPPORT reset: email includes reset link
      subject = 'Reset your HomelyServ password';
      
      text = `HomelyServ Support requested a password reset for your account.

${reason ? `Reason: ${reason}\n` : ''}
Click the link below to choose a new password:

${tempPassword ? `Reset Link: ${tempPassword}\n\n` : ''}
If you did not expect this change, please contact our support team at support@homelyserv.com.

This is an automated security notification from HomelyServ.`;

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #f59e0b;">Password Reset Request</h2>
          <p>HomelyServ Support requested a password reset for your account.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">Click the button below to reset your password:</p>
            <a href="${tempPassword}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">Or copy this link: ${tempPassword}</p>
          </div>
          
          <p>If you did not expect this change, please contact our support team at <a href="mailto:support@homelyserv.com">support@homelyserv.com</a>.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated security notification from HomelyServ.</p>
        </div>
      `;
    }

    // Send via configured provider
    if (EMAIL_PROVIDER === 'resend') {
      return await sendViaResend({
        to,
        subject,
        html,
        text,
        replyTo: process.env.EMAIL_REPLY_TO || 'support@homelyserv.com'
      });
    } else {
      return await sendViaSMTP({
        to,
        subject,
        html,
        text
      });
    }
  } catch (error) {
    console.error('[SECURITY_EMAIL] Failed to send security notification:', error);
    return {
      success: false,
      message: 'Failed to send security notification',
      error: error.message
    };
  }
};

/**
 * Send role-change notification email when an administrator changes a
 * user's role. Non-blocking: email failure must never roll back the change.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.fullName - Recipient name
 * @param {string} options.oldRole - Previous role
 * @param {string} options.newRole - New role
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendRoleChangeNotification = async ({ to, fullName = '', oldRole, newRole }) => {
  try {
    if (!to) {
      console.error('[ROLE_EMAIL] Missing recipient email');
      return { success: false, message: 'Missing recipient email' };
    }

    const subject = 'Your HomelyServ account role has changed';

    const roleLabels = {
      WORKER: 'Worker',
      EMPLOYER: 'Employer',
      SUPPORT: 'Support',
      ADMIN: 'Admin'
    };
    const oldLabel = roleLabels[oldRole] || oldRole || 'unknown';
    const newLabel = roleLabels[newRole] || newRole || 'unknown';

    const text = `Dear ${fullName || 'HomelyServ user'},

Your HomelyServ account role has been changed by an administrator.

Previous role: ${oldLabel}
New role: ${newLabel}

Your account permissions now reflect this new role. For security, all of your existing sessions have been signed out. Please sign in again to continue using HomelyServ.

If you did not expect this change, please contact our support team immediately at support@homelyserv.com.

This is an automated notification from HomelyServ.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #f59e0b;">Your account role has changed</h2>
        <p>Dear ${fullName || 'HomelyServ user'},</p>
        <p>Your HomelyServ account role has been changed by an administrator.</p>
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; color: #92400e;"><strong>Previous role:</strong> ${oldLabel}</p>
          <p style="margin: 0; color: #92400e;"><strong>New role:</strong> ${newLabel}</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">Your existing sessions have been signed out. Please sign in again with your new role.</p>
        <p>If you did not expect this change, please contact our support team at <a href="mailto:support@homelyserv.com">support@homelyserv.com</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from HomelyServ.</p>
      </div>
    `;

    if (EMAIL_PROVIDER === 'resend') {
      return await sendViaResend({
        to,
        subject,
        html,
        text,
        replyTo: process.env.EMAIL_REPLY_TO || 'support@homelyserv.com'
      });
    } else {
      return await sendViaSMTP({
        to,
        subject,
        html,
        text
      });
    }
  } catch (error) {
    console.error('[ROLE_EMAIL] Failed to send role change notification:', error);
    return {
      success: false,
      message: 'Failed to send role change notification',
      error: error.message
    };
  }
};

/**
 * Send transaction confirmation email for successful payments and premium activations.
 * Non-blocking: email failure must never roll back the financial operation.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} [options.userName] - Recipient name
 * @param {string} [options.eventType] - SUBSCRIPTION or COMMISSION
 * @param {string} [options.operation] - Human-readable operation name
 * @param {number} [options.amount] - Transaction amount
 * @param {string} [options.currency] - Currency code
 * @param {string} [options.paymentMethod] - Payment method identifier
 * @param {string} [options.reference] - Transaction reference
 * @param {string} [options.plan] - Subscription plan identifier
 * @param {Date|string} [options.completedAt] - Completion timestamp
 * @param {Date|string} [options.endDate] - Expiration or end date
 * @param {string} [options.source] - Activation source (e.g. ADMIN)
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendTransactionConfirmationEmail = async ({
  to,
  userName = '',
  eventType = 'SUBSCRIPTION',
  operation = 'Transaction',
  amount = 0,
  currency = '',
  paymentMethod = '',
  reference = '',
  plan = '',
  completedAt,
  endDate,
  source = '',
  status = 'Activated',
}) => {
  try {
    if (!to) {
      console.error('[EMAIL] Missing recipient email for transaction confirmation');
      return { success: false, message: 'Missing recipient email' };
    }

    const formatMethod = (m) => {
      if (!m) return 'N/A';
      const lower = String(m).toLowerCase();
      if (lower === 'paymob') return 'Paymob';
      if (lower === 'paypal') return 'PayPal';
      if (lower === 'admin') return 'Admin / Manual Activation';
      return lower.replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const methodLabel = formatMethod(paymentMethod || source);
    const planLabel = plan ? String(plan).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Premium';
    const isManual = source === 'ADMIN' || paymentMethod === 'admin';

    const formatDate = (d) => {
      if (!d) return 'N/A';
      return d instanceof Date ? d.toLocaleDateString() : String(d);
    };

    const greeting = userName ? `Dear ${userName},` : 'Dear HomelyServ user,';

    const text = [
      'HomelyServ - Transaction Confirmation',
      '',
      greeting,
      '',
      `Your ${operation} has been completed successfully.`,
      '',
      `Operation: ${operation}`,
      eventType === 'SUBSCRIPTION' && planLabel ? `Plan: ${planLabel}` : null,
      isManual ? 'Amount: 0' : `Amount Paid: ${amount} ${currency || ''}`,
      isManual ? 'Source: Admin / Manual Activation' : `Payment Method: ${methodLabel}`,
      reference ? `Reference: ${reference}` : null,
      completedAt ? `Date: ${formatDate(completedAt)}` : null,
      endDate ? `Expiration Date: ${formatDate(endDate)}` : null,
      `Status: ${status}`,
      '',
      'If you have any questions, please contact our support team at support@homelyserv.com.',
      '',
      'This is an automated notification from HomelyServ.',
    ].filter(Boolean).join('\n');

    const buildDetailRow = (label, value) =>
      `<p style="margin: 0 0 8px; color: #374151; font-size: 15px; line-height: 1.5; font-family: Arial, sans-serif;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;

    let detailsHtml = buildDetailRow('Operation', operation);
    if (eventType === 'SUBSCRIPTION' && planLabel) {
      detailsHtml += buildDetailRow('Plan', planLabel);
    }
    if (isManual) {
      detailsHtml += buildDetailRow('Amount', '0');
      detailsHtml += buildDetailRow('Source', 'Admin / Manual Activation');
    } else {
      detailsHtml += buildDetailRow('Amount Paid', `${amount} ${currency || ''}`);
      detailsHtml += buildDetailRow('Payment Method', methodLabel);
    }
    if (reference) {
      detailsHtml += buildDetailRow('Reference', reference);
    }
    if (completedAt) {
      detailsHtml += buildDetailRow('Date', formatDate(completedAt));
    }
    if (endDate) {
      detailsHtml += buildDetailRow('Expiration Date', formatDate(endDate));
    }
    detailsHtml += buildDetailRow('Status', status);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #dc2626; margin: 0 0 16px; font-size: 24px; font-weight: 700; font-family: Arial, sans-serif;">${escapeHtml(operation)}</h2>
        <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">${escapeHtml(greeting)}</p>
        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">Your ${escapeHtml(operation.toLowerCase())} has been completed successfully.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          ${detailsHtml}
        </div>
        <p style="margin: 20px 0 0; color: #374151; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">If you have any questions, please contact our support team at <a href="mailto:support@homelyserv.com" style="color: #dc2626; text-decoration: none;">support@homelyserv.com</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">This is an automated notification from HomelyServ.</p>
      </div>
    `;

    const subject = `HomelyServ: ${operation} Confirmation`;

    if (EMAIL_PROVIDER === 'resend') {
      return await sendViaResend({
        to,
        subject,
        html,
        text,
        replyTo: process.env.EMAIL_REPLY_TO || 'support@homelyserv.com'
      });
    }

    return await sendViaSMTP({
      to,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('[EMAIL] Failed to send transaction confirmation email:', error);
    return {
      success: false,
      message: 'Failed to send transaction confirmation email',
      error: error.message
    };
  }
};

/**
 * Verify SMTP connection
 * @returns {Promise<Object>} - Result object with verification status
 */
export const verifySMTPConnection = async () => {
  try {
    console.log('\n🔍 Verifying SMTP connection...');
    const mailTransporter = getTransporter();
    
    await mailTransporter.verify();
    
    console.log('✅ SMTP connection verified successfully');
    
    return {
      success: true,
      message: 'SMTP connection verified',
    };
  } catch (error) {
    console.error('❌ SMTP connection verification failed:', error);
    
    return {
      success: false,
      message: 'SMTP connection verification failed',
      error: error.message,
    };
  }
};

export const shouldSendOptionalEmail = async (userId) => {
  try {
    const user = await User.findById(userId).select('settings');

    if (!user) {
      return true;
    }

    return user.settings?.emailNotifications !== false;
  } catch {
    return true;
  }
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
  sendTestEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSecurityNotificationEmail,
  sendRoleChangeNotification,
  sendTransactionConfirmationEmail,
  verifySMTPConnection,
  shouldSendOptionalEmail,
};

// backend/src/services/emailService.js
// ============================================================
// EMAIL SERVICE - RESEND API INTEGRATION (Primary) / ZOHO SMTP (Fallback)
// ============================================================
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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
      from: process.env.EMAIL_FROM,
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

    const mailOptions = {
      from: `"HomelyServ" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

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
    console.log(`   From: ${process.env.EMAIL_USER}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);

    const mailTransporter = getTransporter();

    const mailOptions = {
      from: `"HomelyServ" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || `<p>${text}</p><p><small>Sent from HomelyServ SMTP Service</small></p>`,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      response: info.response,
      from: process.env.EMAIL_USER,
      to: to,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message,
      code: error.code,
      from: process.env.EMAIL_USER,
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

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
  sendTestEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  verifySMTPConnection,
};

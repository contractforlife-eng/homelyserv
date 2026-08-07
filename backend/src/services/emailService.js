// backend/src/services/emailService.js
// ============================================================
// EMAIL SERVICE - ZOHO SMTP INTEGRATION
// ============================================================
import nodemailer from 'nodemailer';

// ============================================================
// SMTP CONFIGURATION
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

    // Send email using existing transporter
    const mailTransporter = getTransporter();
    
    const mailOptions = {
      from: `"HomelyServ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: welcomeEmail.subject,
      text: welcomeEmail.text,
      html: welcomeEmail.html,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('[EMAIL] Welcome email sent successfully to:', email);
    console.log('[EMAIL] Message ID:', info.messageId);
    
    return {
      success: true,
      message: 'Welcome email sent successfully',
      messageId: info.messageId,
      email: email
    };
    
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
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
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

    // Build verification email using template (reuses buildBaseEmail)
    const verificationEmail = buildVerificationEmail({
      fullName,
      email,
      rawToken
    });

    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] Email built successfully');
      console.log('[VERIFY-EMAIL] Subject:', verificationEmail.subject);
    }

    // Send email using existing transporter
    const mailTransporter = getTransporter();

    const mailOptions = {
      from: `"HomelyServ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html,
    };

    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] Attempting to send email via SMTP');
      console.log('[VERIFY-EMAIL] SMTP Host:', process.env.EMAIL_HOST);
      console.log('[VERIFY-EMAIL] SMTP Port:', process.env.EMAIL_PORT);
    }

    // Verify SMTP connection before sending (diagnostics)
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      const verifyStart = Date.now();
      console.log('[VERIFY-EMAIL] SMTP verify started');

      try {
        await mailTransporter.verify();
        console.log('[VERIFY-EMAIL] SMTP verify success in', Date.now() - verifyStart, 'ms');
      } catch (verifyError) {
        console.error('[VERIFY-EMAIL] SMTP verify failed in', Date.now() - verifyStart, 'ms');
        console.error('[VERIFY-EMAIL] SMTP verify error code:', verifyError.code);
        console.error('[VERIFY-EMAIL] SMTP verify error message:', verifyError.message);
        // Continue with send attempt even if verify fails
      }
    }

    const sendStart = Date.now();
    const info = await mailTransporter.sendMail(mailOptions);
    const sendDuration = Date.now() - sendStart;

    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] Email sent successfully to:', email);
      console.log('[VERIFY-EMAIL] Message ID:', info.messageId);
      console.log('[VERIFY-EMAIL] Response:', info.response);
      console.log('[VERIFY-EMAIL] Accepted:', info.accepted);
      console.log('[VERIFY-EMAIL] Rejected:', info.rejected);
      console.log('[VERIFY-EMAIL] Send completed in', sendDuration, 'ms');
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', error);
    console.error('[EMAIL] Error details:', {
      message: error.message,
      code: error.code,
      userId: user.id || user._id,
      userEmail: user.email
    });

    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.error('[VERIFY-EMAIL] SMTP Error Code:', error.code);
      console.error('[VERIFY-EMAIL] SMTP Error Message:', error.message);
    }

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

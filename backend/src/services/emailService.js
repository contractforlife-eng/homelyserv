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
      userId: user._id,
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
  verifySMTPConnection,
};

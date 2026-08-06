// backend/scripts/test-smtp.js
// ============================================================
// SMTP TEST SCRIPT
// ============================================================
// This script tests the SMTP configuration by sending a test email
// from: noreply@homelyserv.com
// to: emad@homelyserv.com
// ============================================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import the email service
import { sendTestEmail, verifySMTPConnection } from '../src/services/emailService.js';

// ============================================================
// TEST CONFIGURATION
// ============================================================
const TEST_CONFIG = {
  from: process.env.EMAIL_USER || 'noreply@homelyserv.com',
  to: 'emad@homelyserv.com',
  subject: 'HomelyServ SMTP Test - Phase 1',
  text: 'This is a test email to verify Zoho SMTP integration for HomelyServ.\n\nIf you receive this email, the SMTP configuration is working correctly.',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">HomelyServ SMTP Test</h2>
      <p>This is a test email to verify Zoho SMTP integration for HomelyServ.</p>
      <p><strong>From:</strong> ${process.env.EMAIL_USER || 'noreply@homelyserv.com'}</p>
      <p><strong>To:</strong> emad@homelyserv.com</p>
      <p><strong>Status:</strong> ✅ SMTP Configuration Working</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">Sent from HomelyServ SMTP Service</p>
    </div>
  `,
};

// ============================================================
// MAIN TEST FUNCTION
// ============================================================
const runSMTPTest = async () => {
  console.log('============================================================');
  console.log('🚀 HOMELYSERV SMTP TEST - PHASE 1');
  console.log('============================================================\n');

  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Missing (will use default: smtp.zoho.com)');
  console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Missing (will use default: 587)');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Found' : '❌ Missing');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing');
  console.log('   EMAIL_SECURE:', process.env.EMAIL_SECURE || '❌ Missing (will use default: false)');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: EMAIL_USER and EMAIL_PASS are required!');
    console.error('   Please set these environment variables in backend/.env');
    process.exit(1);
  }

  // Step 1: Verify SMTP connection
  console.log('Step 1: Verifying SMTP Connection...');
  const verificationResult = await verifySMTPConnection();
  
  if (!verificationResult.success) {
    console.error('❌ SMTP Connection Verification Failed');
    console.error('   Error:', verificationResult.error);
    console.error('\n💡 Troubleshooting Tips:');
    console.error('   - Check if EMAIL_HOST is correct (smtp.zoho.com for Zoho)');
    console.error('   - Check if EMAIL_PORT is correct (587 for TLS, 465 for SSL)');
    console.error('   - Verify EMAIL_USER and EMAIL_PASS are correct');
    console.error('   - For Zoho: Use App-Specific Password if 2FA is enabled');
    console.error('   - Check firewall/network settings');
    process.exit(1);
  }

  console.log('');

  // Step 2: Send test email
  console.log('Step 2: Sending Test Email...');
  console.log(`   From: ${TEST_CONFIG.from}`);
  console.log(`   To: ${TEST_CONFIG.to}`);
  console.log(`   Subject: ${TEST_CONFIG.subject}`);
  console.log('');

  const result = await sendTestEmail(
    TEST_CONFIG.to,
    TEST_CONFIG.subject,
    TEST_CONFIG.text,
    TEST_CONFIG.html
  );

  console.log('');
  console.log('============================================================');
  if (result.success) {
    console.log('✅ TEST SUCCESSFUL');
    console.log('============================================================');
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    console.log('   From:', result.from);
    console.log('   To:', result.to);
    console.log('');
    console.log('📧 Please check the inbox of:', result.to);
    console.log('   (Don\'t forget to check spam/junk folder)');
  } else {
    console.log('❌ TEST FAILED');
    console.log('============================================================');
    console.log('   Error:', result.error);
    console.log('   Code:', result.code);
    console.log('   From:', result.from);
    console.log('   To:', result.to);
    console.log('');
    console.log('💡 Common Issues:');
    console.log('   - Invalid credentials (check EMAIL_USER and EMAIL_PASS)');
    console.log('   - SMTP server not responding');
    console.log('   - Firewall blocking port 587/465');
    console.log('   - For Zoho: Enable "Less secure apps" or use App Password');
  }
  console.log('============================================================\n');

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
};

// ============================================================
// RUN TEST
// ============================================================
runSMTPTest().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
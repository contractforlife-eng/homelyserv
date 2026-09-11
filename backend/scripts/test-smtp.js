// backend/scripts/test-smtp.js
// ============================================================
// SMTP TEST SCRIPT
// ============================================================
// This script verifies the SMTP configuration and validates sender identities.
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
import { buildEmailSenderIdentity, getEmailFromAddress } from '../src/utils/emailSender.js';

// ============================================================
// MAIN TEST FUNCTION
// ============================================================
const runSMTPTest = async () => {
  console.log('============================================================');
  console.log('🚀 HOMELYSERV SMTP & SENDER IDENTITY TEST');
  console.log('============================================================\n');

  // Verify Sender Identity Construction for all required addresses
  console.log('📋 Validating Required Sender Identities:');
  const requiredIdentities = [
    { name: 'Support', actual: buildEmailSenderIdentity('support@homelyserv.com'), expected: '"HomelyServ Support" <support@homelyserv.com>' },
    { name: 'Noreply (Standard)', actual: buildEmailSenderIdentity('noreply@homelyserv.com'), expected: '"HomelyServ Noreply" <noreply@homelyserv.com>' },
    { name: 'Verification Specific', actual: buildEmailSenderIdentity('noreply@homelyserv.com', 'HomelyServ Verified Registration'), expected: '"HomelyServ Verified Registration" <noreply@homelyserv.com>' },
    { name: 'Contact', actual: buildEmailSenderIdentity('contact@homelyserv.com'), expected: '"HomelyServ Contact" <contact@homelyserv.com>' },
    { name: 'Owner', actual: buildEmailSenderIdentity('emad@homelyserv.com'), expected: '"HomelyServ Owner" <emad@homelyserv.com>' },
    { name: 'Info', actual: buildEmailSenderIdentity('info@homelyserv.com'), expected: '"HomelyServ Info" <info@homelyserv.com>' },
  ];

  let identitiesValid = true;
  for (const { name, actual, expected } of requiredIdentities) {
    const matches = actual === expected;
    console.log(`   ${matches ? '✅' : '❌'} [${name}] -> ${actual}`);
    if (!matches) identitiesValid = false;
  }
  console.log('');

  // Check environment variables (NEVER print secrets)
  console.log('📋 Checking Environment Variables:');
  console.log('   EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER || '❌ Missing');
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Missing (will use default: mail.spacemail.com)');
  console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Missing (will use default: 465)');
  console.log('   EMAIL_SECURE:', process.env.EMAIL_SECURE || '❌ Missing (will use default: true for 465)');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Found' : '❌ Missing');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing');
  console.log('   EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Missing (falls back to EMAIL_USER / noreply)');
  console.log('   EMAIL_REPLY_TO:', process.env.EMAIL_REPLY_TO || '❌ Missing (optional)');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('ℹ️ EMAIL_USER or EMAIL_PASS not set in environment. Skipping live SMTP connection test.');
    console.log('   Sender identity verification passed.');
    process.exit(identitiesValid ? 0 : 1);
  }

  // Step 1: Verify SMTP connection
  console.log('Step 1: Verifying SMTP Connection...');
  const verificationResult = await verifySMTPConnection();
  
  if (!verificationResult.success) {
    console.error('❌ SMTP Connection Verification Failed');
    console.error('   Error:', verificationResult.error);
    console.error('\n💡 Troubleshooting Tips:');
    console.error('   - Check if EMAIL_HOST is correct (mail.spacemail.com for Spacemail)');
    console.error('   - Check if EMAIL_PORT is correct (465 for SSL, 587 for TLS)');
    console.error('   - Verify EMAIL_USER and EMAIL_PASS are correct in .env');
    process.exit(1);
  }

  console.log('');

  // Step 2: Send test email
  const recipient = process.env.TEST_EMAIL_RECIPIENT || process.env.EMAIL_USER || 'emad@homelyserv.com';
  const fromIdentity = buildEmailSenderIdentity();
  console.log('Step 2: Sending Test Email...');
  console.log(`   From: ${fromIdentity}`);
  console.log(`   To: ${recipient}`);
  console.log(`   Subject: HomelyServ Spacemail SMTP Test`);
  console.log('');

  const result = await sendTestEmail(
    recipient,
    'HomelyServ Spacemail SMTP Test',
    'This is a test email to verify Spacemail SMTP integration for HomelyServ.\n\nIf you receive this email, the SMTP configuration is working correctly.',
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">HomelyServ SMTP Test</h2>
        <p>This is a test email to verify Spacemail SMTP integration for HomelyServ.</p>
        <p><strong>From:</strong> ${fromIdentity}</p>
        <p><strong>To:</strong> ${recipient}</p>
        <p><strong>Status:</strong> ✅ SMTP Configuration Working</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Sent from HomelyServ SMTP Service</p>
      </div>
    `
  );

  console.log('');
  console.log('============================================================');
  if (result.success) {
    console.log('✅ LIVE TEST SUCCESSFUL');
    console.log('============================================================');
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    console.log('   From:', result.from);
    console.log('   To:', result.to);
  } else {
    console.log('❌ LIVE TEST FAILED');
    console.log('============================================================');
    console.log('   Error:', result.error);
    console.log('   Code:', result.code);
  }
  console.log('============================================================\n');

  process.exit(result.success ? 0 : 1);
};

// ============================================================
// RUN TEST
// ============================================================
runSMTPTest().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

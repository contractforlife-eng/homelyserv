// backend/scripts/test-welcome-email.js
// ============================================================
// TEST WELCOME EMAIL TEMPLATE
// ============================================================
// Tests the welcome email template generation without sending
// ============================================================

import { buildWelcomeEmail } from '../src/templates/welcomeEmail.js';

// Test data
const testUsers = [
  {
    firstName: 'Ahmed',
    role: 'EMPLOYER',
    email: 'employer@test.com',
    language: 'en'
  },
  {
    firstName: 'Sarah',
    role: 'WORKER',
    email: 'worker@test.com',
    language: 'en'
  }
];

// Run tests
console.log('============================================================');
console.log('🧪 TESTING WELCOME EMAIL TEMPLATE');
console.log('============================================================\n');

testUsers.forEach((user, index) => {
  console.log(`Test ${index + 1}: ${user.role} - ${user.firstName}`);
  console.log('------------------------------------------------------------');
  
  try {
    const email = buildWelcomeEmail(user);
    
    console.log('✅ Template built successfully');
    console.log('   Subject:', email.subject);
    console.log('   Has HTML:', email.html ? '✅ Yes' : '❌ No');
    console.log('   Has Text:', email.text ? '✅ Yes' : '❌ No');
    console.log('   HTML Length:', email.html ? email.html.length : 0, 'characters');
    console.log('   Text Length:', email.text ? email.text.length : 0, 'characters');
    
    // Verify required elements
    const hasHomelyServ = email.html.includes('HomelyServ');
    const hasSupportEmail = email.html.includes('support@homelyserv.com');
    const hasWebsite = email.html.includes('https://homelyserv.com');
    const hasCopyright = email.html.includes('©') || email.html.includes('&copy;');
    const hasFirstName = email.html.includes(user.firstName);
    const hasCTA = email.html.includes('Complete') && email.html.includes('Profile');
    
    console.log('\n   Content Verification:');
    console.log('   - HomelyServ branding:', hasHomelyServ ? '✅' : '❌');
    console.log('   - Support email:', hasSupportEmail ? '✅' : '❌');
    console.log('   - Website link:', hasWebsite ? '✅' : '❌');
    console.log('   - Copyright notice:', hasCopyright ? '✅' : '❌');
    console.log('   - User first name:', hasFirstName ? '✅' : '❌');
    console.log('   - CTA button:', hasCTA ? '✅' : '❌');
    
    // Check for XSS vulnerabilities
    const hasRawInput = email.html.includes('<script>') || 
                        email.html.includes('javascript:') ||
                        email.html.includes('onerror=') ||
                        email.html.includes('onclick=');
    
    console.log('   - No XSS vulnerabilities:', !hasRawInput ? '✅' : '❌');
    
    if (hasRawInput) {
      console.error('   ⚠️  WARNING: Potential XSS vulnerability detected!');
    }
    
  } catch (error) {
    console.error('❌ Template build failed:', error.message);
    console.error('   Error:', error.stack);
  }
  
  console.log('');
});

console.log('============================================================');
console.log('✅ All template tests completed');
console.log('============================================================\n');
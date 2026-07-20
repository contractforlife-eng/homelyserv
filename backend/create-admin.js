// backend/create-admin.js
//
// PHASE 0 SECURITY FIX (audit §2.1): this script previously contained
// a real, hardcoded admin email, phone number, and plaintext password
// committed directly to git history. That credential must be treated
// as fully compromised - see SECURITY_NOTES.md in the repo root for
// the required rotation/history-scrub steps. It has been replaced
// below with environment-variable input; no real credentials are
// stored in source control anymore.
//
// ⚠️  KNOWN LIMITATION (unrelated to the credential leak, not fixed in
// this pass): this script uses @prisma/client, which per the audit
// (§1) is NOT the database layer the live application actually uses -
// the running app persists users via Mongoose (see models/User.js).
// Running this script today will not create an admin account usable
// for login against the deployed app. It is left using Prisma,
// unmodified otherwise, pending the Phase 1 decision on which data
// layer to standardize on. Do not rely on this script until that is
// resolved.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME;
  const phone = process.env.ADMIN_PHONE || '';

  if (!email || !password || !fullName) {
    console.error(
      '❌ Missing required environment variables. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME before running this script, e.g.:\n' +
      '   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=$(openssl rand -base64 18) ADMIN_NAME="Your Name" node create-admin.js'
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 12) {
    console.error('❌ ADMIN_PASSWORD is too short. Use at least 12 characters.');
    process.exitCode = 1;
    return;
  }

  try {
    console.log('📝 Connecting to database...');

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      console.log(`⚠️ User already exists: ${email}`);
      await prisma.$disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        role: 'ADMIN',
        isVerified: true,
        language: 'en'
      }
    });

    console.log(`✅ Admin created successfully: ${email}`);
    console.log('   Password was not logged. Store it in your password manager now.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

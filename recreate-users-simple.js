// recreate-users-simple.js
//
// PHASE 0 SECURITY FIX (audit §2.1): this script previously contained
// hardcoded, plaintext seed passwords - including the SAME leaked
// password ('killuemad') used for an 'admin@homelyserv.com' account,
// written directly into the live `users` collection that the running
// app actually uses (see audit §1). That means this leaked password
// may be a WORKING credential against the real database, not just a
// dead-code example. Treat it as compromised: rotate/delete that
// admin account's password immediately, independent of this fix.
//
// This script now reads seed users from a JSON file that is NOT
// committed to git (see .gitignore entry added alongside this file)
// instead of hardcoding credentials in source. Copy
// seed-users.example.json to seed-users.local.json and fill in your
// own values to use it locally.
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const SEED_FILE = process.env.SEED_USERS_FILE || path.join(__dirname, 'seed-users.local.json');

function loadSeedUsers() {
  if (!fs.existsSync(SEED_FILE)) {
    console.error(
      `❌ Seed file not found: ${SEED_FILE}\n` +
      '   Copy seed-users.example.json to seed-users.local.json and fill in real values, ' +
      'or set SEED_USERS_FILE to point at your own file. This file is gitignored and must never be committed.'
    );
    process.exitCode = 1;
    return null;
  }
  const users = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const weak = users.find(u => !u.password || u.password.length < 8);
  if (weak) {
    console.error(`❌ Refusing to seed "${weak.email}": password missing or shorter than 8 characters.`);
    process.exitCode = 1;
    return null;
  }
  return users;
}

async function recreateUsers() {
  const usersToCreate = loadSeedUsers();
  if (!usersToCreate) return;

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('homelyserv');
    const usersCollection = db.collection('users');

    console.log('📋 Creating users...\n');

    let created = 0;
    let skipped = 0;

    for (const userData of usersToCreate) {
      try {
        const existing = await usersCollection.findOne({ email: userData.email });
        if (existing) {
          console.log(`⏭️ Skipped: ${userData.email} (already exists)`);
          skipped++;
          continue;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const user = {
          fullName: userData.fullName,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          phone: userData.phone || '',
          location: userData.location || '',
          profileImage: null,
          bio: '',
          skills: [],
          experience: '',
          hourlyRate: '0',
          companyName: userData.companyName || '',
          profileComplete: userData.profileComplete || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        };

        await usersCollection.insertOne(user);
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }

    console.log(`\n📊 Summary: Created ${created} users, Skipped ${skipped} users`);
    console.log('\n✅ Done. Passwords were not logged - use whatever you put in your local seed file.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

recreateUsers();

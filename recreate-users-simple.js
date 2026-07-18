import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// ============================================================
// USERS TO CREATE
// ============================================================
const usersToCreate = [
  {
    fullName: "Nono User",
    email: "nono@gmail.com",
    password: "test1234",
    role: "WORKER",
    phone: "01012345678",
    location: "Cairo, Egypt",
    profileComplete: true
  },
  {
    fullName: "Test Worker",
    email: "sara@gmail.com",
    password: "test1234",
    role: "WORKER",
    phone: "01087654321",
    location: "Alexandria, Egypt",
    profileComplete: true
  },
  {
    fullName: "Test Employer",
    email: "ramo@gmail.com",
    password: "test1234",
    role: "EMPLOYER",
    phone: "01123456789",
    location: "Giza, Egypt",
    companyName: "Test Company",
    profileComplete: true
  },
  {
    fullName: "Admin User",
    email: "admin@homelyserv.com",
    password: "killuemad",
    role: "ADMIN",
    phone: "01234567890",
    location: "Cairo, Egypt",
    profileComplete: true
  }
];

async function recreateUsers() {
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
        // Check if user exists
        const existing = await usersCollection.findOne({ email: userData.email });
        if (existing) {
          console.log(`⏭️ Skipped: ${userData.email} (already exists)`);
          skipped++;
          continue;
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Create user
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
    
    // Show all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\n👤 All users in database (${allUsers.length}):`);
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} - ${user.fullName} (${user.role})`);
    });
    
    console.log('\n✅ Done! You can now login with these users.');
    console.log('\n📝 Login Credentials:');
    console.log('========================================');
    usersToCreate.forEach(user => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}`);
      console.log('  ---');
    });
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

recreateUsers();
// backend/scripts/diagnose-403-atlas.js
// Diagnose the 403 error using the ACTUAL Atlas database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend/.env with absolute path
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
console.log('📂 Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error);
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Mask password in output
const maskedUrl = DATABASE_URL.replace(/:([^@]+)@/, ':****@');
console.log('✅ DATABASE_URL loaded:', maskedUrl);
console.log('');

async function diagnose403Error() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(DATABASE_URL);
    
    // Print connection details
    const db = mongoose.connection.db;
    console.log('✅ Connected to MongoDB');
    console.log('  Host:', db.s.options.hosts.map(h => `${h.host}:${h.port}`).join(', '));
    console.log('  Database:', db.databaseName);
    console.log('');

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    console.log('');

    // Verify collections have data
    console.log('📊 Checking collection counts...');
    const usersCount = await db.collection('users').countDocuments();
    const offersCount = await db.collection('offers').countDocuments();
    const hiresCount = await db.collection('hires').countDocuments();
    const paymentsCount = await db.collection('payments').countDocuments();
    const messagesCount = await db.collection('messages').countDocuments();
    const workerProfilesCount = await db.collection('workerprofiles').countDocuments();
    const employerProfilesCount = await db.collection('employerprofiles').countDocuments();

    console.log('  users:', usersCount);
    console.log('  offers:', offersCount);
    console.log('  hires:', hiresCount);
    console.log('  payments:', paymentsCount);
    console.log('  messages:', messagesCount);
    console.log('  workerprofiles:', workerProfilesCount);
    console.log('  employerprofiles:', employerProfilesCount);
    console.log('');

    if (messagesCount === 0) {
      console.log('❌ No messages found in database');
      await mongoose.disconnect();
      return;
    }

    // Find messages
    console.log('📋 Finding recent messages...');
    const messages = await db.collection('messages').find({}).sort({ createdAt: -1 }).limit(20).toArray();
    
    console.log(`Found ${messages.length} recent messages\n`);

    // Get unique conversation IDs
    const conversationIds = [...new Set(messages.map(m => m.conversationId))];
    console.log('Conversation IDs found:', conversationIds);

    // For each conversation, get the last message and trace the IDs
    for (const conversationId of conversationIds) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`ANALYZING CONVERSATION: ${conversationId}`);
      console.log('='.repeat(80));

      // Get last message in this conversation
      const lastMessage = await db.collection('messages').findOne({ conversationId }, { sort: { createdAt: -1 } });

      if (!lastMessage) {
        console.log('No messages found for this conversation');
        continue;
      }

      console.log('\n📨 LAST MESSAGE:');
      console.log('  Message._id:', lastMessage._id);
      console.log('  Message.senderId:', lastMessage.senderId);
      console.log('  Message.recipientId:', lastMessage.recipientId);
      console.log('  Message.conversationId:', lastMessage.conversationId);
      console.log('  Message.senderRole:', lastMessage.senderRole);
      console.log('  Message.recipientRole:', lastMessage.recipientRole);

      // Determine employer and worker IDs from the message
      const employerId = lastMessage.senderRole === 'EMPLOYER' ? lastMessage.senderId : lastMessage.recipientId;
      const workerId = lastMessage.senderRole === 'WORKER' ? lastMessage.senderId : lastMessage.recipientId;

      console.log('\n👤 IDENTIFIED USERS:');
      console.log('  Employer ID (from message):', employerId);
      console.log('  Worker ID (from message):', workerId);

      // Search for users with these IDs
      console.log('\n🔍 SEARCHING FOR USERS WITH THESE IDs...');
      
      const userWithEmployerId = await db.collection('users').findOne({
        $or: [
          { id: employerId },
          { email: employerId }
        ]
      });
      
      const userWithWorkerId = await db.collection('users').findOne({
        $or: [
          { id: workerId },
          { email: workerId }
        ]
      });

      console.log('  User with employerId:', userWithEmployerId || 'Not found');
      console.log('  User with workerId:', userWithWorkerId || 'Not found');

      // Search in WorkerProfile
      const workerProfile = await db.collection('workerprofiles').findOne({
        $or: [
          { userId: workerId },
          { id: workerId }
        ]
      });

      console.log('  WorkerProfile:', workerProfile || 'Not found');

      // Search in EmployerProfile
      const employerProfile = await db.collection('employerprofiles').findOne({
        $or: [
          { userId: employerId },
          { id: employerId }
        ]
      });

      console.log('  EmployerProfile:', employerProfile || 'Not found');

      // Find the offer
      console.log('\n📋 SEARCHING FOR OFFER...');
      const offer = await db.collection('offers').findOne({
        $or: [
          { employerId: employerId },
          { employerId: workerId },
          { workerId: employerId },
          { workerId: workerId }
        ]
      });

      if (offer) {
        console.log('  ✅ Found Offer:');
        console.log('    Offer._id:', offer._id);
        console.log('    Offer.workerId:', offer.workerId);
        console.log('    Offer.employerId:', offer.employerId);
      } else {
        console.log('  ❌ No offer found');
        // Show all offers
        const allOffers = await db.collection('offers').find({}).limit(5).toArray();
        if (allOffers.length > 0) {
          console.log('  📋 Available offers:', allOffers.map(o => ({
            _id: o._id,
            workerId: o.workerId,
            employerId: o.employerId
          })));
        }
      }

      // Find the hire
      console.log('\n💼 SEARCHING FOR HIRE...');
      const hire = await db.collection('hires').findOne({
        $or: [
          { employerId: employerId },
          { employerId: workerId },
          { workerId: employerId },
          { workerId: workerId }
        ]
      });

      if (hire) {
        console.log('  ✅ Found Hire:');
        console.log('    Hire._id:', hire._id);
        console.log('    Hire.workerId:', hire.workerId);
        console.log('    Hire.employerId:', hire.employerId);
        console.log('    Hire.offerId:', hire.offerId);
      } else {
        console.log('  ❌ No hire found');
        // Show all hires
        const allHires = await db.collection('hires').find({}).limit(5).toArray();
        if (allHires.length > 0) {
          console.log('  📋 Available hires:', allHires.map(h => ({
            _id: h._id,
            workerId: h.workerId,
            employerId: h.employerId,
            offerId: h.offerId
          })));
        }
      }

      // Find the payment
      console.log('\n💳 SEARCHING FOR PAYMENT...');
      const payment = await db.collection('payments').findOne({
        $or: [
          { employerId: employerId, workerId: workerId },
          { employerId: workerId, workerId: employerId }
        ]
      });

      if (payment) {
        console.log('  ✅ Found Payment:');
        console.log('    Payment._id:', payment._id);
        console.log('    Payment.workerId:', payment.workerId);
        console.log('    Payment.employerId:', payment.employerId);
        console.log('    Payment.offerId:', payment.offerId);
        console.log('    Payment.hireId:', payment.hireId);
        console.log('    Payment.status:', payment.status);
      } else {
        console.log('  ❌ No payment found for this employer-worker pair');
        // Show all payments
        const allPayments = await db.collection('payments').find({}).limit(10).toArray();
        if (allPayments.length > 0) {
          console.log('  📋 Available payments:', allPayments.map(p => ({
            _id: p._id,
            workerId: p.workerId,
            employerId: p.employerId,
            offerId: p.offerId,
            hireId: p.hireId,
            status: p.status
          })));
        }
      }

      // COMPARISON TABLE
      console.log(`\n${'='.repeat(80)}`);
      console.log('COMPARISON TABLE');
      console.log('='.repeat(80));

      const values = {
        'Offer.workerId': offer?.workerId || 'N/A',
        'Hire.workerId': hire?.workerId || 'N/A',
        'Payment.workerId': payment?.workerId || 'N/A',
        'Message.senderId': lastMessage.senderId,
        'Message.recipientId': lastMessage.recipientId,
        'WorkerProfile.id': workerProfile?.id || 'N/A',
        'WorkerProfile.userId': workerProfile?.userId || 'N/A',
        'EmployerProfile.id': employerProfile?.id || 'N/A',
        'EmployerProfile.userId': employerProfile?.userId || 'N/A',
        'User (employer)': userWithEmployerId?.id || 'N/A',
        'User (worker)': userWithWorkerId?.id || 'N/A'
      };

      const referenceValue = values['Message.recipientId'];

      console.log('\nField'.padEnd(25) + 'Value'.padEnd(40) + 'Match');
      console.log('-'.repeat(25) + '-'.repeat(40) + '-'.repeat(10));

      for (const [field, value] of Object.entries(values)) {
        const match = value === referenceValue ? '✓' : '✗';
        console.log(field.padEnd(25) + (value || 'N/A').padEnd(40) + match);
      }

      console.log(`\n${'='.repeat(80)}\n`);

      // Only analyze first conversation
      break;
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose403Error();
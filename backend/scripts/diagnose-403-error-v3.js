// backend/scripts/diagnose-403-error-v3.js
// Diagnose the 403 error by finding actual users from message IDs
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/homelyserv';

// Define schemas for reading data - use strict: false to allow any fields
const messageSchema = new mongoose.Schema({}, { strict: false });
const paymentSchema = new mongoose.Schema({}, { strict: false });
const offerSchema = new mongoose.Schema({}, { strict: false });
const hireSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });
const workerProfileSchema = new mongoose.Schema({}, { strict: false });
const employerProfileSchema = new mongoose.Schema({}, { strict: false });

const Message = mongoose.model('Message', messageSchema, 'messages');
const Payment = mongoose.model('Payment', paymentSchema, 'payments');
const Offer = mongoose.model('Offer', offerSchema, 'offers');
const Hire = mongoose.model('Hire', hireSchema, 'hires');
const User = mongoose.model('User', userSchema, 'users');
const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema, 'workerprofiles');
const EmployerProfile = mongoose.model('EmployerProfile', employerProfileSchema, 'employerprofiles');

async function diagnose403Error() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    console.log('');

    // Find a conversation with messages
    console.log('📋 Finding conversations with messages...');
    const messages = await Message.find({}).limit(50);
    
    if (messages.length === 0) {
      console.log('❌ No messages found in database');
      return;
    }

    console.log(`Found ${messages.length} messages\n`);

    // Get unique conversation IDs
    const conversationIds = [...new Set(messages.map(m => m.conversationId))];
    console.log('Conversation IDs found:', conversationIds);
    
    // Filter out test conversations
    const realConversationIds = conversationIds.filter(id => !id.includes('test_'));
    console.log('Real conversation IDs (excluding test):', realConversationIds);

    // For each real conversation, get the last message and trace the IDs
    for (const conversationId of realConversationIds) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`ANALYZING CONVERSATION: ${conversationId}`);
      console.log('='.repeat(80));

      // Get last message in this conversation
      const lastMessage = await Message.findOne({ conversationId })
        .sort({ createdAt: -1 });

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

      // Search for users with these IDs in ANY field
      console.log('\n🔍 SEARCHING FOR USERS WITH THESE IDs...');
      
      // Search in User collection - use raw MongoDB driver to avoid ObjectId casting
      const db = mongoose.connection.db;
      
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
      const allOffers = await Offer.find({}).limit(20);
      console.log('  All offers:', allOffers.map(o => ({
        _id: o._id,
        workerId: o.workerId,
        employerId: o.employerId
      })));

      // Find the hire
      console.log('\n💼 SEARCHING FOR HIRE...');
      const allHires = await Hire.find({}).limit(20);
      console.log('  All hires:', allHires.map(h => ({
        _id: h._id,
        workerId: h.workerId,
        employerId: h.employerId,
        offerId: h.offerId
      })));

      // Find the payment
      console.log('\n💳 SEARCHING FOR PAYMENT...');
      const allPayments = await Payment.find({}).limit(20);
      console.log('  All payments:', allPayments.map(p => ({
        _id: p._id,
        workerId: p.workerId,
        employerId: p.employerId,
        offerId: p.offerId,
        hireId: p.hireId,
        status: p.status
      })));

      // COMPARISON TABLE
      console.log(`\n${'='.repeat(80)}`);
      console.log('COMPARISON TABLE');
      console.log('='.repeat(80));

      const values = {
        'Message.senderId': lastMessage.senderId,
        'Message.recipientId': lastMessage.recipientId,
        'User (employer)': userWithEmployerId?.id || 'N/A',
        'User (worker)': userWithWorkerId?.id || 'N/A',
        'WorkerProfile.id': workerProfile?.id || 'N/A',
        'WorkerProfile.userId': workerProfile?.userId || 'N/A',
        'EmployerProfile.id': employerProfile?.id || 'N/A',
        'EmployerProfile.userId': employerProfile?.userId || 'N/A'
      };

      const referenceValue = values['Message.recipientId'];

      console.log('\nField'.padEnd(25) + 'Value'.padEnd(40) + 'Match');
      console.log('-'.repeat(25) + '-'.repeat(40) + '-'.repeat(10));

      for (const [field, value] of Object.entries(values)) {
        const match = value === referenceValue ? '✓' : '✗';
        console.log(field.padEnd(25) + (value || 'N/A').padEnd(40) + match);
      }

      console.log(`\n${'='.repeat(80)}\n`);

      // Only analyze first real conversation
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
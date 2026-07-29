// backend/scripts/diagnose-403-error.js
// Diagnose the 403 error by comparing actual MongoDB values
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/homelyserv';

// Define schemas for reading data
const messageSchema = new mongoose.Schema({}, { strict: false });
const paymentSchema = new mongoose.Schema({}, { strict: false });
const offerSchema = new mongoose.Schema({}, { strict: false });
const hireSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });
const workerProfileSchema = new mongoose.Schema({}, { strict: false });

const Message = mongoose.model('Message', messageSchema, 'messages');
const Payment = mongoose.model('Payment', paymentSchema, 'payments');
const Offer = mongoose.model('Offer', offerSchema, 'offers');
const Hire = mongoose.model('Hire', hireSchema, 'hires');
const User = mongoose.model('User', userSchema, 'users');
const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema, 'workerprofiles');

async function diagnose403Error() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

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

      // Find the offer that created this conversation
      console.log('\n📋 SEARCHING FOR OFFER...');
      let offer = await Offer.findOne({
        $or: [
          { employerId: employerId },
          { employerId: workerId },
          { workerId: employerId },
          { workerId: workerId }
        ]
      }).sort({ createdAt: -1 });
      
      // If no offer found with direct match, try to find by email or other fields
      if (!offer) {
        console.log('  🔍 Trying alternative search...');
        const allOffers = await Offer.find({}).limit(20);
        console.log('  📋 All offers in database:', allOffers.map(o => ({
          _id: o._id,
          workerId: o.workerId,
          employerId: o.employerId
        })));
      }

      // Find the hire record
      console.log('\n💼 SEARCHING FOR HIRE...');
      let hire = await Hire.findOne({
        $or: [
          { employerId: employerId },
          { employerId: workerId },
          { workerId: employerId },
          { workerId: workerId }
        ]
      }).sort({ createdAt: -1 });
      
      // If no hire found, show all hires
      if (!hire) {
        console.log('  🔍 Showing all hires in database...');
        const allHires = await Hire.find({}).limit(20);
        console.log('  📋 All hires:', allHires.map(h => ({
          _id: h._id,
          workerId: h.workerId,
          employerId: h.employerId,
          offerId: h.offerId
        })));
      }

      // Find the payment record
      console.log('\n💳 SEARCHING FOR PAYMENT...');
      let payment = await Payment.findOne({
        $or: [
          { employerId: employerId, workerId: workerId },
          { employerId: workerId, workerId: employerId }
        ]
      }).sort({ createdAt: -1 });
      
      // If no payment found, show all payments
      if (!payment) {
        console.log('  🔍 Showing all payments in database...');
        const allPayments = await Payment.find({}).limit(20);
        console.log('  📋 All payments:', allPayments.map(p => ({
          _id: p._id,
          workerId: p.workerId,
          employerId: p.employerId,
          offerId: p.offerId,
          hireId: p.hireId,
          status: p.status
        })));
      }

      // Find worker profile
      console.log('\n👷 SEARCHING FOR WORKER PROFILE...');
      let workerProfile = await WorkerProfile.findOne({
        $or: [
          { userId: workerId },
          { id: workerId }
        ]
      });
      
      // If no worker profile found, show all worker profiles
      if (!workerProfile) {
        console.log('  🔍 Showing all worker profiles...');
        const allProfiles = await WorkerProfile.find({}).limit(10);
        console.log('  📋 All worker profiles:', allProfiles.map(wp => ({
          id: wp.id,
          userId: wp.userId
        })));
      }

      // Find user document for worker
      console.log('\n👤 SEARCHING FOR USER DOCUMENT...');
      let user = null;
      try {
        user = await User.findOne({
          $or: [
            { id: workerId },
            { _id: workerId }
          ]
        });
      } catch (e) {
        console.log('  ⚠️ Error searching user by ID, trying alternative...');
      }
      
      // If no user found, show all users
      if (!user) {
        console.log('  🔍 Showing all users...');
        const allUsers = await User.find({}).limit(10);
        console.log('  📋 All users:', allUsers.map(u => ({
          id: u.id,
          _id: u._id,
          email: u.email
        })));
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
        'User.id': user?.id || 'N/A'
      };

      const referenceValue = values['Message.recipientId']; // Use recipientId as reference

      console.log('\nField'.padEnd(25) + 'Value'.padEnd(40) + 'Match');
      console.log('-'.repeat(25) + '-'.repeat(40) + '-'.repeat(10));

      for (const [field, value] of Object.entries(values)) {
        const match = value === referenceValue ? '✓' : '✗';
        console.log(field.padEnd(25) + (value || 'N/A').padEnd(40) + match);
      }

      console.log(`\n${'='.repeat(80)}\n`);

      // Only analyze first real conversation for now
      if (realConversationIds.length > 0) {
        break;
      }
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose403Error();
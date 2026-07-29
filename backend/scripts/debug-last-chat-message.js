// backend/scripts/debug-last-chat-message.js
// Diagnostic script to read the newest Message documents
// Run: node backend/scripts/debug-last-chat-message.js

import mongoose from 'mongoose';
import prisma from '../src/lib/prisma.js';

async function diagnose() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}\n`);

    // Query Message collection
    const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
    const messages = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📋 Found ${messages.length} message(s)\n`);

    // Get User and WorkerProfile collections for verification
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const WorkerProfile = mongoose.model('WorkerProfile', new mongoose.Schema({}, { strict: false }));

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log('----------------------------------');
      console.log('_id:', msg._id);
      console.log('conversationId:', msg.conversationId);
      console.log('senderId:', msg.senderId);
      console.log('recipientId:', msg.recipientId);
      console.log('senderRole:', msg.senderRole);
      console.log('recipientRole:', msg.recipientRole);
      console.log('senderName:', msg.senderName);
      console.log('recipientName:', msg.recipientName);
      console.log('text:', msg.text);
      console.log('createdAt:', msg.createdAt);
      console.log('----------------------------------');

      // Check if senderId exists in User collection
      const senderUser = await User.findOne({ _id: msg.senderId });
      console.log('senderId exists in User collection:', senderUser ? 'YES' : 'NO');

      // Check if recipientId exists in User collection
      const recipientUser = await User.findOne({ _id: msg.recipientId });
      console.log('recipientId exists in User collection:', recipientUser ? 'YES' : 'NO');

      // Check if senderId exists in WorkerProfile collection
      const senderWorkerProfile = await WorkerProfile.findOne({ _id: msg.senderId });
      console.log('senderId exists in WorkerProfile collection:', senderWorkerProfile ? 'YES' : 'NO');

      // Check if recipientId exists in WorkerProfile collection
      const recipientWorkerProfile = await WorkerProfile.findOne({ _id: msg.recipientId });
      console.log('recipientId exists in WorkerProfile collection:', recipientWorkerProfile ? 'YES' : 'NO');

      // If recipientId exists in WorkerProfile, print details
      if (recipientWorkerProfile) {
        console.log('WorkerProfile._id:', recipientWorkerProfile._id);
        console.log('WorkerProfile.userId:', recipientWorkerProfile.userId);
      }

      console.log();
    }

    // Summary for the newest employer message
    console.log('=== SUMMARY ===');
    const newestMessage = messages[0];
    if (newestMessage && newestMessage.senderRole === 'EMPLOYER') {
      const recipientUser = await User.findOne({ _id: newestMessage.recipientId });
      const recipientWorkerProfile = await WorkerProfile.findOne({ _id: newestMessage.recipientId });

      console.log('For the newest employer message:');
      console.log('recipientId:', newestMessage.recipientId);
      console.log('Recipient is User._id?', recipientUser ? 'YES' : 'NO');
      console.log('Recipient is WorkerProfile._id?', recipientWorkerProfile ? 'YES' : 'NO');
      console.log('conversationId:', newestMessage.conversationId);
    } else {
      console.log('No employer message found in the newest messages');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  }
}

diagnose();

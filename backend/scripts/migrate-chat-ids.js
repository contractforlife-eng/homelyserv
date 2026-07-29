// backend/scripts/migrate-chat-ids.js
// Migration script for legacy Message documents
// Converts email IDs, user_<timestamp> IDs to User ObjectId
// Run: node backend/scripts/migrate-chat-ids.js

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Message from '../src/models/Message.js';

async function migrate() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}\n`);

    const stats = {
      total: 0,
      migrated: 0,
      skipped: 0,
      orphaned: 0,
      errors: 0
    };

    const orphanedMessages = [];

    // Get all messages
    const messages = await Message.find({});
    stats.total = messages.length;
    console.log(`📊 Found ${messages.length} total messages\n`);

    for (const msg of messages) {
      try {
        let senderId = msg.senderId;
        let recipientId = msg.recipientId;
        let needsUpdate = false;

        // Helper to check if ID is already a valid ObjectId
        const isValidObjectId = (id) => {
          return /^[0-9a-fA-F]{24}$/.test(id);
        };

        // Helper to check if ID is an email
        const isEmail = (id) => {
          return id && id.includes('@');
        };

        // Helper to check if ID is a timestamp-based ID (user_<timestamp>)
        const isTimestampId = (id) => {
          return id && id.startsWith('user_');
        };

        // Resolve sender ID
        if (!isValidObjectId(senderId)) {
          console.log(`\n🔍 Resolving senderId: ${senderId}`);
          
          let user = null;
          
          if (isEmail(senderId)) {
            // Try to find by email
            user = await User.findOne({ email: senderId });
            if (user) {
              console.log(`  ✅ Found user by email: ${user.fullName} (${user._id})`);
            }
          } else if (isTimestampId(senderId)) {
            // Try to find by old timestamp ID (check if stored in a legacy field)
            // This assumes there might be a legacy mapping somewhere
            console.log(`  ⚠️  Timestamp-based ID found: ${senderId}`);
          }

          if (user) {
            senderId = String(user._id);
            needsUpdate = true;
          } else {
            console.log(`  ❌ Cannot resolve senderId: ${senderId}`);
            stats.orphaned++;
            orphanedMessages.push({
              messageId: msg._id,
              field: 'senderId',
              value: senderId,
              conversationId: msg.conversationId
            });
          }
        }

        // Resolve recipient ID
        if (!isValidObjectId(recipientId)) {
          console.log(`\n🔍 Resolving recipientId: ${recipientId}`);
          
          let user = null;
          
          if (isEmail(recipientId)) {
            // Try to find by email
            user = await User.findOne({ email: recipientId });
            if (user) {
              console.log(`  ✅ Found user by email: ${user.fullName} (${user._id})`);
            }
          } else if (isTimestampId(recipientId)) {
            // Try to find by old timestamp ID
            console.log(`  ⚠️  Timestamp-based ID found: ${recipientId}`);
          }

          if (user) {
            recipientId = String(user._id);
            needsUpdate = true;
          } else {
            console.log(`  ❌ Cannot resolve recipientId: ${recipientId}`);
            stats.orphaned++;
            orphanedMessages.push({
              messageId: msg._id,
              field: 'recipientId',
              value: recipientId,
              conversationId: msg.conversationId
            });
          }
        }

        // Update conversationId if either participant changed
        if (needsUpdate && isValidObjectId(senderId) && isValidObjectId(recipientId)) {
          const newConversationId = `conv_${[senderId, recipientId].sort().join('_')}`;
          
          if (newConversationId !== msg.conversationId) {
            console.log(`  📝 Updating conversationId: ${msg.conversationId} -> ${newConversationId}`);
            
            // Check if new conversation already exists
            const existingInNewConv = await Message.findOne({
              conversationId: newConversationId,
              _id: { $ne: msg._id }
            });

            if (existingInNewConv) {
              console.log(`  ⚠️  Duplicate conversation detected, deleting old message`);
              await Message.deleteOne({ _id: msg._id });
              stats.skipped++;
            } else {
              await Message.updateOne(
                { _id: msg._id },
                { 
                  $set: { 
                    senderId, 
                    recipientId,
                    conversationId: newConversationId 
                  } 
                }
              );
              stats.migrated++;
            }
          } else {
            // IDs resolved but conversationId unchanged
            await Message.updateOne(
              { _id: msg._id },
              { $set: { senderId, recipientId } }
            );
            stats.migrated++;
          }
        } else if (!needsUpdate) {
          stats.skipped++;
        }

      } catch (error) {
        console.error(`\n❌ Error processing message ${msg._id}:`, error.message);
        stats.errors++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total messages:      ${stats.total}`);
    console.log(`Migrated:            ${stats.migrated}`);
    console.log(`Skipped (already OK): ${stats.skipped}`);
    console.log(`Orphaned:            ${stats.orphaned}`);
    console.log(`Errors:              ${stats.errors}`);
    console.log('='.repeat(60));

    // Print orphaned messages
    if (orphanedMessages.length > 0) {
      console.log('\n⚠️  ORPHANED MESSAGES (cannot be resolved):');
      console.log('='.repeat(60));
      orphanedMessages.forEach((om, idx) => {
        console.log(`\n${idx + 1}. Message ID: ${om.messageId}`);
        console.log(`   Field: ${om.field}`);
        console.log(`   Value: ${om.value}`);
        console.log(`   Conversation: ${om.conversationId}`);
      });
      console.log('\nThese messages reference users that could not be found in the database.');
      console.log('You may need to manually review or delete these messages.\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
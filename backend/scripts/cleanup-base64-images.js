import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';

const isBase64Image = (str) => typeof str === 'string' && str.startsWith('data:image/');

const cleanupBase64Images = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);

    const usersWithBase64 = await User.find({
      profileImage: { $regex: '^data:image/' }
    });

    console.log(`🔍 Found ${usersWithBase64.length} users with base64 profileImage`);

    for (const user of usersWithBase64) {
      console.log(`  - Cleaning user: ${user.email} (${user.profileImage.length} chars)`);
      user.profileImage = null;
      await user.save();
    }

    console.log('\n✅ Cleanup complete');
    console.log(`   - Users cleaned: ${usersWithBase64.length}`);

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanupBase64Images();

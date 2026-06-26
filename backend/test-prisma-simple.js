const prisma = require('./src/lib/prisma');

async function test() {
  try {
    console.log('🔄 Testing Prisma connection...');
    
    // Test connection by counting users
    const count = await prisma.user.count();
    console.log('✅ Prisma connection successful!');
    console.log(`📊 Total users in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    console.error('Full error:', error);
  }
}

test();
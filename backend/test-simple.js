const prisma = require('./src/lib/prisma');

async function test() {
  try {
    console.log('🔄 Testing Prisma connection...');
    const count = await prisma.user.count();
    console.log('✅ Prisma connection successful!');
    console.log(`📊 Total users: ${count}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
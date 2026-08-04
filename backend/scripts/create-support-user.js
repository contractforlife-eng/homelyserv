// backend/scripts/create-support-user.js
// Creates a support user: Rania (Sup-Admin)
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const createSupportUser = async () => {
  try {
    console.log('🔍 Checking if support user already exists...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'rania@homelyserv.com' }
    });

    if (existingUser) {
      console.log('✅ Support user already exists:');
      console.log('   Email:', existingUser.email);
      console.log('   Name:', existingUser.fullName);
      console.log('   Role:', existingUser.role);
      console.log('   ID:', existingUser.id);
      return;
    }

    console.log('👤 Creating support user: Rania...');

    // Hash password
    const hashedPassword = await bcrypt.hash('Support@123', 10);

    // Create support user
    const user = await prisma.user.create({
      data: {
        email: 'rania@homelyserv.com',
        password: hashedPassword,
        username: 'rania_support',
        fullName: 'Rania',
        role: 'SUPPORT',
        phone: '',
        city: '',
        image: '',
        isVerified: true,
        language: 'en'
      }
    });

    console.log('✅ Support user created successfully!');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.fullName);
    console.log('   Role:', user.role);
    console.log('   Username:', user.username);
    console.log('\n📝 Login credentials:');
    console.log('   Email: rania@homelyserv.com');
    console.log('   Password: Support@123');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating support user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

createSupportUser();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('📝 Connecting to database...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'contractforlife@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️ User already exists!');
      console.log('📧 Email: contractforlife@gmail.com');
      console.log('👤 Name: emad');
      console.log('🔑 Password: killuemad');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('killuemad', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'contractforlife@gmail.com',
        password: hashedPassword,
        fullName: 'emad',
        phone: '01009189851',
        role: 'admin',
        isVerified: true,
        language: 'en'
      }
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email: contractforlife@gmail.com');
    console.log('👤 Name: emad');
    console.log('📱 Phone: 01009189851');
    console.log('🔑 Password: killuemad');
    console.log('🔐 Role: admin');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
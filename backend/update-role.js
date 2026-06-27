import prisma from './src/utils/prisma.js';

async function updateUserRole() {
  try {
    const email = 'superadmin@homelyserv.com'; // Change this email
    const newRole = 'ADMIN'; // Change to ADMIN, WORKER, or EMPLOYER

    const user = await prisma.user.update({
      where: { email: email },
      data: { role: newRole }
    });

    console.log(`✅ User ${user.email} role updated to: ${user.role}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.fullName}`);
    console.log(`🔐 Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Error updating user role:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();
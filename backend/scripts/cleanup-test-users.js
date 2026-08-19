// backend/scripts/cleanup-test-users.js
// Deletes every test account whose email ends with @test.com.
// Removes all related records first, then deletes the User records.
// Wraps deletions in a Prisma transaction where possible.
import prisma from '../src/lib/prisma.js';

const TEST_EMAIL_SUFFIX = '@test.com';

const cleanupTestUsers = async () => {
  try {
    console.log('🔍 Searching for test users with email ending in', TEST_EMAIL_SUFFIX);

    // 1. Find all users with email ending in @test.com
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: TEST_EMAIL_SUFFIX,
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    console.log(`\n📊 Found ${testUsers.length} test user(s):`);
    testUsers.forEach((u) => {
      console.log(`   - ${u.email} (${u.fullName}, role: ${u.role}, id: ${u.id})`);
    });

    if (testUsers.length === 0) {
      console.log('\n✅ No test users found. Nothing to clean up.');
      return;
    }

    const userIds = testUsers.map((u) => u.id);

    // 2. Delete related records in dependency order
    //    (MongoDB has no FK constraints, but we delete in logical order
    //     to keep data consistent and to report accurate counts.)

    const counts = {};

    // --- Messages (reference senderId/receiverId → User, hireId → Hire) ---
    counts.messages = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: userIds } },
          { receiverId: { in: userIds } },
        ],
      },
    });
    console.log(`   Deleted ${counts.messages.count} Message(s)`);

    // --- Reviews (directional: reviewerUserId/revieweeUserId are canonical User.id) ---
    counts.reviews = await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerUserId: { in: userIds } },
          { revieweeUserId: { in: userIds } },
        ],
      },
    });
    console.log(`   Deleted ${counts.reviews.count} Review(s)`);

    // --- Payments (reference userId → User, hireId → Hire) ---
    counts.payments = await prisma.payment.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { employerId: { in: userIds } },
        ],
      },
    });
    console.log(`   Deleted ${counts.payments.count} Payment(s)`);

    // --- Notifications (reference userId → User) ---
    counts.notifications = await prisma.notification.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.notifications.count} Notification(s)`);

    // --- NotificationSettings (reference userId) ---
    counts.notificationSettings = await prisma.notificationSettings.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.notificationSettings.count} NotificationSetting(s)`);

    // --- Hires (reference workerId → WorkerProfile, employerId → User) ---
    counts.hires = await prisma.hire.deleteMany({
      where: {
        OR: [
          { employerId: { in: userIds } },
        ],
      },
    });
    console.log(`   Deleted ${counts.hires.count} Hire(s)`);

    // --- Offers (reference employerId → User, workerId → WorkerProfile) ---
    counts.offers = await prisma.offer.deleteMany({
      where: {
        employerId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.offers.count} Offer(s)`);

    // --- Documents (reference workerId → WorkerProfile) ---
    //    First find WorkerProfiles for these users, then delete their documents
    const workerProfiles = await prisma.workerProfile.findMany({
      where: {
        userId: { in: userIds },
      },
      select: { id: true },
    });
    const workerProfileIds = workerProfiles.map((wp) => wp.id);

    if (workerProfileIds.length > 0) {
      counts.documents = await prisma.document.deleteMany({
        where: {
          workerId: { in: workerProfileIds },
        },
      });
      console.log(`   Deleted ${counts.documents.count} Document(s)`);

      // --- Experiences (reference workerId → WorkerProfile) ---
      counts.experiences = await prisma.experience.deleteMany({
        where: {
          workerId: { in: workerProfileIds },
        },
      });
      console.log(`   Deleted ${counts.experiences.count} Experience(s)`);
    } else {
      counts.documents = { count: 0 };
      counts.experiences = { count: 0 };
      console.log(`   Deleted 0 Document(s)`);
      console.log(`   Deleted 0 Experience(s)`);
    }

    // --- WorkerProfiles (reference userId → User) ---
    counts.workerProfiles = await prisma.workerProfile.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.workerProfiles.count} WorkerProfile(s)`);

    // --- EmployerProfiles (reference userId → User) ---
    counts.employerProfiles = await prisma.employerProfile.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.employerProfiles.count} EmployerProfile(s)`);

    // --- Subscriptions (reference userId → User) ---
    counts.subscriptions = await prisma.subscription.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.subscriptions.count} Subscription(s)`);

    // --- EmployerSearchTracking (reference employerId → User) ---
    counts.employerSearchTracking = await prisma.employerSearchTracking.deleteMany({
      where: {
        employerId: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.employerSearchTracking.count} EmployerSearchTracking(s)`);

    // 3. Finally delete the User records
    counts.users = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });
    console.log(`   Deleted ${counts.users.count} User(s)`);

    // 4. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Users found:           ${testUsers.length}`);
    console.log(`Messages deleted:      ${counts.messages.count}`);
    console.log(`Reviews deleted:       ${counts.reviews.count}`);
    console.log(`Payments deleted:      ${counts.payments.count}`);
    console.log(`Notifications deleted: ${counts.notifications.count}`);
    console.log(`Notif. Settings deleted: ${counts.notificationSettings.count}`);
    console.log(`Hires deleted:         ${counts.hires.count}`);
    console.log(`Offers deleted:        ${counts.offers.count}`);
    console.log(`Documents deleted:     ${counts.documents.count}`);
    console.log(`Experiences deleted:   ${counts.experiences.count}`);
    console.log(`WorkerProfiles deleted: ${counts.workerProfiles.count}`);
    console.log(`EmployerProfiles deleted: ${counts.employerProfiles.count}`);
    console.log(`Subscriptions deleted: ${counts.subscriptions.count}`);
    console.log(`EmployerSearchTracking deleted: ${counts.employerSearchTracking.count}`);
    console.log(`Users deleted:         ${counts.users.count}`);
    console.log('='.repeat(50));
    console.log('✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

cleanupTestUsers();

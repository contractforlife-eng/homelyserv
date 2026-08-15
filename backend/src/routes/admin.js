// backend/src/routes/admin.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getCommandCenter } from '../controllers/adminCommandCenterController.js';
import { getActivePremiumUserIds, getSubscriptionStaffDetail, getSubscriptionSummaries } from '../services/premiumService.js';
import { aggregateAdminMoney, getAnalytics } from '../controllers/adminController.js';
import { getUserIdentity, enrichMessageIdentities } from '../utils/staffIdentity.js';
import { createAndSendPasswordReset } from '../services/passwordResetTokenService.js';
import { sendRoleChangeNotification } from '../services/emailService.js';
import {
  getDuplicateRefundEvidence,
  reconcilePayment,
} from '../services/paymentReconciliationService.js';
import {
  executeSandboxFullPayPalRefund,
  RefundPolicyError,
} from '../services/paypalRefundService.js';
import { getFinancialCenterData } from '../services/financialCenterService.js';
import { getUserPaymentHistory } from '../services/userPaymentHistoryService.js';

const router = express.Router();

const serializeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  obj.id = obj._id;
  return obj;
};

// Helper: check if a string is a valid MongoDB ObjectId (24 hex chars).
// Legacy records may contain non-ObjectId IDs (e.g. "user_1784367005840")
// which crash Prisma relation queries with P2023. This guard prevents that.
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

// PHASE 0 SECURITY FIX (audit §2.2): this entire router previously had
// NO authentication or authorization check at all - any anonymous
// request could list/search all users, view PII, suspend/activate/
// delete accounts, etc. Every route below now requires a valid JWT
// belonging to a user with role === 'ADMIN'.
router.use(requireAdmin);

// ============================================================
// Admin Command Center (Admin Only)
// Aggregated dashboard endpoint returning all platform KPIs,
// needs-attention complaints, recent activity, recent users,
// recent payments, and recent hires in a single response.
// ============================================================
router.get('/command-center', getCommandCenter);

// ============================================================
// Admin Analytics (Admin Only)
// Real aggregated analytics from Prisma models.
// ============================================================
router.get('/analytics', getAnalytics);

// Read-only operational financial truth. All monetary aggregation is computed
// server-side by book/provider currency; this endpoint performs no mutation or
// provider call.
router.get('/financial-center', async (req, res) => {
  try {
    return res.json({ success: true, financialCenter: await getFinancialCenterData(req.query) });
  } catch (error) {
    const status = error instanceof TypeError ? 400 : 500;
    console.error('Financial Center read failed:', error.message);
    return res.status(status).json({ success: false, message: status === 400 ? error.message : 'Failed to load Financial Center' });
  }
});

// ============================================================
// Get All Users (Admin Only) - FIXED: Shows ALL users
// ============================================================
router.get('/users', async (req, res) => {
  try {
    // Get ALL users - NO filters, NO conditions
    const users = await User.find({})
      .select('-password') // Don't send passwords
      .sort({ createdAt: -1 }); // Newest first
    const summaries = await getSubscriptionSummaries(
      users.map((user) => String(user._id)).filter(isValidObjectId)
    );
    const responseUsers = users.map((user) => {
      const plain = user.toObject();
      return {
        ...plain,
        subscription: summaries.get(String(user._id)) || {
          isPremium: false, status: 'inactive', endDate: null, startDate: null, latestPlan: null,
        },
      };
    });

    console.log(`✅ Admin route: Found ${users.length} users`);
    
    res.json({
      success: true,
      count: users.length,
      users: responseUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Read-only user payment history. No provider operation or payment mutation is
// reachable from this endpoint.
router.get('/users/:id/payment-history', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const userExists = await User.exists({ _id: req.params.id });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const history = await getUserPaymentHistory({
      userId: req.params.id,
      page: req.query.page,
      limit: req.query.limit,
      audience: 'admin',
    });
    return res.json({ success: true, ...history });
  } catch (error) {
    console.error('Get user payment history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get payment history' });
  }
});

// ============================================================
// Get User by ID (Admin Only) - FIXED: Better error handling
// ============================================================
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const subscription = isValidObjectId(String(user._id))
      ? await getSubscriptionStaffDetail(user._id)
      : {
        isPremium: false, status: 'inactive', endDate: null, startDate: null,
        latestPlan: null, grantCounts: { weekly: 0, monthly: 0, legacy: 0 },
        grants: [], historyAvailable: false,
      };
    res.json({
      success: true,
      user: { ...user.toObject(), subscription }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

// ============================================================
// Suspend User (Admin Only) - FIXED: Better handling
// ============================================================
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isSuspended: true,
        status: 'SUSPENDED',
        suspensionReason: reason || 'No reason provided',
        suspendedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`🚫 User suspended: ${user.email}`);
    
    res.json({
      success: true,
      user,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
});

// ============================================================
// Activate User (Admin Only) - FIXED: Better handling
// ============================================================
router.post('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isSuspended: false,
        status: 'ACTIVE',
        suspensionReason: null,
        suspendedAt: null
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ User activated: ${user.email}`);
    
    res.json({
      success: true,
      user,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
});

// ============================================================
// Reset User Password (Admin Only) - Direct Temporary Password
// ============================================================
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.userId;
    const adminRole = req.userRole;

    // Prevent self-password reset through staff endpoint
    if (req.params.id === adminId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset your own password through this endpoint. Use account settings.',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.params.id).select('email fullName role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Authorization: Admin cannot reset another Admin's password
    const targetRole = user.role;
    if (targetRole === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset passwords for admin accounts',
      });
    }

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    user.passwordResetAt = new Date();
    user.mustChangePassword = true;
    await user.save();

    // Send security notification email with temporary password
    sendSecurityNotificationEmail({
      to: user.email,
      actorRole: adminRole,
      reason: 'Password reset by administrator',
      tempPassword: newPassword,
    }).catch((emailError) => {
      console.error('[SECURITY_EMAIL] Failed to send password reset notification:', emailError);
    });

    // Audit log (no password data)
    console.log(`🔑 Password reset by admin ${adminId} for user: ${user.email} (Role: ${targetRole})`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// ============================================================
// Change User Role (Admin Only)
// Admin can set a user's role to WORKER, EMPLOYER, or SUPPORT.
// FORBIDDEN: changing any ADMIN, or the acting admin's own role.
// On success the target user's tokenVersion is bumped, which
// invalidates all of their existing JWTs immediately.
// ============================================================
const ALLOWED_ROLE_CHANGES = ['WORKER', 'EMPLOYER', 'SUPPORT'];

router.put('/users/:id/role', async (req, res) => {
  try {
    const adminId = req.userId;
    const { newRole } = req.body || {};

    // Validate newRole presence and value
    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: 'newRole is required'
      });
    }

    const normalizedRole = String(newRole).toUpperCase();
    if (!ALLOWED_ROLE_CHANGES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'newRole must be one of: WORKER, EMPLOYER, SUPPORT'
      });
    }

    // An admin cannot change their own role through this endpoint
    if (String(req.params.id) === String(adminId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role through this endpoint.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Authorization: Admin cannot change another Admin's role
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change roles of admin accounts'
      });
    }

    const oldRole = user.role;

    // No-op: role already set
    if (oldRole === normalizedRole) {
      return res.json({
        success: true,
        changed: false,
        message: `User role is already ${normalizedRole}`,
        user: serializeUser(user)
      });
    }

    const userId = String(user._id);

    // ============================================================
    // SUPPORT exit guard: block if active complaint assignments exist
    // ============================================================
    if (oldRole === 'SUPPORT') {
      const activeAssignments = await prisma.complaint.count({
        where: {
          assignedSupport: userId,
          status: { notIn: ['RESOLVED', 'CLOSED'] }
        }
      });
      if (activeAssignments > 0) {
        return res.status(409).json({
          success: false,
          message: `This user has ${activeAssignments} active complaint assignment(s). Reassign them before changing the role.`
        });
      }
    }

    // ============================================================
    // TRANSITION TO WORKER: ensure a WorkerProfile exists
    // (create minimal, hidden, non-broken profile when missing)
    // ============================================================
    if (normalizedRole === 'WORKER') {
      const existingProfile = await prisma.workerProfile.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (!existingProfile) {
        await prisma.workerProfile.create({
          data: {
            userId,
            category: '',
            experienceYears: 0,
            expectedSalary: 0,
            availability: 'available',
            workType: 'full-time',
            bioAr: '',
            bioEn: '',
            skills: [],
            profilePhotoUrl: '',
            docStatus: 'pending',
            ratingAvg: 0,
            ratingCount: 0,
            isVisible: false
          }
        });
      }
    }

    // ============================================================
    // TRANSITION AWAY FROM WORKER: hide historical WorkerProfile
    // ============================================================
    if (oldRole === 'WORKER' && normalizedRole !== 'WORKER') {
      const existingProfile = await prisma.workerProfile.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (existingProfile) {
        await prisma.workerProfile.update({
          where: { id: existingProfile.id },
          data: { isVisible: false }
        });
      }
    }

    // ============================================================
    // APPLY ROLE CHANGE + INVALIDATE THE TARGET USER'S SESSIONS
    // ============================================================
    user.role = normalizedRole;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    // Email notification (non-blocking - must never roll back the change)
    sendRoleChangeNotification({
      to: user.email,
      fullName: user.fullName,
      oldRole,
      newRole: normalizedRole
    }).catch((emailError) => {
      console.error('[ROLE_EMAIL] Failed to send role change notification:', emailError);
    });

    // Structured audit log (no password/token data)
    console.log('[AUDIT_ROLE_CHANGE]', JSON.stringify({
      actorAdminId: adminId,
      targetUserId: userId,
      oldRole,
      newRole: normalizedRole,
      timestamp: new Date().toISOString()
    }));

    res.json({
      success: true,
      changed: true,
      message: 'User role updated successfully',
      oldRole,
      newRole: normalizedRole,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user role',
      error: error.message
    });
  }
});

// ============================================================
// Delete User (Admin Only) - FIXED: Added safety check
// ============================================================
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Safety: Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    
    console.log(`🗑️ User deleted: ${user.email}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// ============================================================
// Get Dashboard Stats (Admin Only) - FIXED: Better stats
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEmployers = await User.countDocuments({ role: 'EMPLOYER' });
    const totalWorkers = await User.countDocuments({ role: 'WORKER' });
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const suspendedUsers = await User.countDocuments({ status: 'SUSPENDED' });
    const pendingUsers = await User.countDocuments({ status: 'PENDING' });
    
    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get Prisma stats
    const totalHires = await prisma.hire.count();
    const totalOffers = await prisma.offer.count();
    const completedPaymentMoney = await prisma.payment.findMany({
      where: { status: 'completed' },
      select: { amount: true, currency: true }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalEmployers,
        totalWorkers,
        activeUsers,
        suspendedUsers,
        pendingUsers,
        newUsersLast7Days: newUsers,
        completedPaymentRevenueByCurrency: aggregateAdminMoney(completedPaymentMoney).totals,
        totalComplaints: 0,
        totalHires
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
});

// ============================================================
// Get All Payments (Admin Only)
// Safe against legacy non-ObjectId userId values (P2023).
// ============================================================
router.get('/payments', async (req, res) => {
  try {
    // Fetch base payments WITHOUT relation includes to avoid P2023
    // on records with legacy (non-ObjectId) userId values.
    const payments = await prisma.payment.findMany({
      include: { Refunds: true, SubscriptionGrant: true },
      orderBy: { createdAt: 'desc' }
    });

    // Collect only valid user IDs
    const validUserIds = [...new Set(payments.map(p => p.userId).filter(isValidObjectId))];

    // Batch fetch linked users (only for valid IDs)
    let users = [];
    if (validUserIds.length > 0) {
      users = await prisma.user.findMany({
        where: { id: { in: validUserIds } },
        select: { id: true, fullName: true, email: true, role: true, profileImage: true }
      });
    }
    const userMap = new Map(users.map(u => [u.id, u]));

    // One batched query provides sibling grant context for read-only stacked
    // entitlement ambiguity checks. No Subscription projection is consulted.
    const subscriptionUserIds = [...new Set(payments
      .filter((payment) => payment.purpose === 'SUBSCRIPTION')
      .map((payment) => payment.userId)
      .filter(isValidObjectId))];
    const relatedSubscriptionGrants = subscriptionUserIds.length > 0
      ? await prisma.subscriptionGrant.findMany({
        where: { userId: { in: subscriptionUserIds } },
        select: {
          paymentId: true, userId: true, plan: true, durationDays: true,
          startsAt: true, endsAt: true, status: true,
        },
      })
      : [];
    const grantsByUser = relatedSubscriptionGrants.reduce((map, grant) => {
      const grants = map.get(grant.userId) || [];
      grants.push(grant);
      map.set(grant.userId, grants);
      return map;
    }, new Map());

    // Attach user info only when a valid linked user exists
    const duplicateRefundEvidence = getDuplicateRefundEvidence(payments);
    const enriched = payments.map(payment => {
      const reconciliation = reconcilePayment(payment, duplicateRefundEvidence, {
        relatedGrants: grantsByUser.get(payment.userId) || [],
      });
      const {
        Refunds: _refundEvidence,
        SubscriptionGrant: _subscriptionGrantEvidence,
        ...paymentFields
      } = payment;
      return {
        ...paymentFields,
        User: userMap.get(payment.userId) || null,
        refunds: (payment.Refunds || []).map((refund) => ({
          id: refund.id,
          type: refund.type,
          bookAmount: refund.bookAmount,
          bookCurrency: refund.bookCurrency,
          requestedProviderAmount: refund.requestedProviderAmount,
          providerAmount: refund.providerAmount,
          providerCurrency: refund.providerCurrency,
          providerRefundId: refund.providerRefundId,
          status: refund.status,
          reason: refund.reason,
          createdAt: refund.createdAt,
          completedAt: refund.completedAt,
          failedAt: refund.failedAt,
        })),
        reconciliation,
        subscriptionReconciliation: reconciliation.subscriptionReconciliation,
      };
    });

    const completedRevenue = aggregateAdminMoney(
      payments.filter((payment) => payment.status === 'completed')
    );

    res.json({
      success: true,
      payments: enriched,
      completedRevenueByCurrency: completedRevenue.totals,
      rejectedCurrencyRecords: completedRevenue.rejectedCount,
      revenueSemantic: 'gross_completed_payment_book_revenue_by_currency',
      paypalSandboxRefundsEnabled: String(process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase() !== 'production'
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
});

// Sandbox-only, Admin-only provider refund mutation. The service repeats the
// production guard before any database or OAuth operation; client input never
// supplies monetary, currency, capture, provider, or user authority.
router.post('/payments/:paymentId/refunds', async (req, res) => {
  const forbiddenFields = [
    'amount', 'currency', 'captureId', 'providerRefundId', 'providerAmount',
    'providerCurrency', 'userId', 'paymentMethod', 'type',
  ];
  if (forbiddenFields.some((field) => Object.hasOwn(req.body || {}, field))) {
    return res.status(422).json({ success: false, message: 'Refund financial or provider fields are server-owned' });
  }
  try {
    const refund = await executeSandboxFullPayPalRefund({
      paymentId: req.params.paymentId,
      reason: req.body?.reason,
      adminId: req.userId,
    });
    return res.json({ success: true, refund });
  } catch (error) {
    if (error instanceof RefundPolicyError) {
      return res.status(error.status).json({ success: false, code: error.code, message: error.message });
    }
    console.error('Admin PayPal refund error:', error?.message || 'Unknown error');
    return res.status(500).json({ success: false, message: 'Unable to process refund safely' });
  }
});

// ============================================================
// Get All Hires (Admin Only)
// Safe against legacy non-ObjectId workerId/employerId (P2023).
// ============================================================
router.get('/hires', async (req, res) => {
  try {
    // Fetch base hires WITHOUT relation includes to avoid P2023
    // on records with legacy (non-ObjectId) workerId/employerId.
    const hires = await prisma.hire.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Collect valid employer IDs (Hire.employerId -> User)
    const validEmployerIds = [...new Set(hires.map(h => h.employerId).filter(isValidObjectId))];

    // Collect valid worker profile IDs (Hire.workerId -> WorkerProfile)
    const validWorkerIds = [...new Set(hires.map(h => h.workerId).filter(isValidObjectId))];

    // Batch fetch employers (User records)
    let employers = [];
    if (validEmployerIds.length > 0) {
      employers = await prisma.user.findMany({
        where: { id: { in: validEmployerIds } },
        select: { id: true, fullName: true, email: true }
      });
    }
    const employerMap = new Map(employers.map(u => [u.id, u]));

    // Batch fetch worker profiles (WorkerProfile records)
    let workerProfiles = [];
    if (validWorkerIds.length > 0) {
      workerProfiles = await prisma.workerProfile.findMany({
        where: { id: { in: validWorkerIds } },
        select: { id: true, userId: true }
      });
    }
    const workerProfileMap = new Map(workerProfiles.map(w => [w.id, w]));

    // Batch fetch worker user accounts (from WorkerProfile.userId -> User)
    const validWorkerUserIds = [...new Set(workerProfiles.map(w => w.userId).filter(isValidObjectId))];
    let workerUsers = [];
    if (validWorkerUserIds.length > 0) {
      workerUsers = await prisma.user.findMany({
        where: { id: { in: validWorkerUserIds } },
        select: { id: true, fullName: true, phone: true, city: true }
      });
    }
    const workerUserMap = new Map(workerUsers.map(u => [u.id, u]));

    // Build enriched hires with safe fallbacks
    const enriched = hires.map(hire => {
      const employer = employerMap.get(hire.employerId) || { fullName: 'Unknown Employer', email: null };
      const workerProfile = workerProfileMap.get(hire.workerId) || null;
      const workerUser = workerProfile ? workerUserMap.get(workerProfile.userId) || null : null;
      const worker = workerUser || { fullName: 'Unknown Worker', phone: null, city: null };
      return {
        ...hire,
        employer,
        worker,
      };
    });

    res.json({
      success: true,
      hires: enriched
    });
  } catch (error) {
    console.error('Get hires error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hires',
      error: error.message
    });
  }
});

// ============================================================
// ADD THIS: Search Users (Admin Only)
// ============================================================
router.get('/users/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password').limit(20);
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// ============================================================
// ADD THIS: Get Users by Role (Admin Only)
// ============================================================
router.get('/users/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role: role.toUpperCase() })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// ============================================================
// Get Admin Profile
// ============================================================
router.get('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin profile'
    });
  }
});

// ============================================================
// Update Admin Profile
// ============================================================
router.put('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fullName, phone, language, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, phone, language, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin profile'
    });
  }
});

// ============================================================
// Get System Settings
// ============================================================
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'platform' });
    
    if (!settings) {
      settings = await SystemSettings.create({
        key: 'platform',
        data: {
          siteName: 'HomelyServ',
          siteDescription: 'Home Services Platform',
          contactEmail: 'admin@homelyserv.com',
          contactPhone: '',
          address: '',
          darkMode: false,
          primaryColor: '#f59e0b',
          secondaryColor: '#d97706',
          language: 'en',
          systemNotifications: true,
          emailNotifications: true,
          pushNotifications: true,
          complaintNotifications: true,
          paymentNotifications: true,
          twoFactorAuth: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          requireEmailVerification: false,
          requirePhoneVerification: false,
          currency: 'EGP',
          minWithdrawal: 100,
          maxWithdrawal: 10000,
          paymentMethods: ['cash', 'bank_transfer'],
          allowRegistration: true,
          requireApproval: false,
          maxUsersPerIp: 5,
          autoSuspendAfter: 30,
          debugMode: false,
          maintenanceMode: false,
          cacheEnabled: true,
          backupSchedule: 'daily'
        }
      });
    }

    res.json({
      success: true,
      settings: settings.data
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system settings'
    });
  }
});

// ============================================================
// Update System Settings
// ============================================================
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = req.body.settings || req.body;
    
    const settings = await SystemSettings.findOneAndUpdate(
      { key: 'platform' },
      { data: data },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'System settings saved successfully',
      settings: settings.data
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

// ============================================================
// ADMIN MESSAGING - SECURE CONVERSATION ACCESS
// ============================================================
// Admin does NOT have automatic access to private user chats.
// Admin can only access:
//   1. Escalated conversations (after support escalates)
//   2. Support conversations (supervision)
//   3. Internal staff messages (Support <-> Admin)
// ============================================================

const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

const formatMessage = (msg) => {
  return {
    id: msg._id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    recipientId: msg.recipientId,
    recipientName: msg.recipientName,
    text: msg.text,
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: msg.createdAt,
    read: msg.read,
    delivered: msg.delivered
  };
};

// POST /api/admin/start-conversation
// Start an official HomelyServ administrative conversation with a user.
// Conversation type is SUPPORT (for WORKER/EMPLOYER/USER) or INTERNAL (for SUPPORT).
// Never PRIVATE. Private user chats remain completely isolated.
router.post('/start-conversation', async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = String(req.userId);

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Look up the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, fullName: true, email: true, role: true, profileImage: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine conversation type:
    //   WORKER/EMPLOYER/USER -> SUPPORT (admin acts as support agent)
    //   SUPPORT/ADMIN        -> INTERNAL (staff-to-staff)
    const targetRole = targetUser.role;
    let conversationType = 'SUPPORT';
    let supportAgentId = adminId;
    let staffIds = [];

    if (targetRole === 'SUPPORT' || targetRole === 'ADMIN') {
      conversationType = 'INTERNAL';
      staffIds = [adminId, String(targetUser.id)];
      supportAgentId = null;
    }

    // Build conversation ID (deterministic, same as chat system)
    const conversationId = getConversationId(adminId, targetUser.id);

    // Check if an administrative conversation already exists
    const existingConv = await Conversation.findOne({ conversationId });
    if (existingConv) {
      return res.json({
        success: true,
        conversationId,
        conversation: {
          id: existingConv.conversationId,
          type: existingConv.type,
          participantIds: existingConv.participantIds,
          supportAgentId: existingConv.supportAgentId,
          staffIds: existingConv.staffIds
        },
        existing: true
      });
    }

    // Create conversation metadata
    await Conversation.create({
      conversationId,
      type: conversationType,
      participantIds: [adminId, String(targetUser.id)],
      supportAgentId,
      staffIds,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Official HomelyServ administrative conversation'
    });

    // DYNAMIC STAFF IDENTITY: resolve the REAL admin name from the
    // database — never a hardcoded label.
    const adminIdentity = await getUserIdentity(adminId);

    // Create the initial system message
    await Message.create({
      conversationId,
      senderId: adminId,
      senderName: adminIdentity?.name || 'Admin',
      senderRole: adminIdentity?.role || 'ADMIN',
      recipientId: String(targetUser.id),
      recipientName: targetUser.fullName || 'User',
      recipientRole: targetRole,
      text: 'This is an official HomelyServ administrative conversation. How can we help you?',
      read: false,
      delivered: true
    });

    return res.status(201).json({
      success: true,
      conversationId,
      conversation: {
        id: conversationId,
        type: conversationType,
        participantIds: [adminId, String(targetUser.id)],
        supportAgentId,
        staffIds
      },
      existing: false
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// GET /api/admin/escalated-conversations
// List conversations escalated to Admin by Support.
router.get('/escalated-conversations', async (req, res) => {
  try {
    const conversationsMeta = await Conversation.find({
      type: 'ESCALATED',
      escalatedAt: { $ne: null }
    }).sort({ escalatedAt: -1 });

    if (!conversationsMeta.length) {
      return res.json({ success: true, count: 0, conversations: [] });
    }

    const conversationIds = conversationsMeta.map(c => c.conversationId);
    const userId = String(req.userId);

    const lastMessages = await Message.find({ conversationId: { $in: conversationIds } })
      .sort({ createdAt: -1 });
    const lastMessageMap = new Map();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }

    const unreadAgg = await Message.aggregate([
      { $match: { conversationId: { $in: conversationIds }, recipientId: userId, read: false } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } }
    ]);
    const unreadMap = new Map(unreadAgg.map(item => [item._id, item.count]));

    const userIds = new Set();
    const complaintIds = new Set();
    for (const conv of conversationsMeta) {
      const userParticipantId = conv.participantIds.find(id => id !== conv.supportAgentId);
      if (userParticipantId) userIds.add(userParticipantId);
      if (conv.complaintId) complaintIds.add(conv.complaintId);
    }

    const validUserIds = [...userIds].filter(isValidObjectId);
    const users = validUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: validUserIds } },
          select: { id: true, fullName: true, email: true, role: true, profileImage: true }
        })
      : [];
    const activePremiumIds = await getActivePremiumUserIds(users.map((user) => user.id));
    users.forEach((user) => { user.isPremium = activePremiumIds.has(String(user.id)); });
    const userMap = new Map(users.map(u => [u.id, u]));

    let complaints = [];
    try {
      const validComplaintIds = [...complaintIds].filter(id => typeof id === 'string');
      if (validComplaintIds.length > 0) {
        complaints = await prisma.complaint.findMany({
          where: { id: { in: validComplaintIds } },
          select: { id: true, subject: true, status: true, priority: true, createdAt: true }
        });
      }
    } catch (e) {
      console.error('Error fetching complaints batch:', e.message);
    }
    const complaintMap = new Map(complaints.map(c => [c.id, c]));

    const conversations = [];
    for (const conv of conversationsMeta) {
      const lastMsg = lastMessageMap.get(conv.conversationId);
      if (!lastMsg) continue;

      const userParticipantId = conv.participantIds.find(id => id !== conv.supportAgentId);
      const userInfo = userParticipantId ? userMap.get(userParticipantId) || null : null;

      let complaint = null;
      if (conv.complaintId) {
        complaint = complaintMap.get(conv.complaintId) || null;
      }

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        complaintId: conv.complaintId,
        complaint,
        escalatedBy: conv.escalatedBy,
        escalatedAt: conv.escalatedAt,
        escalationReason: conv.escalationReason,
        participantIds: conv.participantIds,
        supportAgentId: conv.supportAgentId,
        user: userInfo,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: unreadMap.get(conv.conversationId) || 0,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    return res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Error fetching escalated conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch escalated conversations' });
  }
});

// GET /api/admin/support-conversations
// List genuine member <-> support conversations for supervision.
// Staff-to-staff conversations (Admin/Support/SUP_ADMIN) that were
// historically misclassified as SUPPORT are EXCLUDED here (read-time
// only - no database records are modified) so that the Support tab
// shows only real member conversations.
router.get('/support-conversations', async (req, res) => {
  try {
    const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);

    const conversationsMeta = await Conversation.find({
      type: 'SUPPORT',
      $or: [
        { status: 'ACTIVE' },
        { status: { $exists: false } }
      ]
    }).sort({ lastMessageAt: -1 });

    // Resolve the roles of all participants once so we can detect
    // staff-to-staff conversations without touching the database.
    const allParticipantIds = new Set();
    for (const conv of conversationsMeta) {
      for (const id of conv.participantIds || []) allParticipantIds.add(id);
    }
    const validIds = [...allParticipantIds].filter(isValidObjectId);
    const staffUserMap = new Map();
    if (validIds.length > 0) {
      const staffUsers = await prisma.user.findMany({
        where: { id: { in: validIds }, role: { in: ['ADMIN', 'SUPPORT'] } },
        select: { id: true, role: true }
      });
      for (const u of staffUsers) staffUserMap.set(u.id, u.role);
    }

    // Keep only genuine member <-> support conversations: a conversation
    // is staff-to-staff when BOTH participants are staff roles.
    const filteredMeta = conversationsMeta.filter((conv) => {
      const participantIds = conv.participantIds || [];
      const roles = participantIds
        .map((id) => staffUserMap.get(id))
        .filter(Boolean);
      const staffCount = roles.filter((r) => STAFF_ROLES.has(r)).length;
      // Exclude when both participants are staff (staff-to-staff).
      // If we cannot determine both roles (e.g. legacy non-ObjectId ids),
      // keep the conversation as support (safe default).
      if (participantIds.length >= 2 && staffCount >= 2) return false;
      return true;
    });

    if (!filteredMeta.length) {
      return res.json({ success: true, count: 0, conversations: [] });
    }

    const conversationIds = filteredMeta.map(c => c.conversationId);
    const userId = String(req.userId);

    const lastMessages = await Message.find({ conversationId: { $in: conversationIds } })
      .sort({ createdAt: -1 });
    const lastMessageMap = new Map();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }

    const unreadAgg = await Message.aggregate([
      { $match: { conversationId: { $in: conversationIds }, recipientId: userId, read: false } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } }
    ]);
    const unreadMap = new Map(unreadAgg.map(item => [item._id, item.count]));

    const userIds = new Set();
    const supportAgentIds = new Set();
    for (const conv of filteredMeta) {
      const userParticipantId = conv.participantIds.find(id => id !== conv.supportAgentId);
      if (userParticipantId) userIds.add(userParticipantId);
      if (conv.supportAgentId) supportAgentIds.add(conv.supportAgentId);
    }

    const allUserIds = [...new Set([...userIds, ...supportAgentIds])];
    const validUserIds = allUserIds.filter(isValidObjectId);
    const users = validUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: validUserIds } },
          select: { id: true, fullName: true, email: true, role: true, profileImage: true }
        })
      : [];
    const activePremiumIds = await getActivePremiumUserIds(users.map((user) => user.id));
    users.forEach((user) => { user.isPremium = activePremiumIds.has(String(user.id)); });
    const userMap = new Map(users.map(u => [u.id, u]));

    const conversations = [];
    for (const conv of filteredMeta) {
      const lastMsg = lastMessageMap.get(conv.conversationId);
      if (!lastMsg) continue;

      const userParticipantId = conv.participantIds.find(id => id !== conv.supportAgentId);
      const userInfo = userParticipantId ? userMap.get(userParticipantId) || null : null;
      const supportInfo = conv.supportAgentId ? userMap.get(conv.supportAgentId) || null : null;

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        userId: userParticipantId || null,
        user: userInfo,
        supportAgentId: conv.supportAgentId,
        supportAgent: supportInfo,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: unreadMap.get(conv.conversationId) || 0,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    return res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Error fetching support conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch support conversations' });
  }
});

// GET /api/admin/internal-messages
// List internal staff conversations (Support <-> Admin).
// Includes:
//   A. type=INTERNAL conversations where this admin is a staff member
//   B. legacy type=SUPPORT conversations where BOTH participants are
//      staff roles (ADMIN/SUPPORT/SUP_ADMIN) — historically misclassified
//      via the chat /send & /ensure-conversation routes. These are surfaced
//      here READ-ONLY (no database records modified) so they remain visible.
router.get('/internal-messages', async (req, res) => {
  try {
    const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);
    const userId = String(req.userId);

    const internalMeta = await Conversation.find({
      type: 'INTERNAL',
      staffIds: userId,
      $or: [
        { status: 'ACTIVE' },
        { status: { $exists: false } }
      ]
    }).sort({ lastMessageAt: -1 });

    // Legacy staff-to-staff conversations that were misclassified as SUPPORT.
    // We find them by looking for SUPPORT-type conversations where the current
    // admin is a participant AND both participants are staff roles.
    const legacySupportMeta = await Conversation.find({
      type: 'SUPPORT',
      participantIds: userId,
      $or: [
        { status: 'ACTIVE' },
        { status: { $exists: false } }
      ]
    }).sort({ lastMessageAt: -1 });

    // Determine if a legacy SUPPORT conversation is truly staff-to-staff by
    // resolving participant roles. Only keep those where this admin is a
    // participant and the OTHER participant is staff.
    const allParticipantIds = new Set();
    for (const conv of legacySupportMeta) {
      for (const id of conv.participantIds || []) allParticipantIds.add(id);
    }
    const validIds = [...allParticipantIds].filter(isValidObjectId);
    const roleMap = new Map();
    if (validIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: validIds } },
        select: { id: true, role: true }
      });
      for (const u of users) roleMap.set(u.id, u.role);
    }

    const filteredLegacy = legacySupportMeta.filter((conv) => {
      const participantIds = conv.participantIds || [];
      if (participantIds.length < 2) return false;
      const otherId = participantIds.find(id => id !== userId);
      if (!otherId) return false;
      const otherRole = roleMap.get(otherId);
      // Only include when the OTHER participant is staff and this user
      // is also known to be staff (admin requesting this endpoint).
      return STAFF_ROLES.has(otherRole);
    });

    // Merge both sets, avoiding duplicates by conversationId.
    const seen = new Set();
    const mergedMeta = [];
    for (const conv of [...internalMeta, ...filteredLegacy]) {
      if (seen.has(conv.conversationId)) continue;
      seen.add(conv.conversationId);
      mergedMeta.push(conv);
    }
    mergedMeta.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    if (!mergedMeta.length) {
      return res.json({ success: true, count: 0, conversations: [] });
    }

    const conversationIds = mergedMeta.map(c => c.conversationId);

    const lastMessages = await Message.find({ conversationId: { $in: conversationIds } })
      .sort({ createdAt: -1 });
    const lastMessageMap = new Map();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }

    const unreadAgg = await Message.aggregate([
      { $match: { conversationId: { $in: conversationIds }, recipientId: userId, read: false } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } }
    ]);
    const unreadMap = new Map(unreadAgg.map(item => [item._id, item.count]));

    // For INTERNAL conversations, otherStaffId comes from staffIds.
    // For legacy SUPPORT conversations, otherStaffId is the non-admin participant.
    const otherStaffIds = mergedMeta
      .map(conv =>
        conv.type === 'INTERNAL'
          ? conv.staffIds?.find(id => id !== userId)
          : conv.participantIds?.find(id => id !== userId)
      )
      .filter(id => id);

    const validStaffIds = otherStaffIds.filter(isValidObjectId);
    const staffUsers = validStaffIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: validStaffIds } },
          select: { id: true, fullName: true, email: true, role: true, profileImage: true }
        })
      : [];
    const staffMap = new Map(staffUsers.map(u => [u.id, u]));

    const conversations = [];
    for (const conv of mergedMeta) {
      const lastMsg = lastMessageMap.get(conv.conversationId);
      if (!lastMsg) continue;

      const otherStaffId = conv.type === 'INTERNAL'
        ? conv.staffIds?.find(id => id !== userId)
        : conv.participantIds?.find(id => id !== userId);
      const otherStaffInfo = otherStaffId ? staffMap.get(otherStaffId) || null : null;

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        otherStaffId: otherStaffId || null,
        otherStaff: otherStaffInfo,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: unreadMap.get(conv.conversationId) || 0,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    return res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Error fetching internal messages:', error);
    return res.status(500).json({ error: 'Failed to fetch internal messages' });
  }
});

// GET /api/admin/conversations/:conversationId/messages
// Get messages for an admin-accessible conversation.
// Access is verified: only ESCALATED, SUPPORT, or INTERNAL conversations
// where the admin is a staff member.
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.userId);

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Admin access rules:
    // - ESCALATED: admin can access after escalation
    // - SUPPORT: admin can supervise
    // - INTERNAL: admin must be a staff member
    let allowed = false;
    if (conv.type === 'ESCALATED' && conv.escalatedAt) {
      allowed = true;
    } else if (conv.type === 'SUPPORT') {
      allowed = true;
    } else if (conv.type === 'INTERNAL' && conv.staffIds.includes(userId)) {
      allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    // DYNAMIC STAFF IDENTITY: refresh sender names/roles from the database
    const enriched = await enrichMessageIdentities(messages.map(formatMessage));

    return res.json({
      success: true,
      conversation: {
        id: conv.conversationId,
        type: conv.type,
        complaintId: conv.complaintId,
        escalatedBy: conv.escalatedBy,
        escalatedAt: conv.escalatedAt,
        escalationReason: conv.escalationReason,
        participantIds: conv.participantIds,
        supportAgentId: conv.supportAgentId
      },
      messages: enriched
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
});

// ============================================================
// CLOSE CONVERSATION (soft-close)
// POST /api/admin/conversations/:conversationId/close
// Admin-only. Soft-closes a SUPPORT or INTERNAL conversation.
// Does NOT delete messages or conversation metadata.
// ============================================================
router.post('/conversations/:conversationId/close', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.userId);

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Only SUPPORT or INTERNAL conversations may be closed from Admin Messages.
    // PRIVATE conversations must NEVER be affected.
    // ESCALATED conversations are outside the current Admin Messages UI.
    if (conv.type !== 'SUPPORT' && conv.type !== 'INTERNAL') {
      return res.status(403).json({
        error: `Cannot close ${conv.type} conversation from Admin Messages`
      });
    }

    // Verify admin has legitimate access:
    // - SUPPORT: admin can supervise (requireAdmin already applied to router)
    // - INTERNAL: admin must be a staff member
    if (conv.type === 'INTERNAL' && !conv.staffIds.includes(userId)) {
      return res.status(403).json({ error: 'Not authorized to close this conversation' });
    }

    // Idempotent: if already CLOSED, return success
    if (conv.status === 'CLOSED') {
      return res.json({
        success: true,
        message: 'Conversation is already closed',
        conversation: {
          id: conv.conversationId,
          type: conv.type,
          status: conv.status,
          closedAt: conv.closedAt,
          closedBy: conv.closedBy
        }
      });
    }

    // Soft-close: set status, closedAt, closedBy. Do NOT delete anything.
    const updated = await Conversation.findOneAndUpdate(
      { conversationId },
      {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userId
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Conversation closed successfully',
      conversation: {
        id: updated.conversationId,
        type: updated.type,
        status: updated.status,
        closedAt: updated.closedAt,
        closedBy: updated.closedBy
      }
    });
  } catch (error) {
    console.error('Error closing conversation:', error);
    return res.status(500).json({ error: 'Failed to close conversation' });
  }
});

// ============================================================
// One-Time Migration: Normalize Offer.workerId and Hire.workerId
// from legacy User._id to WorkerProfile.id
// Remove this endpoint after running successfully.
// ============================================================
router.post('/migrate/offer-worker-ids', async (req, res) => {
  try {
    const [offers, hires, workerProfiles] = await Promise.all([
      prisma.offer.findMany(),
      prisma.hire.findMany(),
      prisma.workerProfile.findMany()
    ]);

    const profileById = new Map(workerProfiles.map(p => [p.id, p]));
    const profileByUserId = new Map(workerProfiles.map(p => [p.userId, p]));

    let scannedOffers = 0;
    let updatedOffers = 0;
    let skippedOffers = 0;

    let scannedHires = 0;
    let updatedHires = 0;
    let skippedHires = 0;

    for (const offer of offers) {
      scannedOffers++;
      if (profileById.has(offer.workerId)) {
        skippedOffers++;
        continue;
      }
      const profile = profileByUserId.get(offer.workerId);
      if (profile) {
        await prisma.offer.update({
          where: { id: offer.id },
          data: { workerId: profile.id }
        });
        updatedOffers++;
      } else {
        skippedOffers++;
      }
    }

    for (const hire of hires) {
      scannedHires++;
      if (profileById.has(hire.workerId)) {
        skippedHires++;
        continue;
      }
      const profile = profileByUserId.get(hire.workerId);
      if (profile) {
        await prisma.hire.update({
          where: { id: hire.id },
          data: { workerId: profile.id }
        });
        updatedHires++;
      } else {
        skippedHires++;
      }
    }

    console.log(
      `Migration complete: offers scanned=${scannedOffers} updated=${updatedOffers} skipped=${skippedOffers}; ` +
      `hires scanned=${scannedHires} updated=${updatedHires} skipped=${skippedHires}`
    );

    res.json({
      success: true,
      message: 'Migration completed',
      offers: { scanned: scannedOffers, updated: updatedOffers, skipped: skippedOffers },
      hires: { scanned: scannedHires, updated: updatedHires, skipped: skippedHires }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

export default router;

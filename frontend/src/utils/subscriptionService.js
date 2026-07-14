// src/utils/subscriptionService.js
// Premium subscription service for HomelyServ

const SUBSCRIPTION_KEY = 'homelyserv_subscriptions';
const SUBSCRIPTION_PRICES = {
  EMPLOYER: 200, // EGP per month
  WORKER: 100   // EGP per month
};

/**
 * Get all subscriptions
 */
export const getSubscriptions = () => {
  try {
    return JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) || '{}');
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    return {};
  }
};

/**
 * Get subscription for a specific user
 */
export const getUserSubscription = (userId) => {
  const subscriptions = getSubscriptions();
  return subscriptions[userId] || null;
};

/**
 * Check if a user has an active premium subscription
 */
export const isUserPremium = (userId) => {
  if (!userId) return false;
  
  const subscription = getUserSubscription(userId);
  if (!subscription) return false;
  
  // Check if subscription is expired
  if (subscription.expiresAt) {
    const now = new Date();
    const expiryDate = new Date(subscription.expiresAt);
    if (expiryDate < now) {
      // Auto-clean expired subscription
      cancelSubscription(userId);
      return false;
    }
  }
  
  return subscription.active === true;
};

/**
 * Create or renew a subscription
 */
export const createSubscription = (userId, userEmail, userRole, userFullName) => {
  try {
    const subscriptions = getSubscriptions();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription
    
    const price = userRole === 'EMPLOYER' ? SUBSCRIPTION_PRICES.EMPLOYER : SUBSCRIPTION_PRICES.WORKER;
    
    const subscription = {
      userId: userId,
      userEmail: userEmail,
      userRole: userRole,
      userFullName: userFullName,
      active: true,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      price: price,
      currency: 'EGP',
      paymentMethod: null,
      transactionId: 'SUB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      autoRenew: false,
      isVerified: true
    };
    
    subscriptions[userId] = subscription;
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptions));
    
    // ✅ FIX: Update user profile with premium status
    updateUserPremiumStatus(userEmail, true, userId, userRole, userFullName);
    
    // ✅ FIX: Update users list
    updateUsersListPremiumStatus(userEmail, true);
    
    // ✅ FIX: Update current session user
    updateCurrentSessionUser(userEmail, true);
    
    console.log(`✅ Subscription created for ${userFullName} (${userRole})`);
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = (userId) => {
  try {
    const subscriptions = getSubscriptions();
    if (subscriptions[userId]) {
      subscriptions[userId].active = false;
      subscriptions[userId].updatedAt = new Date().toISOString();
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptions));
      
      // Update user profile
      const user = subscriptions[userId];
      updateUserPremiumStatus(user.userEmail, false, userId, user.userRole, user.userFullName);
      updateUsersListPremiumStatus(user.userEmail, false);
      updateCurrentSessionUser(user.userEmail, false);
      
      console.log(`❌ Subscription cancelled for ${user.userFullName}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
};

/**
 * Update user's premium status in profile
 */
const updateUserPremiumStatus = (userEmail, isPremium, userId, userRole, userFullName) => {
  try {
    // Update in homelyserv_profiles
    const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
    if (profiles[userEmail]) {
      profiles[userEmail].isPremium = isPremium;
      profiles[userEmail].subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
    } else if (userEmail) {
      // Create profile if it doesn't exist
      profiles[userEmail] = {
        isPremium: isPremium,
        subscriptionActive: isPremium,
        updatedAt: new Date().toISOString()
      };
      if (userFullName) profiles[userEmail].fullName = userFullName;
      localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
    }
    
    // Update current session user
    updateCurrentSessionUser(userEmail, isPremium);
    
  } catch (error) {
    console.error('Error updating user premium status:', error);
  }
};

/**
 * Update current session user with premium status
 */
const updateCurrentSessionUser = (userEmail, isPremium) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('homelyserv_user') || '{}');
    if (currentUser.email === userEmail) {
      currentUser.isPremium = isPremium;
      currentUser.subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_user', JSON.stringify(currentUser));
      console.log(`✅ Updated current session user premium status: ${isPremium}`);
    }
  } catch (error) {
    console.error('Error updating current session user:', error);
  }
};

/**
 * Update users list with premium status
 */
const updateUsersListPremiumStatus = (userEmail, isPremium) => {
  try {
    const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex !== -1) {
      users[userIndex].isPremium = isPremium;
      users[userIndex].subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_users', JSON.stringify(users));
      console.log(`✅ Updated users list premium status for ${userEmail}: ${isPremium}`);
    }
  } catch (error) {
    console.error('Error updating users list:', error);
  }
};

/**
 * Get subscription price based on role
 */
export const getSubscriptionPrice = (role) => {
  return role === 'EMPLOYER' ? SUBSCRIPTION_PRICES.EMPLOYER : SUBSCRIPTION_PRICES.WORKER;
};

/**
 * Get subscription status for display
 */
export const getSubscriptionStatus = (userId) => {
  const subscription = getUserSubscription(userId);
  if (!subscription) return { active: false, status: 'inactive', message: 'No active subscription' };
  
  const now = new Date();
  const expiryDate = new Date(subscription.expiresAt);
  
  if (!subscription.active) {
    return { active: false, status: 'inactive', message: 'Subscription cancelled' };
  }
  
  if (expiryDate < now) {
    return { active: false, status: 'expired', message: 'Subscription expired' };
  }
  
  const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  return { 
    active: true, 
    status: 'active', 
    message: `Active (${daysLeft} days left)`,
    daysLeft: daysLeft,
    expiresAt: subscription.expiresAt
  };
};

/**
 * Check if a user has premium badge
 */
export const hasPremiumBadge = (userId) => {
  return isUserPremium(userId);
};

/**
 * Get verification badge data for a user
 */
export const getVerificationBadge = (userId, userRole) => {
  const isPremium = isUserPremium(userId);
  if (!isPremium) return null;
  
  return {
    type: 'premium',
    label: 'Premium Verified',
    icon: '⭐',
    color: userRole === 'EMPLOYER' ? 'text-teal-500' : 'text-amber-500',
    bgColor: userRole === 'EMPLOYER' ? 'bg-teal-50' : 'bg-amber-50',
    borderColor: userRole === 'EMPLOYER' ? 'border-teal-200' : 'border-amber-200'
  };
};

/**
 * Sync premium status for a user across all storage locations
 * This is the main function to call when you want to ensure premium status is consistent
 */
export const syncPremiumStatus = (userId, userEmail) => {
  try {
    if (!userId || !userEmail) {
      console.warn('⚠️ Cannot sync premium status: missing userId or userEmail');
      return false;
    }
    
    const isPremium = isUserPremium(userId);
    const subscription = getUserSubscription(userId);
    
    console.log(`🔄 Syncing premium status for ${userEmail}: ${isPremium}`);
    
    // Update user object in session
    const currentUser = JSON.parse(localStorage.getItem('homelyserv_user') || '{}');
    if (currentUser.email === userEmail || currentUser.id === userId) {
      currentUser.isPremium = isPremium;
      currentUser.subscriptionActive = isPremium;
      currentUser.subscription = subscription;
      localStorage.setItem('homelyserv_user', JSON.stringify(currentUser));
      console.log('✅ Updated current session user');
    }
    
    // Update profiles
    const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
    if (profiles[userEmail]) {
      profiles[userEmail].isPremium = isPremium;
      profiles[userEmail].subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
      console.log('✅ Updated profiles');
    }
    
    // Update users list
    const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex !== -1) {
      users[userIndex].isPremium = isPremium;
      users[userIndex].subscriptionActive = isPremium;
      users[userIndex].subscription = subscription;
      localStorage.setItem('homelyserv_users', JSON.stringify(users));
      console.log('✅ Updated users list');
    }
    
    console.log(`✅ Synced premium status for ${userEmail}: ${isPremium}`);
    return isPremium;
  } catch (error) {
    console.error('Error syncing premium status:', error);
    return false;
  }
};

/**
 * Force refresh premium status for a user
 * This checks the subscription data and updates all storage locations
 */
export const refreshPremiumStatus = (userEmail) => {
  try {
    if (!userEmail) return false;
    
    // Find user ID from email
    const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    const user = users.find(u => u.email === userEmail);
    if (!user) {
      console.warn(`⚠️ User not found: ${userEmail}`);
      return false;
    }
    
    const userId = user.id || userEmail;
    return syncPremiumStatus(userId, userEmail);
  } catch (error) {
    console.error('Error refreshing premium status:', error);
    return false;
  }
};

/**
 * Get all premium users
 */
export const getPremiumUsers = () => {
  try {
    const subscriptions = getSubscriptions();
    const premiumUsers = [];
    
    Object.keys(subscriptions).forEach(userId => {
      const sub = subscriptions[userId];
      if (sub.active) {
        const now = new Date();
        const expiryDate = new Date(sub.expiresAt);
        if (expiryDate >= now) {
          premiumUsers.push(sub);
        }
      }
    });
    
    return premiumUsers;
  } catch (error) {
    console.error('Error getting premium users:', error);
    return [];
  }
};

/**
 * Get subscription statistics
 */
export const getSubscriptionStats = () => {
  try {
    const subscriptions = getSubscriptions();
    const totalSubscriptions = Object.keys(subscriptions).length;
    let activeCount = 0;
    let expiredCount = 0;
    let employerCount = 0;
    let workerCount = 0;
    let totalRevenue = 0;
    
    Object.keys(subscriptions).forEach(userId => {
      const sub = subscriptions[userId];
      if (sub.active) {
        const now = new Date();
        const expiryDate = new Date(sub.expiresAt);
        if (expiryDate >= now) {
          activeCount++;
          totalRevenue += sub.price || 0;
        } else {
          expiredCount++;
        }
      } else {
        expiredCount++;
      }
      
      if (sub.userRole === 'EMPLOYER') {
        employerCount++;
      } else if (sub.userRole === 'WORKER') {
        workerCount++;
      }
    });
    
    return {
      totalSubscriptions,
      activeCount,
      expiredCount,
      employerCount,
      workerCount,
      totalRevenue
    };
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    return {
      totalSubscriptions: 0,
      activeCount: 0,
      expiredCount: 0,
      employerCount: 0,
      workerCount: 0,
      totalRevenue: 0
    };
  }
};

/**
 * Check if subscription is expired
 */
export const isSubscriptionExpired = (userId) => {
  const subscription = getUserSubscription(userId);
  if (!subscription) return true;
  
  if (!subscription.active) return true;
  
  if (subscription.expiresAt) {
    const now = new Date();
    const expiryDate = new Date(subscription.expiresAt);
    return expiryDate < now;
  }
  
  return false;
};

/**
 * Get days remaining on subscription
 */
export const getSubscriptionDaysRemaining = (userId) => {
  const subscription = getUserSubscription(userId);
  if (!subscription || !subscription.active) return 0;
  
  if (subscription.expiresAt) {
    const now = new Date();
    const expiryDate = new Date(subscription.expiresAt);
    if (expiryDate < now) return 0;
    return Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
};

/**
 * Extend subscription by days
 */
export const extendSubscription = (userId, days) => {
  try {
    const subscriptions = getSubscriptions();
    if (!subscriptions[userId]) {
      console.warn(`⚠️ No subscription found for user: ${userId}`);
      return false;
    }
    
    const now = new Date();
    const currentExpiry = new Date(subscriptions[userId].expiresAt);
    const newExpiry = currentExpiry > now ? currentExpiry : now;
    newExpiry.setDate(newExpiry.getDate() + days);
    
    subscriptions[userId].expiresAt = newExpiry.toISOString();
    subscriptions[userId].active = true;
    subscriptions[userId].updatedAt = now.toISOString();
    
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptions));
    
    // Sync premium status
    const user = subscriptions[userId];
    syncPremiumStatus(userId, user.userEmail);
    
    console.log(`✅ Extended subscription for ${user.userFullName} by ${days} days`);
    return true;
  } catch (error) {
    console.error('Error extending subscription:', error);
    return false;
  }
};

/**
 * Update subscription payment method
 */
export const updateSubscriptionPaymentMethod = (userId, paymentMethod) => {
  try {
    const subscriptions = getSubscriptions();
    if (!subscriptions[userId]) {
      console.warn(`⚠️ No subscription found for user: ${userId}`);
      return false;
    }
    
    subscriptions[userId].paymentMethod = paymentMethod;
    subscriptions[userId].updatedAt = new Date().toISOString();
    
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptions));
    console.log(`✅ Updated payment method for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating payment method:', error);
    return false;
  }
};

/**
 * Get subscription history for a user
 */
export const getSubscriptionHistory = (userId) => {
  try {
    const receipts = JSON.parse(localStorage.getItem('subscription_receipts') || '[]');
    return receipts.filter(r => r.userId === userId || r.userEmail === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error getting subscription history:', error);
    return [];
  }
};

export default {
  getSubscriptions,
  getUserSubscription,
  isUserPremium,
  createSubscription,
  cancelSubscription,
  getSubscriptionPrice,
  getSubscriptionStatus,
  hasPremiumBadge,
  getVerificationBadge,
  syncPremiumStatus,
  refreshPremiumStatus,
  getPremiumUsers,
  getSubscriptionStats,
  isSubscriptionExpired,
  getSubscriptionDaysRemaining,
  extendSubscription,
  updateSubscriptionPaymentMethod,
  getSubscriptionHistory
};
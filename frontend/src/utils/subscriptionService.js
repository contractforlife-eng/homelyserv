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
    
    // Also update user profile with premium status
    updateUserPremiumStatus(userEmail, true);
    
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
      updateUserPremiumStatus(user.userEmail, false);
      
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
const updateUserPremiumStatus = (userEmail, isPremium) => {
  try {
    // Update in homelyserv_users
    const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex !== -1) {
      users[userIndex].isPremium = isPremium;
      users[userIndex].subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_users', JSON.stringify(users));
    }
    
    // Update in homelyserv_profiles
    const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
    if (profiles[userEmail]) {
      profiles[userEmail].isPremium = isPremium;
      profiles[userEmail].subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
    }
    
    // Update current session user
    const currentUser = JSON.parse(localStorage.getItem('homelyserv_user') || '{}');
    if (currentUser.email === userEmail) {
      currentUser.isPremium = isPremium;
      currentUser.subscriptionActive = isPremium;
      localStorage.setItem('homelyserv_user', JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error('Error updating user premium status:', error);
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
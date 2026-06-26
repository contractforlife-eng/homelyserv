import useAuthStore from '../store/authStore';

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const { isAuthenticated } = useAuthStore.getState();
  return isAuthenticated;
};

/**
 * Get current user
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const { user } = useAuthStore.getState();
  return user;
};

/**
 * Get user's role
 * @returns {string|null}
 */
export const getUserRole = () => {
  const { user } = useAuthStore.getState();
  return user?.role || null;
};

/**
 * Check if user is a worker
 * @returns {boolean}
 */
export const isWorker = () => {
  const { isWorker } = useAuthStore.getState();
  return isWorker();
};

/**
 * Check if user is an employer
 * @returns {boolean}
 */
export const isEmployer = () => {
  const { isEmployer } = useAuthStore.getState();
  return isEmployer();
};

/**
 * Check if user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const { isAdmin } = useAuthStore.getState();
  return isAdmin();
};

/**
 * Get auth token
 * @returns {string|null}
 */
export const getAuthToken = () => {
  const { token } = useAuthStore.getState();
  return token;
};

/**
 * Get user's full name
 * @returns {string}
 */
export const getUserName = () => {
  const { getUserName } = useAuthStore.getState();
  return getUserName();
};

/**
 * Require authentication - redirects to login if not authenticated
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} - True if authenticated
 */
export const requireAuth = (navigate) => {
  if (!isAuthenticated()) {
    navigate('/login');
    return false;
  }
  return true;
};

/**
 * Require specific role - redirects to home if user doesn't have role
 * @param {string|string[]} roles - Required role(s)
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} - True if user has required role
 */
export const requireRole = (roles, navigate) => {
  if (!isAuthenticated()) {
    navigate('/login');
    return false;
  }
  
  const userRole = getUserRole();
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!requiredRoles.includes(userRole)) {
    navigate('/');
    return false;
  }
  
  return true;
};

/**
 * Get profile completion percentage
 * @returns {number}
 */
export const getProfileCompletion = () => {
  const { getProfileCompletion } = useAuthStore.getState();
  return getProfileCompletion();
};

/**
 * Format user data for display
 * @param {Object} user - User object
 * @returns {Object} - Formatted user data
 */
export const formatUserData = (user) => {
  if (!user) return null;
  
  return {
    ...user,
    displayName: user.fullName || user.name || 'User',
    initials: (user.fullName || user.name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    isVerified: user.isVerified || false,
    isSuspended: user.isSuspended || false,
  };
};

/**
 * Get user's dashboard route based on role
 * @param {string} role - User role
 * @returns {string} - Dashboard route
 */
export const getDashboardRoute = (role) => {
  switch (role) {
    case 'worker':
      return '/worker-dashboard';
    case 'employer':
      return '/employer-dashboard';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

/**
 * Check if user has completed their profile
 * @returns {boolean}
 */
export const hasCompletedProfile = () => {
  const completion = getProfileCompletion();
  return completion >= 70;
};

/**
 * Get user's language preference
 * @returns {string}
 */
export const getUserLanguage = () => {
  const { language } = useAuthStore.getState();
  return language || 'en';
};

/**
 * Set user's language preference
 * @param {string} lang - Language code ('en' or 'ar')
 */
export const setUserLanguage = (lang) => {
  useAuthStore.getState().setLanguage(lang);
};

/**
 * Get user's display avatar (initials or image)
 * @param {Object} user - User object
 * @param {number} size - Avatar size in pixels
 * @returns {Object} - Avatar data
 */
export const getUserAvatar = (user, size = 40) => {
  const formatted = formatUserData(user);
  return {
    initials: formatted?.initials || '?',
    hasImage: Boolean(user?.profilePhotoUrl),
    imageUrl: user?.profilePhotoUrl || null,
    backgroundColor: getColorFromName(formatted?.displayName || 'User'),
    size
  };
};

/**
 * Generate color from name for avatar
 * @param {string} name - User name
 * @returns {string} - Color code
 */
const getColorFromName = (name) => {
  const colors = [
    '#EF4444', // Red
    '#F59E0B', // Yellow
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#06B6D4', // Cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Export all helpers as default
export default {
  isAuthenticated,
  getCurrentUser,
  getUserRole,
  isWorker,
  isEmployer,
  isAdmin,
  getAuthToken,
  getUserName,
  requireAuth,
  requireRole,
  getProfileCompletion,
  formatUserData,
  getDashboardRoute,
  hasCompletedProfile,
  getUserLanguage,
  setUserLanguage,
  getUserAvatar
};
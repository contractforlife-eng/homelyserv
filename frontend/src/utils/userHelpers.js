// frontend/src/utils/userHelpers.js

// Default image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';

// Get user image with fallback — pure function, no localStorage
export const getUserImage = (user) => {
  if (user && user.image) {
    return user.image;
  }
  return DEFAULT_IMAGE;
};

// Get user name with fallback — pure function, no localStorage
export const getUserName = (user) => {
  if (user && user.fullName) {
    return user.fullName;
  }
  return 'User';
};

// Get user role with fallback — pure function, no localStorage
export const getUserRole = (user) => {
  if (user && user.role) {
    return user.role;
  }
  return 'WORKER';
};

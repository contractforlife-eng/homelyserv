// frontend/src/utils/userHelpers.js

// Default image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';

// Get user data with fallback for image
export const getUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      // Ensure image field exists
      if (!user.image) {
        user.image = DEFAULT_IMAGE;
        localStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    }
    return null;
  } catch (e) {
    console.error('Error getting user:', e);
    return null;
  }
};

// Update user data in localStorage
export const updateUser = (userData) => {
  try {
    const currentUser = getUser();
    const updatedUser = { 
      ...currentUser, 
      ...userData,
      image: userData.image || DEFAULT_IMAGE
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  } catch (e) {
    console.error('Error updating user:', e);
    return null;
  }
};

// Save user data to localStorage (for login/register)
export const saveUser = (userData) => {
  try {
    const userToSave = {
      ...userData,
      image: userData.image || DEFAULT_IMAGE
    };
    localStorage.setItem('user', JSON.stringify(userToSave));
    return userToSave;
  } catch (e) {
    console.error('Error saving user:', e);
    return null;
  }
};

// Get user image with fallback
export const getUserImage = () => {
  const user = getUser();
  if (user && user.image) {
    return user.image;
  }
  return DEFAULT_IMAGE;
};

// Get user name with fallback
export const getUserName = () => {
  const user = getUser();
  if (user && user.fullName) {
    return user.fullName;
  }
  return 'User';
};

// Get user role with fallback
export const getUserRole = () => {
  const user = getUser();
  if (user && user.role) {
    return user.role;
  }
  return 'WORKER';
};

// Clear user data
export const clearUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
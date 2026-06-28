// Get user data with fallback for image
export const getUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      // Ensure image field exists
      if (!user.image) {
        user.image = 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';
        // Update localStorage with default image
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
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  } catch (e) {
    console.error('Error updating user:', e);
    return null;
  }
};

// Get user image with fallback
export const getUserImage = () => {
  const user = getUser();
  if (user && user.image) {
    return user.image;
  }
  return 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';
};

// Get user name with fallback
export const getUserName = () => {
  const user = getUser();
  if (user && user.fullName) {
    return user.fullName;
  }
  return 'User';
};
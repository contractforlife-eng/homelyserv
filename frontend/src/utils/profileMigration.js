import api from '../utils/api';

const isBase64Image = (str) => typeof str === 'string' && str.startsWith('data:image/');

export const migrateLegacyProfileIfNeeded = async (user, token) => {
  if (!user || !user.email || !token) {
    return null;
  }

  if (user.image || user.profileImage) {
    return null;
  }

  let legacyImage = null;
  try {
    const profiles = JSON.parse(
      localStorage.getItem('homelyserv_profiles') || '{}'
    );
    legacyImage = profiles[user.email]?.profileImage || null;
  } catch (e) {
    console.warn('Could not read homelyserv_profiles from localStorage:', e);
    return null;
  }

  if (!legacyImage) {
    return null;
  }

  if (isBase64Image(legacyImage)) {
    console.warn('Migration: skipping base64 image from localStorage');
    return null;
  }

  try {
    const response = await api.put('/api/auth/profile', {
      profileImage: legacyImage
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success && response.data.user) {
      console.log('Migration: profile image migrated to MongoDB successfully');
      return response.data.user;
    }

    console.warn('Migration: unexpected response format:', response.data);
    return null;
  } catch (error) {
    console.error('Migration: network error while migrating profile image:', error);
    return null;
  }
};

export default migrateLegacyProfileIfNeeded;

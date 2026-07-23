// frontend/src/utils/profileMigration.js
// One-time migration: copies profileImage from legacy localStorage to MongoDB
// when MongoDB has no profileImage but localStorage does.
// After migration, MongoDB is the single source of truth.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Migrates the user's profile image from localStorage (homelyserv_profiles)
 * to MongoDB if MongoDB does not already have one.
 *
 * Conditions for migration:
 *   - MongoDB user.profileImage is null/empty
 *   - localStorage homelyserv_profiles[email].profileImage exists and is truthy
 *
 * Idempotent: once MongoDB has a profileImage, this becomes a no-op.
 * Safe: never overwrites an existing MongoDB value.
 *
 * @param {Object} user - The user object from Zustand/MongoDB
 * @param {string} token - The JWT token for authenticated requests
 * @returns {Object|null} Updated user object if migration occurred, null otherwise
 */
export const migrateLegacyProfileIfNeeded = async (user, token) => {
  if (!user || !user.email || !token) {
    return null;
  }

  // Condition 1: MongoDB already has a profileImage — skip
  if (user.image || user.profileImage) {
    return null;
  }

  // Condition 2: Check localStorage for legacy profile image
  let legacyImage = null;
  try {
    const profiles = JSON.parse(
      localStorage.getItem('homelyserv_profiles') || '{}'
    );
    legacyImage = profiles[user.email]?.profileImage || null;
  } catch (e) {
    console.warn('⚠️ Could not read homelyserv_profiles from localStorage:', e);
    return null;
  }

  if (!legacyImage) {
    return null;
  }

  // Perform migration: save legacy image to MongoDB via generic auth profile endpoint
  try {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ profileImage: legacyImage })
    });

    if (!response.ok) {
      console.error('❌ Migration: failed to update profile image in MongoDB:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.success && data.user) {
      console.log('✅ Migration: profile image migrated to MongoDB successfully');
      // Avoid deleting the legacy data — let old code continue working
      // until all references are cleaned up
      return data.user;
    }

    console.warn('⚠️ Migration: unexpected response format:', data);
    return null;
  } catch (error) {
    console.error('❌ Migration: network error while migrating profile image:', error);
    return null;
  }
};

export default migrateLegacyProfileIfNeeded;
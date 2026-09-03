// frontend/src/utils/avatarUtils.js
/**
 * Normalizes user avatar URLs:
 * - Preserves absolute HTTPS/HTTP URLs (e.g. Cloudinary).
 * - Preserves data: and blob: URLs.
 * - Resolves relative backend upload paths (e.g. /uploads/... or uploads/...)
 *   against the canonical backend API_BASE origin.
 * @param {string|null|undefined} image - Raw image string
 * @param {string} [apiBase] - API base URL override
 * @returns {string|null} Normalized URL or null
 */
export const resolveAvatarUrl = (
  image,
  apiBase = (typeof process !== 'undefined' && process.env?.VITE_API_URL)
    ? process.env.VITE_API_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:5000')
) => {
  if (!image || typeof image !== 'string') return null;
  const trimmed = image.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const baseOrigin = (apiBase || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return baseOrigin ? `${baseOrigin}${cleanPath}` : cleanPath;
};

export default {
  resolveAvatarUrl,
};

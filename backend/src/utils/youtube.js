// backend/src/utils/youtube.js
// ============================================================
// YOUTUBE URL PARSER & VALIDATOR (HomelyServ LMS)
// ============================================================

/**
 * Regex for standard YouTube URLs:
 * Matches:
 *  - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *  - https://youtube.com/watch?v=dQw4w9WgXcQ
 *  - http://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s
 *  - https://youtu.be/dQw4w9WgXcQ
 *  - https://www.youtube.com/embed/dQw4w9WgXcQ
 *  - https://www.youtube.com/v/dQw4w9WgXcQ
 *  - https://www.youtube.com/shorts/dQw4w9WgXcQ
 */
const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;

/**
 * Extracts and sanitizes the 11-character YouTube video ID.
 * Returns null if the URL is invalid.
 *
 * @param {string} url
 * @returns {string|null}
 */
export const extractYouTubeVideoId = (url) => {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(YOUTUBE_REGEX);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }
  return null;
};

/**
 * Builds the privacy-enhanced nocookie embed URL for HomelyServ.
 *
 * @param {string} videoId
 * @returns {string}
 */
export const buildYouTubeEmbedUrl = (videoId) => {
  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
    return '';
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
};

export default {
  extractYouTubeVideoId,
  buildYouTubeEmbedUrl
};

// frontend/src/utils/fileDownload.js
// ============================================================
// CROSS-PLATFORM SECURE FILE DOWNLOAD HELPER
// ============================================================
// Handles secure downloads across Web browsers and Capacitor Android.
// In Web: Fetches as Blob if possible to enforce the server-specified
// original filename via an anchor download, and falls back to window.open
// if CORS prevents direct blob consumption.
// In Native/Capacitor: Gracefully opens the signed URL in browser/system viewer.
// ============================================================
import { Capacitor } from '@capacitor/core';

/**
 * Formats byte size into human-readable string (e.g. "1.2 MB", "450 KB").
 *
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
};

/**
 * Triggers a secure download of a file from a signed URL.
 *
 * @param {string} url - Short-lived signed download URL
 * @param {string} fallbackFilename - Expected original filename (e.g. "syllabus.pdf")
 * @returns {Promise<void>}
 */
export const triggerFileDownload = async (url, fallbackFilename = 'material.pdf') => {
  if (!url) {
    throw new Error('Download URL is missing or invalid');
  }

  const safeFilename = String(fallbackFilename || 'material.pdf').replace(/[\r\n\t"]/g, '_');
  const isNative = Capacitor.isNativePlatform();

  // If running inside Capacitor mobile app, open the system browser/viewer
  if (isNative) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Web environment: attempt to fetch as blob so the native HTML5 download attribute
  // guarantees the exact originalFilename instead of Cloudinary's generated hash
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Failed to fetch file (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = safeFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 10000);
  } catch (err) {
    // If fetch failed (e.g. cross-origin blocking or network error), fallback to direct link click
    console.warn('Direct blob fetch failed, falling back to direct navigation:', err);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = safeFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default {
  formatFileSize,
  triggerFileDownload
};

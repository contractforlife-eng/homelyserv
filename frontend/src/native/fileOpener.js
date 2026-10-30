import { registerPlugin } from '@capacitor/core';

const HomelyServFileOpener = registerPlugin('HomelyServFileOpener');

/**
 * Downloads and permanently saves a file on Android to public Downloads (or SAF document picker).
 *
 * @param {Object} options
 * @param {string} options.base64Data - Base64 encoded file data
 * @param {string} options.filename - Desired filename (e.g. 'سيرة_ذاتية.pdf' or 'CV.docx')
 * @param {string} [options.mimeType] - MIME type of the file
 * @returns {Promise<{ success: boolean, filename: string, uri: string, mimeType: string }>}
 */
export const downloadFile = async ({ base64Data, filename, mimeType }) => {
  return HomelyServFileOpener.downloadFile({ base64Data, filename, mimeType });
};

/**
 * Opens a file on Android using native Intent.ACTION_VIEW with temporary read permission.
 *
 * @param {Object} options
 * @param {string} [options.uri] - Content URI of the saved file
 * @param {string} [options.base64Data] - Base64 encoded file data if fallback caching is needed
 * @param {string} options.filename - Filename
 * @param {string} [options.mimeType] - MIME type
 * @returns {Promise<{ success: boolean, filename: string }>}
 */
export const openFile = async ({ uri, base64Data, filename, mimeType }) => {
  return HomelyServFileOpener.openFile({ uri, base64Data, filename, mimeType });
};

export default {
  downloadFile,
  openFile,
};

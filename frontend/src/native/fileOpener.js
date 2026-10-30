import { registerPlugin } from '@capacitor/core';

const HomelyServFileOpener = registerPlugin('HomelyServFileOpener');

/**
 * Open a file represented as base64 on Android using native FileProvider and Intent.ACTION_VIEW.
 *
 * @param {Object} options
 * @param {string} options.base64Data - Base64 encoded file data
 * @param {string} options.filename - Desired filename (e.g. 'سيرة_ذاتية.pdf' or 'CV.pdf')
 * @param {string} [options.mimeType] - MIME type of the file (e.g. 'application/pdf')
 * @returns {Promise<{ success: boolean, filename: string }>}
 */
export const openBase64File = async ({ base64Data, filename, mimeType }) => {
  return HomelyServFileOpener.openBase64File({ base64Data, filename, mimeType });
};

export default HomelyServFileOpener;

/**
 * Pure helper for safely reading installed app info via @capacitor/app.
 * Exported separately from React UI components to be cleanly testable in Node.
 */
export const fetchAppVersionInfo = async ({ isNativePlatform, getInfo }) => {
  if (typeof isNativePlatform === 'function' ? !isNativePlatform() : !isNativePlatform) {
    return null;
  }
  if (typeof getInfo !== 'function') {
    return null;
  }
  try {
    const info = await getInfo();
    if (info && (info.version || info.build)) {
      return {
        version: info.version || '',
        build: info.build || '',
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to retrieve native app info:', error);
    return null;
  }
};

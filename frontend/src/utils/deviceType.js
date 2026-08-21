export const classifyDevice = (userAgent = '', platform = '', maxTouchPoints = 0) => {
  const ua = String(userAgent || '');
  const normalizedPlatform = String(platform || '');

  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || (normalizedPlatform === 'MacIntel' && maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Windows NT|Macintosh|X11|Linux x86_64|Linux armv/i.test(ua)) return 'desktop';
  return 'unknown';
};

export default classifyDevice;

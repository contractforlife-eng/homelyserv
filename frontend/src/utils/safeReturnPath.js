const ALLOWED_RETURN_PREFIXES = ['/marketplace', '/wall'];

export const sanitizeMarketplaceListReturnPath = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  try {
    const url = new URL(value, 'https://www.homelyserv.com');
    if (url.origin !== 'https://www.homelyserv.com') return null;
    const pathname = url.pathname;
    // Must be either /marketplace or /marketplace/mine (not a detail or edit path)
    const isListPath = pathname === '/marketplace' || pathname === '/marketplace/' || pathname === '/marketplace/mine' || pathname === '/marketplace/mine/';
    return isListPath ? `${pathname}${url.search}` : null;
  } catch {
    return null;
  }
};

export const sanitizeReturnPath = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  try {
    const url = new URL(value, 'https://www.homelyserv.com');
    if (url.origin !== 'https://www.homelyserv.com') return null;
    return ALLOWED_RETURN_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
};

export const storeMarketplaceReturnPath = (value) => {
  const safe = sanitizeReturnPath(value);
  if (safe) sessionStorage.setItem('homelyserv_return_to', safe);
  return safe;
};

export const consumeMarketplaceReturnPath = () => {
  const safe = sanitizeReturnPath(sessionStorage.getItem('homelyserv_return_to'));
  sessionStorage.removeItem('homelyserv_return_to');
  return safe;
};

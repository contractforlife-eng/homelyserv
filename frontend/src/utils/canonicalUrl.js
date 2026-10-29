export const HOMELYSERV_ORIGIN = 'https://www.homelyserv.com';

export function getCanonicalUrl(path) {
  try {
    const value = String(path || '/');
    const candidate = new URL(value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `/${value}`, HOMELYSERV_ORIGIN);
    if (candidate.protocol !== 'https:' || candidate.origin !== HOMELYSERV_ORIGIN || candidate.username || candidate.password || candidate.port) return `${HOMELYSERV_ORIGIN}/`;
    return candidate.href;
  } catch { return `${HOMELYSERV_ORIGIN}/`; }
}

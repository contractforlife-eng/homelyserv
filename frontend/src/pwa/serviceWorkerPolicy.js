export const isSafeStaticRequest = ({ method = 'GET', origin, appOrigin, pathname = '', destination = '' }) => {
  if (method !== 'GET') return false;
  if (origin !== appOrigin) return false;
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/socket.io/')) return false;
  if (pathname.startsWith('/downloads/')) return false;
  if (pathname.includes('/backend')) return false;
  return ['script', 'style', 'font', 'image'].includes(destination);
};

// Existing API configuration (single source, also used by utils/axiosConfig.js).
// The `import.meta.env &&` guard keeps this module importable in plain Node
// (frontend unit tests) where Vite does not define import.meta.env; behavior
// under Vite dev/build is unchanged.
export const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'https://adventurous-grace-production-1b38.up.railway.app';

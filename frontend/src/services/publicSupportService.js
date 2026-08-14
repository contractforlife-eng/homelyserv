import axios from 'axios';
import { API_BASE } from '../config/api';
import { cleanupObsoleteHomelyServStorage, isQuotaExceededError } from '../utils/storageMaintenance';

const SESSION_KEY = 'homelyserv_public_support_session';
const publicApi = axios.create({ baseURL: `${API_BASE}/api/public-support` });

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[PublicSupport] Request failed', {
        stage: `${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url || 'unknown'}`,
        status: error.response?.status || 'NETWORK_OR_CORS',
        message: error.response?.data?.message || error.message,
      });
    }
    return Promise.reject(error);
  }
);

export const getStoredGuestSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw || raw.length > 1024) {
    if (raw) localStorage.removeItem(SESSION_KEY);
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.publicId !== 'string' || parsed.publicId.length > 100 || typeof parsed.token !== 'string' || parsed.token.length < 20 || parsed.token.length > 256) throw new Error('Malformed guest session');
    return { publicId:parsed.publicId, token:parsed.token };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};
export const storeGuestSession = (session) => {
  const minimal = { publicId:String(session?.publicId || '').slice(0,100), token:String(session?.token || '').slice(0,256) };
  if (!minimal.publicId || minimal.token.length < 20) return false;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(minimal)); return true; }
  catch (error) {
    if (isQuotaExceededError(error)) cleanupObsoleteHomelyServStorage();
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(minimal)); return true; }
    catch { return false; }
  }
};
export const clearGuestSession = () => localStorage.removeItem(SESSION_KEY);
const guestHeaders = (token) => ({ 'X-Guest-Token': token });

export async function createGuestSession(language) {
  const { data } = await publicApi.post('/session', { language });
  const session = { publicId:data.conversation.publicId, token:data.token };
  storeGuestSession(session);
  return { ...data, session };
}
export const loadGuestSession = async ({ publicId, token }) => (await publicApi.get(`/session/${publicId}`, { headers:guestHeaders(token) })).data;
export const sendGuestMessage = async ({ publicId, token, body, clientMessageId, language }) => (await publicApi.post(`/session/${publicId}/messages`, { body, clientMessageId, language }, { headers:guestHeaders(token) })).data;
export const escalateGuestSession = async ({ publicId, token, name, email, language, reason }) => (await publicApi.post(`/session/${publicId}/escalate`, { name, email, language, reason }, { headers:guestHeaders(token) })).data;

export const createClientMessageId = () => `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export default publicApi;

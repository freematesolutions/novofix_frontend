import axios from 'axios';

// Build a robust baseURL using Vite envs.
// - In development, prefer relative "/api" and let Vite devServer proxy handle target (avoids CORS).
// - In production, use the absolute host from VITE_API_URL and append the API prefix.
const MODE = import.meta.env.MODE;
const HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PREFIX = (import.meta.env.VITE_API_PREFIX || '/api').replace(/^(?!\/)/, '/');

const baseURL = MODE === 'development'
  ? PREFIX
  : HOST
    ? (HOST.toLowerCase().endsWith(PREFIX.toLowerCase()) ? HOST : `${HOST}${PREFIX}`)
    : `${window.location.origin}${PREFIX}`; // final fallback when no env host provided

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // Default timeout: 60 segundos (puede ser sobreescrito por request)
});

// Stable client identifier to deduplicate first-visit parallel requests
// Regenerates every 90 days for privacy (TTL metadata stored separately)
let CLIENT_ID = undefined;
try {
  const KEY = 'client_id';
  const META_KEY = 'client_id_meta';
  const TTL_DAYS = 90;
  const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;
  
  // Check if existing ID is still valid (within TTL)
  const metaRaw = localStorage.getItem(META_KEY);
  const meta = metaRaw ? JSON.parse(metaRaw) : null;
  const isValid = meta?.id && meta?.createdAt && (Date.now() - meta.createdAt) < TTL_MS;
  
  if (isValid) {
    CLIENT_ID = meta.id;
    // Also ensure the ID is in the direct key for backwards compat
    localStorage.setItem(KEY, CLIENT_ID);
  } else {
    // Generate new ID (expired or missing)
    const rnd = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `cid_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(KEY, rnd);
    localStorage.setItem(META_KEY, JSON.stringify({ id: rnd, createdAt: Date.now() }));
    CLIENT_ID = rnd;
  }
} catch {
  // Ignore storage errors; header won't be set
}

// Attach Authorization if token exists
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  if (CLIENT_ID) {
    config.headers['X-Client-Id'] = CLIENT_ID;
  }
  return config;
});

// 401 handling with refresh flow via httpOnly cookie
let isRefreshing = false;
let refreshWaiters = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const url = String(originalRequest?.url || '').toLowerCase();
    const isAuthRefresh = url.includes('/auth/refresh');
    const isAuthLoginOrRegister = /\/auth\/(login|register|logout|reset|forgot)/.test(url);

    // Never try to refresh for auth endpoints themselves to avoid infinite loops
    if (error.response?.status === 401 && (isAuthRefresh || isAuthLoginOrRegister)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        // Single-flight: queue retries while a refresh is in progress
        if (isRefreshing) {
          const token = await new Promise((resolve, reject) => {
            refreshWaiters.push({ resolve, reject });
          });
          if (token) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
        isRefreshing = true;
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
        const newAccess = data?.data?.accessToken;
        if (newAccess) {
          // Persist new access token where it was stored previously (prefer localStorage fallback)
          try {
            if (localStorage.getItem('access_token') != null) {
              localStorage.setItem('access_token', newAccess);
            } else {
              sessionStorage.setItem('access_token', newAccess);
            }
          } catch { /* ignore storage errors */ }
          // Notify queued waiters
          refreshWaiters.forEach(w => w.resolve(newAccess));
          refreshWaiters = [];
          // Update header and retry the original request
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (e) {
        // Notify waiters of failure
        refreshWaiters.forEach(w => w.reject(e));
        refreshWaiters = [];
        // fall through to clearing tokens below
      } finally {
        isRefreshing = false;
      }
      // If refresh fails, clear tokens and bubble up
      try { localStorage.removeItem('access_token'); } catch { /* ignore */ }
      try { sessionStorage.removeItem('access_token'); } catch { /* ignore */ }
      try { localStorage.removeItem('view_role'); } catch { /* ignore */ }
    }
    return Promise.reject(error);
  }
);

export default api;

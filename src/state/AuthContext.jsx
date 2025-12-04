import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api from './apiClient';

// Normalize backend role values (e.g., 'Client'|'client' -> 'client')
function normalizeRole(value) {
  if (!value) return 'guest';
  const v = String(value).toLowerCase();
  if (v.includes('client')) return 'client';
  if (v.includes('provider')) return 'provider';
  if (v.includes('admin')) return 'admin';
  return 'guest';
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [roles, setRoles] = useState([]);
  const [viewRole, setViewRole] = useState(() => localStorage.getItem('view_role') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  

  // Initialize or resume guest session
  useEffect(() => {
    const init = async () => {
      try {
        // Always ensure guest session exists for tracking before auth
        const res = await api.get('/guest/session');
        const sessionId = res?.data?.data?.session?.sessionId;
        if (sessionId) localStorage.setItem('session_id', sessionId);
      } catch {
        console.debug('Guest session init skipped');
      }

      // If we already have an access token, hydrate user/profile and role on load
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/profile');
          const u = data?.data?.user;
          if (u) {
            setUser(u);
            const rs = Array.isArray(u.roles) ? u.roles.map(String) : [];
            setRoles(rs);
            // Rol primario para compatibilidad: admin > provider > client > guest
            const primary = rs.includes('admin') ? 'admin' : rs.includes('provider') ? 'provider' : rs.includes('client') ? 'client' : normalizeRole(u.role);
            setRole(primary);
            // Establecer viewRole si estaba vacío o no válido
            const vr = localStorage.getItem('view_role');
            const valid = rs.includes(vr);
            const initial = valid ? vr : primary;
            setViewRole(initial);
            localStorage.setItem('view_role', initial);
          }
        } catch {
          // token may be invalid; drop to guest
          localStorage.removeItem('access_token');
          setUser(null);
          setRole('guest');
          setRoles([]);
          setViewRole('guest');
          localStorage.removeItem('view_role');
        }
      } else {
        // No token present: asegurar que el modo visual no quede "pegado" a un rol previo
        setUser(null);
        setRole('guest');
        setRoles([]);
        setViewRole('guest');
        try { localStorage.removeItem('view_role'); } catch { /* ignore */ }
      }
    };
    init();
  }, []);

  const setAuthState = useCallback((u, token, persist = 'local') => {
    if (token) {
      try {
        if (persist === 'session') {
          sessionStorage.setItem('access_token', token);
        } else {
          localStorage.setItem('access_token', token);
        }
      } catch { /* ignore */ }
    }
    setUser(u || null);
    const rs = Array.isArray(u?.roles) ? u.roles.map(String) : [];
    setRoles(rs);
    const primary = rs.includes('admin') ? 'admin' : rs.includes('provider') ? 'provider' : rs.includes('client') ? 'client' : normalizeRole(u?.role);
    setRole(primary);
    const vr = localStorage.getItem('view_role');
    const valid = rs.includes(vr);
    const nextVR = valid ? vr : primary;
    setViewRole(nextVR);
    localStorage.setItem('view_role', nextVR);
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user: maybeUser, token } = data.data || {};
      // Store token according to remember preference
      if (token) {
        try {
          if (remember) {
            localStorage.setItem('access_token', token);
            sessionStorage.removeItem('access_token');
          } else {
            sessionStorage.setItem('access_token', token);
            localStorage.removeItem('access_token');
          }
        } catch { /* ignore */ }
      }
      // Always hydrate from /auth/profile to ensure latest role and shape
      let u = maybeUser;
      try {
        const prof = await api.get('/auth/profile');
        u = prof?.data?.data?.user || maybeUser;
      } catch {
        // If profile fails, proceed with the user from login response
      }
      // Pass null token here since already stored according to preference
      setAuthState(u, null);
      // Return hydrated user for callers that need immediate role-based navigation
      return { ok: true, user: u };
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al iniciar sesión');
      return { ok: false, error: err };
    } finally { setLoading(false); }
  }, [setAuthState]);

  const registerClient = useCallback(async (payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register/client', payload);
      const { user: u, token } = data.data;
      setAuthState(u, token);
      // Hidratar perfil completo por consistencia inmediata
      try {
        const prof = await api.get('/auth/profile');
        const u2 = prof?.data?.data?.user || u;
        setAuthState(u2, null);
      } catch { /* ignore */ }
      // Merge guest data after register (optional, backend can auto-merge)
      try {
        await api.post('/auth/merge-guest', { sessionId: localStorage.getItem('session_id') });
        // La sesión guest fue eliminada en el servidor; limpiar id local para evitar headers obsoletos
        try { localStorage.removeItem('session_id'); } catch { /* ignore */ }
      } catch { /* noop */ }
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al registrarse');
      return false;
    } finally { setLoading(false); }
  }, [setAuthState]);

  const registerProvider = useCallback(async (payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register/provider', payload);
      const { user: u, token } = data.data;
      setAuthState(u, token);
      // Hidratar perfil completo de inmediato
      try {
        const prof = await api.get('/auth/profile');
        const u2 = prof?.data?.data?.user || u;
        setAuthState(u2, null);
      } catch { /* ignore */ }
      // Merge guest data after register (paridad con cliente)
      try {
        await api.post('/auth/merge-guest', { sessionId: localStorage.getItem('session_id') });
        try { localStorage.removeItem('session_id'); } catch { /* ignore */ }
      } catch { /* noop */ }
      return true;
    } catch (err) {
      // Si ya existe como cliente, usar el endpoint dedicado para ampliar a proveedor
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || '';
      const isConflictClient = status === 409 && msg.toLowerCase().includes('become-provider');
      if (isConflictClient) {
        try {
          // Sanitizar payload para upgrade (no enviar email/password)
          const upgrade = {
            businessName: payload.businessName,
            description: payload.description,
            services: payload.services,
            serviceArea: payload.serviceArea,
            phone: payload.phone,
            referredBy: payload.referredByCode || payload.referredBy
          };
          // Requiere que el usuario ya esté autenticado (token presente)
          const bearer = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
          if (!bearer) {
            setError('Ya existe una cuenta de cliente con este correo. Inicia sesión con ese correo y vuelve a intentar para activar el modo proveedor.');
            return false;
          }
          // Adjuntar explícitamente Authorization por seguridad (además del interceptor)
          const { data } = await api.post('/auth/become-provider', upgrade, { headers: { Authorization: `Bearer ${bearer}` } });
          const { user: u, token: newToken } = data.data || {};
          setAuthState(u, newToken);
          // Hidratar perfil completo tras upgrade
          try {
            const prof = await api.get('/auth/profile');
            const u2 = prof?.data?.data?.user || u;
            setAuthState(u2, null);
          } catch { /* ignore */ }
          return true;
        } catch (e2) {
          const st = e2?.response?.status;
          if (st === 401) {
            setError('Ya existe una cuenta de cliente con este correo. Inicia sesión con ese correo y vuelve a intentar para activar el modo proveedor.');
          } else {
            setError(e2?.response?.data?.message || 'No se pudo completar el upgrade a proveedor');
          }
          return false;
        } finally {
          setLoading(false);
        }
      }
      setError(msg || 'Error al registrarse');
      return false;
    } finally { setLoading(false); }
  }, [setAuthState]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    // Establecer viewRole como guest ANTES de limpiar tokens para evitar estado inconsistente
    setViewRole('guest');
    try { localStorage.setItem('view_role', 'guest'); } catch { /* ignore */ }
    setUser(null); setRole('guest');
    setRoles([]);
    try { localStorage.removeItem('access_token'); } catch { /* ignore */ }
    try { sessionStorage.removeItem('access_token'); } catch { /* ignore */ }
    try { sessionStorage.removeItem('view_role_lock'); } catch { /* ignore */ }
    // Privacy: Remove client_id and its metadata on logout
    try { localStorage.removeItem('client_id'); } catch { /* ignore */ }
    try { localStorage.removeItem('client_id_meta'); } catch { /* ignore */ }
  }, []);

  const changeViewRole = useCallback((nextRole) => {
    const r = String(nextRole || '').toLowerCase();
    if (r && (r === 'admin' || r === 'provider' || r === 'client' || r === 'guest')) {
      // solo permitir si el usuario realmente tiene ese rol (salvo guest)
      if (r === 'guest' || roles.includes(r)) {
        setViewRole(r);
        localStorage.setItem('view_role', r);
        // Bloquear auto-ajuste por esta sesión hasta salir del área
        try {
          sessionStorage.setItem('view_role_lock', JSON.stringify({ role: r, at: Date.now() }));
        } catch { /* ignore storage errors */ }
      }
    }
  }, [roles]);

  const clearViewRoleLock = useCallback(() => {
    try { sessionStorage.removeItem('view_role_lock'); } catch { /* ignore */ }
  }, []);

  const clearError = useCallback(() => setError(''), []);

  const isAuthenticated = !!user && role !== 'guest';
  const value = useMemo(() => ({ user, role, roles, viewRole, isAuthenticated, changeViewRole, clearViewRoleLock, loading, error, login, registerClient, registerProvider, logout, clearError }), [user, role, roles, viewRole, isAuthenticated, changeViewRole, clearViewRoleLock, loading, error, login, registerClient, registerProvider, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

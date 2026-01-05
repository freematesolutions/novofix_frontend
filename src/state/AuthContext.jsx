import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const [pendingVerification, setPendingVerification] = useState(() => {
    const email = sessionStorage.getItem('pending_verification_email');
    return email ? { email } : null;
  });
  const [role, setRole] = useState('guest');
  const [roles, setRoles] = useState([]);
  const [viewRole, setViewRole] = useState(() => localStorage.getItem('view_role') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Flag para indicar que se está cambiando de rol (evita flash de mensajes durante transición)
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar si el usuario está autenticado (verificado)
  const isAuthenticated = useMemo(() => {
    return !!(user && user.isActive !== false && user.emailVerified !== false);
  }, [user]);

  // Determinar si está pendiente de verificación
  const isPendingVerification = useMemo(() => {
    return !!pendingVerification || (user && user.emailVerified === false);
  }, [pendingVerification, user]);

  // Redirigir a verificación si el usuario está pendiente de verificación
  // Usar ref para evitar redirecciones repetidas
  const redirectedToVerifyRef = useRef(false);
  
  useEffect(() => {
    if (isPendingVerification && !location.pathname.startsWith('/verificar-email')) {
      if (!redirectedToVerifyRef.current) {
        redirectedToVerifyRef.current = true;
        navigate('/verificar-email', { replace: true });
      }
    } else if (!isPendingVerification) {
      // Resetear cuando ya no está pendiente
      redirectedToVerifyRef.current = false;
    }
  }, [isPendingVerification, location.pathname, navigate]);

  // Inicialización: guest session + hidratar perfil si hay token válido
  // NOTA: Se usa un ref para evitar loops infinitos de re-render
  const initRanRef = useRef(false);
  
  useEffect(() => {
    // Evitar múltiples ejecuciones
    if (initRanRef.current) return;
    
    let cancelled = false;
    const init = async () => {
      // Si hay verificación pendiente, NO intentar cargar perfil
      if (pendingVerification) {
        setUser(null);
        setRoles([]);
        setRole('guest');
        setViewRole('guest');
        try { localStorage.removeItem('access_token'); } catch { /* ignore */ }
        try { sessionStorage.removeItem('access_token'); } catch {/* ignore */}
        try { localStorage.setItem('view_role', 'guest'); } catch {/* ignore */}
        initRanRef.current = true;
        return;
      }

      try {
        // Crear guest session sólo si no hay token
        const existingToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        if (!existingToken) {
          const res = await api.get('/guest/session');
          const sessionId = res?.data?.data?.session?.sessionId;
          if (sessionId) localStorage.setItem('session_id', sessionId);
        }
      } catch (err) {
        if (!(err?.response?.status === 401)) {
          console.debug('Guest session init error:', err);
        }
      }

      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/profile');
          const u = data?.data?.user;
          if (!cancelled) {
            if (u && u.isActive !== false && u.emailVerified !== false) {
              setUser(u);
              const rs = Array.isArray(u.roles) ? u.roles.map(String) : [];
              setRoles(rs);
              const primary = rs.includes('admin') ? 'admin' : rs.includes('provider') ? 'provider' : rs.includes('client') ? 'client' : normalizeRole(u.role);
              setRole(primary);
              const vr = localStorage.getItem('view_role');
              const valid = rs.includes(vr);
              const initial = valid ? vr : primary;
              setViewRole(initial);
              localStorage.setItem('view_role', initial);
            } else {
              // Si el usuario no está verificado, establecer estado pendiente
              setUser(null);
              setRoles([]);
              setRole('guest');
              setViewRole('guest');
              localStorage.setItem('view_role', 'guest');
              
              if (u && u.emailVerified === false) {
                setPendingVerification({ email: u.email });
                try { sessionStorage.setItem('pending_verification_email', u.email); } catch {/* ignore */}
              }
            }
          }
        } catch (err) {
          console.debug('Token inválido al cargar perfil:', err);
          try { localStorage.removeItem('access_token'); } catch {/* ignore */}
          try { sessionStorage.removeItem('access_token'); } catch {/* ignore */}
          setUser(null);
          setRole('guest');
          setRoles([]);
          setViewRole('guest');
          try { localStorage.removeItem('view_role'); } catch {/* ignore */}
        }
      } else {
        setUser(null);
        setRole('guest');
        setRoles([]);
        setViewRole('guest');
        try { localStorage.removeItem('view_role'); } catch {/* ignore */}
      }
      
      initRanRef.current = true;
    };

    init();

    const forceGuest = () => {
      setUser(null);
      setRole('guest');
      setRoles([]);
      setViewRole('guest');
      try { localStorage.removeItem('view_role'); } catch {/* ignore */}
    };
    window.addEventListener('auth:force-guest', forceGuest);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:force-guest', forceGuest);
    };
  }, []); // Sin dependencias - solo ejecutar una vez al montar

  const setAuthState = useCallback((u, token, persist = 'local') => {
    if (!u) {
      setUser(null);
      setRoles([]);
      setRole('guest');
      setViewRole('guest');
      try { localStorage.setItem('view_role', 'guest'); } catch {/* ignore */}
      return;
    }

    // Si el usuario no está verificado, NO guardar token
    if (u.emailVerified === false) {
      setUser(null);
      setRoles([]);
      setRole('guest');
      setViewRole('guest');
      try { localStorage.setItem('view_role', 'guest'); } catch {/* ignore */}
      setPendingVerification({ email: u.email });
      try { sessionStorage.setItem('pending_verification_email', u.email); } catch {/* ignore */}
      try { localStorage.removeItem('access_token'); } catch {/* ignore */}
      try { sessionStorage.removeItem('access_token'); } catch {/* ignore */}
      return;
    }

    // Usuario verificado: guardar token
    if (token) {
      try {
        if (persist === 'session') {
          sessionStorage.setItem('access_token', token);
          localStorage.removeItem('access_token');
        } else {
          localStorage.setItem('access_token', token);
          sessionStorage.removeItem('access_token');
        }
      } catch { /* ignore */ }
    }

    setUser(u || null);
    setPendingVerification(null);
    try { sessionStorage.removeItem('pending_verification_email'); } catch {/* ignore */}
    const rs = Array.isArray(u?.roles) ? u.roles.map(String) : [];
    setRoles(rs);
    const primary = rs.includes('admin') ? 'admin' : rs.includes('provider') ? 'provider' : rs.includes('client') ? 'client' : normalizeRole(u?.role);
    setRole(primary);
    const vr = localStorage.getItem('view_role');
    const valid = rs.includes(vr);
    const nextVR = valid ? vr : primary;
    setViewRole(nextVR);
    try { localStorage.setItem('view_role', nextVR); } catch {/* ignore */}
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user: maybeUser, token } = data.data || {};

      if (!maybeUser || maybeUser.emailVerified === false) {
        throw new Error('Debes verificar tu correo electrónico para acceder.');
      }

      if (token) {
        try {
          if (remember) {
            localStorage.setItem('access_token', token);
            sessionStorage.removeItem('access_token');
          } else {
            sessionStorage.setItem('access_token', token);
            localStorage.removeItem('access_token');
          }
        } catch {/* ignore */}
      }

      let u = maybeUser;
      try {
        const prof = await api.get('/auth/profile');
        u = prof?.data?.data?.user || maybeUser;
      } catch { /* ignore */ }

      setAuthState(u, null);
      return { ok: true, user: u };
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al iniciar sesión');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [setAuthState]);

  const registerClient = useCallback(async (payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register/client', payload);
      const { user: u, pendingVerification: backendPending, verificationUrl, demoMode } = data.data || {};

      // Debug log en desarrollo
      if (import.meta.env.DEV) {
        console.log('[AuthContext] registerClient response:', {
          user: u,
          pendingVerification: backendPending,
          verificationUrl: verificationUrl ? 'presente' : 'ausente',
          demoMode,
          emailVerified: u?.emailVerified
        });
      }

      // Siempre pendiente de verificación (flujo unificado)
      if (backendPending || (u && u.emailVerified === false)) {
        setPendingVerification({ email: u.email, verificationUrl, demoMode });
        try { sessionStorage.setItem('pending_verification_email', u.email); } catch {/* ignore */}
        if (verificationUrl) {
          try { sessionStorage.setItem('pending_verification_url', verificationUrl); } catch {/* ignore */}
        }
        setUser(null);
        setRoles([]);
        setRole('guest');
        setViewRole('guest');
        try { localStorage.setItem('view_role', 'guest'); } catch {/* ignore */}
        try { localStorage.removeItem('access_token'); } catch {/* ignore */}
        try { sessionStorage.removeItem('access_token'); } catch {/* ignore */}
        return { pending: true, email: u.email, verificationUrl, demoMode };
      }

      return { ok: true };
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al registrarse');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [setAuthState]);

  const registerProvider = useCallback(async (payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register/provider', payload);
      const { user: u, pendingVerification: backendPending, verificationUrl, demoMode } = data.data || {};

      // Debug log en desarrollo
      if (import.meta.env.DEV) {
        console.log('[AuthContext] registerProvider response:', {
          user: u,
          pendingVerification: backendPending,
          verificationUrl: verificationUrl ? 'presente' : 'ausente',
          demoMode,
          emailVerified: u?.emailVerified
        });
      }

      // Siempre pendiente de verificación (flujo unificado)
      if (backendPending || (u && u.emailVerified === false)) {
        setPendingVerification({ email: u.email, verificationUrl, demoMode });
        try { sessionStorage.setItem('pending_verification_email', u.email); } catch {/* ignore */}
        if (verificationUrl) {
          try { sessionStorage.setItem('pending_verification_url', verificationUrl); } catch {/* ignore */}
        }
        setUser(null);
        setRoles([]);
        setRole('guest');
        setViewRole('guest');
        try { localStorage.setItem('view_role', 'guest'); } catch {/* ignore */}
        try { localStorage.removeItem('access_token'); } catch {/* ignore */}
        try { sessionStorage.removeItem('access_token'); } catch {/* ignore */}
        return { pending: true, email: u.email, verificationUrl, demoMode };
      }

      return { ok: true };
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || '';

      const isConflictClient = status === 409 && msg.toLowerCase().includes('become-provider');
      if (isConflictClient) {
        try {
          const upgrade = {
            businessName: payload.businessName,
            description: payload.description,
            services: payload.services,
            serviceArea: payload.serviceArea,
            phone: payload.phone,
            referredBy: payload.referredByCode || payload.referredBy
          };
          const bearer = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
          if (!bearer) {
            setError('Ya existe una cuenta de cliente con este correo. Inicia sesión con ese correo y vuelve a intentar para activar el modo proveedor.');
            return { ok: false };
          }
          const { data: data2 } = await api.post('/auth/become-provider', upgrade, { headers: { Authorization: `Bearer ${bearer}` } });
          const { user: u2, token: newToken } = data2.data || {};
          setAuthState(u2, newToken);
          return { ok: true };
        } catch (e2) {
          const st = e2?.response?.status;
          if (st === 401) {
            setError('Ya existe una cuenta de cliente con este correo. Inicia sesión con ese correo y vuelve a intentar para activar el modo proveedor.');
          } else {
            setError(e2?.response?.data?.message || 'No se pudo completar el upgrade a proveedor');
          }
          return { ok: false, error: e2 };
        } finally {
          setLoading(false);
        }
      }

      setError(msg || 'Error al registrarse');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [setAuthState]);

  const logout = useCallback(() => {
    try { localStorage.removeItem('access_token'); } catch {/* ignore */}
    try { sessionStorage.removeItem('access_token'); } catch {/* ignore */}
    setUser(null);
    setRoles([]);
    setRole('guest');
    setViewRole('guest');
    try { localStorage.setItem('view_role', 'guest'); } catch {/* ignore */}
    setPendingVerification(null);
    try { sessionStorage.removeItem('pending_verification_email'); } catch {/* ignore */}
  }, []);

  const clearPendingVerification = useCallback(() => {
    setPendingVerification(null);
    try { sessionStorage.removeItem('pending_verification_email'); } catch {/* ignore */}
  }, []);

  // Cambiar el rol de vista activo (para usuarios multi-rol)
  const changeViewRole = useCallback((newRole) => {
    if (!roles.includes(newRole) && newRole !== 'guest') {
      console.warn(`changeViewRole: Rol '${newRole}' no disponible para este usuario`);
      return;
    }
    setViewRole(newRole);
    // Desactivar el flag de transición después de cambiar el rol
    setIsRoleSwitching(false);
    try { 
      localStorage.setItem('view_role', newRole);
      // Guardar lock temporal en sessionStorage
      sessionStorage.setItem('view_role_lock', JSON.stringify({ role: newRole, ts: Date.now() }));
    } catch {/* ignore */}
  }, [roles]);

  // Iniciar cambio de rol (activa flag de transición para evitar flash)
  const startRoleSwitch = useCallback(() => {
    setIsRoleSwitching(true);
  }, []);

  // Limpiar el lock del rol de vista
  const clearViewRoleLock = useCallback(() => {
    try { sessionStorage.removeItem('view_role_lock'); } catch {/* ignore */}
  }, []);

  const clearError = useCallback(() => setError(''), []);

  const value = useMemo(() => ({
    user,
    role,
    roles,
    viewRole,
    setViewRole,
    changeViewRole,
    startRoleSwitch,
    isRoleSwitching,
    clearViewRoleLock,
    loading,
    error,
    setError,
    clearError,
    login,
    registerClient,
    registerProvider,
    setAuthState,
    logout,
    pendingVerification,
    isAuthenticated,
    isPendingVerification,
    clearPendingVerification,
  }), [
    user, role, roles, viewRole, isRoleSwitching, loading, error, 
    login, registerClient, registerProvider, changeViewRole, startRoleSwitch, clearViewRoleLock, 
    setAuthState, logout, pendingVerification, 
    isAuthenticated, isPendingVerification, clearError, clearPendingVerification
  ]);

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
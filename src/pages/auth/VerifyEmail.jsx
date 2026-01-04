import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../state/apiClient';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

// ============================================================================
// ICONS - Iconos SVG modernos
// ============================================================================
const Icons = {
  Mail: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Refresh: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Shield: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
};

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthState, pendingVerification, clearPendingVerification } = useAuth();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const [status, setStatus] = useState(token ? 'pending' : 'idle');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Inicializar email desde múltiples fuentes con prioridad
  const [email, setEmail] = useState(() => {
    // 1. Primero intentar desde pendingVerification (estado de React)
    if (pendingVerification?.email) {
      return pendingVerification.email;
    }
    // 2. Luego desde sessionStorage (persistencia entre recargas)
    try {
      const stored = sessionStorage.getItem('pending_verification_email');
      if (stored) return stored;
    } catch { /* ignore */ }
    return '';
  });

  const handleVerify = useCallback(async () => {
    if (!token) return;
    setStatus('pending');
    try {
      const res = await apiClient.post('/auth/verify-email', { token });
      setStatus('success');
      setMessage(res.data.message || '¡Email verificado! Redirigiendo...');

      // Guardar token y usuario usando setAuthState
      const user = res.data.user;
      const newToken = res.data.token;
      
      // Establecer estado de autenticación con el token
      setAuthState(user, newToken, 'local');
      clearPendingVerification();

      // Determinar ruta de redirección según roles
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
      let redirectPath = '/';
      
      if (userRoles.includes('admin')) {
        redirectPath = '/admin/users';
      } else if (userRoles.includes('provider')) {
        redirectPath = '/empleos';
      } else if (userRoles.includes('client')) {
        redirectPath = '/mis-solicitudes';
      }

      // Redirigir después de un breve delay para mostrar el mensaje de éxito
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Error verificando email.');
    }
  }, [token, navigate, setAuthState, clearPendingVerification]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    setResent(false);
    setMessage('');
    try {
      // Endpoint público que no requiere autenticación
      await apiClient.post('/auth/resend-verification', { email });
      setResent(true);
      setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.');
      // Iniciar countdown de 60 segundos
      setCountdown(60);
    } catch (err) {
      setMessage(err.response?.data?.message || 'No se pudo reenviar el email.');
    } finally {
      setResending(false);
    }
  };

  // Countdown timer para reenvío
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (token) handleVerify();
  }, [token, handleVerify]);

  // Sincronizar email: priorizar pendingVerification, luego sessionStorage
  useEffect(() => {
    // Si pendingVerification tiene email, usarlo
    if (pendingVerification?.email && pendingVerification.email !== email) {
      setEmail(pendingVerification.email);
      return;
    }
    
    // Si no hay email en el estado y hay en sessionStorage, usarlo
    if (!email) {
      try {
        const stored = sessionStorage.getItem('pending_verification_email');
        if (stored) {
          setEmail(stored);
        }
      } catch { /* ignore */ }
    }
  }, [pendingVerification?.email, email]);

  // Obtener el email a mostrar (priorizar pendingVerification sobre el estado local)
  const displayEmail = pendingVerification?.email || email;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-linear-to-br from-blue-50 via-white to-cyan-50 p-4 sm:p-8">
      <div className="relative bg-white/90 shadow-2xl rounded-3xl px-6 py-10 sm:px-12 sm:py-12 max-w-lg w-full text-center border border-gray-100 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-linear-to-br from-cyan-400 via-blue-400 to-blue-600 rounded-full p-4 shadow-lg animate-bounce-in">
            <svg className="w-10 h-10 text-white drop-shadow-xl" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a8 8 0 11-16 0 8 8 0 0116 0zm-8 4v-4m0 0V8m0 4h4" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-blue-700 tracking-tight">Verifica tu correo electrónico</h2>
        
        {/* Mostrar email pendiente */}
        {pendingVerification?.email && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Email pendiente:</strong> {pendingVerification.email}
            </p>
          </div>
        )}

        <p className="text-gray-600 mb-6 text-base sm:text-lg">
          Te hemos enviado un enlace de verificación a tu email. 
          Por seguridad, debes verificarlo para activar tu cuenta y acceder a todas las funcionalidades.
        </p>

        {/* Estados de feedback */}
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <Spinner className="mx-auto" />
            <span className="text-blue-500 font-medium animate-pulse">Verificando enlace...</span>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <svg className="w-8 h-8 text-green-500 mx-auto animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-green-600 font-semibold">{message}</div>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <svg className="w-8 h-8 text-red-500 mx-auto animate-shake" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div className="text-red-600 font-semibold">{message}</div>
          </div>
        )}

        {/* Reenvío de email */}
        {status === 'idle' && (
          <div className="flex flex-col gap-2 mb-6">
            <p className="mb-2 text-gray-700">¿No recibiste el correo? Ingresa tu email para reenviar el enlace de verificación.</p>
            <input
              type="email"
              className="input input-bordered w-full mb-1 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
              placeholder="Tu email"
              value={pendingVerification?.email ?? email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={resending}
            />
            <Button 
              onClick={handleResend} 
              disabled={resending || !email} 
              className="w-full mb-1 bg-linear-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-md hover:from-cyan-600 hover:to-blue-600 transition"
            >
              {resending ? 'Enviando...' : 'Reenviar email de verificación'}
            </Button>
            {resent && <div className="text-green-600 text-sm">¡Email reenviado! Revisa tu bandeja de entrada.</div>}
          </div>
        )}

        {/* Acciones adicionales */}
        <div className="mt-6 flex flex-col gap-3 w-full max-w-xs mx-auto">
          <Button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-3 rounded-xl font-semibold bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl transition-all duration-200"
          >
            Inicia sesión
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 rounded-xl font-semibold bg-linear-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:from-gray-700 hover:to-gray-800 hover:shadow-xl transition-all duration-200"
          >
            Ir al inicio
          </Button>
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-2 bg-linear-to-r from-cyan-400 via-blue-400 to-blue-600 rounded-full blur-sm opacity-60"></div>
      </div>
    </div>
  );
};

export default VerifyEmail;
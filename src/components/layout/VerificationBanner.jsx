import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';

export const VerificationBanner = () => {
  const { isPendingVerification, pendingVerification, clearPendingVerification } = useAuth();

  if (!isPendingVerification) return null;

  const email = pendingVerification?.email || 'tu correo electrónico';

  return (
    <div className="w-full bg-linear-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-cyan-200 py-3 px-4 shadow-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 12H8m8 0a8 8 0 11-16 0 8 8 0 0116 0zm-8 4v-4m0 0V8m0 4h4" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800">
              ¡Falta un paso para completar tu registro!
            </p>
            <p className="text-xs text-blue-600">
              Hemos enviado un enlace de verificación a <span className="font-medium">{email}</span>. 
              Por favor verifícalo para activar tu cuenta.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/verificar-email"
            className="px-4 py-1.5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
            onClick={() => {
              // Opcional: scroll al inicio de la página de verificación
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Verificar email
          </Link>
          <button
            onClick={clearPendingVerification}
            className="px-3 py-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
            title="Cerrar este aviso temporalmente"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner;
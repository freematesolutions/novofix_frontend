import { useMemo, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '@/state/apiClient';
import PasswordToggle from '@/components/ui/PasswordToggle.jsx';
import { 
  HiLockClosed, 
  HiKey, 
  HiCheckCircle, 
  HiExclamationCircle,
  HiArrowLeft,
  HiShieldCheck,
  HiCheck,
  HiX
} from 'react-icons/hi';

// Requisitos de contraseña
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\d/.test(p) },
];

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token') || '';
  const uid = params.get('uid') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  // Calcular fortaleza de contraseña
  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter(r => r.test(password)).length;
    return { 
      score: passed, 
      percentage: (passed / PASSWORD_REQUIREMENTS.length) * 100,
      color: passed <= 1 ? 'bg-red-500' : passed <= 2 ? 'bg-accent-500' : passed <= 3 ? 'bg-accent-500' : 'bg-brand-500',
      label: passed <= 1 ? 'Débil' : passed <= 2 ? 'Regular' : passed <= 3 ? 'Buena' : 'Fuerte'
    };
  }, [password]);

  const passwordsMatch = password && confirm && password === confirm;
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every(r => r.test(password));
  const disabled = !token || !uid || !allRequirementsMet || !passwordsMatch || status.loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      await api.post('/auth/reset-password', { token, uid, password });
      setStatus({ loading: false, error: '', success: 'Tu contraseña fue actualizada exitosamente.' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo restablecer la contraseña.';
      setStatus({ loading: false, error: msg, success: '' });
    }
  };

  // Vista de enlace inválido
  if (!token || !uid) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <HiExclamationCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h1>
            <p className="text-sm text-gray-600 mb-6">
              Este enlace ha expirado o es inválido. Por favor, solicita un nuevo correo de restablecimiento.
            </p>
            <Link 
              to="/forgot-password"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25 transition-all duration-200"
            >
              <HiArrowLeft className="w-4 h-4" />
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Vista de éxito
  if (status.success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/20 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
              <HiCheckCircle className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h1>
            <p className="text-sm text-gray-600 mb-4">{status.success}</p>
            <p className="text-xs text-gray-500">Serás redirigido al inicio de sesión...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="relative">
          {/* Efecto de brillo */}
          <div className="absolute -inset-1 bg-linear-to-r from-brand-500 via-accent-500 to-dark-600 rounded-3xl blur-lg opacity-20"></div>
          
          <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Header con gradiente */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-dark-700 via-dark-800 to-brand-800"></div>
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
              
              <div className="relative px-6 py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                  <HiKey className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
                <p className="text-brand-100 mt-2 text-sm">
                  Crea una contraseña segura para tu cuenta
                </p>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nueva contraseña */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiLockClosed className="w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 placeholder:text-gray-400 text-gray-900 hover:border-gray-300 focus:border-brand-500 focus:bg-brand-50/20 focus:outline-none focus:ring-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                    <PasswordToggle
                      isVisible={showPwd}
                      onToggle={() => setShowPwd((v) => !v)}
                      className="text-brand-600 hover:text-brand-700 focus:ring-brand-500"
                    />
                  </div>
                  
                  {/* Barra de fortaleza */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fortaleza:</span>
                        <span className={`font-medium ${
                          passwordStrength.score <= 1 ? 'text-red-600' : 
                          passwordStrength.score <= 2 ? 'text-accent-600' : 
                          passwordStrength.score <= 3 ? 'text-accent-600' : 'text-brand-600'
                        }`}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Requisitos */}
                  {password && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {PASSWORD_REQUIREMENTS.map((req) => (
                        <div 
                          key={req.id}
                          className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                            req.test(password) ? 'text-brand-600' : 'text-gray-400'
                          }`}
                        >
                          {req.test(password) ? (
                            <HiCheck className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <HiX className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-2">
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiShieldCheck className={`w-5 h-5 transition-colors duration-200 ${
                        confirm && passwordsMatch ? 'text-brand-500' : 
                        confirm && !passwordsMatch ? 'text-red-400' : 
                        'text-gray-400 group-focus-within:text-brand-500'
                      }`} />
                    </div>
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl transition-all duration-200 placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-0 ${
                        confirm && passwordsMatch ? 'border-brand-300 bg-brand-50/50' :
                        confirm && !passwordsMatch ? 'border-red-300 bg-red-50/50' :
                        'border-gray-200 hover:border-gray-300 focus:border-brand-500 focus:bg-brand-50/20'
                      }`}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                    <PasswordToggle
                      isVisible={showConfirm}
                      onToggle={() => setShowConfirm((v) => !v)}
                      className="text-brand-600 hover:text-brand-700 focus:ring-brand-500"
                    />
                  </div>
                  {confirm && !passwordsMatch && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600">
                      <HiX className="w-3.5 h-3.5" />
                      Las contraseñas no coinciden
                    </p>
                  )}
                  {confirm && passwordsMatch && (
                    <p className="flex items-center gap-1.5 text-xs text-brand-600">
                      <HiCheck className="w-3.5 h-3.5" />
                      Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* Error */}
                {status.error && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">
                    <HiExclamationCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{status.error}</span>
                  </div>
                )}

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={disabled}
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    disabled 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  {status.loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      Actualizar contraseña
                    </>
                  )}
                </button>

                {/* Link de regreso */}
                <div className="text-center pt-2">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors duration-200"
                  >
                    <HiArrowLeft className="w-4 h-4" />
                    Volver a iniciar sesión
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

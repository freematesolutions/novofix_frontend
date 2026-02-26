import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import Button from '@/components/ui/Button.jsx';
import PasswordToggle from '@/components/ui/PasswordToggle.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { isEmail, required, validate } from '@/utils/validation.js';
import { useTranslation } from 'react-i18next';

// ============================================================================
// ICONS - Iconos SVG modernos
// ============================================================================
const Icons = {
  Mail: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Lock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Briefcase: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Shield: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
};

function Login() {
  const { login, loading, error, clearError, role, viewRole } = useAuth();
  const { t } = useTranslation();
  useEffect(()=>{ clearError(); }, [clearError]);
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});

  // Simple client-side email suggestions for common domains
  const EMAIL_DOMAINS = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'];
  const localPart = email.split('@')[0] || '';
  const typedDomain = email.includes('@') ? email.split('@')[1] : '';
  const emailSuggestions = localPart
    ? EMAIL_DOMAINS
        .filter(d => !typedDomain || d.startsWith(typedDomain))
        .map(d => `${localPart}@${d}`)
    : [];

  // Role-aware accent for the eye icon (color + focus ring)
  const eyeClasses = (() => {
    const r = role === 'guest' ? 'guest' : viewRole;
    switch (r) {
      case 'provider':
        return 'text-brand-600 hover:text-brand-800 focus:ring-brand-500';
      case 'client':
        return 'text-brand-600 hover:text-brand-800 focus:ring-brand-500';
      case 'admin':
        return 'text-dark-600 hover:text-dark-800 focus:ring-dark-500';
      default:
        return 'text-gray-500 hover:text-gray-700 focus:ring-gray-500';
    }
  })();

  // Prefill email if remembered
  useEffect(() => {
    try {
      const saved = localStorage.getItem('remembered_email') || '';
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch { /* ignore */ }
  }, []);

  const runValidation = () => {
    const rules = {
      email: [
        (v)=> required(v) ? undefined : t('auth.validation.emailRequired'),
        (v)=> isEmail(v) ? undefined : t('auth.validation.emailInvalid')
      ],
      password: [ (v)=> required(v) ? undefined : t('auth.validation.passwordRequired') ]
    };
    const errs = validate({ email, password }, rules);
    setErrors(errs);
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = runValidation();
    if (Object.keys(errs).length) {
      setTouched({ email: true, password: true });
      toast.warning(t('auth.validation.checkFormFields'));
      return;
    }
    const result = await login({ email, password, remember });
    if (result?.ok) {
      try {
        if (remember) localStorage.setItem('remembered_email', email);
        else localStorage.removeItem('remembered_email');
      } catch { /* ignore */ }
      toast.success(t('toast.loginSuccess'));
      const r = String(result.user?.role || '').toLowerCase();
      if (r === 'admin') navigate('/admin');
      else if (r === 'provider') navigate('/empleos');
      else navigate('/');
    } else {
      toast.error(t('toast.loginError'));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((t)=>({ ...t, [field]: true }));
    setErrors((prev)=>({ ...prev, ...validate({ email, password }, {
      [field]: field === 'email'
        ? [ (v)=> required(v) ? undefined : t('auth.validation.emailRequired'), (v)=> isEmail(v) ? undefined : t('auth.validation.emailInvalid') ]
        : [ (v)=> required(v) ? undefined : t('auth.validation.passwordRequired') ]
    }) }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card principal con gradiente sutil */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header con gradiente */}
          <div className="relative bg-linear-to-br from-dark-700 via-dark-800 to-brand-800 px-6 py-8 text-center">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-400/15 rounded-full blur-2xl" />
            </div>
            
            {/* Icono central */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
              <Icons.User className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="relative text-2xl font-bold text-white mb-1">
              {t('auth.welcomeBack')}
            </h1>
            <p className="relative text-white/80 text-sm">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Campo Email */}
              <div>
                <label htmlFor="login-email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Icons.Mail className="w-4 h-4 text-brand-500" />
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e)=>{ setEmail(e.target.value); if (touched.email) setErrors((prev)=>({ ...prev, email: undefined })); }}
                    onBlur={handleBlur('email')}
                    aria-invalid={Boolean(touched.email && errors.email)}
                    id="login-email"
                    autoComplete="email"
                    inputMode="email"
                    list="email-options-login"
                    placeholder={t('auth.emailPlaceholder')}
                    className={`
                      w-full border-2 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400
                      transition-all duration-200 focus:outline-none
                      ${touched.email && errors.email 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                    `}
                  />
                  <datalist id="email-options-login">
                    {emailSuggestions.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                {touched.email && errors.email && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                    <span>⚠️</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Campo Password */}
              <div>
                <label htmlFor="login-password" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Icons.Lock className="w-4 h-4 text-brand-500" />
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e)=>{ setPassword(e.target.value); if (touched.password) setErrors((prev)=>({ ...prev, password: undefined })); }}
                    onBlur={handleBlur('password')}
                    aria-invalid={Boolean(touched.password && errors.password)}
                    autoComplete="current-password"
                    id="login-password"
                    placeholder="••••••••"
                    className={`
                      w-full border-2 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400
                      transition-all duration-200 focus:outline-none
                      ${touched.password && errors.password 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                    `}
                  />
                  <PasswordToggle
                    show={showPassword}
                    onToggle={()=> setShowPassword(s=>!s)}
                    onPeekStart={()=> setShowPassword(true)}
                    onPeekEnd={()=> setShowPassword(false)}
                    controls="login-password"
                    className={eyeClasses}
                  />
                </div>
                {touched.password && errors.password && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                    <span>⚠️</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me y Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={remember}
                      onChange={(e)=> setRemember(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-brand-500 peer-checked:bg-brand-500 transition-all">
                      {remember && (
                        <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    {t('auth.rememberMe')}
                  </span>
                </label>
                <Link 
                  to="/olvide-contrasena" 
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Error general */}
              {error && (
                <Alert type="error">{error}</Alert>
              )}

              {/* Botón Submit */}
              <Button 
                loading={loading} 
                className="w-full py-3 text-base font-semibold rounded-xl bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('auth.loggingIn')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t('auth.login')}
                    <Icons.ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">{t('auth.dontHaveAccount')}</span>
              </div>
            </div>

            {/* Botón único de registro */}
            <div className="flex justify-center mt-3">
              <Link
                to="/registrarse"
                className="flex items-center gap-2 px-4 py-3 bg-accent-50 text-accent-700 rounded-xl font-medium hover:bg-accent-100 transition-all group"
              >
                <Icons.User className="w-5 h-5" />
                <span className="text-sm">{t('header.registerFree')}</span>
              </Link>
            </div>
          </div>

          {/* Footer con badges de confianza */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Icons.Shield className="w-4 h-4 text-brand-500" />
                {t('common.secureConnection', 'Conexión segura')}
              </span>
              <span className="flex items-center gap-1">
                <Icons.Sparkles className="w-4 h-4 text-accent-500" />
                {t('common.trusted', '100% confiable')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

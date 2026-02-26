import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import Button from './Button.jsx';
import PasswordToggle from './PasswordToggle.jsx';
import Alert from './Alert.jsx';
import api from '@/state/apiClient.js';
import { isEmail, required, minLength, validate } from '@/utils/validation.js';

// ============================================================================
// ICONS - Iconos SVG inline (idénticos a Login/RegisterClient)
// ============================================================================
const Icons = {
  Close: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
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
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  ChevronLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  UserPlus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Login: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
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
  Star: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Shield: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Gift: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
};

// ============================================================================
// PASSWORD REQUIREMENTS (idéntico a RegisterClient)
// ============================================================================
const PASSWORD_REQUIREMENTS = [
  { id: 'length', labelKey: 'ui.guestConversion.passwordRequirements.length', test: (p) => p.length >= 8 },
  { id: 'upper', labelKey: 'ui.guestConversion.passwordRequirements.upper', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', labelKey: 'ui.guestConversion.passwordRequirements.number', test: (p) => /\d/.test(p) },
  { id: 'special', labelKey: 'ui.guestConversion.passwordRequirements.special', test: (p) => /[^a-zA-Z0-9]/.test(p) }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function GuestConversionModal({ 
  isOpen, 
  onClose, 
  provider, 
  onConversionComplete 
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { login, registerClient, error: authError, clearError } = useAuth();
  
  // State
  const [mode, setMode] = useState('choice'); // 'choice' | 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  
  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
  
  // Register form
  const [registerForm, setRegisterForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '' 
  });
  
  // Email validation for register
  const [emailValidation, setEmailValidation] = useState({ checking: false, message: '', isValid: null });
  const emailCheckTimeoutRef = useRef(null);
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMode('choice');
      setLoginForm({ email: '', password: '', remember: false });
      setRegisterForm({ firstName: '', lastName: '', email: '', password: '' });
      setErrors({});
      setTouched({});
      setEmailValidation({ checking: false, message: '', isValid: null });
      setPasswordStrength({ score: 0, label: '', color: '' });
      clearError?.();
    }
  }, [isOpen, clearError]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Email availability check for registration
  useEffect(() => {
    if (mode !== 'register' || !registerForm.email || !touched.email) {
      if (mode !== 'register') setEmailValidation({ checking: false, message: '', isValid: null });
      return;
    }

    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setEmailValidation({ checking: false, message: '', isValid: null });
      return;
    }

    setEmailValidation({ checking: true, message: t('ui.guestConversion.emailValidation.checking'), isValid: null });

    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/auth/check-email?email=${encodeURIComponent(registerForm.email)}`);
        if (response.data?.available) {
          setEmailValidation({ checking: false, message: t('ui.guestConversion.emailValidation.available'), isValid: true });
        } else {
          setEmailValidation({ checking: false, message: t('ui.guestConversion.emailValidation.alreadyRegistered'), isValid: false });
        }
      } catch {
        setEmailValidation({ checking: false, message: '', isValid: null });
      }
    }, 600);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [registerForm.email, mode, touched.email]);

  // Password strength calculator
  useEffect(() => {
    if (!registerForm.password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    const password = registerForm.password;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    let label = '';
    let color = '';
    
    if (score <= 2) {
      label = t('ui.guestConversion.passwordStrength.weak');
      color = 'from-red-500 to-red-400';
    } else if (score <= 4) {
      label = t('ui.guestConversion.passwordStrength.medium');
      color = 'from-amber-500 to-yellow-400';
    } else {
      label = t('ui.guestConversion.passwordStrength.strong');
      color = 'from-green-500 to-brand-400';
    }

    setPasswordStrength({ score, label, color });
  }, [registerForm.password]);

  // ============================================================================
  // LOGIN HANDLERS (idéntico a Login.jsx)
  // ============================================================================
  const handleLoginBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    const rules = {
      email: [
        (v) => required(v) ? undefined : t('ui.guestConversion.validation.emailRequired'),
        (v) => isEmail(v) ? undefined : t('ui.guestConversion.validation.emailInvalid')
      ],
      password: [(v) => required(v) ? undefined : t('ui.guestConversion.validation.passwordRequired')]
    };
    const fieldErr = validate(loginForm, { [field]: rules[field] });
    setErrors((prev) => ({ ...prev, ...fieldErr }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const rules = {
      email: [
        (v) => required(v) ? undefined : t('ui.guestConversion.validation.emailRequired'),
        (v) => isEmail(v) ? undefined : t('ui.guestConversion.validation.emailInvalid')
      ],
      password: [(v) => required(v) ? undefined : t('ui.guestConversion.validation.passwordRequired')]
    };
    
    const validationErrors = validate(loginForm, rules);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      setTouched({ email: true, password: true });
      toast.warning(t('ui.guestConversion.validation.checkFields'));
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        email: loginForm.email,
        password: loginForm.password,
        remember: loginForm.remember
      });

      if (result.ok) {
        toast.success(t('ui.guestConversion.login.welcomeBack'));
        onConversionComplete?.();
        onClose();
      } else {
        toast.error(t('ui.guestConversion.login.failed'));
      }
    } catch (err) {
      toast.error(err?.message || t('ui.guestConversion.login.error'));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // REGISTER HANDLERS (idéntico a RegisterClient.jsx)
  // ============================================================================
  const handleRegisterBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    const partialRules = {
      firstName: [(v) => required(v) ? undefined : t('ui.guestConversion.validation.firstNameRequired')],
      lastName: [(v) => required(v) ? undefined : t('ui.guestConversion.validation.lastNameRequired')],
      email: [
        (v) => required(v) ? undefined : t('ui.guestConversion.validation.emailRequired'),
        (v) => isEmail(v) ? undefined : t('ui.guestConversion.validation.emailInvalid')
      ],
      password: [
        (v) => required(v) ? undefined : t('ui.guestConversion.validation.passwordRequired'),
        (v) => minLength(v, 6) ? undefined : t('ui.guestConversion.validation.passwordMinLength')
      ]
    };
    const fieldErr = validate(registerForm, { [field]: partialRules[field] });
    setErrors((prev) => ({ ...prev, ...fieldErr }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const rules = {
      firstName: [(v) => required(v) ? undefined : t('ui.guestConversion.validation.firstNameRequired')],
      lastName: [(v) => required(v) ? undefined : t('ui.guestConversion.validation.lastNameRequired')],
      email: [
        (v) => required(v) ? undefined : t('ui.guestConversion.validation.emailRequired'),
        (v) => isEmail(v) ? undefined : t('ui.guestConversion.validation.emailInvalid')
      ],
      password: [
        (v) => required(v) ? undefined : t('ui.guestConversion.validation.passwordRequired'),
        (v) => minLength(v, 6) ? undefined : t('ui.guestConversion.validation.passwordMinLength')
      ]
    };
    
    const validationErrors = validate(registerForm, rules);
    
    if (emailValidation.isValid === false) {
      validationErrors.email = t('ui.guestConversion.emailValidation.alreadyRegistered');
    }
    
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      setTouched({ firstName: true, lastName: true, email: true, password: true });
      toast.warning(t('ui.guestConversion.validation.checkFields'));
      return;
    }

    setLoading(true);
    try {
      // Incluir sessionId para merge de datos guest
      const sessionId = localStorage.getItem('session_id');
      
      const result = await registerClient({
        ...registerForm,
        guestSessionId: sessionId
      });

      if (result.pending) {
        // Guardar el proveedor pendiente para después de la verificación
        try {
          sessionStorage.setItem('pending_provider_contact', JSON.stringify({
            providerId: provider?._id,
            providerName: provider?.providerProfile?.businessName || provider?.profile?.firstName
          }));
        } catch { /* intentionally empty */ }
        
        toast.success(t('ui.guestConversion.register.verifyEmail'));
        onClose();
        navigate('/verificar-email', { 
          replace: true,
          state: { 
            email: registerForm.email,
            verificationUrl: result.verificationUrl,
            demoMode: result.demoMode
          }
        });
      } else if (result.ok) {
        toast.success(t('ui.guestConversion.register.success'));
        onConversionComplete?.();
        onClose();
      } else {
        toast.error(t('ui.guestConversion.register.failed'));
      }
    } catch (err) {
      toast.error(err?.message || t('ui.guestConversion.register.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const providerName = provider?.providerProfile?.businessName || provider?.profile?.firstName || t('ui.guestConversion.thisProfessional');
  const providerAvatar = provider?.profile?.avatar;
  const providerRating = provider?.providerProfile?.rating?.average || 0;

  return (
    <>
      {/* Backdrop - z-index muy alto para estar sobre el header */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10002 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container - centrado, margen superior en modal para evitar header */}
      <div className="fixed inset-0 z-10003 flex items-start justify-center px-3 pb-3 sm:p-4 overflow-y-auto">
        <div 
          className="relative w-full max-w-md max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mt-20"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* ================================================================ */}
          {/* CHOICE MODE - Pantalla inicial de elección */}
          {/* ================================================================ */}
          {mode === 'choice' && (
            <>
              {/* Header con info del proveedor */}
              <div className="relative bg-linear-to-br from-dark-700 via-dark-800 to-brand-800 px-4 sm:px-5 py-3 sm:py-4 text-center shrink-0">
                {/* Decoración de fondo */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-400/20 rounded-full blur-2xl" />
                </div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
                >
                  <Icons.Close className="w-5 h-5 text-white" />
                </button>

                {/* Provider info */}
                <div className="relative flex flex-col items-center">
                  {providerAvatar ? (
                    <img 
                      src={providerAvatar} 
                      alt={providerName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white/50 mb-1.5 sm:mb-2"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-1.5 sm:mb-2">
                      <Icons.User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  )}
                  <h2 className="text-base sm:text-lg font-bold text-white mb-0.5">{t('ui.guestConversion.contactProvider', { name: providerName })}</h2>
                  {providerRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Icons.Star className="w-4 h-4 text-yellow-300" />
                      <span className="text-sm text-white/90">{providerRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="text-center mb-4 sm:mb-5">
                  <Icons.Shield className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-brand-500 mb-2 sm:mb-3" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('ui.guestConversion.accountRequired')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('ui.guestConversion.freeAndQuick')}
                  </p>
                </div>

                {/* Benefits */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2 sm:mb-3">{t('ui.guestConversion.benefitsTitle')}</p>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {[
                      t('ui.guestConversion.benefits.contactProviders'),
                      t('ui.guestConversion.benefits.receiveProposals'),
                      t('ui.guestConversion.benefits.requestHistory'),
                      t('ui.guestConversion.benefits.directChat')
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <Icons.Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                        </div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => { setMode('register'); setTouched({}); setErrors({}); }}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 sm:py-3.5 bg-linear-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-accent-500/25"
                >
                  <Icons.UserPlus className="w-5 h-5" />
                  <span>{t('ui.guestConversion.createFreeAccount')}</span>
                  <Icons.ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => { setMode('login'); setTouched({}); setErrors({}); }}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 mt-3 border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  <Icons.Login className="w-5 h-5" />
                  <span>{t('ui.guestConversion.alreadyHaveAccount')}</span>
                </button>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-50 border-t border-gray-100 shrink-0">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icons.Shield className="w-4 h-4 text-green-500" />
                    {t('ui.guestConversion.secureConnection')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icons.Sparkles className="w-4 h-4 text-amber-500" />
                    {t('ui.guestConversion.reliable')}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ================================================================ */}
          {/* LOGIN MODE - Formulario idéntico a Login.jsx */}
          {/* ================================================================ */}
          {mode === 'login' && (
            <>
              {/* Header */}
              <div className="relative bg-linear-to-br from-dark-700 via-dark-800 to-brand-800 px-4 sm:px-5 py-3 sm:py-4 text-center shrink-0">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-400/20 rounded-full blur-2xl" />
                </div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
                >
                  <Icons.Close className="w-5 h-5 text-white" />
                </button>
                
                <div className="relative inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl mb-1.5 sm:mb-2">
                  <Icons.User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                
                <h1 className="relative text-base sm:text-xl font-bold text-white mb-0.5">
                  {t('ui.guestConversion.login.title')}
                </h1>
                <p className="relative text-white/80 text-xs sm:text-sm">
                  {t('ui.guestConversion.login.subtitle')}
                </p>
              </div>

              {/* Form */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => { setMode('choice'); setTouched({}); setErrors({}); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-2 sm:mb-3"
                >
                  <Icons.ChevronLeft className="w-4 h-4" />
                  {t('ui.guestConversion.back')}
                </button>

                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-5">
                  {/* Campo Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      <Icons.Mail className="w-4 h-4 text-brand-500" />
                      {t('ui.guestConversion.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => { 
                        setLoginForm({ ...loginForm, email: e.target.value }); 
                        if (touched.email) setErrors((prev) => ({ ...prev, email: undefined })); 
                      }}
                      onBlur={handleLoginBlur('email')}
                      autoComplete="email"
                      placeholder="tu@email.com"
                      className={`
                        w-full border-2 rounded-xl px-4 py-2.5 sm:py-3 text-gray-900 placeholder:text-gray-400
                        transition-all duration-200 focus:outline-none
                        ${touched.email && errors.email 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                      `}
                    />
                    {touched.email && errors.email && (
                      <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                        <span>⚠️</span> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Campo Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      <Icons.Lock className="w-4 h-4 text-brand-500" />
                      {t('ui.guestConversion.passwordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => { 
                          setLoginForm({ ...loginForm, password: e.target.value }); 
                          if (touched.password) setErrors((prev) => ({ ...prev, password: undefined })); 
                        }}
                        onBlur={handleLoginBlur('password')}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className={`
                          w-full border-2 rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-gray-900 placeholder:text-gray-400
                          transition-all duration-200 focus:outline-none
                          ${touched.password && errors.password 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                        `}
                      />
                      <PasswordToggle
                        show={showPassword}
                        onToggle={() => setShowPassword(s => !s)}
                        onPeekStart={() => setShowPassword(true)}
                        onPeekEnd={() => setShowPassword(false)}
                        className="text-gray-500 hover:text-gray-700"
                      />
                    </div>
                    {touched.password && errors.password && (
                      <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                        <span>⚠️</span> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember me y Forgot password */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={loginForm.remember}
                          onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-brand-500 peer-checked:bg-brand-500 transition-all">
                          {loginForm.remember && (
                            <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        {t('ui.guestConversion.rememberMe')}
                      </span>
                    </label>
                    <a 
                      href="/olvide-contrasena" 
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                      {t('ui.guestConversion.forgotPassword')}
                    </a>
                  </div>

                  {/* Error general */}
                  {authError && (
                    <Alert type="error">{authError}</Alert>
                  )}

                  {/* Botón Submit */}
                  <Button 
                    loading={loading} 
                    className="w-full py-2.5 sm:py-3 text-base font-semibold rounded-xl bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-500/25"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('ui.guestConversion.login.loggingIn')}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t('ui.guestConversion.login.button')}
                        <Icons.ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-4 sm:my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500">{t('ui.guestConversion.newHere')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('register'); setTouched({}); setErrors({}); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-50 text-accent-700 rounded-xl font-medium hover:bg-accent-100 transition-all"
                >
                  <Icons.UserPlus className="w-5 h-5" />
                  <span className="text-sm">{t('ui.guestConversion.registerFree')}</span>
                </button>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-50 border-t border-gray-100 shrink-0">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icons.Shield className="w-4 h-4 text-green-500" />
                    Conexión segura
                  </span>
                  <span className="flex items-center gap-1">
                    <Icons.Sparkles className="w-4 h-4 text-amber-500" />
                    100% confiable
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ================================================================ */}
          {/* REGISTER MODE - Formulario idéntico a RegisterClient.jsx */}
          {/* ================================================================ */}
          {mode === 'register' && (
            <>
              {/* Header */}
              <div className="relative bg-linear-to-br from-dark-700 via-dark-800 to-brand-800 px-4 sm:px-5 py-3 sm:py-4 text-center shrink-0">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-400/20 rounded-full blur-2xl" />
                </div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
                >
                  <Icons.Close className="w-5 h-5 text-white" />
                </button>
                
                <div className="relative inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl mb-1.5 sm:mb-2">
                  <Icons.User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                
                <h1 className="relative text-base sm:text-xl font-bold text-white mb-0.5">
                  ¡Crea tu cuenta gratis!
                </h1>
                <p className="relative text-white/80 text-xs sm:text-sm">
                  Encuentra los mejores profesionales en minutos
                </p>

                <div className="relative flex items-center justify-center gap-2 mt-1.5 sm:mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-white">
                    <Icons.Gift className="w-3 h-3" /> Gratis
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-white">
                    <Icons.Shield className="w-3 h-3" /> Seguro
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => { setMode('choice'); setTouched({}); setErrors({}); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-2 sm:mb-3"
                >
                  <Icons.ChevronLeft className="w-4 h-4" />
                  Volver
                </button>

                <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                        <span className="text-sm sm:text-base">👤</span> Nombre
                      </label>
                      <input
                        value={registerForm.firstName}
                        onChange={(e) => { 
                          setRegisterForm({ ...registerForm, firstName: e.target.value }); 
                          if (touched.firstName) setErrors((p) => ({ ...p, firstName: undefined })); 
                        }}
                        onBlur={handleRegisterBlur('firstName')}
                        autoComplete="given-name"
                        placeholder="Juan"
                        className={`
                          w-full border-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-gray-900 placeholder:text-gray-400
                          transition-all duration-200 focus:outline-none text-sm sm:text-base
                          ${touched.firstName && errors.firstName 
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                        `}
                      />
                      {touched.firstName && errors.firstName && (
                        <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                        <span className="text-sm sm:text-base">👥</span> Apellido
                      </label>
                      <input
                        value={registerForm.lastName}
                        onChange={(e) => { 
                          setRegisterForm({ ...registerForm, lastName: e.target.value }); 
                          if (touched.lastName) setErrors((p) => ({ ...p, lastName: undefined })); 
                        }}
                        onBlur={handleRegisterBlur('lastName')}
                        autoComplete="family-name"
                        placeholder="Pérez"
                        className={`
                          w-full border-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-gray-900 placeholder:text-gray-400
                          transition-all duration-200 focus:outline-none text-sm sm:text-base
                          ${touched.lastName && errors.lastName 
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                        `}
                      />
                      {touched.lastName && errors.lastName && (
                        <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                      <Icons.Mail className="w-4 h-4 text-brand-500" /> Correo electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => { 
                          setRegisterForm({ ...registerForm, email: e.target.value }); 
                          if (touched.email) setErrors((p) => ({ ...p, email: undefined })); 
                        }}
                        onBlur={handleRegisterBlur('email')}
                        autoComplete="email"
                        placeholder="tu@email.com"
                        className={`
                          w-full border-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-gray-900 placeholder:text-gray-400
                          transition-all duration-200 focus:outline-none text-sm sm:text-base
                          ${touched.email && errors.email ? 'border-red-300 bg-red-50' : 
                            emailValidation.isValid === true ? 'border-green-500 bg-green-50/50' : 
                            emailValidation.isValid === false ? 'border-red-500 bg-red-50' : 
                            'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                        `}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailValidation.checking && (
                          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        {!emailValidation.checking && emailValidation.isValid === true && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Icons.Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {!emailValidation.checking && emailValidation.isValid === false && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <Icons.X className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    {touched.email && errors.email && (
                      <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                    )}
                    {!errors.email && emailValidation.message && (
                      <p className={`text-xs mt-1 ${
                        emailValidation.isValid === true ? 'text-green-600' : 
                        emailValidation.isValid === false ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {emailValidation.message}
                        {emailValidation.isValid === false && (
                          <>
                            {' - '}
                            <button
                              type="button"
                              onClick={() => {
                                setLoginForm({ ...loginForm, email: registerForm.email });
                                setMode('login');
                                setTouched({});
                                setErrors({});
                              }}
                              className="text-brand-600 hover:underline font-medium"
                            >
                              ¿Iniciar sesión?
                            </button>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                      <Icons.Lock className="w-4 h-4 text-brand-500" /> Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) => { 
                          setRegisterForm({ ...registerForm, password: e.target.value }); 
                          if (touched.password) setErrors((p) => ({ ...p, password: undefined })); 
                        }}
                        onBlur={handleRegisterBlur('password')}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={`
                          w-full border-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-12 text-gray-900 placeholder:text-gray-400
                          transition-all duration-200 focus:outline-none text-sm sm:text-base
                          ${touched.password && errors.password 
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
                        `}
                      />
                      <PasswordToggle
                        show={showPassword}
                        onToggle={() => setShowPassword(s => !s)}
                        onPeekStart={() => setShowPassword(true)}
                        onPeekEnd={() => setShowPassword(false)}
                        className="text-gray-500 hover:text-gray-700"
                      />
                    </div>
                    {touched.password && errors.password && (
                      <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                    )}
                    
                    {/* Password strength indicator */}
                    {registerForm.password && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-linear-to-r ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${
                            passwordStrength.score <= 2 ? 'text-red-600' :
                            passwordStrength.score <= 4 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                          {PASSWORD_REQUIREMENTS.map((req) => {
                            const passed = req.test(registerForm.password);
                            return (
                              <div 
                                key={req.id}
                                className={`flex items-center gap-1 sm:gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}
                              >
                                {passed ? (
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <Icons.Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                  </div>
                                ) : (
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border border-gray-300 rounded-full" />
                                )}
                                <span className="text-[11px] sm:text-xs">{req.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error general */}
                  {authError && <Alert type="error">{authError}</Alert>}

                  {/* Botón Submit */}
                  <Button 
                    loading={loading} 
                    disabled={emailValidation.isValid === false}
                    className="w-full py-2.5 sm:py-3 text-base font-semibold rounded-xl bg-linear-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg shadow-accent-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creando cuenta...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Crear mi cuenta gratis
                        <Icons.ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-3 sm:my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500">¿Ya tienes cuenta?</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setTouched({}); setErrors({}); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  <Icons.Login className="w-4 h-4" />
                  <span className="text-sm">Iniciar sesión</span>
                </button>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-100 shrink-0">
                <p className="text-center text-xs text-gray-500">
                  Al registrarte, aceptas nuestros{' '}
                  <a href="/terminos" className="text-brand-600 hover:underline">Términos</a> y{' '}
                  <a href="/privacidad" className="text-brand-600 hover:underline">Privacidad</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

GuestConversionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  provider: PropTypes.object,
  onConversionComplete: PropTypes.func
};

export default GuestConversionModal;

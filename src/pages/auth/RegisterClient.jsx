import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import Button from '@/components/ui/Button.jsx';
import PasswordToggle from '@/components/ui/PasswordToggle.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { isEmail, required, minLength, validate } from '@/utils/validation.js';
import api from '@/state/apiClient.js';

// ============================================================================
// ICONS - Iconos SVG modernos
// ============================================================================
const Icons = {
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
  Phone: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Lock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
  ),
  Briefcase: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Gift: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
};

// ============================================================================
// PASSWORD STRENGTH REQUIREMENTS
// ============================================================================
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: '8+ caracteres', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Un símbolo', test: (p) => /[^a-zA-Z0-9]/.test(p) }
];

function RegisterClient() {
  const { registerClient, loading, error, clearError, role, viewRole } = useAuth();
  useEffect(()=>{ clearError(); }, [clearError]);
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  
  // Validación de email en tiempo real
  const [emailValidation, setEmailValidation] = useState({ checking: false, message: '', isValid: null });
  const emailCheckTimeoutRef = useRef(null);
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  // Validación de disponibilidad de email con debounce
  useEffect(() => {
    if (form.email && touched.email) {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setEmailValidation({ checking: false, message: '', isValid: null });
        return;
      }

      setEmailValidation({ checking: true, message: 'Verificando...', isValid: null });

      emailCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get(`/auth/check-email?email=${encodeURIComponent(form.email)}`);
          if (response.data?.available) {
            setEmailValidation({ 
              checking: false, 
              message: 'Email disponible', 
              isValid: true 
            });
          } else {
            setEmailValidation({ 
              checking: false, 
              message: 'Este email ya está registrado', 
              isValid: false 
            });
          }
        } catch (err) {
          if (err?.response?.status === 404) {
            setEmailValidation({ checking: false, message: '', isValid: null });
          } else {
            setEmailValidation({ 
              checking: false, 
              message: 'Error al verificar email', 
              isValid: false 
            });
          }
        }
      }, 800);
    } else {
      setEmailValidation({ checking: false, message: '', isValid: null });
    }

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [form.email, touched.email]);

  // Password strength calculator
  useEffect(() => {
    if (!form.password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    const password = form.password;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    let label = '';
    let color = '';
    
    if (score <= 2) {
      label = 'Débil';
      color = 'from-red-500 to-red-400';
    } else if (score <= 4) {
      label = 'Media';
      color = 'from-amber-500 to-yellow-400';
    } else {
      label = 'Fuerte';
      color = 'from-green-500 to-emerald-400';
    }

    setPasswordStrength({ score, label, color });
  }, [form.password]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const runValidation = async () => {
    const rules = {
      firstName: [(v)=> required(v) ? undefined : 'El nombre es obligatorio'],
      lastName: [(v)=> required(v) ? undefined : 'El apellido es obligatorio'],
      email: [
        (v)=> required(v) ? undefined : 'El correo es obligatorio',
        (v)=> isEmail(v) ? undefined : 'Correo inválido'
      ],
      password: [
        (v)=> required(v) ? undefined : 'La contraseña es obligatoria',
        (v)=> minLength(v, 6) ? undefined : 'Mínimo 6 caracteres'
      ]
    };
    const errs = validate(form, rules);
    
    if (!errs.email && form.email) {
      try {
        const response = await api.get(`/auth/check-email?email=${encodeURIComponent(form.email)}`);
        if (!response.data?.available) {
          errs.email = 'Este email ya está registrado';
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.warn('Email validation failed:', err);
        }
      }
    }
    
    setErrors(errs);
    return errs;
  };

  const handleBlur = (field) => () => {
    setTouched((t)=>({ ...t, [field]: true }));
    const partialRules = {
      firstName: [(v)=> required(v) ? undefined : 'El nombre es obligatorio'],
      lastName: [(v)=> required(v) ? undefined : 'El apellido es obligatorio'],
      email: [ (v)=> required(v) ? undefined : 'El correo es obligatorio', (v)=> isEmail(v) ? undefined : 'Correo inválido' ],
      password: [ (v)=> required(v) ? undefined : 'La contraseña es obligatoria', (v)=> minLength(v, 6) ? undefined : 'Mínimo 6 caracteres' ]
    };
    const fieldErr = validate(form, { [field]: partialRules[field] });
    setErrors((prev)=>({ ...prev, ...fieldErr }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = await runValidation();
    if (Object.keys(errs).length) {
      setTouched({ firstName: true, lastName: true, email: true, password: true });
      toast.warning('Revisa los campos del formulario');
      return;
    }
    const ok = await registerClient(form);
    if (ok) {
      toast.success('¡Bienvenido! Te has registrado como cliente');
      navigate('/');
    } else {
      toast.error('No se pudo completar el registro');
    }
  };

  // Email suggestions
  const EMAIL_DOMAINS = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com'];
  const localPart = (form.email || '').split('@')[0] || '';
  const typedDomain = (form.email || '').includes('@') ? (form.email || '').split('@')[1] : '';
  const emailSuggestions = localPart
    ? EMAIL_DOMAINS
        .filter(d => !typedDomain || d.startsWith(typedDomain))
        .map(d => `${localPart}@${d}`)
    : [];

  // Role-aware accent for the eye icon
  const eyeClasses = (() => {
    const r = role === 'guest' ? 'guest' : viewRole;
    switch (r) {
      case 'provider':
        return 'text-brand-600 hover:text-brand-800 focus:ring-brand-500';
      case 'client':
        return 'text-emerald-600 hover:text-emerald-800 focus:ring-emerald-500';
      case 'admin':
        return 'text-indigo-600 hover:text-indigo-800 focus:ring-indigo-500';
      default:
        return 'text-gray-500 hover:text-gray-700 focus:ring-gray-500';
    }
  })();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Card principal */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header con gradiente esmeralda */}
          <div className="relative bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-8 text-center">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
            </div>
            
            {/* Icono central */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
              <Icons.User className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="relative text-2xl font-bold text-white mb-1">
              ¡Crea tu cuenta gratis!
            </h1>
            <p className="relative text-white/80 text-sm">
              Encuentra los mejores profesionales en minutos
            </p>

            {/* Benefits badges */}
            <div className="relative flex items-center justify-center gap-3 mt-4 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs text-white">
                <Icons.Gift className="w-3.5 h-3.5" /> 100% Gratis
              </span>
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs text-white">
                <Icons.Shield className="w-3.5 h-3.5" /> Seguro
              </span>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Nombre y Apellido en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="client-firstName" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="text-base">👤</span> Nombre
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={(e)=>{ onChange(e); if (touched.firstName) setErrors((p)=>({ ...p, firstName: undefined })); }}
                    onBlur={handleBlur('firstName')}
                    aria-invalid={Boolean(touched.firstName && errors.firstName)}
                    autoComplete="given-name"
                    id="client-firstName"
                    placeholder="Juan"
                    className={`
                      w-full border-2 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400
                      transition-all duration-200 focus:outline-none
                      ${touched.firstName && errors.firstName 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}
                    `}
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="client-lastName" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="text-base">👥</span> Apellido
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={(e)=>{ onChange(e); if (touched.lastName) setErrors((p)=>({ ...p, lastName: undefined })); }}
                    onBlur={handleBlur('lastName')}
                    aria-invalid={Boolean(touched.lastName && errors.lastName)}
                    autoComplete="family-name"
                    id="client-lastName"
                    placeholder="Pérez"
                    className={`
                      w-full border-2 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400
                      transition-all duration-200 focus:outline-none
                      ${touched.lastName && errors.lastName 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}
                    `}
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="client-email" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Icons.Mail className="w-4 h-4 text-emerald-500" /> Correo electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e)=>{ onChange(e); if (touched.email) setErrors((p)=>({ ...p, email: undefined })); }}
                    onBlur={handleBlur('email')}
                    aria-invalid={Boolean(touched.email && errors.email)}
                    autoComplete="email"
                    inputMode="email"
                    list="email-options-register-client"
                    id="client-email"
                    placeholder="tu@email.com"
                    className={`
                      w-full border-2 rounded-xl px-4 py-2.5 pr-10 text-gray-900 placeholder:text-gray-400
                      transition-all duration-200 focus:outline-none
                      ${touched.email && errors.email ? 'border-red-300 bg-red-50' : 
                        emailValidation.isValid === true ? 'border-green-500 bg-green-50/50' : 
                        emailValidation.isValid === false ? 'border-red-500 bg-red-50' : 
                        'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}
                    `}
                  />
                  {/* Status icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValidation.checking && (
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
                  </p>
                )}
                <datalist id="email-options-register-client">
                  {emailSuggestions.map(opt => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="client-phone" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Icons.Phone className="w-4 h-4 text-emerald-500" /> Teléfono
                  <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={onChange} 
                  autoComplete="tel" 
                  inputMode="tel" 
                  id="client-phone" 
                  placeholder="+1 234 567 8900"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                />
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="client-password" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Icons.Lock className="w-4 h-4 text-emerald-500" /> Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={(e)=>{ onChange(e); if (touched.password) setErrors((p)=>({ ...p, password: undefined })); }}
                    onBlur={handleBlur('password')}
                    aria-invalid={Boolean(touched.password && errors.password)}
                    autoComplete="new-password"
                    id="client-password"
                    placeholder="••••••••"
                    className={`
                      w-full border-2 rounded-xl px-4 py-2.5 pr-12 text-gray-900 placeholder:text-gray-400
                      transition-all duration-200 focus:outline-none
                      ${touched.password && errors.password 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}
                    `}
                  />
                  <PasswordToggle
                    show={showPassword}
                    onToggle={()=> setShowPassword(s=>!s)}
                    onPeekStart={()=> setShowPassword(true)}
                    onPeekEnd={()=> setShowPassword(false)}
                    controls="client-password"
                    className={eyeClasses}
                  />
                </div>
                {touched.password && errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                )}
                
                {/* Password strength indicator moderno */}
                {form.password && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    {/* Barra de fuerza */}
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
                    
                    {/* Requisitos */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {PASSWORD_REQUIREMENTS.map((req) => {
                        const passed = req.test(form.password);
                        return (
                          <div 
                            key={req.id}
                            className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {passed ? (
                              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                <Icons.Check className="w-2.5 h-2.5" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 border border-gray-300 rounded-full" />
                            )}
                            {req.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Error general */}
              {error && <Alert type="error">{error}</Alert>}

              {/* Botón Submit */}
              <Button 
                loading={loading} 
                className="w-full py-3 text-base font-semibold rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
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
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">¿Ya tienes cuenta?</span>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <Icons.User className="w-4 h-4" />
                <span className="text-sm">Iniciar sesión</span>
              </Link>
              <Link
                to="/registro-proveedor"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-50 text-brand-700 rounded-xl font-medium hover:bg-brand-100 transition-all"
              >
                <Icons.Briefcase className="w-4 h-4" />
                <span className="text-sm">Soy profesional</span>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-xs text-gray-500">
              Al registrarte, aceptas nuestros{' '}
              <a href="/terminos" className="text-emerald-600 hover:underline">Términos</a> y{' '}
              <a href="/privacidad" className="text-emerald-600 hover:underline">Privacidad</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterClient;

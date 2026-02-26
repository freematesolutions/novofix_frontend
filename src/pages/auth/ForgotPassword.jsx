import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { isEmail, required, validate } from '@/utils/validation.js';
import api from '@/state/apiClient.js';
import { useTranslation } from 'react-i18next';
import { 
  HiMail, 
  HiArrowLeft, 
  HiLockClosed, 
  HiCheckCircle,
  HiShieldCheck,
  HiLightningBolt,
  HiClock
} from 'react-icons/hi';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('remembered_email') || '';
      if (saved) setEmail(saved);
    } catch { /* ignore */ }
  }, []);

  const runValidation = () => {
    const rules = {
      email: [
        (v)=> required(v) ? undefined : t('auth.validation.emailRequired'),
        (v)=> isEmail(v) ? undefined : t('auth.validation.emailInvalid')
      ]
    };
    const errs = validate({ email }, rules);
    setErrors(errs);
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = runValidation();
    if (Object.keys(errs).length) {
      setTouched({ email: true });
      return;
    }
    setLoading(true); setServerError('');
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (err) {
      void err;
    } finally {
      setLoading(false);
      setSubmitted(true);
      toast.info(t('toast.passwordResetSent'));
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="relative">
          {/* Efecto de brillo detrás */}
          <div className="absolute -inset-1 bg-linear-to-r from-brand-500 via-accent-500 to-dark-600 rounded-3xl blur-lg opacity-20"></div>
          
          <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Header con gradiente */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-dark-700 via-dark-800 to-brand-800"></div>
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
              
              <div className="relative px-6 py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                  <HiLockClosed className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">{t('auth.forgotPassword')}</h1>
                <p className="text-brand-100 mt-2 text-sm">
                  {t('auth.resetPasswordSubtitle')}
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 sm:p-8">
              {!submitted ? (
                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Campo de email */}
                  <div className="space-y-2">
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                      {t('auth.email')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiMail className={`w-5 h-5 transition-colors duration-200 ${
                          touched.email && errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-brand-500'
                        }`} />
                      </div>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e)=>{ setEmail(e.target.value); if (touched.email) setErrors((prev)=>({ ...prev, email: undefined })); }}
                        onBlur={()=>{ setTouched((t)=>({ ...t, email: true })); setErrors((prev)=>({ ...prev, ...validate({ email }, { email: [ (v)=> required(v) ? undefined : t('auth.validation.emailRequired'), (v)=> isEmail(v) ? undefined : t('auth.validation.emailInvalid') ] }) })); }}
                        aria-invalid={Boolean(touched.email && errors.email)}
                        autoComplete="email"
                        inputMode="email"
                        placeholder={t('auth.emailPlaceholder')}
                        className={`
                          w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200
                          placeholder:text-gray-400 text-gray-900
                          focus:outline-none focus:ring-0
                          ${touched.email && errors.email 
                            ? 'border-red-300 bg-red-50/50 focus:border-red-400' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-brand-500 focus:bg-brand-50/20'
                          }
                        `}
                      />
                    </div>
                    {touched.email && errors.email && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {serverError && <Alert type="error">{serverError}</Alert>}

                  {/* Botón de envío */}
                  <Button 
                    loading={loading} 
                    className="w-full bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-brand-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
                  >
                    {loading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
                  </Button>

                  {/* Link de regreso */}
                  <div className="text-center pt-2">
                    <Link 
                      to="/login" 
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors duration-200"
                    >
                      <HiArrowLeft className="w-4 h-4" />
                      {t('auth.signInHere')}
                    </Link>
                  </div>
                </form>
              ) : (
                /* Estado de éxito */
                <div className="text-center py-4" role="status" aria-live="polite">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                    <HiCheckCircle className="w-8 h-8 text-brand-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('auth.checkYourEmail', '¡Revisa tu correo!')}</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {t('auth.resetEmailSentTo', { email, defaultValue: `Si ${email} está registrado, recibirás un enlace para restablecer tu contraseña.` })}
                  </p>
                  
                  <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-6">
                    <p className="text-xs text-accent-700">
                      💡 {t('auth.checkSpamFolder', 'Revisa también tu carpeta de spam si no lo encuentras en unos minutos.')}
                    </p>
                  </div>

                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                  >
                    <HiArrowLeft className="w-4 h-4" />
                    {t('auth.signInHere')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de seguridad */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center p-3 bg-white/50 rounded-xl border border-gray-100">
            <HiShieldCheck className="w-5 h-5 text-brand-500 mb-1" />
            <span className="text-xs text-gray-600">{t('common.secureConnection')}</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-white/50 rounded-xl border border-gray-100">
            <HiLightningBolt className="w-5 h-5 text-brand-500 mb-1" />
            <span className="text-xs text-gray-600">{t('common.fast', 'Rápido')}</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-white/50 rounded-xl border border-gray-100">
            <HiClock className="w-5 h-5 text-brand-500 mb-1" />
            <span className="text-xs text-gray-600">24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

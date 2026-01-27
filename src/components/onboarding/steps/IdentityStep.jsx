import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProviderOnboarding } from '@/state/ProviderOnboardingContext.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import PasswordToggle from '@/components/ui/PasswordToggle.jsx';

export default function IdentityStep() {
  const { t } = useTranslation();
  const { 
    formData, 
    updateFormData, 
    saveStep, 
    loading, 
    error,
    isExistingClient,
    checkEmailAvailability 
  } = useProviderOnboarding();

  const [showPassword, setShowPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ checking: false, message: '', isValid: null });
  const emailCheckTimeoutRef = useRef(null);

  // Validación de email con debounce
  useEffect(() => {
    if (!isExistingClient && formData.email) {
      // Limpiar timeout anterior
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }

      // Validar formato básico primero
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailValidation({ checking: false, message: '', isValid: null });
        return;
      }

      // Mostrar estado "verificando"
      setEmailValidation({ checking: true, message: t('onboarding.identity.verifying'), isValid: null });

      // Debounce de 800ms
      emailCheckTimeoutRef.current = setTimeout(async () => {
        const result = await checkEmailAvailability(formData.email);
        if (result.available) {
          setEmailValidation({ 
            checking: false, 
            message: t('onboarding.identity.emailAvailable'), 
            isValid: true 
          });
        } else {
          setEmailValidation({ 
            checking: false, 
            message: result.error || t('onboarding.identity.emailNotAvailable'), 
            isValid: false 
          });
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
  }, [formData.email, isExistingClient, checkEmailAvailability, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveStep(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email y contraseña solo si NO es cliente existente */}
      {!isExistingClient && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.identity.email')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-md px-4 py-2.5 pr-10 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                  emailValidation.isValid === true ? 'border-green-500' : 
                  emailValidation.isValid === false ? 'border-red-500' : 
                  'border-gray-300'
                }`}
                placeholder={t('onboarding.identity.emailPlaceholder')}
                required
              />
              {emailValidation.checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-brand-600 border-t-transparent rounded-full"></div>
                </div>
              )}
              {!emailValidation.checking && emailValidation.isValid === true && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                  ✓
                </div>
              )}
              {!emailValidation.checking && emailValidation.isValid === false && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                  ✕
                </div>
              )}
            </div>
            {emailValidation.message && (
              <p className={`text-xs mt-1 ${
                emailValidation.isValid === true ? 'text-green-600' : 
                emailValidation.isValid === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {emailValidation.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.identity.password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 pr-12 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder={t('onboarding.identity.passwordPlaceholder')}
                minLength={6}
                required
              />
              <PasswordToggle 
                show={showPassword} 
                onToggle={() => setShowPassword(!showPassword)} 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('onboarding.identity.passwordHint')}
            </p>
          </div>
        </>
      )}

      {/* Información del negocio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.identity.businessName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder={t('onboarding.identity.businessNamePlaceholder')}
          required
          minLength={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('onboarding.identity.businessNameHint')}
        </p>
      </div>

      {isExistingClient && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">💼</div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                {t('onboarding.identity.multiRoleInfo.title')}
              </p>
              <p className="text-sm text-blue-700">
                {t('onboarding.identity.multiRoleInfo.description', { email: formData.email || '' })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('onboarding.identity.firstName')} {!isExistingClient && <span className="text-gray-400">({t('onboarding.identity.optional')})</span>}
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={t('onboarding.identity.firstNamePlaceholder')}
            disabled={isExistingClient}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('onboarding.identity.lastName')} {!isExistingClient && <span className="text-gray-400">({t('onboarding.identity.optional')})</span>}
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={t('onboarding.identity.lastNamePlaceholder')}
            disabled={isExistingClient}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.identity.phone')} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder={t('onboarding.identity.phonePlaceholder')}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('onboarding.identity.phoneHint')}
        </p>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          {t('onboarding.identity.stepOf', { current: 1, total: 4 })}
        </div>
        <Button type="submit" loading={loading}>
          {loading ? t('common.saving') : t('common.continue')}
        </Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProviderOnboarding } from '@/state/ProviderOnboardingContext.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import api from '@/state/apiClient.js';

export default function ReviewStep() {
  const { t } = useTranslation();
  const { 
    formData, 
    submitOnboarding,
    prevStep,
    goToStep,
    loading, 
    error,
    isExistingClient,
    clearDraft
  } = useProviderOnboarding();

  const navigate = useNavigate();
  const [acceptTerms, setAcceptTerms] = useState(formData.acceptTerms || false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(formData.acceptPrivacy || false);
  const [referredByCode, setReferredByCode] = useState(formData.referredByCode || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptTerms || !acceptPrivacy) {
      return;
    }

    // Actualizar formData con los valores finales antes de submit
    const finalData = {
      acceptTerms,
      acceptPrivacy,
      referredByCode: referredByCode.trim()
    };
    
    const result = await submitOnboarding(finalData);

    // Si el resultado fue exitoso pero no hay redirección automática del callback
    // (esto puede pasar si se usa el flujo fallback sin onRegistrationComplete)
    if (result.success) {
      // Limpiar draft por si acaso
      clearDraft();
      
      // Solo redirigir si el callback no lo hizo (flujo fallback)
      // Esperamos un momento para ver si ya se redirigió
      setTimeout(() => {
        if (window.location.pathname !== '/verificar-email' && 
            !window.location.pathname.includes('/servicios') &&
            !window.location.pathname.includes('/empleos')) {
          navigate('/verificar-email', { replace: true });
        }
      }, 100);
    }
  };

  const handleContinueLater = () => {
    // El progreso ya está guardado automáticamente
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumen de la información */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">
          {t('onboarding.review.summaryTitle')}
        </h3>

        {/* Identidad */}
        <div className="border-b pb-3">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-700">{t('onboarding.review.identitySection')}</h4>
            <button
              type="button"
              onClick={() => goToStep(0)}
              className="text-sm text-brand-600 hover:text-brand-700 underline"
            >
              {t('onboarding.review.editButton')}
            </button>
          </div>
          <dl className="space-y-1 text-sm">
            {!isExistingClient && (
              <div className="flex gap-2">
                <dt className="text-gray-600 font-medium">{t('onboarding.review.emailLabel')}:</dt>
                <dd className="text-gray-900">{formData.email}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-gray-600 font-medium">{t('onboarding.review.businessNameLabel')}:</dt>
              <dd className="text-gray-900">{formData.businessName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-600 font-medium">{t('onboarding.review.phoneLabel')}:</dt>
              <dd className="text-gray-900">{formData.phone}</dd>
            </div>
          </dl>
        </div>

        {/* Servicios */}
        <div className="border-b pb-3">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-700">{t('onboarding.review.offeringSection')}</h4>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="text-sm text-brand-600 hover:text-brand-700 underline"
            >
              {t('onboarding.review.editButton')}
            </button>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600 font-medium mb-1">{t('onboarding.review.categoriesLabel')}:</dt>
              <dd className="flex flex-wrap gap-1">
                {formData.categories?.map(cat => (
                  <span 
                    key={cat}
                    className="px-2 py-1 bg-brand-100 text-brand-800 rounded text-xs"
                  >
                    {cat}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 font-medium">{t('onboarding.review.mainServiceLabel')}:</dt>
              <dd className="text-gray-900">{formData.mainService}</dd>
            </div>
            {formData.description && (
              <div>
                <dt className="text-gray-600 font-medium">{t('onboarding.review.descriptionLabel')}:</dt>
                <dd className="text-gray-900">{formData.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Cobertura */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-700">{t('onboarding.review.coverageSection')}</h4>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="text-sm text-brand-600 hover:text-brand-700 underline"
            >
              {t('onboarding.review.editButton')}
            </button>
          </div>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-600 font-medium">{t('onboarding.review.serviceAreaLabel')}:</dt>
              <dd className="text-gray-900">{formData.serviceAreaZone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-600 font-medium">{t('onboarding.review.radiusLabel')}:</dt>
              <dd className="text-gray-900">{formData.radius} {t('common.miles')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-600 font-medium">{t('onboarding.review.serviceModeLabel')}:</dt>
              <dd className="text-gray-900 capitalize">{formData.serviceMode}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Código de referido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.review.referralLabel')} <span className="text-gray-400">({t('onboarding.identity.optional')})</span>
        </label>
        <input
          type="text"
          value={referredByCode}
          onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder={t('onboarding.review.referralPlaceholder')}
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('onboarding.review.referralHint')}
        </p>
      </div>

      {/* Términos y condiciones */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            {t('onboarding.review.termsLabel')}{' '}
            <a 
              href="/terminos" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 underline"
            >
              {t('onboarding.review.termsLink')}
            </a>
            {' '}<span className="text-red-500">*</span>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptPrivacy"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            className="mt-1 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            required
          />
          <label htmlFor="acceptPrivacy" className="text-sm text-gray-700">
            {t('onboarding.review.privacyLabel')}{' '}
            <a 
              href="/privacidad" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 underline"
            >
              {t('onboarding.review.privacyLink')}
            </a>
            {' '}<span className="text-red-500">*</span>
          </label>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-sm text-green-800">
          ✅ <strong>{t('onboarding.review.almostDone')}</strong> {t('onboarding.review.successInfo')}
        </p>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={prevStep}
          >
            {t('common.back')}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleContinueLater}
          >
            {t('onboarding.review.continueLater')}
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {t('onboarding.review.stepOf', { current: 4, total: 4 })}
        </div>
        <Button 
          type="submit" 
          loading={loading}
          disabled={!acceptTerms || !acceptPrivacy}
        >
          {loading ? t('onboarding.review.submitting') : t('onboarding.review.submitButton')}
        </Button>
      </div>
    </form>
  );
}

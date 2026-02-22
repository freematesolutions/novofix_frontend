import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProviderOnboarding } from '@/state/ProviderOnboardingContext.jsx';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';

export default function OfferingStep() {
  const { t } = useTranslation();
  const { 
    formData, 
    updateFormData, 
    saveStep,
    prevStep,
    loading, 
    error 
  } = useProviderOnboarding();

  const [primaryCategory, setPrimaryCategory] = useState(formData.primaryCategory || '');
  const [additionalCategories, setAdditionalCategories] = useState(formData.additionalCategories || []);
  const [mainService, setMainService] = useState(formData.mainService || '');
  const [description, setDescription] = useState(formData.description || '');
  const [customAdditional, setCustomAdditional] = useState('');

  useEffect(() => {
    updateFormData({ 
      primaryCategory, 
      additionalCategories, 
      mainService, 
      description 
    });
  }, [primaryCategory, additionalCategories, mainService, description, updateFormData]);

  useEffect(() => {
    if (!primaryCategory) return;
    setAdditionalCategories(prev => prev.filter(cat => cat !== primaryCategory));
  }, [primaryCategory]);

  const toggleAdditional = (category) => {
    setAdditionalCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (category === primaryCategory) {
        return prev;
      }
      return [...prev, category];
    });
  };

  const addCustomAdditional = () => {
    const value = customAdditional.trim();
    if (!value) return;
    if (value === primaryCategory) {
      setCustomAdditional('');
      return;
    }
    if (!additionalCategories.includes(value)) {
      setAdditionalCategories(prev => [...prev, value]);
    }
    setCustomAdditional('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveStep(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Servicio principal (categoría única) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('onboarding.offering.mainCategoryLabel')} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          {t('onboarding.offering.mainCategoryHint')}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {SERVICE_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setPrimaryCategory(category)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${primaryCategory === category
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {t(`home.categories.${category}`, category)}
            </button>
          ))}
        </div>
      </div>

      {/* Experiencia en otros servicios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.offering.additionalServicesLabel')}
        </label>
        <p className="text-sm text-gray-600 mb-3">
          {t('onboarding.offering.additionalServicesHint')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {SERVICE_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => toggleAdditional(category)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${additionalCategories.includes(category)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {t(`home.categories.${category}`, category)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customAdditional}
            onChange={(e) => setCustomAdditional(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAdditional())}
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder={t('onboarding.offering.additionalServicePlaceholder')}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addCustomAdditional}
          >
            {t('onboarding.offering.addButton')}
          </Button>
        </div>

        {additionalCategories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {additionalCategories.map(cat => (
              <span 
                key={cat}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
              >
                {t(`home.categories.${cat}`, cat)}
                <button
                  type="button"
                  onClick={() => toggleAdditional(cat)}
                  className="hover:text-emerald-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-2">{t('onboarding.offering.additionalServicesEmpty')}</p>
        )}
      </div>

      {/* Servicio principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.offering.mainServiceLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={mainService}
          onChange={(e) => setMainService(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder={t('onboarding.offering.mainServicePlaceholder')}
          required
          minLength={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('onboarding.offering.mainServiceHint')}
        </p>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.offering.descriptionLabel')} <span className="text-gray-400">({t('onboarding.identity.optional')})</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          placeholder={t('onboarding.offering.descriptionPlaceholder')}
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('onboarding.offering.descriptionHint', { count: description.length })}
        </p>
      </div>

      {/* Tip */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>{t('common.tip')}:</strong> {t('onboarding.offering.tipText')}
        </p>
      </div>

      {error && (
        <Alert type="error">{error}</Alert>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={prevStep}
        >
          {t('common.back')}
        </Button>
        <div className="text-sm text-gray-500">
          {t('onboarding.offering.stepOf', { current: 2, total: 4 })}
        </div>
        <Button type="submit" loading={loading}>
          {loading ? t('common.saving') : t('common.continue')}
        </Button>
      </div>
    </form>
  );
}

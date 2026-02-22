import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from './apiClient';

const ProviderOnboardingContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useProviderOnboarding() {
  const context = useContext(ProviderOnboardingContext);
  if (!context) {
    throw new Error('useProviderOnboarding must be used within ProviderOnboardingProvider');
  }
  return context;
}

const STORAGE_KEY = 'provider_onboarding_draft';

export function ProviderOnboardingProvider({ children, user, isExistingClient = false, onRegistrationComplete }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => {
    if (!isExistingClient) {
      try {
        const draft = localStorage.getItem(STORAGE_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            if (!user?.email || parsed.data?.email !== user.email) {
              const draftData = parsed.data || {};
              if (!draftData.primaryCategory && Array.isArray(draftData.categories) && draftData.categories.length > 0) {
                return {
                  ...draftData,
                  primaryCategory: draftData.categories[0],
                  additionalCategories: draftData.categories.slice(1)
                };
              }
              return draftData;
            }
          }
        }
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    return {
      // Paso 1: Identidad profesional
      email: isExistingClient ? user?.email || '' : '',
      password: '',
      businessName: user?.providerProfile?.businessName || (isExistingClient ? (user?.profile?.firstName || '') : ''),
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      phone: user?.profile?.phone || '',

      // Paso 2: Oferta y servicios
      description: user?.providerProfile?.description || '',
      primaryCategory: user?.providerProfile?.services?.[0]?.category || '',
      additionalCategories: user?.providerProfile?.additionalServices || user?.providerProfile?.services?.slice(1).map(s => s.category).filter(Boolean) || [],
      mainService: user?.providerProfile?.services?.[0]?.name || '',
      servicesList: user?.providerProfile?.services || [],

      // Paso 3: Cobertura
      serviceAreaZone: user?.providerProfile?.serviceArea?.zones?.[0] || '',
      radius: user?.providerProfile?.serviceArea?.radius || 15,
      lat: user?.providerProfile?.serviceArea?.coordinates?.lat || '',
      lng: user?.providerProfile?.serviceArea?.coordinates?.lng || '',
      serviceMode: 'both',

      // Paso 4: Verificación (opcional)
      acceptTerms: false,
      acceptPrivacy: false,
      referredByCode: '',

      // Metadata
      isExistingClient
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: formData,
        timestamp: Date.now()
      }));
    } catch {
      // ignore storage errors
    }
  }, [formData]);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const checkEmailAvailability = useCallback(async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { available: false, error: t('onboarding.identity.emailInvalid') };
    }

    if (isExistingClient && user?.email && email.toLowerCase() === user.email.toLowerCase()) {
      return { available: true, error: null, isCurrentUser: true };
    }

    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return {
        available: response.data?.available !== false,
        code: response.data?.code,
        error: response.data?.available === false ? t('onboarding.identity.emailNotAvailable') : null
      };
    } catch (err) {
      if (err?.response?.status === 404) {
        return { available: true, error: null };
      }
      return { available: false, error: t('onboarding.identity.emailCheckError') };
    }
  }, [isExistingClient, user?.email, t]);

  const checkProviderAvailability = useCallback(async (email, mainCategory) => {
    if (!email || !mainCategory) {
      return { available: true, error: null };
    }
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}&serviceCategory=${encodeURIComponent(mainCategory)}&role=provider`);
      if (response.data?.available === false) {
        if (response.data?.code === 'PROVIDER_EMAIL_SERVICE_EXISTS') {
          return { available: false, error: t('onboarding.identity.emailServiceExists') };
        }
        if (response.data?.code === 'PROVIDER_EMAIL_DIFFERENT_SERVICE') {
          return { available: false, error: t('onboarding.identity.emailDifferentService') };
        }
      }
      return { available: true, error: null };
    } catch {
      return { available: true, error: null };
    }
  }, [t]);

  const goToStep = useCallback((stepIndex) => {
    setCurrentStep(stepIndex);
    setError('');
  }, []);

  const nextStep = useCallback(() => {
    setCompletedSteps(prev => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });
    setCurrentStep(prev => prev + 1);
    setError('');
  }, [currentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    setError('');
  }, []);

  const validateStep = useCallback(async (stepIndex) => {
    switch (stepIndex) {
      case 0:
        if (!isExistingClient) {
          if (!formData.email || !formData.password) {
            setError(t('onboarding.validation.emailPasswordRequired'));
            return false;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError(t('onboarding.identity.emailInvalid'));
            return false;
          }
          const emailCheck = await checkEmailAvailability(formData.email);
          if (!emailCheck.available) {
            setError(emailCheck.error || t('onboarding.identity.emailNotAvailable'));
            return false;
          }
          if (formData.password.length < 6) {
            setError(t('onboarding.validation.passwordMin'));
            return false;
          }
        }
        if (!formData.businessName || formData.businessName.trim().length < 3) {
          setError(t('onboarding.validation.businessNameMin'));
          return false;
        }
        break;

      case 1:
        if (!formData.primaryCategory) {
          setError(t('onboarding.validation.selectMainCategory'));
          return false;
        }
        if (!formData.mainService || formData.mainService.trim().length < 3) {
          setError(t('onboarding.validation.mainServiceRequired'));
          return false;
        }
        if (!isExistingClient) {
          const providerCheck = await checkProviderAvailability(formData.email, formData.primaryCategory);
          if (!providerCheck.available) {
            setError(providerCheck.error || t('onboarding.identity.emailNotAvailable'));
            return false;
          }
        }
        break;

      case 2:
        if (!formData.serviceAreaZone || formData.serviceAreaZone.trim().length < 2) {
          setError(t('onboarding.validation.serviceAreaRequired'));
          return false;
        }
        if (!formData.radius || formData.radius < 1) {
          setError(t('onboarding.validation.radiusRequired'));
          return false;
        }
        break;

      case 3:
        if (!formData.acceptTerms || !formData.acceptPrivacy) {
          setError(t('onboarding.validation.acceptTerms'));
          return false;
        }
        break;

      default:
        break;
    }

    setError('');
    return true;
  }, [formData, isExistingClient, checkEmailAvailability, checkProviderAvailability, t]);

  const saveStep = useCallback(async (stepIndex) => {
    const isValid = await validateStep(stepIndex);
    if (!isValid) {
      return false;
    }

    setLoading(true);
    setError('');

    try {
      if (isExistingClient && user?.id) {
        await api.put('/auth/profile', {
          providerDraft: {
            step: stepIndex,
            data: formData,
            updatedAt: new Date().toISOString()
          }
        });
      }

      nextStep();
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || t('onboarding.toast.stepError'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateStep, nextStep, formData, isExistingClient, user, t]);

  const submitOnboarding = useCallback(async (finalData = {}) => {
    setLoading(true);
    setError('');

    try {
      setCompletedSteps(prev => {
        if (!prev.includes(3)) {
          return [...prev, 3];
        }
        return prev;
      });

      const mergedData = { ...formData, ...finalData };
      const primaryCategory = mergedData.primaryCategory;

      const payload = {
        businessName: mergedData.businessName,
        description: mergedData.description,
        services: mergedData.servicesList?.length > 0
          ? [mergedData.servicesList[0]]
          : [{
              category: primaryCategory,
              name: mergedData.mainService,
              description: mergedData.description
            }],
        additionalServices: mergedData.additionalCategories || [],
        serviceArea: {
          zones: mergedData.serviceAreaZone ? [mergedData.serviceAreaZone] : [],
          radius: Number(mergedData.radius) || 15,
          coordinates: (mergedData.lat !== '' && mergedData.lng !== '' &&
                       !isNaN(Number(mergedData.lat)) && !isNaN(Number(mergedData.lng)))
            ? { lat: Number(mergedData.lat), lng: Number(mergedData.lng) }
            : undefined
        },
        phone: mergedData.phone,
        referredByCode: mergedData.referredByCode || undefined
      };

      if (!isExistingClient) {
        payload.email = formData.email;
        payload.password = formData.password;
        payload.firstName = formData.firstName || formData.businessName;
        payload.lastName = formData.lastName || '';
      }

      if (onRegistrationComplete && typeof onRegistrationComplete === 'function') {
        clearDraft();
        const result = await onRegistrationComplete(payload);
        if (result) {
          if (result.pending || result.ok) {
            return { success: true, data: result };
          } else if (result.error) {
            setError(result.error?.message || result.error || t('onboarding.toast.stepError'));
            return { success: false, error: result.error };
          }
        }
        return { success: true };
      }

      let response;
      if (isExistingClient) {
        response = await api.post('/auth/become-provider', payload);
      } else {
        response = await api.post('/auth/register/provider', payload);

        const token = response.data?.data?.token;
        if (token) {
          try {
            localStorage.setItem('access_token', token);
          } catch (e) {
            console.error('Error saving token:', e);
          }
        }

        const userEmail = response.data?.data?.user?.email || formData.email;
        if (userEmail) {
          try {
            sessionStorage.setItem('pending_verification_email', userEmail);
          } catch (e) {
            console.error('Error saving pending email:', e);
          }
        }
      }

      clearDraft();

      return { success: true, data: response.data };
    } catch (err) {
      const message = err?.response?.data?.message || t('onboarding.toast.stepError');
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [formData, isExistingClient, clearDraft, onRegistrationComplete, t]);

  const completionPercentage = useMemo(() => {
    const totalSteps = 4;
    const completed = completedSteps.length;
    const current = currentStep > completed ? 1 : 0;
    return Math.round(((completed + current) / totalSteps) * 100);
  }, [completedSteps, currentStep]);

  const value = {
    currentStep,
    completedSteps,
    formData,
    loading,
    error,
    isExistingClient,
    completionPercentage,

    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    validateStep,
    saveStep,
    submitOnboarding,
    clearDraft,
    setError,
    checkEmailAvailability
  };

  return (
    <ProviderOnboardingContext.Provider value={value}>
      {children}
    </ProviderOnboardingContext.Provider>
  );
}

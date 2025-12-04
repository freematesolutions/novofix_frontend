import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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

export function ProviderOnboardingProvider({ children, user, isExistingClient = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => {
    // Si es cliente existente, NO usar draft del localStorage para evitar conflictos
    // Solo usar draft para usuarios no autenticados (guest)
    if (!isExistingClient) {
      try {
        const draft = localStorage.getItem(STORAGE_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          // Si hay draft y es reciente (< 7 días), usarlo
          if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            // Validar que el email del draft no sea de un usuario autenticado
            if (!user?.email || parsed.data?.email !== user.email) {
              return parsed.data || {};
            }
          }
        }
      } catch {
        // ignore
      }
    } else {
      // Limpiar draft si es cliente existente
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    
    // Prefill desde usuario existente
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
      categories: user?.providerProfile?.services?.map(s => s.category).filter(Boolean) || [],
      mainService: user?.providerProfile?.services?.[0]?.name || '',
      servicesList: user?.providerProfile?.services || [],
      
      // Paso 3: Cobertura
      serviceAreaZone: user?.providerProfile?.serviceArea?.zones?.[0] || '',
      radius: user?.providerProfile?.serviceArea?.radius || 15,
      lat: user?.providerProfile?.serviceArea?.coordinates?.lat || '',
      lng: user?.providerProfile?.serviceArea?.coordinates?.lng || '',
      serviceMode: 'both', // online, presencial, both
      
      // Paso 4: Verificación (opcional)
      acceptTerms: false,
      acceptPrivacy: false,
      referredByCode: '',
      
      // Metadata
      isExistingClient
    };
  });

  // Autosave al localStorage cada vez que cambia formData
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

  // Validación de email en tiempo real
  const checkEmailAvailability = useCallback(async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { available: false, error: 'Email inválido' };
    }

    // Si es cliente existente y está usando su propio email, permitirlo (multirol)
    if (isExistingClient && user?.email && email.toLowerCase() === user.email.toLowerCase()) {
      return { available: true, error: null, isCurrentUser: true };
    }

    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return { 
        available: response.data?.available !== false, 
        error: response.data?.available === false ? 'Este email ya está registrado' : null 
      };
    } catch (err) {
      // Si el endpoint no existe, retornar disponible por defecto
      if (err?.response?.status === 404) {
        return { available: true, error: null };
      }
      return { available: false, error: 'Error al verificar email' };
    }
  }, [isExistingClient, user?.email]);

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
    // Validación básica por paso
    switch (stepIndex) {
      case 0: // Identidad profesional
        if (!isExistingClient) {
          if (!formData.email || !formData.password) {
            setError('Email y contraseña son requeridos');
            return false;
          }
          // Validar formato de email
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Email inválido');
            return false;
          }
          // Verificar disponibilidad del email
          const emailCheck = await checkEmailAvailability(formData.email);
          if (!emailCheck.available) {
            setError(emailCheck.error || 'Este email ya está registrado');
            return false;
          }
          if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return false;
          }
        }
        if (!formData.businessName || formData.businessName.trim().length < 3) {
          setError('El nombre comercial debe tener al menos 3 caracteres');
          return false;
        }
        break;
      
      case 1: // Oferta y servicios
        if (!formData.categories || formData.categories.length === 0) {
          setError('Selecciona al menos una categoría');
          return false;
        }
        if (!formData.mainService || formData.mainService.trim().length < 3) {
          setError('Describe tu servicio principal');
          return false;
        }
        break;
      
      case 2: // Cobertura
        if (!formData.serviceAreaZone || formData.serviceAreaZone.trim().length < 2) {
          setError('Especifica tu zona de servicio');
          return false;
        }
        if (!formData.radius || formData.radius < 1) {
          setError('Especifica un radio válido');
          return false;
        }
        break;
      
      case 3: // Verificación
        if (!formData.acceptTerms || !formData.acceptPrivacy) {
          setError('Debes aceptar los términos y políticas');
          return false;
        }
        break;
      
      default:
        break;
    }
    
    setError('');
    return true;
  }, [formData, isExistingClient]);

  const saveStep = useCallback(async (stepIndex) => {
    const isValid = await validateStep(stepIndex);
    if (!isValid) {
      return false;
    }

    setLoading(true);
    setError('');

    try {
      // Guardar progreso en el servidor (draft)
      if (isExistingClient && user?.id) {
        // Para cliente existente, guardar como draft en su perfil
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
      setError(err?.response?.data?.message || 'Error al guardar');
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateStep, nextStep, formData, isExistingClient, user]);

  const submitOnboarding = useCallback(async (finalData = {}) => {
    setLoading(true);
    setError('');

    try {
      // Marcar paso 3 como completado antes de enviar
      setCompletedSteps(prev => {
        if (!prev.includes(3)) {
          return [...prev, 3];
        }
        return prev;
      });

      // Merge con datos finales del último paso
      const mergedData = { ...formData, ...finalData };
      
      // Construir payload según el flujo
      const payload = {
        businessName: mergedData.businessName,
        description: mergedData.description,
        services: mergedData.servicesList?.length > 0 
          ? mergedData.servicesList 
          : mergedData.categories.map(cat => ({
              category: cat,
              name: cat === mergedData.categories[0] ? mergedData.mainService : cat,
              description: mergedData.description
            })),
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
        // Registro nuevo como proveedor
        payload.email = formData.email;
        payload.password = formData.password;
        payload.firstName = formData.firstName || formData.businessName;
        payload.lastName = formData.lastName || '';
      }

      let response;
      if (isExistingClient) {
        // Upgrade de cliente a proveedor
        response = await api.post('/auth/become-provider', payload);
      } else {
        // Registro nuevo - el AuthContext.registerProvider ya maneja el token
        response = await api.post('/auth/register/provider', payload);
        
        // Guardar token en localStorage para nuevos usuarios
        const token = response.data?.data?.token;
        if (token) {
          try {
            localStorage.setItem('access_token', token);
          } catch (e) {
            console.error('Error saving token:', e);
          }
        }
      }

      // Limpiar draft
      clearDraft();

      return { success: true, data: response.data };
    } catch (err) {
      const message = err?.response?.data?.message || 'Error al completar el registro';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [formData, isExistingClient, clearDraft]);

  const completionPercentage = useMemo(() => {
    const totalSteps = 4;
    const completed = completedSteps.length;
    const current = currentStep > completed ? 1 : 0;
    return Math.round(((completed + current) / totalSteps) * 100);
  }, [completedSteps, currentStep]);

  const value = {
    // Estado
    currentStep,
    completedSteps,
    formData,
    loading,
    error,
    isExistingClient,
    completionPercentage,
    
    // Métodos
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

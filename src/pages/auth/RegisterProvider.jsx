import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import { ProviderOnboardingProvider } from '@/state/ProviderOnboardingContext.jsx';
import ProviderOnboardingWizard from '@/components/onboarding/ProviderOnboardingWizard.jsx';

function RegisterProvider() {
  const { user, role, roles, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => { clearError?.(); }, [clearError]);
  
  // If user is already authenticated, check their role status
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Si ya es proveedor, redirigir a empleos
    if (roles?.includes('provider') || role === 'provider') {
      navigate('/empleos', { replace: true });
    }
    // Si es cliente pero NO proveedor, continuar con el wizard de upgrade (multirol)
    // El isExistingClient se maneja automáticamente abajo
  }, [isAuthenticated, roles, role, navigate]);

  // Determinar si es cliente existente que quiere convertirse en proveedor (multirol)
  const isExistingClient = isAuthenticated && 
                          (role === 'client' || roles?.includes('client')) && 
                          !(roles?.includes('provider') || role === 'provider');

  // Usar el nuevo wizard unificado con detección automática de multirol
  return (
    <ProviderOnboardingProvider user={user} isExistingClient={isExistingClient}>
      <ProviderOnboardingWizard />
    </ProviderOnboardingProvider>
  );
}

export default RegisterProvider;

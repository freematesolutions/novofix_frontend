import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import { ProviderOnboardingProvider } from '@/state/ProviderOnboardingContext.jsx';
import ProviderOnboardingWizard from '@/components/onboarding/ProviderOnboardingWizard.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import Spinner from '@/components/ui/Spinner.jsx';

function RegisterProvider() {
  const { user, role, roles, isAuthenticated, clearError, registerProvider } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => { clearError?.(); }, [clearError]);
  
  // Si el usuario ya está autenticado, verificar su rol
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Si ya es proveedor, redirigir a empleos
    if (roles?.includes('provider') || role === 'provider') {
      navigate('/empleos', { replace: true });
      return;
    }
    
    // Si es cliente pero NO proveedor, continuar con el wizard de upgrade (multirol)
    // El isExistingClient se maneja automáticamente abajo
  }, [isAuthenticated, roles, role, navigate]);

  // Determinar si es cliente existente que quiere convertirse en proveedor (multirol)
  const isExistingClient = isAuthenticated && 
                          (role === 'client' || roles?.includes('client')) && 
                          !(roles?.includes('provider') || role === 'provider');

  // Función para manejar el registro de proveedor desde el wizard
  const handleProviderRegistration = async (providerData) => {
    setLoading(true);
    try {
      const result = await registerProvider(providerData);
      if (result.pending) {
        // Registro exitoso, pendiente de verificación
        // En modo demo, verificationUrl viene incluida para mostrar en la UI
        toast.success('¡Registro exitoso! Por favor verifica tu email para activar tu cuenta.');
        // Guardar email pendiente explícitamente en sessionStorage antes de redirigir
        if (result.email) {
          try { sessionStorage.setItem('pending_verification_email', result.email); } catch (e) {}
        }
        if (result.verificationUrl) {
          try { sessionStorage.setItem('pending_verification_url', result.verificationUrl); } catch (e) {}
        }
        navigate('/verificar-email', { 
          replace: true,
          state: { 
            email: providerData.email,
            verificationUrl: result.verificationUrl,
            demoMode: result.demoMode
          }
        });
      } else if (result.ok) {
        toast.success('¡Bienvenido! Te has registrado como proveedor');
        navigate('/servicios', { replace: true });
      } else {
        toast.error(result.error?.message || 'Error en el registro. Por favor intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error en registro de proveedor:', error);
      toast.error('Error en el registro. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" />
          <p className="text-gray-600">Procesando registro...</p>
        </div>
      </div>
    );
  }

  // Usar el nuevo wizard unificado con detección automática de multirol
  return (
    <ProviderOnboardingProvider 
      user={user} 
      isExistingClient={isExistingClient}
      onRegistrationComplete={handleProviderRegistration}
    >
      <ProviderOnboardingWizard />
    </ProviderOnboardingProvider>
  );
}

export default RegisterProvider;
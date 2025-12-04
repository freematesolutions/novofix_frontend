import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Alert from '@/components/ui/Alert.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { ProviderOnboardingProvider } from '@/state/ProviderOnboardingContext.jsx';
import ProviderOnboardingWizard from '@/components/onboarding/ProviderOnboardingWizard.jsx';

export default function Onboarding() {
  const { user, role, isAuthenticated, clearError } = useAuth();

  useEffect(() => { clearError?.(); }, [clearError]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto space-y-3">
        <Alert type="warning">Debes iniciar sesión para continuar con el registro de proveedor.</Alert>
        <div className="text-sm text-gray-700">
          <Link to="/login" className="text-brand-700 hover:text-brand-800 underline">Inicia sesión</Link> o
          {' '}<Link to="/unete" className="text-brand-700 hover:text-brand-800 underline">regístrate como profesional</Link> si aún no tienes cuenta.
        </div>
      </div>
    );
  }

  // Cliente existente activando perfil de proveedor
  const isExistingClient = role === 'client' || !user?.providerProfile;

  return (
    <ProviderOnboardingProvider user={user} isExistingClient={isExistingClient}>
      <ProviderOnboardingWizard />
    </ProviderOnboardingProvider>
  );
}

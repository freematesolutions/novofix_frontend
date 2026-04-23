import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Alert from '@/components/ui/Alert.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { ProviderOnboardingProvider } from '@/state/ProviderOnboardingContext.jsx';
import ProviderOnboardingWizard from '@/components/onboarding/ProviderOnboardingWizard.jsx';

export default function Onboarding() {
  const { t } = useTranslation();
  const { user, role, isAuthenticated, clearError } = useAuth();

  useEffect(() => { clearError?.(); }, [clearError]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto space-y-3 px-3 sm:px-6 py-4 sm:py-6">
        <Alert type="warning">{t('auth.onboarding.loginRequired')}</Alert>
        <div className="text-sm text-gray-700">
          <Link to="/login" className="text-brand-700 hover:text-brand-800 underline">{t('auth.onboarding.loginLink')}</Link> {t('auth.onboarding.or')}
          {' '}<Link to="/unete" className="text-brand-700 hover:text-brand-800 underline">{t('auth.onboarding.registerLink')}</Link> {t('auth.onboarding.noAccountYet')}
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

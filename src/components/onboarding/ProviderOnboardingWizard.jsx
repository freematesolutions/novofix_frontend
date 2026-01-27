import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProviderOnboarding } from '@/state/ProviderOnboardingContext.jsx';
import IdentityStep from './steps/IdentityStep.jsx';
import OfferingStep from './steps/OfferingStep.jsx';
import CoverageStep from './steps/CoverageStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';
import Alert from '@/components/ui/Alert.jsx';

// ============================================================================
// ICONS - Iconos SVG modernos para cada paso
// ============================================================================
const Icons = {
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Briefcase: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  MapPin: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  CheckCircle: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Shield: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  X: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Info: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Save: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Help: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const getSteps = (t) => [
  { 
    id: 'identity', 
    title: t('onboarding.steps.identity.title'),
    fullTitle: t('onboarding.steps.identity.fullTitle'),
    description: t('onboarding.steps.identity.description'),
    icon: Icons.User,
    component: IdentityStep 
  },
  { 
    id: 'offering', 
    title: t('onboarding.steps.offering.title'),
    fullTitle: t('onboarding.steps.offering.fullTitle'),
    description: t('onboarding.steps.offering.description'),
    icon: Icons.Briefcase,
    component: OfferingStep 
  },
  { 
    id: 'coverage', 
    title: t('onboarding.steps.coverage.title'),
    fullTitle: t('onboarding.steps.coverage.fullTitle'),
    description: t('onboarding.steps.coverage.description'),
    icon: Icons.MapPin,
    component: CoverageStep 
  },
  { 
    id: 'review', 
    title: t('onboarding.steps.review.title'),
    fullTitle: t('onboarding.steps.review.fullTitle'),
    description: t('onboarding.steps.review.description'),
    icon: Icons.CheckCircle,
    component: ReviewStep 
  }
];

export default function ProviderOnboardingWizard() {
  const { t } = useTranslation();
  const { 
    currentStep, 
    completedSteps, 
    completionPercentage,
    isExistingClient,
    error: contextError,
    goToStep
  } = useProviderOnboarding();

  const STEPS = getSteps(t);
  const currentStepData = STEPS[currentStep];
  const StepComponent = currentStepData?.component;
  const StepIcon = currentStepData?.icon;
  const stepContentRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // Calcular tiempo estimado restante
  const estimatedMinutes = Math.max(1, Math.round((100 - completionPercentage) / 25));

  // Manejar click en paso de la barra de progreso
  const handleStepClick = (targetIndex) => {
    if (targetIndex === currentStep) return;

    const canAccess = targetIndex === 0 || completedSteps.includes(targetIndex - 1);

    if (canAccess) {
      goToStep(targetIndex);
    } else {
      const previousStepTitle = STEPS[targetIndex - 1]?.title || t('onboarding.previousStep');
      setToast({
        show: true,
        message: t('onboarding.completeStepFirst', { step: previousStepTitle }),
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  // Scroll al contenido del formulario cuando cambia el paso
  useEffect(() => {
    if (currentStep > 0 && stepContentRef.current) {
      setTimeout(() => {
        const element = stepContentRef.current;
        if (element) {
          const stickyBarHeight = 200; 
          const y = element.getBoundingClientRect().top + window.pageYOffset - stickyBarHeight;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    } else if (currentStep === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/30">
      {/* Progress bar - Sticky con diseño mejorado */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          {/* Header de progreso */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Icons.Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('onboarding.stepProgress', { current: currentStep + 1, total: STEPS.length })}
                </h3>
                <p className="text-xs text-gray-500">{currentStepData.fullTitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-brand-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-brand-700">
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* Barra de progreso moderna */}
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
            <div 
              className="absolute inset-y-0 left-0 bg-linear-to-r from-brand-500 via-brand-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          
          {/* Steps indicator con iconos */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = index === currentStep;
              const canNavigate = index === 0 || completedSteps.includes(index - 1);
              const isClickable = !isCurrent && (isCompleted || canNavigate);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center relative">
                  {/* Línea conectora */}
                  {index < STEPS.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      completedSteps.includes(index) ? 'bg-brand-500' : 'bg-gray-200'
                    }`} />
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable && !isCurrent}
                    className={`
                      relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-2
                      transition-all duration-300 ease-out
                      ${isCompleted 
                        ? 'bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                        : isCurrent 
                          ? 'bg-linear-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-500/30 ring-4 ring-brand-100' 
                          : canNavigate 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-gray-100 text-gray-400'}
                      ${isClickable ? 'hover:scale-110 hover:shadow-xl cursor-pointer' : ''}
                      ${isCurrent ? 'cursor-default scale-110' : ''}
                      ${!isClickable && !isCurrent ? 'cursor-not-allowed opacity-50' : ''}
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                    `}
                    title={
                      isCurrent ? t('onboarding.tooltip.currentStep', { step: step.title }) :
                      isCompleted ? t('onboarding.tooltip.completed', { step: step.title }) :
                      canNavigate ? t('onboarding.tooltip.goTo', { step: step.title }) :
                      t('onboarding.tooltip.completeFirst', { step: step.title })
                    }
                  >
                    {isCompleted ? (
                      <Icons.Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </button>
                  <span className={`text-xs text-center hidden sm:block font-medium transition-colors ${
                    isCurrent ? 'text-brand-600' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header con diseño moderno */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-brand-500 to-indigo-600 rounded-2xl mb-4 shadow-xl shadow-brand-500/25">
            {StepIcon && <StepIcon className="w-8 h-8 text-white" />}
          </div>
          
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
            {isExistingClient ? t('onboarding.activateProviderProfile') : t('onboarding.joinAsProfessional')}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            {isExistingClient 
              ? t('onboarding.completeInfoToReceiveRequests')
              : t('onboarding.createProfileAndConnect')
            }
          </p>
          
          {/* Tiempo estimado badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
            <Icons.Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {t('onboarding.estimatedTimeRemaining', { count: estimatedMinutes })}
            </span>
          </div>
        </div>

        {/* Error global */}
        {contextError && (
          <div className="mb-6">
            <Alert type="error">{contextError}</Alert>
          </div>
        )}

        {/* Step content con diseño mejorado */}
        <div ref={stepContentRef} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Header del paso */}
          <div className="px-6 md:px-8 py-5 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                {StepIcon && <StepIcon className="w-6 h-6 text-brand-600" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentStepData.fullTitle}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentStepData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="p-6 md:p-8">
            {StepComponent && <StepComponent />}
          </div>
        </div>

        {/* Footer info mejorado */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Icons.Save className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">{t('onboarding.autoSave.title')}</p>
              <p className="text-xs text-blue-600 mt-0.5">
                {t('onboarding.autoSave.description')}
              </p>
            </div>
          </div>
          
          <a 
            href="/contacto" 
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors group"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
              <Icons.Help className="w-4 h-4 text-gray-600 group-hover:text-brand-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{t('onboarding.help.title')}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {t('onboarding.help.description')}
              </p>
            </div>
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-gray-500">
            <Icons.Shield className="w-4 h-4" />
            <span className="text-xs">{t('onboarding.badges.dataProtected')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Icons.CheckCircle className="w-4 h-4" />
            <span className="text-xs">{t('onboarding.badges.fastVerification')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Icons.Sparkles className="w-4 h-4" />
            <span className="text-xs">{t('onboarding.badges.free')}</span>
          </div>
        </div>
      </div>

      {/* Toast mejorado para mensajes de navegación */}
      {toast.show && (
        <div className="fixed top-24 right-4 z-50 animate-slideIn">
          <div className={`
            rounded-xl shadow-2xl px-4 py-3 max-w-sm backdrop-blur-sm
            ${toast.type === 'error' 
              ? 'bg-red-50/95 border border-red-200' 
              : 'bg-blue-50/95 border border-blue-200'}
          `}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                toast.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {toast.type === 'error' 
                  ? <Icons.X className="w-4 h-4 text-red-600" />
                  : <Icons.Info className="w-4 h-4 text-blue-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  toast.type === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToast({ show: false, message: '', type: 'error' })}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para animación shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import RequestWizardModal from './RequestWizardModal.jsx';
import GuestConversionModal from './GuestConversionModal.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import StarRating from './StarRating.jsx';

// Iconos SVG inline para mejor rendimiento
const Icons = {
  Star: ({ filled, className = "w-5 h-5" }) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={filled ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Close: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Location: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Message: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Verified: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  ),
  Briefcase: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Clock: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Play: ({ className = "w-8 h-8" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Image: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  ChevronLeft: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  User: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ThumbUp: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  ),
  Award: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
};

// Plan badges config
const planConfig = {
  pro: { 
    label: 'PRO', 
    gradient: 'from-purple-500 to-purple-700',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    ring: 'ring-purple-400',
    icon: '👑'
  },
  basic: { 
    label: 'BASIC', 
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    ring: 'ring-blue-400',
    icon: '⭐'
  },
  free: { 
    label: 'FREE', 
    gradient: 'from-gray-400 to-gray-500',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-600',
    ring: 'ring-gray-300',
    icon: '✨'
  }
};

// Tab configuration
const TABS = [
  { id: 'about', labelKey: 'about', icon: '👤' },
  { id: 'services', labelKey: 'services', icon: '🛠️' },
  { id: 'portfolio', labelKey: 'portfolio', icon: '📸' },
  { id: 'reviews', labelKey: 'reviews', icon: '⭐' }
];

function ProviderProfileModal({ isOpen, onClose, provider, initialTab, selectedCategory = null, readOnly = false }) {
  const { t } = useTranslation();
  const { isAuthenticated, viewRole } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab || 'about');
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  const [showGuestConversion, setShowGuestConversion] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const modalRef = useRef(null);
  const sectionRefs = {
    about: useRef(null),
    services: useRef(null),
    portfolio: useRef(null),
    reviews: useRef(null)
  };

  // Ref para el contenedor scrollable
  const scrollContainerRef = useRef(null);
  
  // Flag para evitar actualizar tab durante scroll programático
  const isScrollingProgrammatically = useRef(false);

  // Scroll automático a la sección correspondiente según initialTab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
      setTimeout(() => {
        const sectionEl = sectionRefs[initialTab]?.current;
        const scrollContainer = scrollContainerRef.current;
        if (sectionEl && scrollContainer) {
          isScrollingProgrammatically.current = true;
          const containerRect = scrollContainer.getBoundingClientRect();
          const sectionRect = sectionEl.getBoundingClientRect();
          const currentScroll = scrollContainer.scrollTop;
          const targetScroll = currentScroll + sectionRect.top - containerRect.top - 16;
          
          scrollContainer.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
          });
          
          // Resetear el flag después de que termine el scroll
          setTimeout(() => {
            isScrollingProgrammatically.current = false;
          }, 500);
        }
      }, 250);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTab]);

  // Scroll spy: actualizar pestaña activa según la sección visible
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!isOpen || !scrollContainer) return;

    const handleScroll = () => {
      // No actualizar si el scroll es programático (click en tab)
      if (isScrollingProgrammatically.current) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const containerTop = containerRect.top;
      
      // Encontrar qué sección está más cerca del tope del contenedor
      let closestSection = 'about';
      let closestDistance = Infinity;

      TABS.forEach(tab => {
        const sectionEl = sectionRefs[tab.id]?.current;
        if (sectionEl) {
          const sectionRect = sectionEl.getBoundingClientRect();
          // Distancia desde el tope de la sección al tope del contenedor
          const distance = Math.abs(sectionRect.top - containerTop - 50);
          
          // Si la sección está visible y es la más cercana al tope
          if (sectionRect.top <= containerTop + 150 && distance < closestDistance) {
            closestDistance = distance;
            closestSection = tab.id;
          }
        }
      });

      setActiveTab(closestSection);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Extract provider data
  const businessName = provider?.providerProfile?.businessName || provider?.profile?.firstName || t('ui.providerProfile.professional');
  const description = provider?.providerProfile?.description || provider?.providerProfile?.businessDescription || '';
  const rating = provider?.providerProfile?.rating?.average || 0;
  const reviewCount = provider?.providerProfile?.rating?.count || 0;
  const ratingBreakdown = provider?.providerProfile?.rating?.breakdown || {};
  const plan = provider?.subscription?.plan || 'free';
  const services = provider?.providerProfile?.services || [];
  const mainService = services[0];
  const additionalServices = (provider?.providerProfile?.additionalServices && provider.providerProfile.additionalServices.length > 0)
    ? provider.providerProfile.additionalServices
    : services.slice(1).map(s => s.category).filter(Boolean);
  const profileImage = provider?.profile?.avatar || null;
  const portfolio = provider?.providerProfile?.portfolio || [];
  const stats = provider?.providerProfile?.stats || {};
  const score = provider?.score?.total || 0;
  const serviceArea = provider?.providerProfile?.serviceArea || {};
  const completedJobs = stats.completedJobs || 0;
  const responseRate = stats.responseRate || 0;
  
  // Simulated reviews (in real app, fetch from API)
  const reviews = provider?.reviews || [];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (isOpen && initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll to section when tab changes
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    isScrollingProgrammatically.current = true;
    
    const sectionEl = sectionRefs[tabId]?.current;
    const scrollContainer = scrollContainerRef.current;
    if (sectionEl && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const currentScroll = scrollContainer.scrollTop;
      const targetScroll = currentScroll + sectionRect.top - containerRect.top - 16;
      
      scrollContainer.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
      
      // Resetear el flag después de que termine el scroll
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    } else {
      isScrollingProgrammatically.current = false;
    }
  };

  // Handle contact/message
  const handleMessage = () => {
    // Si no está autenticado, mostrar modal de conversión guest
    if (!isAuthenticated) {
      setShowGuestConversion(true);
      return;
    }
    // Si está autenticado pero no es cliente, mostrar mensaje
    if (viewRole !== 'client') {
      toast.warning(t('ui.providerProfile.onlyClientsCanRequest'));
      return;
    }
    setShowRequestWizard(true);
  };

  // Portfolio navigation
  const handlePortfolioNav = (direction) => {
    const newIndex = direction === 'next' 
      ? (portfolioIndex + 1) % portfolio.length
      : (portfolioIndex - 1 + portfolio.length) % portfolio.length;
    setPortfolioIndex(newIndex);
    setSelectedPortfolioItem(portfolio[newIndex]);
  };

  if (!isOpen || !provider) return null;

  const planInfo = planConfig[plan] || planConfig.free;

  // Rating bar component - diseño simple y robusto
  const RatingBar = ({ label, value, icon }) => (
    <div className="flex items-center text-xs">
      <span className="w-5 shrink-0">{icon}</span>
      <span className="w-24 text-gray-600 truncate">{label}</span>
      <div className="flex-1 mx-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-linear-to-r from-yellow-400 to-amber-500 rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-7 text-right font-semibold text-gray-700">{value.toFixed(1)}</span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10000 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed left-2 right-2 top-16 bottom-2 sm:left-4 sm:right-4 sm:top-24 sm:bottom-4 lg:left-8 lg:right-8 lg:top-32 lg:bottom-8 bg-white rounded-2xl shadow-2xl z-10000 flex flex-col overflow-hidden animate-modal-enter"
      >
        {/* Compact Header with Provider Basic Info */}
        <div className={`relative bg-linear-to-br ${planInfo.gradient} px-4 py-3 sm:px-6 sm:py-4`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 p-2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full transition-all shadow-md"
          >
            <Icons.Close className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Compact layout - horizontal on all screens */}
          <div className="relative flex items-center gap-3 sm:gap-4 pr-10">
            {/* Small Avatar */}
            <div className="relative shrink-0">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={businessName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Plan badge */}
              <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-white rounded-full shadow flex items-center gap-0.5`}>
                <span className="text-xs">{planInfo.icon}</span>
                <span className={`text-[10px] font-bold ${planInfo.textColor}`}>{planInfo.label}</span>
              </div>
            </div>

            {/* Info - compact */}
            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-xl font-bold truncate">{businessName}</h1>
                <Icons.Verified className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 shrink-0" />
              </div>
              
              {/* Rating inline */}
              <div className="flex items-center gap-2 text-sm overflow-hidden">
                <div className="flex items-center gap-1 shrink-0">
                  <StarRating value={rating} size="xs" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                  <span className="text-white/70">({reviewCount})</span>
                </div>
                
                {score > 0 && (
                  <span className="text-emerald-300 font-medium shrink-0">Score: {score.toFixed(1)}</span>
                )}
                
                <span className="hidden sm:inline text-white/70">•</span>
                <span className="hidden sm:inline"><b>{completedJobs}</b> {t('ui.providerProfile.jobs')}</span>
              </div>
            </div>

            {/* Action buttons - compact, hidden on mobile */}
            {!readOnly && (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-1.5 bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all shadow"
                >
                  <Icons.Message className="w-4 h-4" />
                  {t('ui.providerProfile.sendRequest')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation - more compact */}
        <div className="sticky top-0 bg-white border-b z-10 px-3 sm:px-4">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{t(`ui.providerProfile.tabs.${tab.labelKey}`)}</span>
                {tab.id === 'reviews' && reviewCount > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {reviewCount}
                  </span>
                )}
                {tab.id === 'portfolio' && portfolio.length > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {portfolio.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="p-3 sm:p-5 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
            
            {/* ========== ABOUT SECTION ========== */}
            <section ref={sectionRefs.about} id="about" className="pt-1">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 mb-4">
                <span className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">👤</span>
                {t('ui.providerProfile.tabs.about')}
              </h2>
              
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Description */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{t('ui.providerProfile.description')}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {description || t('ui.providerProfile.noDescription')}
                  </p>
                </div>

                {/* Location & Contact */}
                <div className="space-y-3">
                  {/* Location card */}
                  <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icons.Location className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{t('ui.providerProfile.location')}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {serviceArea.zones?.join(', ') || t('ui.providerProfile.serviceAreaNotSpecified')}
                    </p>
                    {serviceArea.radius && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('ui.providerProfile.coverageRadius', { radius: serviceArea.radius })}
                      </p>
                    )}
                  </div>

                  {/* Action buttons (shown always on mobile, additional on desktop) */}
                  {!readOnly && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleMessage}
                        className="flex items-center justify-center gap-2 bg-linear-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow"
                      >
                        <Icons.Message className="w-4 h-4" />
                        {t('ui.providerProfile.sendRequest')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ========== SERVICES SECTION ========== */}
            <section ref={sectionRefs.services} id="services" className="pt-1">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 mb-4">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">🛠️</span>
                {t('ui.providerProfile.servicesOffered')}
              </h2>

              {mainService ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="group relative bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-md transition-all duration-300">
                      {/* Category badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-linear-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white text-base">
                          {mainService.category?.charAt(0) || '🔧'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{t(`home.categories.${mainService.category}`, mainService.category)}</h3>
                          {mainService.experience && (
                            <p className="text-xs text-gray-500">{t('ui.providerProfile.yearsExp', { years: mainService.experience })}</p>
                          )}
                        </div>
                      </div>

                      {/* Service name */}
                      {mainService.name && (
                        <p className="font-medium text-gray-700 text-sm mb-1">{mainService.name}</p>
                      )}

                      {/* Description */}
                      {mainService.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {mainService.description}
                        </p>
                      )}

                      {/* Subcategories */}
                      {mainService.subcategories?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mainService.subcategories.slice(0, 2).map((sub, subIdx) => (
                            <span 
                              key={subIdx}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {sub}
                            </span>
                          ))}
                          {mainService.subcategories.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{mainService.subcategories.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Hover effect checkmark */}
                      <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('ui.providerProfile.additionalServices')}</h4>
                    {additionalServices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {additionalServices.map((svc) => (
                          <span key={svc} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                            {t(`home.categories.${svc}`, svc)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">{t('ui.providerProfile.noAdditionalServices')}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Icons.Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">{t('ui.providerProfile.noServicesListed')}</p>
                </div>
              )}
            </section>

            {/* ========== PORTFOLIO SECTION ========== */}
            <section ref={sectionRefs.portfolio} id="portfolio" className="pt-2">
              <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">📸</span>
                {t('ui.providerProfile.portfolio')}
                {portfolio.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({t('ui.providerProfile.works', { count: portfolio.length })})
                  </span>
                )}
              </h2>

              {portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolio.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPortfolioItem(item);
                        setPortfolioIndex(idx);
                      }}
                      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                    >
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.caption || t('ui.providerProfile.portfolioWork')}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          <video 
                            src={item.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                              <Icons.Play className="w-6 h-6 text-gray-800 ml-1" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        {item.caption && (
                          <p className="text-white text-sm line-clamp-2">{item.caption}</p>
                        )}
                      </div>

                      {/* Type badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'video' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/90 text-gray-700'
                        }`}>
                          {item.type === 'video' ? t('ui.providerProfile.videoType') : t('ui.providerProfile.imageType')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Icons.Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('ui.providerProfile.noPortfolioWorks')}</p>
                </div>
              )}
            </section>

            {/* ========== REVIEWS SECTION ========== */}
            <section 
              ref={sectionRefs.reviews} 
              id="reviews" 
              style={{ 
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1
              }}
            >
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 mb-3">
                <span className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-100 rounded-lg flex items-center justify-center text-xs sm:text-sm">⭐</span>
                <span>{t('ui.providerProfile.reviewsAndRatings')}</span>
              </h2>

              {/* Rating Summary - BLOQUE 1: Calificación general - SIN GRID */}
              <div 
                style={{ 
                  display: 'block',
                  width: '100%',
                  background: 'linear-gradient(to bottom right, #fffbeb, #fef3c7)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  position: 'relative',
                  zIndex: 1,
                  overflow: 'hidden'
                }}
              >
                <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                  {rating.toFixed(1)}
                </div>
                {/* StarRating contenido en un div con overflow hidden */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginBottom: '4px',
                  overflow: 'hidden',
                  maxWidth: '100%'
                }}>
                  <div style={{ overflow: 'hidden', maxWidth: '150px' }}>
                    <StarRating value={rating} size="sm" readonly />
                  </div>
                </div>
                <p style={{ color: '#4b5563', fontSize: '12px' }}>
                  {t('ui.providerProfile.basedOnReviews', { count: reviewCount })}
                </p>
              </div>

              {/* Rating Summary - BLOQUE 2: Desglose - COMPLETAMENTE SEPARADO */}
              <div 
                style={{ 
                  display: 'block',
                  width: '100%',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <h3 style={{ fontWeight: 600, color: '#111827', marginBottom: '8px', fontSize: '12px' }}>
                  {t('ui.providerProfile.ratingsBreakdown')}
                </h3>
                {/* Rating bars con estilos inline */}
                {[
                  { label: t('ui.providerProfile.quality'), value: ratingBreakdown.quality || 0, icon: '🎯' },
                  { label: t('ui.providerProfile.professionalism'), value: ratingBreakdown.professionalism || 0, icon: '💼' },
                  { label: t('ui.providerProfile.communication'), value: ratingBreakdown.communication || 0, icon: '💬' },
                  { label: t('ui.providerProfile.punctuality'), value: ratingBreakdown.punctuality || 0, icon: '⏰' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: idx < 3 ? '8px' : '0',
                      fontSize: '11px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ width: '18px', flexShrink: 0, fontSize: '12px' }}>{item.icon}</span>
                    <span style={{ 
                      width: '70px', 
                      flexShrink: 0, 
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.label}
                    </span>
                    <div style={{ 
                      flex: 1, 
                      height: '6px', 
                      backgroundColor: '#e5e7eb',
                      borderRadius: '9999px',
                      marginLeft: '6px',
                      marginRight: '6px',
                      overflow: 'hidden',
                      minWidth: '30px'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(item.value / 5) * 100}%`,
                        background: 'linear-gradient(to right, #facc15, #f59e0b)',
                        borderRadius: '9999px'
                      }} />
                    </div>
                    <span style={{ 
                      width: '24px', 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: '#374151',
                      flexShrink: 0,
                      fontSize: '11px'
                    }}>
                      {item.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reviews list - responsive mejorado */}
              {reviews.length > 0 ? (
                <div className="space-y-2 sm:space-y-3" style={{ overflow: 'hidden' }}>
                  {reviews.map((review, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-shadow" style={{ overflow: 'hidden' }}>
                      <div className="flex flex-col xs:flex-row xs:items-start gap-2 xs:gap-3 sm:gap-4">
                        {/* Reviewer avatar - más pequeño en móviles */}
                        <div className="flex items-center gap-2 xs:block" style={{ overflow: 'hidden' }}>
                          <div className="shrink-0 w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Icons.User className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-500" />
                          </div>
                          {/* Nombre visible solo en móviles muy pequeños junto al avatar */}
                          <div className="xs:hidden" style={{ overflow: 'hidden', maxWidth: '200px' }}>
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {review.clientName || t('ui.providerProfile.verifiedClient')}
                            </h4>
                            <div style={{ overflow: 'hidden', maxWidth: '100px' }}>
                              <StarRating value={review.rating?.overall || 5} size="xs" readonly />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0" style={{ overflow: 'hidden' }}>
                          <div className="hidden xs:flex items-start justify-between gap-2 mb-1 sm:mb-2">
                            <div style={{ overflow: 'hidden' }}>
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {review.clientName || t('ui.providerProfile.verifiedClient')}
                              </h4>
                              <div style={{ overflow: 'hidden', maxWidth: '120px' }}>
                                <StarRating value={review.rating?.overall || 5} size="sm" readonly />
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 shrink-0">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : t('ui.providerProfile.recent')}
                            </span>
                          </div>
                          
                          {/* Fecha en móviles muy pequeños */}
                          <span className="xs:hidden text-xs text-gray-500 block mb-1">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : t('ui.providerProfile.recent')}
                          </span>
                          
                          <p className="text-gray-600 text-xs sm:text-sm">{review.comment || review.review?.comment}</p>
                          
                          {/* Helpful buttons - más compacto */}
                          <div className="flex items-center gap-3 mt-2 sm:mt-3">
                            <button className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-brand-600 transition-colors">
                              <Icons.ThumbUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">{t('ui.providerProfile.helpful')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <span className="text-3xl mb-2 block">💬</span>
                  <p className="text-gray-500">{t('ui.providerProfile.noReviews')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('ui.providerProfile.beFirstToReview')}</p>
                </div>
              )}
            </section>

          </div>
        </div>

        {/* Mobile Action Bar */}
        {!readOnly && (
          <div className="sm:hidden sticky bottom-0 bg-white border-t p-4 flex gap-3">
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-3 rounded-xl font-semibold"
            >
              <Icons.Message className="w-5 h-5" />
              {t('ui.providerProfile.sendRequest')}
            </button>
          </div>
        )}
      </div>

      {/* Portfolio Lightbox */}
      {selectedPortfolioItem && (
        <div 
          className="fixed inset-0 bg-black/95 z-10001 flex items-center justify-center"
          onClick={() => setSelectedPortfolioItem(null)}
        >
          <button
            onClick={() => setSelectedPortfolioItem(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icons.Close className="w-6 h-6 text-white" />
          </button>

          {/* Navigation */}
          {portfolio.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePortfolioNav('prev'); }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <Icons.ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePortfolioNav('next'); }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <Icons.ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          {/* Content */}
          <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            {selectedPortfolioItem.type === 'image' ? (
              <img 
                src={selectedPortfolioItem.url}
                alt={selectedPortfolioItem.caption || 'Portfolio item'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <video 
                src={selectedPortfolioItem.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            )}
            {selectedPortfolioItem.caption && (
              <p className="text-white text-center mt-4">{selectedPortfolioItem.caption}</p>
            )}
            <p className="text-white/50 text-center text-sm mt-2">
              {portfolioIndex + 1} / {portfolio.length}
            </p>
          </div>
        </div>
      )}

      {/* Request Wizard Modal */}
      {showRequestWizard && (
        <RequestWizardModal
          provider={provider}
          isOpen={showRequestWizard}
          onClose={() => setShowRequestWizard(false)}
          initialCategory={selectedCategory}
        />
      )}

      {/* Guest Conversion Modal */}
      <GuestConversionModal
        isOpen={showGuestConversion}
        onClose={() => setShowGuestConversion(false)}
        provider={provider}
        onConversionComplete={() => {
          // Después de registrarse/login exitoso, abrir el wizard de solicitud
          setShowGuestConversion(false);
          setShowRequestWizard(true);
        }}
      />
    </>
  );
}

ProviderProfileModal.propTypes = {
  initialTab: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  provider: PropTypes.object,
  readOnly: PropTypes.bool,
  selectedCategory: PropTypes.string
};

export default ProviderProfileModal;

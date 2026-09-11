import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import useModalHistory from '@/utils/useModalHistory.js';
import RequestWizardModal from './RequestWizardModal.jsx';
import InquiryChatModal from './InquiryChatModal.jsx';
import GuestConversionModal from './GuestConversionModal.jsx';
import BeforeAfterGallery from './BeforeAfterGallery.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import StarRating from './StarRating.jsx';
import { isSelfProvider } from '@/utils/selfHireGuard.js';
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/utils/categoryImages.js';
import api from '@/state/apiClient.js';


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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 13.5L6 22l6-3.5L18 22l-2.5-8.5" />
      <circle cx="12" cy="8" r="6" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5.3l.99 2 2.21.32-1.6 1.56.38 2.2-1.98-1.04-1.98 1.04.38-2.2-1.6-1.56 2.21-.32z" fill="currentColor" stroke="none" />
    </svg>
  ),
  License: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  ),
  Shield: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
};

// Plan badges config
const planConfig = {
  elite: { 
    label: 'ÉLITE', 
    gradient: 'from-amber-500 to-amber-700',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    ring: 'ring-amber-400',
    icon: '👑'
  },
  expert: { 
    label: 'EXPERTO', 
    gradient: 'from-brand-500 to-brand-600',
    bgLight: 'bg-brand-50',
    textColor: 'text-brand-600',
    ring: 'ring-brand-400',
    icon: '⭐'
  },
  free: { 
    label: 'BÁSICO', 
    gradient: 'from-gray-400 to-gray-500',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-600',
    ring: 'ring-gray-300',
    icon: '✨'
  }
};

function ProviderProfileModal({ isOpen, onClose, provider, initialTab, selectedCategory = null, readOnly = false }) {
  const closeModal = useModalHistory(isOpen, onClose, 'provider-profile');
  const { t, i18n } = useTranslation();
  const { isAuthenticated, viewRole, user } = useAuth();
  const toast = useToast();
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  const [showInquiryChat, setShowInquiryChat] = useState(false);
  const [showGuestConversion, setShowGuestConversion] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const [providerReviews, setProviderReviews] = useState(null);
  const modalRef = useRef(null);
  const nameRowRef = useRef(null);
  const nameTextRef = useRef(null);
  const sectionRefs = {
    about: useRef(null),
    services: useRef(null),
    portfolio: useRef(null),
    reels: useRef(null),
    reviews: useRef(null)
  };

  // Ref para el contenedor scrollable
  const scrollContainerRef = useRef(null);
  
  // Flag para evitar actualizar tab durante scroll programático
  const isScrollingProgrammatically = useRef(false);

  // Scroll automático a la sección correspondiente según initialTab (por defecto, al abrir
  // el modal sin initialTab explícito, el foco natural ya recae en la primera sección
  // — Trabajos realizados — al estar arriba del todo del contenido scrollable).
  useEffect(() => {
    if (isOpen && initialTab) {
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

  // Extract provider data
  const businessName = provider?.providerProfile?.businessName || provider?.profile?.firstName || t('ui.providerProfile.professional');
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
  const primaryCategory = mainService?.category || selectedCategory || '';
  const headerImage = CATEGORY_IMAGES[primaryCategory] || FALLBACK_IMAGE;
  const portfolioItems = Array.isArray(portfolio)
    ? portfolio.map((item, idx) => ({ ...item, __index: idx }))
    : [];
  const portfolioImages = portfolioItems.filter((item) => item.type === 'image');
  // Solo videos marcados explícitamente como reel por el profesional (igual que en el Home)
  const portfolioVideos = portfolioItems.filter((item) => item.type === 'video' && item.isReel === true);
  const subtitle = mainService?.category
    ? t('ui.providerProfile.premiumSubtitle', {
        service: t(`home.categories.${mainService.category}`, mainService.category)
      })
    : t('ui.providerProfile.premiumSubtitleFallback');
  const quickPoints = [
    responseRate > 0
      ? t('ui.providerProfile.quickResponseRate', { rate: responseRate })
      : t('ui.providerProfile.quickResponseFallback'),
    serviceArea.zones?.length
      ? t('ui.providerProfile.quickCoverageArea', { zone: serviceArea.zones[0] })
      : t('ui.providerProfile.quickCoverageFallback'),
    mainService?.experience
      ? t('ui.providerProfile.quickExperience', { years: mainService.experience })
      : t('ui.providerProfile.quickExperienceFallback'),
    t('ui.providerProfile.quickWarranty')
  ];
  
  // Reseñas reales del proveedor — antes se leía provider.reviews, un campo que la
  // búsqueda/listado de proveedores nunca incluye (solo trae el promedio/():count agregado),
  // por lo que la sección de reseñas siempre aparecía vacía aunque existieran reseñas reales.
  const reviews = providerReviews || [];
  const reviewsLoading = providerReviews === null;

  // Lock body scroll when modal is open — preserving scroll position on mobile
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.dataset.scrollY = scrollY;
    } else {
      const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
    return () => {
      const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    };
  }, [isOpen]);

  // Cargar las reseñas reales del proveedor desde el backend al abrir el modal
  useEffect(() => {
    if (!isOpen || !provider?._id) return;
    let cancelled = false;
    setProviderReviews(null);
    api.get(`/reviews/provider/${provider._id}`, { params: { limit: 20 } })
      .then(({ data }) => {
        if (!cancelled) setProviderReviews(data?.data?.reviews || []);
      })
      .catch(() => {
        if (!cancelled) setProviderReviews([]);
      });
    return () => { cancelled = true; };
  }, [isOpen, provider?._id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);


  // Auto-ajuste del nombre del profesional: reduce el tamaño de fuente solo lo necesario
  // para que el nombre completo quepa siempre en una sola línea, sin cortarse, en cualquier
  // ancho de pantalla (especialmente móviles pequeños). Si hay espacio suficiente no se toca.
  useEffect(() => {
    if (!isOpen) return;
    const el = nameTextRef.current;
    const row = nameRowRef.current;
    if (!el || !row) return;

    const fitName = () => {
      el.style.fontSize = '';
      const icon = row.querySelector('svg');
      const iconSpace = icon ? icon.getBoundingClientRect().width + 6 : 0;
      const availableWidth = row.clientWidth - iconSpace;
      if (availableWidth <= 0) return;
      if (el.scrollWidth > availableWidth) {
        const baseSize = parseFloat(getComputedStyle(el).fontSize);
        const ratio = availableWidth / el.scrollWidth;
        const nextSize = Math.max(11, Math.floor(baseSize * ratio * 0.96));
        el.style.fontSize = `${nextSize}px`;
      }
    };

    // Doble rAF para asegurar que el layout del modal (animación de entrada) ya se aplicó
    requestAnimationFrame(() => requestAnimationFrame(fitName));
    window.addEventListener('resize', fitName);
    return () => window.removeEventListener('resize', fitName);
  }, [isOpen, businessName]);

  // Bloqueo de auto-contrato (multirol Cliente/Profesional)
  const isSelf = isSelfProvider(user, provider);

  // Handle contact/message
  const handleMessage = () => {
    if (isSelf) {
      toast.warning(t('ui.providerProfile.selfHireBlocked'));
      return;
    }
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

  // Handle inquiry chat
  const handleInquiry = () => {
    if (isSelf) {
      toast.warning(t('ui.providerProfile.selfHireBlocked'));
      return;
    }
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
    setShowInquiryChat(true);
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
        onClick={closeModal}
      />

      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed left-2 right-2 top-3 bottom-3 sm:left-4 sm:right-4 sm:top-7 sm:bottom-7 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:top-10 lg:bottom-10 lg:w-[calc(100%-5rem)] lg:max-w-6xl bg-slate-50 rounded-3xl shadow-2xl z-10000 flex flex-col overflow-hidden animate-modal-enter border border-white/60"
      >
        {/* Premium Hero Header — avatar straddles the boundary between the photo zone and the badges zone */}
        <div className="relative">
          {/* Photo zone */}
          <div className="relative min-h-20 sm:min-h-32 lg:min-h-24 overflow-hidden">
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${headerImage})` }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/92 via-slate-900/78 to-brand-900/35" />
            <div className="absolute inset-0 bg-linear-to-r from-brand-900/55 via-transparent to-slate-900/40" />

            <button
              onClick={closeModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full transition-all shadow-md"
            >
              <Icons.Close className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="relative z-10 h-full pl-[152px] sm:pl-[164px] lg:pl-[132px] pr-12 sm:pr-16 pt-2.5 sm:pt-7 lg:pt-5 pb-2 sm:pb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 text-white">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-base sm:text-2xl font-black tracking-tight leading-tight truncate">{businessName}</h1>
                  <Icons.Verified className="w-4 h-4 sm:w-5 sm:h-5 text-sky-200 shrink-0" />
                </div>

                <p className="mt-0.5 text-xs sm:text-sm text-white/90 leading-snug line-clamp-1 sm:line-clamp-2">{subtitle}</p>

                <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 text-white/85">
                  <StarRating value={rating} size="xs" readonly />
                  {reviewCount > 0 && (
                    <span className="text-[11px] sm:text-xs font-semibold">({reviewCount})</span>
                  )}
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold">
                    <Icons.Briefcase className="w-3 h-3" />
                    {completedJobs} {t('ui.providerProfile.jobs')}
                  </span>
                </div>
              </div>

              {!readOnly && !isSelf && (
                <div className="hidden md:flex items-center gap-2 shrink-0 mt-1">
                  <button
                    onClick={handleInquiry}
                    className="flex items-center gap-1.5 bg-white/15 text-white border border-white/35 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all"
                  >
                    <Icons.Message className="w-4 h-4" />
                    {t('ui.providerProfile.inquiry')}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="flex items-center gap-1.5 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all shadow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('ui.providerProfile.sendRequest')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar — compacto, abarca desde el nombre hasta los sellos de confianza, sin espacios arriba/abajo en mobile */}
          <div className="absolute left-3 top-1.5 sm:left-6 sm:top-16 lg:top-11 z-20 w-20 h-20 sm:w-32 sm:h-32 lg:w-20 lg:h-20">
            <div className="absolute -inset-1.5 rounded-full bg-white/40 blur-sm" />
            {profileImage ? (
              <img
                src={profileImage}
                alt={businessName}
                className="relative w-20 h-20 sm:w-32 sm:h-32 lg:w-20 lg:h-20 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 lg:w-20 lg:h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl sm:text-4xl font-bold shadow-xl border-4 border-white">
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}
            {plan !== 'free' && (
              <div className={`absolute -bottom-1 -right-1 px-2 py-1 bg-white rounded-full shadow flex items-center gap-1 ring-2 ring-white ${planInfo.ring}`}>
                <span className="text-xs">{planInfo.icon}</span>
                <span className={`text-[10px] font-bold ${planInfo.textColor}`}>{planInfo.label}</span>
              </div>
            )}
          </div>

          {/* Badges zone — 4 columnas de ancho IGUAL (no basadas en el contenido) para garantizar simetría real
              en cualquier resolución: si el ancho dependiera del texto (que varía en largo por sello), el grupo
              se ve desplazado en móviles angostos aunque el bloque completo esté centrado. */}
          <div className="bg-white pl-[116px] sm:pl-[164px] lg:pl-[132px] pr-3 sm:pr-4 pt-1.5 sm:pt-3 lg:pt-1.5 pb-1.5 sm:pb-3 lg:pb-2 border-b border-slate-100 flex items-center">
            <div className="grid grid-cols-4 w-full">
              {[
                { key: 'verified', label: t('ui.providerProfile.trustVerified'), icon: Icons.Verified },
                { key: 'licensed', label: t('ui.providerProfile.trustLicensed'), icon: Icons.License },
                { key: 'insured', label: t('ui.providerProfile.trustInsured'), icon: Icons.Shield },
                { key: 'certified', label: t('ui.providerProfile.trustCertified'), icon: Icons.Award }
              ].map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <div key={badge.key} className="flex flex-col items-center gap-0.5 text-center min-w-0 px-1">
                    <span className="w-7 h-7 sm:w-9 sm:h-9 lg:w-7 lg:h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                      <BadgeIcon className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] lg:w-4 lg:h-4" />
                    </span>
                    <span className="text-[9px] sm:text-[10.5px] font-bold text-slate-700 leading-[1.15] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="p-2.5 sm:p-4 lg:px-8 lg:py-4 space-y-2.5 sm:space-y-4 lg:space-y-5 max-w-full overflow-hidden">

            {/* TRABAJOS REALIZADOS — se muestra primero: es la evidencia visual (Antes/Después) */}
            <section ref={sectionRefs.portfolio} id="portfolio" className="pt-1">
              <h2 className="flex items-center gap-2 text-base sm:text-xl font-black text-slate-900 mb-1.5 sm:mb-3">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">📸</span>
                {t('ui.providerProfile.portfolio')}
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-4 shadow-sm">
                <BeforeAfterGallery
                  providerId={provider._id}
                  showHeader={false}
                  emptyMessage={t('ui.providerProfile.noPortfolioWorks')}
                  size="lg"
                />
              </div>
            </section>

            {/* VIDEOS EN ACCIÓN (REELS) — misma jerarquía visual que el resto de las secciones */}
            <section ref={sectionRefs.reels} id="reels" className="pt-1">
              <h2 className="flex items-center gap-2 text-base sm:text-xl font-black text-slate-900 mb-1.5 sm:mb-3">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">🎬</span>
                {t('ui.providerProfile.reelsInAction')}
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-4 shadow-sm">
                {portfolioVideos.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 lg:gap-3">
                    {portfolioVideos.slice(0, 8).map((item, idx) => (
                      <button
                        key={`video-${item.__index}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedPortfolioItem(item);
                          setPortfolioIndex(item.__index || 0);
                        }}
                        className="relative shrink-0 w-16 sm:w-24 lg:w-full aspect-9/16 rounded-xl overflow-hidden bg-slate-900 group"
                      >
                        <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/85 flex items-center justify-center">
                            <Icons.Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-800 ml-0.5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                    {[0, 1, 2].map((p) => (
                      <div key={`placeholder-video-${p}`} className="aspect-9/16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2">
                        <Icons.Play className="w-6 h-6 text-slate-300" />
                        <span className="text-[11px] text-slate-400 mt-1 text-center">{t('ui.providerProfile.reelPlaceholder')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>


            {/* ABOUT */}
            <section ref={sectionRefs.about} id="about" className="pt-1">
              <h2 className="flex items-center gap-2 text-base sm:text-xl font-black text-slate-900 mb-1.5 sm:mb-3">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">👤</span>
                {t('ui.providerProfile.tabs.about')}
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-4 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {quickPoints.map((point, idx) => {
                    const PointIcon = [Icons.Clock, Icons.Location, Icons.Briefcase, Icons.Check][idx];
                    return (
                      <div key={`quick-${idx}`} className="flex items-center gap-2">
                        <PointIcon className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-800 leading-snug">{point}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <Icons.Location className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="text-sm font-bold text-slate-800 leading-snug">
                      {serviceArea.zones?.join(', ') || t('ui.providerProfile.serviceAreaNotSpecified')}
                      {serviceArea.radius && ` · ${t('ui.providerProfile.coverageRadius', { radius: serviceArea.radius })}`}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Icons.Message className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-xs font-bold text-brand-700 leading-snug">{t('ui.providerProfile.contactReadinessHint')}</span>
                </div>
              </div>
            </section>

            {/* SERVICES */}
            <section ref={sectionRefs.services} id="services" className="pt-1">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-black text-slate-900 mb-3">
                <span className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-sm">🛠️</span>
                {t('ui.providerProfile.servicesOffered')}
              </h2>

              {mainService ? (
                <div className="space-y-3 lg:space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{t('ui.providerProfile.mainService')}</p>
                        <h3 className="font-bold text-slate-900 text-base">
                          {t(`home.categories.${mainService.category}`, mainService.category)}
                        </h3>
                        {mainService.name && (
                          <p className="text-sm text-slate-600 mt-1">{mainService.name}</p>
                        )}
                        {mainService.experience && (
                          <p className="text-xs text-slate-500 mt-1">{t('ui.providerProfile.yearsExp', { years: mainService.experience })}</p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                        <Icons.Check className="w-3.5 h-3.5" />
                        {t('ui.providerProfile.availableNow')}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                    <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${serviceArea.zones?.length > 0 ? '' : 'lg:col-span-2'}`}>
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">{t('ui.providerProfile.additionalServices')}</h4>
                      {additionalServices.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {additionalServices.map((svc) => (
                            <span key={svc} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                              {t(`home.categories.${svc}`, svc)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">{t('ui.providerProfile.noAdditionalServices')}</p>
                      )}
                    </div>

                    {serviceArea.zones?.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">{t('ui.providerProfile.coverageAreaTitle')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {serviceArea.zones.slice(0, 8).map((zone) => (
                            <span key={zone} className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-xs font-semibold">
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-2xl">
                  <Icons.Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">{t('ui.providerProfile.noServicesListed')}</p>
                </div>
              )}
            </section>

            {/* REVIEWS */}
            <section ref={sectionRefs.reviews} id="reviews" className="pt-1">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-black text-slate-900 mb-3">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-sm">⭐</span>
                <span>{t('ui.providerProfile.reviewsAndRatings')}</span>
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-3 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-4xl font-black text-slate-900 leading-none">{rating.toFixed(1)}</p>
                    <div className="mt-2"><StarRating value={rating} size="sm" readonly /></div>
                    <p className="text-sm text-slate-500 mt-1">{t('ui.providerProfile.basedOnReviews', { count: reviewCount })}</p>
                  </div>
                  <div className="space-y-2">
                    {[ 
                      { label: t('ui.providerProfile.quality'), value: ratingBreakdown.quality || 0, icon: '🎯' },
                      { label: t('ui.providerProfile.professionalism'), value: ratingBreakdown.professionalism || 0, icon: '💼' },
                      { label: t('ui.providerProfile.communication'), value: ratingBreakdown.communication || 0, icon: '💬' },
                      { label: t('ui.providerProfile.punctuality'), value: ratingBreakdown.punctuality || 0, icon: '⏰' }
                    ].map((item, idx) => (
                      <RatingBar key={`rating-${idx}`} label={item.label} value={item.value} icon={item.icon} />
                    ))}
                  </div>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">{t('ui.providerProfile.loadingReviews')}</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">
                  {reviews.map((review, idx) => {
                    const currentLang = i18n.language?.split('-')[0] || 'es';
                    const reviewerName = [review.client?.profile?.firstName, review.client?.profile?.lastName]
                      .filter(Boolean)
                      .join(' ') || t('ui.providerProfile.verifiedClient');
                    const reviewerAvatar = review.client?.profile?.avatar || null;
                    const comment = review.translations?.[currentLang]?.comment || review.review?.comment || '';
                    return (
                      <div key={review._id || idx} className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                          {reviewerAvatar ? (
                            <img src={reviewerAvatar} alt={reviewerName} className="shrink-0 w-10 h-10 rounded-full object-cover ring-1 ring-slate-100" />
                          ) : (
                            <div className="shrink-0 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <Icons.User className="w-5 h-5 text-slate-500" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                                  {reviewerName}
                                </h4>
                                <StarRating value={review.rating?.overall || 5} size="xs" readonly />
                              </div>
                              <span className="text-xs text-slate-500 shrink-0">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : t('ui.providerProfile.recent')}
                              </span>
                            </div>

                            <p className="text-slate-600 text-sm leading-relaxed">{comment}</p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <Icons.Verified className="w-3.5 h-3.5" />
                                {t('ui.providerProfile.verifiedWork')}
                              </span>
                              <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700 transition-colors">
                                <Icons.ThumbUp className="w-3.5 h-3.5" />
                                {t('ui.providerProfile.helpful')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-3xl mb-2 block">💬</span>
                  <p className="text-slate-500">{t('ui.providerProfile.noReviews')}</p>
                  <p className="text-sm text-slate-400 mt-1">{t('ui.providerProfile.beFirstToReview')}</p>
                </div>
              )}
            </section>

          </div>
        </div>

        {/* Sticky Contact Bar */}
        {!readOnly && isSelf && (
          <div className="sticky bottom-0 bg-amber-50 border-t border-amber-200 p-2.5 flex items-center justify-center gap-2 text-amber-800 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('ui.providerProfile.selfHireBlocked')}
          </div>
        )}
        {!readOnly && !isSelf && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-2.5 sm:p-3 flex gap-2">
            <button
              onClick={handleInquiry}
              className="flex-1 flex items-center justify-center gap-2 border border-brand-400 text-brand-700 px-3 py-2 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors"
            >
              <Icons.Message className="w-4 h-4" />
              {t('ui.providerProfile.inquiry')}
            </button>
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white px-3 py-2 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
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
        selectedCategory={selectedCategory}
        onConversionComplete={() => {
          // Después de registrarse/login exitoso, abrir el wizard de solicitud
          setShowGuestConversion(false);
          setShowRequestWizard(true);
        }}
      />

      {/* Inquiry Chat Modal */}
      <InquiryChatModal
        isOpen={showInquiryChat}
        onClose={() => setShowInquiryChat(false)}
        provider={provider}
        currentUserId={user?._id || user?.id}
        selectedCategory={selectedCategory}
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

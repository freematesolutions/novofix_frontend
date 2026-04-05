import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient.js';
import ProviderProfileModal from './ProviderProfileModal.jsx';
import ReelsFullscreenModal from './ReelsFullscreenModal.jsx';
import Spinner from './Spinner.jsx';
import { ProfileOverlaySkeleton } from './SkeletonLoader.jsx';

// ─── Constantes ───
const CARD_WIDTH_MOBILE = 260;   // px – ancho card en móvil
const CARD_WIDTH_DESKTOP = 280;  // px – ancho card en desktop
const CARD_GAP = 16;             // px – gap entre cards
const ASPECT_RATIO = 16 / 9;     // Relación de aspecto invertida (video vertical 9:16)
const AUTOPLAY_INTERVAL = 4000;  // ms entre auto-advance
const SWIPE_THRESHOLD = 50;      // px mínimo para considerar swipe
const PRELOAD_RANGE = 1;         // Cuántos videos adyacentes pre-cargar

// ─── Thumbnail helper (Cloudinary) — baja resolución para carga rápida ───
const getVideoThumbnail = (url, { width = 480, height = 854 } = {}) => {
  if (url?.includes('cloudinary.com') && url.includes('/video/')) {
    // f_jpg para generar imagen estática del primer frame
    // so_0 = segundo 0 del video
    return url
      .replace('/video/upload/', `/video/upload/so_0,f_jpg,w_${width},h_${height},c_fill,g_center,q_auto/`)
      .replace(/\.[^.]+$/, '.jpg'); // Forzar extensión .jpg
  }
  return null;
};

// ─── Optimizar URL de video Cloudinary para streaming rápido ───
const getOptimizedVideoUrl = (url, { width = 480, quality = 'auto:low' } = {}) => {
  if (url?.includes('cloudinary.com') && url.includes('/video/')) {
    // f_auto selecciona WebM (VP9) o MP4 según navegador
    // q_auto:low para carrusel (calidad aceptable, carga rápida)
    // w_480 para carrusel (no necesita full HD)
    // vc_auto para codec óptimo
    return url.replace('/video/upload/', `/video/upload/f_auto,q_${quality},w_${width},vc_auto/`);
  }
  return url;
};

// ─── Prefetch de thumbnails (precargar imágenes en cache del navegador) ───
const prefetchThumbnails = (reels) => {
  reels.forEach((reel) => {
    const thumb = getVideoThumbnail(reel.url, { width: 320, height: 568 });
    if (thumb) {
      const img = new Image();
      img.src = thumb;
    }
  });
};

// ─── Skeleton card para loading ───
const SkeletonCard = () => (
  <div className="shrink-0 rounded-2xl overflow-hidden bg-gray-200 animate-pulse"
    style={{ width: CARD_WIDTH_MOBILE, aspectRatio: '9/16' }}
  >
    <div className="h-full flex flex-col justify-end p-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-300 rounded w-24" />
          <div className="h-2.5 bg-gray-300 rounded w-16" />
        </div>
      </div>
    </div>
  </div>
);

// ─── ReelCard individual (optimizado) ───
const ReelCard = ({ reel, isActive, isNearby, onViewProfile, onOpenFullscreen, isMobile }) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const thumbnail = useMemo(() => getVideoThumbnail(reel.url), [reel.url]);
  // URL optimizada para carrusel (menor resolución, codec automático)
  const optimizedUrl = useMemo(() => getOptimizedVideoUrl(reel.url), [reel.url]);
  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP;

  // Solo renderizar <video> si está activo o nearby (± PRELOAD_RANGE)
  const shouldMountVideo = isActive || isNearby;

  // Autoplay/pause basado en si está activo (visible)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && !videoError) {
      // Intentar play lo más rápido posible
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, videoError]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (reel.providerId) {
      onViewProfile(reel.providerId);
    }
  };

  return (
    <div
      className="shrink-0 relative rounded-2xl overflow-hidden bg-dark-900 group cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
      style={{ width: cardWidth, aspectRatio: '9/16' }}
      onClick={() => onOpenFullscreen()}
    >
      {/* Botón expand fullscreen (esquina superior izquierda) */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpenFullscreen(); }}
        className="absolute top-3 left-3 z-5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
        aria-label={t('home.reels.scrollHint')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Thumbnail — siempre visible como fondo hasta que el video esté listo */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={reel.providerName}
          className={`absolute inset-0 w-full h-full object-cover z-1 transition-opacity duration-300 ${
            videoReady && isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
          loading={isNearby || isActive ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={isActive ? 'high' : 'auto'}
        />
      ) : (
        /* Fallback para videos no-Cloudinary: mostrar gradiente con icono de video */
        !videoReady && (
          <div className="absolute inset-0 z-1 bg-linear-to-br from-dark-700 to-dark-900 flex items-center justify-center">
            <svg className="w-12 h-12 text-white/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )
      )}

      {/* Video — solo se monta si está activo o nearby */}
      {shouldMountVideo && !videoError && (
        <video
          ref={videoRef}
          src={optimizedUrl}
          poster={thumbnail || undefined}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
          loop
          muted={isMuted}
          playsInline
          preload={isActive ? 'auto' : 'metadata'}
          onCanPlay={() => setVideoReady(true)}
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Error state */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800 z-2">
          <div className="text-center text-white/60">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">{t('home.reels.videoError')}</p>
          </div>
        </div>
      )}

      {/* Play/Pause overlay central — pointer-events-none para que clicks abran fullscreen */}
      {!isPlaying && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center z-3 bg-black/20 pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-transform duration-200 group-hover:scale-110">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Gradiente inferior para legibilidad del texto */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-linear-to-t from-black/80 via-black/40 to-transparent z-4 pointer-events-none" />

      {/* Controles superiores: mute */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          aria-label={isMuted ? t('home.reels.unmute') : t('home.reels.mute')}
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}

      {/* Info del profesional (overlay inferior) */}
      <div className="absolute bottom-0 left-0 right-0 z-5 p-3.5">
        {/* Categoría badge */}
        {reel.category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-600/80 text-white backdrop-blur-sm mb-2">
            {t(`home.categories.${reel.category}`, reel.category)}
          </span>
        )}

        {/* Info del profesional */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2.5 w-full text-left group/profile hover:opacity-90 transition-opacity"
        >
          {/* Avatar */}
          {reel.providerAvatar ? (
            <img
              src={reel.providerAvatar}
              alt={reel.providerName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/40 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/40 shrink-0">
              {reel.providerName?.charAt(0) || 'P'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate group-hover/profile:text-brand-300 transition-colors">
              {reel.providerName}
            </p>
            <p className="text-white/60 text-xs flex items-center gap-1">
              <svg className="w-3 h-3 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {reel.rating ? reel.rating.toFixed(1) : '—'}
              <span className="mx-0.5">·</span>
              {t('home.reels.viewProfile')}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </button>

        {/* Caption */}
        {reel.caption && (
          <p className="text-white/70 text-xs mt-1.5 line-clamp-2">{reel.caption}</p>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ReelsSection ───
export default function ReelsSection() {
  const { t } = useTranslation();
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);
  const autoplayTimer = useRef(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [sectionVisible, setSectionVisible] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // IntersectionObserver — solo cargar datos cuando la sección está cerca del viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect(); // Solo necesitamos detectar la primera vez
        }
      },
      { rootMargin: '200px 0px' } // Empezar a cargar 200px antes de ser visible
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP;
  const scrollStep = cardWidth + CARD_GAP;

  // ─── Fetch reels (solo cuando la sección está visible/cerca) ───
  useEffect(() => {
    if (!sectionVisible) return;

    const fetchReels = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/guest/reels');
        if (data?.success && data?.data?.reels) {
          const fetchedReels = data.data.reels;
          setReels(fetchedReels);
          // Prefetch thumbnails inmediatamente para que estén en cache
          prefetchThumbnails(fetchedReels);
        }
      } catch (err) {
        console.warn('ReelsSection: Could not load reels', err);
        setReels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [sectionVisible]);

  // ─── Autoplay carousel (solo si hay 3+ reels) ───
  const startAutoplay = useCallback(() => {
    if (reels.length < 3) return;
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    autoplayTimer.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % reels.length;
        const container = carouselRef.current;
        if (container) {
          container.scrollTo({
            left: next * scrollStep,
            behavior: 'smooth'
          });
        }
        return next;
      });
    }, AUTOPLAY_INTERVAL);
  }, [reels.length, scrollStep]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  // ─── Detectar card activo por scroll ───
  const handleScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const newIndex = Math.round(scrollLeft / scrollStep);
    setActiveIndex(Math.max(0, Math.min(newIndex, reels.length - 1)));
  }, [scrollStep, reels.length]);

  // ─── Navegación manual ───
  const scrollToIndex = useCallback((index) => {
    const container = carouselRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, reels.length - 1));
    container.scrollTo({
      left: clamped * scrollStep,
      behavior: 'smooth'
    });
    setActiveIndex(clamped);
    // Reiniciar autoplay al navegar manualmente
    stopAutoplay();
    startAutoplay();
  }, [reels.length, scrollStep, stopAutoplay, startAutoplay]);

  const handlePrev = () => scrollToIndex(activeIndex - 1);
  const handleNext = () => scrollToIndex(activeIndex + 1);

  // ─── Ver perfil del profesional ───
  const handleViewProfile = useCallback(async (providerId) => {
    // Cerrar fullscreen modal primero para evitar conflicto de z-index
    setFullscreenOpen(false);

    setLoadingProvider(true);
    try {
      const { data } = await api.get(`/guest/providers/${providerId}`);
      if (data?.success && data?.data?.provider) {
        setSelectedProvider(data.data.provider);
      }
    } catch (err) {
      console.warn('ReelsSection: Could not load provider', err);
    } finally {
      setLoadingProvider(false);
    }
  }, []);

  // ─── Abrir fullscreen modal en un reel específico ───
  const handleOpenFullscreen = useCallback((index) => {
    stopAutoplay();
    setFullscreenIndex(index);
    setFullscreenOpen(true);
  }, [stopAutoplay]);

  // ─── Cerrar fullscreen modal ───
  const handleCloseFullscreen = useCallback(() => {
    setFullscreenOpen(false);
    startAutoplay();
  }, [startAutoplay]);

  // ─── No renderizar si no hay reels y ya terminó de cargar ───
  if (!loading && reels.length === 0 && sectionVisible) return null;

  return (
    <section id="reels-section" ref={sectionRef} className="-mt-10 sm:-mt-14 md:-mt-16 pt-0 pb-2 scroll-mt-20 relative z-10">
      {/* Header de la sección */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2.5">
            {/* Icono de play/reels */}
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-md">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            {t('home.reels.title')}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            {t('home.reels.subtitle')}
          </p>
        </div>

        {/* Badge de cantidad */}
        {!loading && reels.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-linear-to-r from-brand-100 to-brand-50 px-4 py-2 rounded-full border border-brand-200">
            <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-sm font-semibold text-brand-700">
              {t('home.reels.count', { count: reels.length })}
            </span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="relative">
          <div
            className="flex gap-4 overflow-hidden pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Carousel de reels */}
      {!loading && reels.length > 0 && (
        <div className="relative">
          {/* Botón izquierdo (solo desktop) */}
          {reels.length > 2 && (
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/95 rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-all duration-200 group disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t('common.previous')}
            >
              <svg className="w-5 h-5 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Contenedor del carrusel */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            onMouseEnter={stopAutoplay}
            onMouseLeave={startAutoplay}
            onTouchStart={stopAutoplay}
            onTouchEnd={() => { setTimeout(startAutoplay, 3000); }}
            className="overflow-x-auto overflow-y-visible scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pb-4"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex gap-4 min-w-max">
              {reels.map((reel, index) => (
                <div
                  key={reel._id || `reel-${index}`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ReelCard
                    reel={reel}
                    isActive={index === activeIndex}
                    isNearby={Math.abs(index - activeIndex) <= PRELOAD_RANGE}
                    onViewProfile={handleViewProfile}
                    onOpenFullscreen={() => handleOpenFullscreen(index)}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Botón derecho (solo desktop) */}
          {reels.length > 2 && (
            <button
              onClick={handleNext}
              disabled={activeIndex >= reels.length - 1}
              className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/95 rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-all duration-200 group disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t('common.next')}
            >
              <svg className="w-5 h-5 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Indicadores de posición (dots) */}
          {reels.length > 1 && reels.length <= 12 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {reels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? 'w-6 h-2 bg-brand-600'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Reel ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enlace para scroll a siguiente sección */}
      {!loading && reels.length > 0 && (
        <div className="text-center mt-1">
          <button
            onClick={() => {
              const servicesSection = document.getElementById('services-section');
              if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="group inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 cursor-pointer transition-colors duration-200 focus:outline-none"
            aria-label={t('header.exploreServices')}
          >
            <span className="text-base font-bold text-brand-500 group-hover:text-brand-600 transition-colors">&gt;&gt;</span>
            <span className="group-hover:underline">{t('header.exploreServices')}</span>
          </button>
        </div>
      )}

      {/* Provider Profile Modal — portal a body para escapar del stacking context z-10 */}
      {selectedProvider && createPortal(
        <ProviderProfileModal
          isOpen={!!selectedProvider}
          onClose={() => { setSelectedProvider(null); startAutoplay(); }}
          provider={selectedProvider}
          initialTab="portfolio"
        />,
        document.body
      )}

      {/* Loading overlay para cargar perfil — portal a body */}
      {loadingProvider && createPortal(
        <ProfileOverlaySkeleton />,
        document.body
      )}

      {/* Fullscreen Reels Modal (TikTok-style) */}
      <ReelsFullscreenModal
        isOpen={fullscreenOpen}
        onClose={handleCloseFullscreen}
        reels={reels}
        initialIndex={fullscreenIndex}
        onViewProfile={handleViewProfile}
      />
    </section>
  );
}

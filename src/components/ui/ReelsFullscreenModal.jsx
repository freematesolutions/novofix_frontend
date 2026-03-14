import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

// ─── Constantes ───
const SWIPE_THRESHOLD = 60;       // px mínimo para cambiar de reel
const TRANSITION_DURATION = 350;  // ms de animación de slide

// ─── Fullscreen Reel Slide ───
const FullscreenReelSlide = ({ reel, isActive, onViewProfile, t }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInterval = useRef(null);

  // Autoplay/pause basado en si es el slide activo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
    }

    return () => {
      if (progressInterval.current) cancelAnimationFrame(progressInterval.current);
    };
  }, [isActive]);

  // Actualizar barra de progreso
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setDuration(video.duration);
      }
      progressInterval.current = requestAnimationFrame(updateProgress);
    };
    progressInterval.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressInterval.current) cancelAnimationFrame(progressInterval.current);
    };
  }, [isActive, isPlaying]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
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
    if (reel.providerId) onViewProfile(reel.providerId);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 w-full h-full" onClick={togglePlay}>
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.url}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
      />

      {/* Play/Pause indicator (fade) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 animate-pulse">
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Barra de progreso (top) */}
      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/20">
        <div
          className="h-full bg-brand-400 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controles superiores */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Duración */}
        {duration > 0 && (
          <span className="text-[10px] text-white/70 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
          </span>
        )}
        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          aria-label={isMuted ? t('home.reels.unmute') : t('home.reels.mute')}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* Gradiente inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />

      {/* Sidebar de acciones (estilo TikTok - lado derecho) */}
      <div className="absolute right-3 bottom-28 sm:bottom-32 z-20 flex flex-col items-center gap-5">
        {/* Botón perfil (avatar) */}
        <button onClick={handleProfileClick} className="flex flex-col items-center gap-1 group">
          {reel.providerAvatar ? (
            <img
              src={reel.providerAvatar}
              alt={reel.providerName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-400 group-hover:ring-brand-300 transition-all"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold ring-2 ring-brand-400">
              {reel.providerName?.charAt(0) || 'P'}
            </div>
          )}
          <span className="text-[10px] text-white/80 font-medium">{t('home.reels.viewProfile')}</span>
        </button>

        {/* Rating */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span className="text-xs text-white/80 font-semibold">{reel.rating ? reel.rating.toFixed(1) : '—'}</span>
        </div>
      </div>

      {/* Info del profesional (overlay inferior) */}
      <div className="absolute bottom-0 left-0 right-16 z-20 p-4 pb-6 sm:pb-8">
        {/* Nombre del profesional */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 mb-2 group"
        >
          <p className="text-white text-base font-bold group-hover:text-brand-300 transition-colors">
            @{reel.providerName}
          </p>
          {reel.providerPlan === 'pro' && (
            <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Categoría */}
        {reel.category && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-600/70 text-white backdrop-blur-sm mb-2">
            {t(`home.categories.${reel.category}`, reel.category)}
          </span>
        )}

        {/* Caption */}
        {reel.caption && (
          <p className="text-white/80 text-sm mt-1 line-clamp-3">{reel.caption}</p>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal: Modal Fullscreen de Reels ───
export default function ReelsFullscreenModal({ isOpen, onClose, reels, initialIndex = 0, onViewProfile }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Touch/drag refs
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const touchCurrentY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef(false);
  const containerRef = useRef(null);

  // Sincronizar índice cuando cambia desde fuera
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setTranslateY(0);
      setIsClosing(false);
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // Navegar a un índice
  const goToIndex = useCallback((newIndex) => {
    if (isAnimating) return;
    if (newIndex < 0 || newIndex >= reels.length) return;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTranslateY(0);
    setTimeout(() => setIsAnimating(false), TRANSITION_DURATION);
  }, [isAnimating, reels.length]);

  // Cerrar modal con animación
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      document.body.style.overflow = '';
      onClose();
    }, 250);
  }, [onClose]);

  // ─── Keyboard navigation ───
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goToIndex(currentIndex - 1);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goToIndex(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, goToIndex, handleClose]);

  // ─── Touch handlers (vertical swipe) ───
  const handleTouchStart = useCallback((e) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
    isDragging.current = true;
    isHorizontalSwipe.current = false;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || isAnimating) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY.current;
    const deltaX = touch.clientX - touchStartX.current;

    // Detectar si es un swipe horizontal (ignorar)
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = true;
    }

    if (isHorizontalSwipe.current) return;

    e.preventDefault();
    touchCurrentY.current = touch.clientY;

    // Resistencia elástica en los bordes
    let adjustedDelta = deltaY;
    if ((currentIndex === 0 && deltaY > 0) || (currentIndex === reels.length - 1 && deltaY < 0)) {
      adjustedDelta = deltaY * 0.3; // Efecto rubber band
    }

    setTranslateY(adjustedDelta);
  }, [isAnimating, currentIndex, reels.length]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || isAnimating || isHorizontalSwipe.current) {
      isDragging.current = false;
      isHorizontalSwipe.current = false;
      setTranslateY(0);
      return;
    }
    isDragging.current = false;

    const deltaY = touchCurrentY.current - touchStartY.current;

    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
      if (deltaY < 0 && currentIndex < reels.length - 1) {
        // Swipe up → siguiente
        goToIndex(currentIndex + 1);
      } else if (deltaY > 0 && currentIndex > 0) {
        // Swipe down → anterior
        goToIndex(currentIndex - 1);
      } else if (deltaY > 0 && currentIndex === 0) {
        // Swipe down en el primer reel → cerrar
        handleClose();
      } else {
        setTranslateY(0);
      }
    } else {
      // No pasó el umbral, volver a posición
      setTranslateY(0);
    }
  }, [isAnimating, currentIndex, reels.length, goToIndex, handleClose]);

  // ─── Mouse wheel navigation (desktop) ───
  useEffect(() => {
    if (!isOpen) return;
    let wheelTimeout = null;
    let wheelAccum = 0;

    const handleWheel = (e) => {
      e.preventDefault();
      wheelAccum += e.deltaY;

      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (Math.abs(wheelAccum) > 50) {
          if (wheelAccum > 0) goToIndex(currentIndex + 1);
          else goToIndex(currentIndex - 1);
        }
        wheelAccum = 0;
      }, 80);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [isOpen, currentIndex, goToIndex]);

  if (!isOpen || !reels || reels.length === 0) return null;

  const modal = (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-100 bg-black transition-opacity duration-250 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        aria-label={t('common.close')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Indicador de posición (lateral derecho - dots verticales) */}
      {reels.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5">
          {reels.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goToIndex(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'h-5 w-1.5 bg-brand-400'
                  : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Reel ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <span className="text-sm text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
          {currentIndex + 1} / {reels.length}
        </span>
      </div>

      {/* Hint de navegación (solo visible en primer uso) */}
      {currentIndex === 0 && reels.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 animate-bounce pointer-events-none">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-xs text-white/50 font-medium">{t('home.reels.swipeUp')}</span>
        </div>
      )}

      {/* Botones de navegación (desktop) */}
      {reels.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToIndex(currentIndex - 1); }}
              className="hidden sm:flex absolute top-6 left-1/2 -translate-x-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label={t('common.previous')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {currentIndex < reels.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToIndex(currentIndex + 1); }}
              className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label={t('common.next')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Contenedor de slides con transición vertical */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging.current ? 'none' : `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
        }}
      >
        {/* Solo renderizamos current, prev y next para rendimiento */}
        {reels.map((reel, index) => {
          const diff = index - currentIndex;
          // Solo renderizar slides cercanos al actual
          if (Math.abs(diff) > 1) return null;

          return (
            <div
              key={reel._id || `fs-reel-${index}`}
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `translateY(${diff * 100}%)`,
                transition: isDragging.current ? 'none' : `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
              }}
            >
              <FullscreenReelSlide
                reel={reel}
                isActive={index === currentIndex}
                onViewProfile={onViewProfile}
                t={t}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

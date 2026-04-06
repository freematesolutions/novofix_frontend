import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient.js';

/**
 * BeforeAfterGallery — Sección de Antes/Después
 * Muestra pares de fotos (antes y después) de bookings completados.
 * Carrusel horizontal con tarjetas de comparación side-by-side.
 */
function BeforeAfterGallery({ onViewProfile }) {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Slider state por tarjeta (posición del slider 0-100)
  const [sliderPositions, setSliderPositions] = useState({});
  // Active image index per card for multi-image navigation
  const [activeImageIndex, setActiveImageIndex] = useState({});

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const { data } = await api.get('/guest/before-after', { params: { limit: 20 } });
        if (data?.data?.pairs) {
          setPairs(data.data.pairs);
          // Inicializar sliders en 50% y image index en 0
          const positions = {};
          const imageIndices = {};
          data.data.pairs.forEach(p => { positions[p.id] = 50; imageIndices[p.id] = 0; });
          setSliderPositions(positions);
          setActiveImageIndex(imageIndices);
        }
      } catch (error) {
        console.error('Error fetching before/after pairs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPairs();
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [pairs, checkScroll]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.ba-card')?.offsetWidth || 360;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
  };

  const handleSliderChange = (pairId, value) => {
    setSliderPositions(prev => ({ ...prev, [pairId]: value }));
  };

  // Drag slider handler para touch/mouse en la imagen
  const handleSliderDrag = useCallback((pairId, e, containerEl) => {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPositions(prev => ({ ...prev, [pairId]: pct }));
  }, []);

  // Navigate between image pairs within a card (circular)
  const navigatePairImage = useCallback((pairId, direction, totalSlides) => {
    setActiveImageIndex(prev => {
      const current = prev[pairId] || 0;
      const next = (current + direction + totalSlides) % totalSlides;
      return { ...prev, [pairId]: next };
    });
  }, []);

  if (loading) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-40 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="shrink-0 w-[340px] sm:w-[400px] h-64 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (pairs.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {t('testimonials.beforeAfter.title')}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{t('testimonials.beforeAfter.subtitle')}</p>
      </div>

      {/* Carousel container */}
      <div className="relative group/carousel">
        {/* Botón izquierdo */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover/carousel:opacity-100"
            aria-label={t('common.previous')}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide pb-2 pt-4 -mx-1 px-1"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-6 min-w-max">
            {pairs.map((pair) => {
              const sliderPos = sliderPositions[pair.id] ?? 50;
              const beforeImages = pair.beforeImages || [pair.before];
              const afterImages = pair.afterImages || [pair.after];
              // Math.min → only show real 1:1 pairs (no repeated/stretched images)
              const totalSlides = Math.min(beforeImages.length, afterImages.length);
              const currentIdx = Math.min(activeImageIndex[pair.id] || 0, totalSlides - 1);
              const currentBefore = beforeImages[currentIdx];
              const currentAfter = afterImages[currentIdx];

              return (
                <div
                  key={pair.id}
                  className="ba-card shrink-0 w-[340px] sm:w-[400px] bg-white rounded-2xl transition-shadow duration-300 relative"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Labels Antes / Después — protruding ribbon style */}
                  <div className="absolute -top-3 left-3 z-20 pointer-events-none">
                    <div className="bg-linear-to-r from-gray-900 to-gray-700 text-white px-4 py-1.5 rounded-xl shadow-lg shadow-gray-900/30">
                      <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider drop-shadow-md">
                        {t('testimonials.beforeAfter.before')}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -top-3 right-3 z-20 pointer-events-none">
                    <div className="bg-linear-to-l from-brand-600 to-brand-500 text-white px-4 py-1.5 rounded-xl shadow-lg shadow-brand-600/40">
                      <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider drop-shadow-md">
                        {t('testimonials.beforeAfter.after')}
                      </span>
                    </div>
                  </div>

                  {/* Comparación de imágenes con slider */}
                  <div
                    className="relative h-56 sm:h-64 overflow-hidden rounded-t-2xl cursor-col-resize select-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const container = e.currentTarget;
                      handleSliderDrag(pair.id, e, container);
                      const onMove = (ev) => handleSliderDrag(pair.id, ev, container);
                      const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                    }}
                    onTouchStart={(e) => {
                      const container = e.currentTarget;
                      handleSliderDrag(pair.id, e, container);
                      const onMove = (ev) => {
                        ev.preventDefault(); // Prevent parent carousel from scrolling
                        handleSliderDrag(pair.id, ev, container);
                      };
                      const onEnd = () => {
                        container.removeEventListener('touchmove', onMove);
                        container.removeEventListener('touchend', onEnd);
                      };
                      container.addEventListener('touchmove', onMove, { passive: false });
                      container.addEventListener('touchend', onEnd);
                    }}
                  >
                    {/* After image (fondo completo) */}
                    <img
                      src={currentAfter.url}
                      alt={t('testimonials.beforeAfter.after')}
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable="false"
                    />

                    {/* Before image (recortado con clip-path) */}
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <img
                        src={currentBefore.url}
                        alt={t('testimonials.beforeAfter.before')}
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                    </div>

                    {/* Línea divisoria del slider */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
                      style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                    >
                      {/* Handle circular */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-brand-400">
                        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>

                    {/* Multi-image navigation (only when multiple images exist) */}
                    {totalSlides > 1 && (
                      <>
                        {/* Previous image */}
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={() => navigatePairImage(pair.id, -1, totalSlides)}
                          className="absolute left-2 bottom-3 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 active:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                          aria-label={t('common.previous')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Image counter pill */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full pointer-events-none tabular-nums">
                          {currentIdx + 1} / {totalSlides}
                        </div>

                        {/* Next image */}
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={() => navigatePairImage(pair.id, 1, totalSlides)}
                          className="absolute right-2 bottom-3 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 active:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                          aria-label={t('common.next')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Info del proveedor */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {pair.providerAvatar ? (
                        <img
                          src={pair.providerAvatar}
                          alt={pair.providerName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold ring-2 ring-brand-100">
                          {pair.providerName?.charAt(0) || 'P'}
                        </div>
                      )}

                      {/* Nombre y categoría */}
                      <div className="flex-1 min-w-0">
                        {pair.providerId && onViewProfile ? (
                          <button
                            onClick={() => onViewProfile(pair.providerId, pair)}
                            className="font-semibold text-sm truncate block max-w-full text-left hover:text-brand-500 transition-colors cursor-pointer"
                            title={t('testimonials.beforeAfter.viewProfile')}
                          >
                            {pair.providerName}
                          </button>
                        ) : (
                          <p className="font-semibold text-gray-900 text-sm truncate">{pair.providerName}</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">{t(`home.categories.${pair.category}`, pair.category)}</p>
                      </div>

                      {/* Rating */}
                      {pair.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <svg className="w-4 h-4 text-accent-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="font-bold text-gray-700">{pair.rating.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Botón ver perfil */}
                      {pair.providerId && onViewProfile && (
                        <button
                          onClick={() => onViewProfile(pair.providerId, pair)}
                          className="shrink-0 bg-brand-50 hover:bg-brand-100 text-brand-600 p-2 rounded-full transition-colors"
                          title={t('testimonials.beforeAfter.viewProfile')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón derecho */}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover/carousel:opacity-100"
            aria-label={t('common.next')}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Scroll hint */}
      <p className="text-center text-xs text-gray-400 mt-2">
        {t('testimonials.beforeAfter.scrollHint')}
      </p>
    </div>
  );
}

BeforeAfterGallery.propTypes = {
  onViewProfile: PropTypes.func
};

export default BeforeAfterGallery;

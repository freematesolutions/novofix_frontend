import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/utils/categoryImages.js';
import { useTranslation } from 'react-i18next';

/**
 * CategoryIconCarousel - Carrusel 3D con tarjetas de categoría
 *
 * Arquitectura de renderizado:
 * - Todas las tarjetas se renderizan SIEMPRE (nunca display:none).
 *   Las que están fuera de rango tienen opacity:0 y se desplazan lejos.
 * - La auto-rotación usa requestAnimationFrame + DOM directo (sin React state).
 * - La auto-rotación se pausa al pasar el mouse sobre el contenedor (hover)
 *   y al arrastrar (drag), para que el usuario pueda explorar las tarjetas.
 * - El hover visual de tarjetas se maneja 100% con CSS (group-hover), sin
 *   manipular transforms desde JS, para no conflictuar con applyPositionsToDOM.
 * - isDragging se activa solo después del umbral de movimiento (no en mouseDown).
 */
function CategoryIconCarousel({
  categories,
  currentIndex,
  onIndexChange,
  onCategoryClick,
  onHoverChange: _onHoverChange, // eslint-disable-line no-unused-vars
  autoRotate = true,
  rotationInterval: _rotationInterval = 2800 // eslint-disable-line no-unused-vars
}) {
  const { t } = useTranslation();
  const [loadedImages, setLoadedImages] = useState({});
  const containerRef = useRef(null);
  const cardRefsMap = useRef(new Map());

  // Offset continuo — solo ref para la animación
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const offsetRef = useRef(0);

  // Drag state — todo en refs para evitar re-renders
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  // Hover state — ref para no causar re-renders
  const isHoveringRef = useRef(false);

  // Auto-pause
  const autoPauseTimeoutRef = useRef(null);
  const autoPausedUntilRef = useRef(0);

  // ─── Precargar imágenes ───────────────────────────────────────────
  useEffect(() => {
    categories.forEach((service) => {
      const url = CATEGORY_IMAGES[service.category] || FALLBACK_IMAGE;
      const img = new Image();
      img.onload = () => setLoadedImages((p) => ({ ...p, [service.category]: true }));
      img.onerror = () => setLoadedImages((p) => ({ ...p, [service.category]: false }));
      img.src = url;
    });
  }, [categories]);

  // ─── Espaciado responsive (más compacto) ──────────────────────────
  const getCardSpacing = useCallback(() => {
    if (typeof window === 'undefined') return 120;
    const w = window.innerWidth;
    if (w >= 1536) return 195;
    if (w >= 1280) return 180;
    if (w >= 1024) return 165;
    if (w >= 768) return 150;
    if (w >= 640) return 138;
    if (w >= 480) return 128;
    return 115;
  }, []);

  // ─── Pausar auto-rotación por N ms ────────────────────────────────
  const pauseAutoRotate = useCallback((ms = 2000) => {
    autoPausedUntilRef.current = Date.now() + ms;
    if (autoPauseTimeoutRef.current) clearTimeout(autoPauseTimeoutRef.current);
    autoPauseTimeoutRef.current = setTimeout(() => {
      autoPausedUntilRef.current = 0;
    }, ms);
  }, []);

  // ─── Posición pura de una tarjeta ─────────────────────────────────
  const computePosition = useCallback(
    (index, offset, totalItems) => {
      if (totalItems === 0) return null;
      const spacing = getCardSpacing();

      let rel = index - offset;
      while (rel > totalItems / 2) rel -= totalItems;
      while (rel < -totalItems / 2) rel += totalItems;

      const dist = Math.abs(rel);

      // Todas las tarjetas se renderizan; las muy lejanas van a opacity 0
      const MAX_VISIBLE = 2.8;
      const visible = dist <= MAX_VISIBLE;

      const translateX = rel * spacing;
      const translateZ = -dist * 45;
      const translateY = dist * dist * 4;
      const rotateY = rel * -8;
      const depthFactor = Math.max(0, 1 - dist * 0.3);
      const baseScale = 0.68 + depthFactor * 0.32; // 0.68 → 1.0
      const baseZIndex = Math.round(50 + depthFactor * 50);

      // Opacidad: fade suave en los bordes, 0 fuera de rango
      let opacity;
      if (!visible) {
        opacity = 0;
      } else if (dist > 2.0) {
        // Fade out suave entre 2.0 y 2.8
        opacity = Math.max(0, 1 - (dist - 1.2) * 0.6) * 0.5;
      } else {
        opacity = Math.max(0.35, 1 - dist * 0.3);
      }

      return {
        translateX,
        translateY,
        translateZ,
        rotateY,
        opacity,
        baseZIndex,
        baseScale,
        visible,
        isCenter: dist < 0.3
      };
    },
    [getCardSpacing]
  );

  // ─── Escribir posiciones directamente en el DOM ───────────────────
  const applyPositionsToDOM = useCallback(
    (offset) => {
      const total = categories.length;
      if (total === 0) return;

      categories.forEach((service, index) => {
        const node = cardRefsMap.current.get(service.instanceId);
        if (!node) return;

        const pos = computePosition(index, offset, total);
        if (!pos) return;

        node.style.transform = `translateX(${pos.translateX}px) translateY(${pos.translateY}px) translateZ(${pos.translateZ}px) rotateY(${pos.rotateY}deg) scale(${pos.baseScale})`;
        node.style.opacity = String(pos.opacity);
        node.style.zIndex = String(pos.baseZIndex);
        node.style.pointerEvents = pos.visible ? 'auto' : 'none';
      });
    },
    [categories, computePosition]
  );

  // ─── Auto-rotación fluida ─────────────────────────────────────────
  useEffect(() => {
    if (!autoRotate || categories.length <= 1) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }

    const speed = 0.00028; // ~30 s por vuelta completa

    const animate = (now) => {
      // Pausar por hover, drag activo o pausa manual
      const paused =
        isHoveringRef.current ||
        isDraggingRef.current ||
        (autoPausedUntilRef.current && Date.now() < autoPausedUntilRef.current);

      if (paused) {
        lastTimeRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;

      offsetRef.current += dt * speed;
      if (offsetRef.current >= categories.length) {
        offsetRef.current %= categories.length;
      }

      applyPositionsToDOM(offsetRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [autoRotate, categories.length, applyPositionsToDOM]);

  // Cleanup timer
  useEffect(() => () => {
    if (autoPauseTimeoutRef.current) clearTimeout(autoPauseTimeoutRef.current);
  }, []);

  // ─── Teclado ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nw = (offsetRef.current - 1 + categories.length) % categories.length;
        offsetRef.current = nw;
        applyPositionsToDOM(nw);
        pauseAutoRotate(2500);
        onIndexChange?.(Math.round(nw) % categories.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nw = (offsetRef.current + 1) % categories.length;
        offsetRef.current = nw;
        applyPositionsToDOM(nw);
        pauseAutoRotate(2500);
        onIndexChange?.(Math.round(nw) % categories.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = Math.round(offsetRef.current) % categories.length;
        if (categories[idx]?.hasProviders !== false) {
          onCategoryClick?.(categories[idx]?.category);
        }
      }
    },
    [categories, onIndexChange, onCategoryClick, applyPositionsToDOM, pauseAutoRotate]
  );

  // ─── Drag (mouse + touch) ────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    hasDraggedRef.current = false;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    dragStartOffsetRef.current = offsetRef.current;
    // NO activar isDragging aquí — esperar umbral de movimiento
  }, []);

  const handleDragMove = useCallback(
    (e) => {
      if (startXRef.current === 0) return;

      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const diff = clientX - startXRef.current;

      // Prevenir scroll del navegador si estamos arrastrando
      if (e.cancelable && Math.abs(diff) > 5) e.preventDefault();

      // Activar drag solo después de umbral
      if (Math.abs(diff) > 8) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
        }
        hasDraggedRef.current = true;

        const spacing = getCardSpacing();
        const total = categories.length || 1;
        let nw = dragStartOffsetRef.current - diff / spacing;
        nw = ((nw % total) + total) % total;
        offsetRef.current = nw;
        applyPositionsToDOM(nw);
      }
    },
    [getCardSpacing, categories.length, applyPositionsToDOM]
  );

  const handleDragEnd = useCallback(() => {
    if (startXRef.current === 0 && !isDraggingRef.current) return;

    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    startXRef.current = 0;
    dragStartOffsetRef.current = 0;

    if (wasDragging && hasDraggedRef.current && onIndexChange) {
      const total = categories.length || 1;
      const rounded = Math.round(offsetRef.current) % total;
      onIndexChange(rounded);
    }

    // Breve pausa para que la auto-rotación no salte inmediatamente
    if (wasDragging) pauseAutoRotate(1500);
  }, [categories.length, onIndexChange, pauseAutoRotate]);

  // ─── Wheel ────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const dir = e.deltaX > 0 || e.deltaY > 0 ? 1 : -1;
      if (!containerRef.current?.dataset.scrolling) {
        containerRef.current.dataset.scrolling = 'true';
        const nw = (offsetRef.current + dir + categories.length) % categories.length;
        offsetRef.current = nw;
        applyPositionsToDOM(nw);
        pauseAutoRotate(2000);
        setTimeout(() => {
          if (containerRef.current) containerRef.current.dataset.scrolling = '';
        }, 300);
      }
    },
    [categories.length, pauseAutoRotate, applyPositionsToDOM]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ─── Click en tarjeta ─────────────────────────────────────────────
  const handleIconClick = useCallback(
    (e, index, category, hasProviders) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasDraggedRef.current) {
        hasDraggedRef.current = false;
        return;
      }
      if (hasProviders === false) return;
      onCategoryClick?.(category);
      onIndexChange?.(index);
    },
    [onIndexChange, onCategoryClick]
  );

  // ─── Posiciones iniciales ─────────────────────────────────────────
  useEffect(() => {
    const id = requestAnimationFrame(() => applyPositionsToDOM(offsetRef.current));
    return () => cancelAnimationFrame(id);
  }, [categories, applyPositionsToDOM, loadedImages]);

  // ─── Render ───────────────────────────────────────────────────────
  if (categories.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-44 sm:h-52 md:h-60 lg:h-60 xl:h-72 2xl:h-80 select-none"
      style={{ perspective: '1400px', touchAction: 'pan-y' }}
      onMouseEnter={() => { isHoveringRef.current = true; }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        isHoveringRef.current = false;
        handleDragEnd();
        startXRef.current = 0;
      }}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label={t('home.carousel.ariaLabel', 'Carrusel de categorías de servicio')}
      aria-activedescendant={`category-card-${currentIndex}`}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1400px', perspectiveOrigin: 'center center' }}
      >
        {categories.map((service, index) => {
          const imageUrl = CATEGORY_IMAGES[service.category] || FALLBACK_IMAGE;
          const isImageLoaded = loadedImages[service.category];
          const isDisabled = service.hasProviders === false;

          return (
            <div
              key={service.instanceId}
              id={`category-card-${index}`}
              ref={(node) => {
                if (node) cardRefsMap.current.set(service.instanceId, node);
                else cardRefsMap.current.delete(service.instanceId);
              }}
              onClick={(e) => {
                if (isDisabled) { e.preventDefault(); e.stopPropagation(); return; }
                handleIconClick(e, index, service.category, service.hasProviders);
              }}
              className={`carousel-card absolute flex flex-col items-center justify-end
                rounded-2xl sm:rounded-3xl overflow-hidden
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                transformOrigin: 'center center',
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                // Forzar GPU a respetar border-radius durante 3D transforms
                WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                maskImage: 'radial-gradient(white, black)',
                opacity: 0 // applyPositionsToDOM lo actualizará
              }}
              role="option"
              aria-selected={false}
              aria-label={`${service.translatedName} - ${isDisabled ? t('home.comingSoon') : t('home.clickToViewProviders')}`}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
            >
              {/* Tarjeta con imagen — hover 100% CSS via group */}
              <div
                className="carousel-card-inner relative overflow-hidden rounded-2xl sm:rounded-3xl group
                  transition-[transform,box-shadow] duration-300 ease-out
                  hover:-translate-y-2 hover:shadow-2xl"
                style={{
                  width: 'clamp(115px, 24vw, 210px)',
                  height: 'clamp(130px, 27vw, 230px)',
                  boxShadow: '0 15px 40px -10px rgba(0,0,0,0.4), 0 5px 15px -5px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.15)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  maskImage: 'radial-gradient(white, black)'
                }}
              >
                {/* Imagen de fondo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    filter: isDisabled ? 'grayscale(40%)' : 'none'
                  }}
                />

                {/* Skeleton loader */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 bg-linear-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                )}

                {/* Overlay gradiente inferior */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                  }}
                />

                {/* Overlay superior sutil */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 30%)'
                  }}
                />

                {/* Badge PRÓXIMAMENTE */}
                {isDisabled && (
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/95 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap"
                    style={{ boxShadow: '0 4px 12px rgba(245,158,11,0.5)' }}
                  >
                    {t('home.comingSoon')}
                  </div>
                )}

                {/* Nombre de categoría + contador */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                  <h3
                    className="carousel-card-label font-bold text-white text-center leading-tight drop-shadow-lg text-sm sm:text-base md:text-lg"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {service.translatedName}
                  </h3>

                  {!isDisabled && service.providerCount > 0 && (
                    <p
                      className="text-white/90 text-center mt-1 text-xs sm:text-sm font-medium"
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                    >
                      {service.providerCount}{' '}
                      {service.providerCount === 1
                        ? t('home.carousel.provider', 'profesional')
                        : t('home.carousel.providers', 'profesionales')}
                    </p>
                  )}
                </div>

                {/* Borde hover */}
                <div
                  className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    border: '2px solid rgba(255,255,255,0.4)',
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
                  }}
                />

                {/* Glow hover */}
                <div
                  className="carousel-card-glow absolute -inset-4 rounded-3xl pointer-events-none -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-60"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.4) 0%, rgba(14,165,233,0.2) 50%, transparent 70%)',
                    filter: 'blur(20px)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

CategoryIconCarousel.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      translatedName: PropTypes.string,
      providerCount: PropTypes.number,
      hasProviders: PropTypes.bool
    })
  ).isRequired,
  currentIndex: PropTypes.number.isRequired,
  onIndexChange: PropTypes.func.isRequired,
  onCategoryClick: PropTypes.func,
  onHoverChange: PropTypes.func,
  autoRotate: PropTypes.bool,
  rotationInterval: PropTypes.number
};

export default CategoryIconCarousel;

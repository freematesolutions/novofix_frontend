import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/utils/categoryImages.js';
import { useTranslation } from 'react-i18next';

/**
 * CategoryIconCarousel - Carrusel 3D con tarjetas de imagen realistas
 * 
 * Características:
 * - Tarjetas grandes con imágenes reales de alta calidad para cada categoría
 * - Rotación CONTINUA fluida (no step-by-step) independiente del hero
 * - Efecto perspectiva con tarjetas que resaltan y "flotan"
 * - Pausa al hover con resaltado del elemento
 * - Interacción con mouse/touch/teclado para navegar
 * - Click para seleccionar categoría
 * - Diseño responsive para todas las resoluciones
 */
function CategoryIconCarousel({ 
  categories, 
  currentIndex, 
  onIndexChange, 
  onCategoryClick,
  onHoverChange,
  autoRotate = true,
  rotationInterval = 2800
}) {
  const { t } = useTranslation();
  const [loadedImages, setLoadedImages] = useState({});
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Para animación continua fluida - usando refs para evitar re-renders
  const [continuousOffset, setContinuousOffset] = useState(0);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const offsetRef = useRef(0); // Ref para tracking del offset sin causar re-renders
  const hasDraggedRef = useRef(false); // Flag para saber si hubo drag significativo
  const autoPauseTimeoutRef = useRef(null);
  const [autoPausedUntil, setAutoPausedUntil] = useState(0);
  
  // Refs para drag - usar refs para evitar re-renders durante el drag
  const startXRef = useRef(0);
  const dragStartOffsetRef = useRef(0); // Offset al iniciar el drag

  // Precargar imágenes de categorías
  useEffect(() => {
    categories.forEach((service) => {
      const imageUrl = CATEGORY_IMAGES[service.category] || FALLBACK_IMAGE;
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [service.category]: true }));
      };
      img.onerror = () => {
        setLoadedImages(prev => ({ ...prev, [service.category]: false }));
      };
      img.src = imageUrl;
    });
  }, [categories]);

  // Cantidad de tarjetas visibles según resolución - ajustado para tarjetas más grandes
  const visibleCount = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1; // mobile: 1 tarjeta central prominente
      if (window.innerWidth < 1024) return 1.5; // tablet: tarjeta central + parciales
      return 1.5; // desktop: tarjeta central grande + parciales elegantes
    }
    return 1.5;
  }, []);

  // Calcular espaciado entre tarjetas según resolución - optimizado para tarjetas grandes
  const getCardSpacing = useCallback(() => {
    let cardSpacing = 160; // Móvil pequeño - más espacio para tarjetas grandes
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1536) {
        cardSpacing = 360; // 2K+ - tarjetas muy espaciadas
      } else if (width >= 1280) {
        cardSpacing = 320; // Desktop XL
      } else if (width >= 1024) {
        cardSpacing = 280; // Desktop
      } else if (width >= 768) {
        cardSpacing = 240; // Tablet
      } else if (width >= 640) {
        cardSpacing = 200; // Tablet pequeña
      } else if (width >= 480) {
        cardSpacing = 180; // Móvil grande
      } else {
        cardSpacing = 160; // Móvil pequeño
      }
    }
    return cardSpacing;
  }, []);

  const pauseAutoRotate = useCallback((ms = 3000) => {
    const until = Date.now() + ms;
    setAutoPausedUntil(until);
    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
    }
    autoPauseTimeoutRef.current = setTimeout(() => {
      setAutoPausedUntil(0);
    }, ms);
  }, []);

  const getIconPosition = useCallback((index) => {
    const totalItems = categories.length;
    if (totalItems === 0) return { isVisible: false };

    // Espaciado entre tarjetas según resolución
    const cardSpacing = getCardSpacing();

    // Calcular posición relativa al centro (qué tan lejos está del ítem actual)
    let relativeIndex = index - continuousOffset;
    
    // Normalizar para que esté en rango [-totalItems/2, totalItems/2]
    while (relativeIndex > totalItems / 2) relativeIndex -= totalItems;
    while (relativeIndex < -totalItems / 2) relativeIndex += totalItems;

    // Mostrar 3 tarjetas: la central y una a cada lado
    if (Math.abs(relativeIndex) > 1.5) {
      return { isVisible: false };
    }

    // Posición horizontal proporcional al índice relativo
    const translateX = relativeIndex * cardSpacing;
    
    // Profundidad: tarjeta central al frente, laterales atrás - más pronunciado para tarjetas grandes
    const distanceFromCenter = Math.abs(relativeIndex);
    const translateZ = -distanceFromCenter * 120; // Mayor profundidad para efecto más dramático
    
    // Movimiento vertical sutil para efecto de arco elegante
    const translateY = distanceFromCenter * distanceFromCenter * 20;
    
    // Rotación Y para efecto 3D de giro - más sutil para tarjetas grandes
    const rotateY = relativeIndex * -12;
    
    // Factor de profundidad: 1 en el centro, 0 en los bordes
    const depthFactor = Math.max(0, 1 - distanceFromCenter * 0.5);
    
    // Opacidad: plena en el centro, fade elegante hacia los bordes
    const opacity = Math.max(0.5, 1 - distanceFromCenter * 0.4);
    
    // Determinar si esta tarjeta está en el centro
    const isCenter = Math.abs(relativeIndex) < 0.3;

    return {
      isVisible: true,
      translateX,
      translateY,
      translateZ,
      rotateY,
      depthFactor,
      opacity,
      relativeIndex,
      isCenter
    };
  }, [categories.length, continuousOffset, getCardSpacing]);

  // Navegación por teclado
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onIndexChange((currentIndex - 1 + categories.length) % categories.length);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onIndexChange((currentIndex + 1) % categories.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCategoryClick?.(categories[currentIndex]?.category);
    }
  }, [currentIndex, categories, onIndexChange, onCategoryClick]);

  // Mouse/Touch handlers para drag - Funciona en todo el carrusel incluyendo tarjetas
  const handleDragStart = useCallback((e) => {
    // Permitir drag desde cualquier parte, incluyendo tarjetas
    hasDraggedRef.current = false;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    dragStartOffsetRef.current = offsetRef.current; // Guardar offset al iniciar
    // NO activar isDragging aquí - esperar a que haya movimiento
  }, []);

  const handleDragMove = useCallback((e) => {
    if (startXRef.current === 0) return; // No hay drag iniciado
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = clientX - startXRef.current;
    
    if (e.cancelable && Math.abs(diff) > 3) {
      e.preventDefault();
    }
    
    // Solo activar modo drag después de movimiento significativo (más de 5px)
    if (Math.abs(diff) > 5) {
      if (!isDragging) {
        setIsDragging(true);
      }
      hasDraggedRef.current = true;
      
      // Calcular nuevo offset basado en el drag
      // relativeIndex = index - continuousOffset
      // translateX = relativeIndex * cardSpacing
      // Para que las tarjetas sigan el dedo:
      // - Arrastrar a la derecha (diff > 0) debe mover tarjetas a la derecha
      // - Esto requiere que translateX aumente, lo que requiere que relativeIndex aumente
      // - Para que relativeIndex aumente, continuousOffset debe DISMINUIR
      // - Por lo tanto: newOffset = dragStartOffset - dragItems
      const cardSpacing = getCardSpacing();
      const dragItems = diff / cardSpacing;
      const total = categories.length || 1;
      let newOffset = dragStartOffsetRef.current - dragItems;
      // Normalizar al rango [0, total)
      newOffset = ((newOffset % total) + total) % total;
      offsetRef.current = newOffset;
      setContinuousOffset(newOffset);
    }
  }, [isDragging, getCardSpacing, categories.length]);

  const handleDragEnd = useCallback(() => {
    if (startXRef.current === 0 && !isDragging) return;
    
    setIsDragging(false);
    startXRef.current = 0;
    dragStartOffsetRef.current = 0;
    
    // El offset ya está actualizado durante el drag, solo pausar auto-rotación
    if (hasDraggedRef.current && onIndexChange) {
      const total = categories.length || 1;
      const roundedIndex = Math.round(offsetRef.current) % total;
      onIndexChange(roundedIndex);
    }

    pauseAutoRotate(3500);
  }, [isDragging, categories.length, onIndexChange, pauseAutoRotate]);

  // Navegación manual con flechas
  const navigatePrev = useCallback(() => {
    const newOffset = (offsetRef.current - 1 + categories.length) % categories.length;
    offsetRef.current = newOffset;
    setContinuousOffset(newOffset);
    pauseAutoRotate(2500);
  }, [categories.length, pauseAutoRotate]);

  const navigateNext = useCallback(() => {
    const newOffset = (offsetRef.current + 1) % categories.length;
    offsetRef.current = newOffset;
    setContinuousOffset(newOffset);
    pauseAutoRotate(2500);
  }, [categories.length, pauseAutoRotate]);

  // Scroll wheel para navegar
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const direction = e.deltaX > 0 || e.deltaY > 0 ? 1 : -1;
    
    // Debounce para evitar scroll muy rápido (300ms para movimiento más controlado)
    if (!containerRef.current?.dataset.scrolling) {
      containerRef.current.dataset.scrolling = 'true';
      
      // Actualizar offset continuo
      const newOffset = (offsetRef.current + direction + categories.length) % categories.length;
      offsetRef.current = newOffset;
      setContinuousOffset(newOffset);
      pauseAutoRotate(2000);
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.dataset.scrolling = '';
        }
      }, 300);
    }
  }, [currentIndex, categories.length, onIndexChange, pauseAutoRotate]);

  // Auto-rotación CONTINUA fluida - movimiento de espiral sin interrupciones
  useEffect(() => {
    const isAutoPaused = autoPausedUntil && Date.now() < autoPausedUntil;
    if (!autoRotate || isHovering || isDragging || isAutoPaused || categories.length <= 1) {
      // Cancelar animación si está pausada
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }
    
    // Velocidad de rotación - items por milisegundo
    // Ajustada para completar una rotación completa en ~30 segundos (más lento y suave)
    const speed = 0.00028;
    
    const animate = (currentTime) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      
      // Actualizar offset continuamente
      offsetRef.current += deltaTime * speed;
      
      // Mantener el offset dentro del rango del total de items para evitar overflow
      if (offsetRef.current >= categories.length) {
        offsetRef.current = offsetRef.current % categories.length;
      }
      
      // Actualizar estado para re-render visual
      setContinuousOffset(offsetRef.current);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [autoRotate, isHovering, isDragging, categories.length, autoPausedUntil]);

  useEffect(() => {
    return () => {
      if (autoPauseTimeoutRef.current) {
        clearTimeout(autoPauseTimeoutRef.current);
      }
    };
  }, []);

  // Notificar al componente padre cuando cambia el estado de hover
  useEffect(() => {
    onHoverChange?.(isHovering);
  }, [isHovering, onHoverChange]);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Click en icono específico - Solo navega si tiene proveedores
  const handleIconClick = useCallback((e, index, category, hasProviders) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    e.stopPropagation(); // Prevenir que el evento suba al contenedor
    
    // Si hubo drag significativo, no ejecutar el click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    // NO permitir click si no tiene proveedores
    if (hasProviders === false) {
      console.log('CategoryIconCarousel: Categoría sin proveedores, click deshabilitado:', category);
      return;
    }
    
    // Navegar a los proveedores de la categoría
    console.log('CategoryIconCarousel: Click en categoría:', category);
    if (onCategoryClick) {
      onCategoryClick(category);
    }
    // También actualizar el índice para que quede centrada
    if (onIndexChange) {
      onIndexChange(index);
    }
  }, [onIndexChange, onCategoryClick]);

  if (categories.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-52 sm:h-60 md:h-72 lg:h-64 xl:h-80 2xl:h-88 select-none"
      style={{ perspective: '1400px', touchAction: 'pan-y' }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        handleDragEnd();
        startXRef.current = 0;
        setIsHovering(false);
        setHoveredIndex(null);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label={t('home.carousel.ariaLabel', 'Carrusel de categorías de servicio')}
      aria-activedescendant={`category-card-${currentIndex}`}
    >
      {/* Contenedor central con perspectiva 3D */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1400px', perspectiveOrigin: 'center center' }}
      >
        {categories.map((service, index) => {
          const pos = getIconPosition(index);
          const imageUrl = CATEGORY_IMAGES[service.category] || FALLBACK_IMAGE;
          const isImageLoaded = loadedImages[service.category];
          
          // Si no es visible, no renderizar
          if (!pos.isVisible) {
            return null;
          }
          
          // Z-index basado en profundidad
          const baseZIndex = Math.round(50 + pos.depthFactor * 50);
          // Escala para tarjetas grandes con imagen
          const baseScale = 0.55 + pos.depthFactor * 0.45; // Rango: 0.55 a 1.0
          // Determinar si está deshabilitado (sin proveedores)
          const isDisabled = service.hasProviders === false;
          
          return (
            <div
              key={service.instanceId}
              id={`category-card-${index}`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                handleIconClick(e, index, service.category, service.hasProviders);
              }}
              className={`carousel-card absolute flex flex-col items-center justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                transform: `translateX(${pos.translateX}px) translateY(${pos.translateY}px) translateZ(${pos.translateZ}px) rotateY(${pos.rotateY}deg) scale(${baseScale})`,
                opacity: pos.opacity,
                zIndex: baseZIndex,
                transformOrigin: 'center center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: 'auto',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out'
              }}
              onMouseEnter={(e) => {
                // Animación hover elegante
                e.currentTarget.style.transform = `translateX(${pos.translateX}px) translateY(${pos.translateY - 8}px) translateZ(${pos.translateZ + 30}px) rotateY(${pos.rotateY}deg) scale(${baseScale * 1.08})`;
                e.currentTarget.style.zIndex = '999';
                setHoveredIndex(index);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `translateX(${pos.translateX}px) translateY(${pos.translateY}px) translateZ(${pos.translateZ}px) rotateY(${pos.rotateY}deg) scale(${baseScale})`;
                e.currentTarget.style.zIndex = String(baseZIndex);
                setHoveredIndex(null);
              }}
              role="option"
              aria-selected={pos.isCenter}
              aria-label={`${service.translatedName} - ${isDisabled ? t('home.comingSoon') : t('home.clickToViewProviders')}`}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : (pos.isCenter ? 0 : -1)}
            >
              {/* Tarjeta con imagen de categoría */}
              <div 
                className="carousel-card-inner relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 group"
                style={{
                  width: 'clamp(140px, 35vw, 260px)',
                  height: 'clamp(170px, 42vw, 320px)',
                  boxShadow: hoveredIndex === index 
                    ? '0 25px 60px -12px rgba(0,0,0,0.5), 0 10px 20px -5px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)'
                    : '0 15px 40px -10px rgba(0,0,0,0.4), 0 5px 15px -5px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.15)'
                }}
              >
                {/* Imagen de fondo de la categoría */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    filter: isDisabled ? 'grayscale(40%)' : 'none'
                  }}
                />
                
                {/* Skeleton loader mientras carga la imagen */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 bg-linear-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                )}
                
                {/* Overlay gradiente oscuro en la parte inferior para el texto */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                  }}
                />
                
                {/* Overlay superior con gradiente sutil */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 30%)'
                  }}
                />

                {/* Badge de PRÓXIMAMENTE - solo para categorías sin proveedores */}
                {isDisabled && (
                  <div 
                    className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/95 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap"
                    style={{
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.5)'
                    }}
                  >
                    {t('home.comingSoon')}
                  </div>
                )}

                {/* Contenido inferior: nombre de categoría */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                  {/* Nombre de la categoría */}
                  <h3 
                    className="carousel-card-label font-bold text-white text-center leading-tight drop-shadow-lg text-sm sm:text-base md:text-lg"
                    style={{
                      textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)'
                    }}
                  >
                    {service.translatedName}
                  </h3>
                  
                  {/* Contador de proveedores - solo si tiene proveedores */}
                  {!isDisabled && service.providerCount > 0 && (
                    <p 
                      className="text-white/90 text-center mt-1 text-xs sm:text-sm font-medium"
                      style={{
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {service.providerCount} {service.providerCount === 1 
                        ? t('home.carousel.provider', 'profesional') 
                        : t('home.carousel.providers', 'profesionales')}
                    </p>
                  )}
                </div>

                {/* Borde brillante en hover */}
                <div 
                  className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    border: '2px solid rgba(255,255,255,0.4)',
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
                  }}
                />

                {/* Glow effect en hover */}
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
  categories: PropTypes.arrayOf(PropTypes.shape({
    category: PropTypes.string.isRequired,
    translatedName: PropTypes.string,
    providerCount: PropTypes.number,
    hasProviders: PropTypes.bool
  })).isRequired,
  currentIndex: PropTypes.number.isRequired,
  onIndexChange: PropTypes.func.isRequired,
  onCategoryClick: PropTypes.func,
  onHoverChange: PropTypes.func,
  autoRotate: PropTypes.bool,
  rotationInterval: PropTypes.number
};

export default CategoryIconCarousel;

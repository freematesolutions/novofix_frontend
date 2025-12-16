import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CATEGORY_ICONS } from '@/utils/categoryIcons.jsx';

/**
 * CategoryIconCarousel - Carrusel 3D estilo "Encarta 2004" moderno
 * 
 * Características:
 * - ~4 tarjetas grandes visibles con efecto levitación 3D
 * - Rotación CONTINUA fluida (no step-by-step) independiente del hero
 * - Efecto perspectiva con tarjetas que resaltan y "flotan"
 * - Pausa al hover con resaltado del elemento
 * - Interacción con mouse/touch/teclado para navegar
 * - Click para seleccionar categoría
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
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Para animación continua fluida - usando refs para evitar re-renders
  const [continuousOffset, setContinuousOffset] = useState(0);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const offsetRef = useRef(0); // Ref para tracking del offset sin causar re-renders
  const hasDraggedRef = useRef(false); // Flag para saber si hubo drag significativo

  // Cantidad de iconos visibles: ~3 total para efecto espiral flotante
  const visibleCount = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1; // mobile: ~3 total
      if (window.innerWidth < 1024) return 1.5; // tablet: ~4 total
      return 1.5; // desktop: ~4 total (menos para que resalten más)
    }
    return 1.5;
  }, []);

  // Calcular posiciones de iconos - CARRUSEL CIRCULAR CONTINUO
  // Calcula posición 3D con SEPARACIÓN FIJA basada en índice relativo
  const getIconPosition = useCallback((index) => {
    const totalItems = categories.length;
    if (totalItems === 0) return { isVisible: false };

    // Calcular posición relativa al centro (qué tan lejos está del ítem actual)
    let relativeIndex = index - continuousOffset;
    
    // Normalizar para que esté en rango [-totalItems/2, totalItems/2]
    while (relativeIndex > totalItems / 2) relativeIndex -= totalItems;
    while (relativeIndex < -totalItems / 2) relativeIndex += totalItems;
    
    // Agregar offset del drag (en unidades de índice)
    relativeIndex -= dragOffset / 100;

    // SOLO mostrar 3 tarjetas: la central y una a cada lado
    // Si está más lejos de 1.5 posiciones, no es visible
    if (Math.abs(relativeIndex) > 1.5) {
      return { isVisible: false };
    }

    // SEPARACIÓN FIJA EN PÍXELES según resolución
    // Cada tarjeta se separa esta cantidad de píxeles del centro
    let cardSpacing = 120; // Móvil pequeño
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1536) {
        cardSpacing = 280; // 2K+
      } else if (width >= 1280) {
        cardSpacing = 240; // Desktop XL
      } else if (width >= 1024) {
        cardSpacing = 200; // Desktop
      } else if (width >= 768) {
        cardSpacing = 170; // Tablet
      } else if (width >= 640) {
        cardSpacing = 150; // Tablet pequeña
      } else if (width >= 480) {
        cardSpacing = 130; // Móvil grande
      } else {
        cardSpacing = 110; // Móvil pequeño
      }
    }

    // Posición horizontal: directamente proporcional al índice relativo
    const translateX = relativeIndex * cardSpacing;
    
    // Profundidad: tarjeta central al frente, laterales atrás
    // Usar función cuadrática para efecto más pronunciado
    const distanceFromCenter = Math.abs(relativeIndex);
    const translateZ = -distanceFromCenter * 80; // Negativos van hacia atrás
    
    // Movimiento vertical sutil para efecto de arco/espiral
    const translateY = distanceFromCenter * distanceFromCenter * 15; // Las laterales bajan un poco
    
    // Rotación Y para efecto 3D de giro
    const rotateY = relativeIndex * -15; // Gira hacia afuera
    
    // Factor de profundidad: 1 en el centro, 0 en los bordes
    const depthFactor = Math.max(0, 1 - distanceFromCenter * 0.6);
    
    // Opacidad: plena en el centro, fade hacia los bordes
    const opacity = Math.max(0.4, 1 - distanceFromCenter * 0.5);
    
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
  }, [categories.length, dragOffset, continuousOffset]);

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
    setStartX(clientX);
    setDragOffset(0);
    // NO activar isDragging aquí - esperar a que haya movimiento
  }, []);

  const handleDragMove = useCallback((e) => {
    if (startX === 0) return; // No hay drag iniciado
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = clientX - startX;
    
    // Solo activar modo drag después de movimiento significativo (más de 5px)
    if (Math.abs(diff) > 5) {
      if (!isDragging) {
        setIsDragging(true);
      }
      hasDraggedRef.current = true;
      setDragOffset(diff);
    }
  }, [startX, isDragging]);

  const handleDragEnd = useCallback(() => {
    if (startX === 0 && !isDragging) return;
    
    setIsDragging(false);
    setStartX(0);
    
    // Calcular cuántos items mover basado en el drag y aplicar al offset continuo
    const threshold = 50;
    const itemsToMove = Math.round(dragOffset / threshold);
    
    if (itemsToMove !== 0) {
      // Actualizar el offset continuo directamente
      const newOffset = (offsetRef.current + itemsToMove + categories.length) % categories.length;
      offsetRef.current = newOffset;
      setContinuousOffset(newOffset);
    }
    
    setDragOffset(0);
  }, [isDragging, startX, dragOffset, categories.length]);

  // Navegación manual con flechas
  const navigatePrev = useCallback(() => {
    const newOffset = (offsetRef.current - 1 + categories.length) % categories.length;
    offsetRef.current = newOffset;
    setContinuousOffset(newOffset);
  }, [categories.length]);

  const navigateNext = useCallback(() => {
    const newOffset = (offsetRef.current + 1) % categories.length;
    offsetRef.current = newOffset;
    setContinuousOffset(newOffset);
  }, [categories.length]);

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
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.dataset.scrolling = '';
        }
      }, 300);
    }
  }, [currentIndex, categories.length, onIndexChange]);

  // Auto-rotación CONTINUA fluida - movimiento de espiral sin interrupciones
  useEffect(() => {
    if (!autoRotate || isHovering || isDragging || categories.length <= 1) {
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
  }, [autoRotate, isHovering, isDragging, categories.length]);

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
      className="relative w-full h-36 sm:h-40 md:h-44 lg:h-36 xl:h-44 select-none"
      style={{ perspective: '1200px' }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        handleDragEnd();
        setStartX(0);
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
      aria-label="Carrusel de categorías de servicio"
      aria-activedescendant={`category-icon-${currentIndex}`}
    >
      {/* Contenedor central con perspectiva 3D para efecto de órbita - Sin márgenes ya que no hay flechas */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1200px', perspectiveOrigin: 'center center' }}
      >
        {categories.map((service, index) => {
          const pos = getIconPosition(index);
          
          // Si no es visible, no renderizar
          if (!pos.isVisible) {
            return null;
          }
          
          // Z-index basado en profundidad
          const baseZIndex = Math.round(50 + pos.depthFactor * 50);
          // Escala MUY agresiva: tarjeta central GRANDE, laterales MUY PEQUEÑAS
          // depthFactor va de 0 (atrás) a 1 (frente)
          const baseScale = 0.45 + pos.depthFactor * 0.55; // Rango: 0.45 a 1.0
          // Determinar si está deshabilitado (sin proveedores)
          const isDisabled = service.hasProviders === false;
          
            return (
              <div
                key={service.instanceId}
              id={`category-icon-${index}`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                handleIconClick(e, index, service.category, service.hasProviders);
              }}
              className={`carousel-card absolute flex flex-col items-center justify-center gap-1.5 sm:gap-2 focus:outline-none ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                transform: `translateX(${pos.translateX}px) translateY(${pos.translateY}px) translateZ(${pos.translateZ}px) rotateY(${pos.rotateY}deg) scale(${baseScale})`,
                opacity: pos.opacity,
                zIndex: baseZIndex,
                transformOrigin: 'center center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                pointerEvents: 'auto',
                transition: 'transform 0.2s ease-out'
              }}
              onMouseEnter={(e) => {
                // Animación hover para TODAS las tarjetas (con y sin proveedores)
                e.currentTarget.style.transform = `translateX(${pos.translateX}px) translateY(${pos.translateY}px) translateZ(${pos.translateZ}px) rotateY(${pos.rotateY}deg) scale(${baseScale * 1.15})`;
                e.currentTarget.style.zIndex = '999';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `translateX(${pos.translateX}px) translateY(${pos.translateY}px) translateZ(${pos.translateZ}px) rotateY(${pos.rotateY}deg) scale(${baseScale})`;
                e.currentTarget.style.zIndex = String(baseZIndex);
              }}
              role="option"
              aria-selected={pos.isCenter}
              aria-label={`${service.category} - ${isDisabled ? 'Próximamente' : 'Click para ver proveedores'}`}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : (pos.isCenter ? 0 : -1)}
            >
              {/* TARJETA - MISMO FONDO SÓLIDO para TODAS (con/sin proveedores) */}
              <div 
                className="carousel-card-inner relative rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-5 xl:p-6 transition-all duration-300 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(240,240,255,0.9) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '2px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 15px 40px -10px rgba(0,0,0,0.4), 0 5px 15px -5px rgba(255,255,255,0.3), inset 0 1px 2px rgba(255,255,255,0.5)'
                }}
              >
                {/* Badge de PRÓXIMAMENTE en la esquina superior derecha - SOLO para tarjetas deshabilitadas */}
                {isDisabled && (
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10"
                    style={{
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)'
                    }}
                  >
                    Próximamente
                  </div>
                )}
                {/* Efecto de luz superior */}
                <div 
                  className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)'
                  }}
                />

                {/* Icono SVG - MISMO COLOR VIBRANTE para TODAS las tarjetas */}
                <div 
                  className="carousel-card-icon relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-11 lg:h-11 xl:w-13 xl:h-13 [&>svg]:w-full [&>svg]:h-full text-brand-600"
                  style={{
                    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))'
                  }}
                >
                  {CATEGORY_ICONS[service.category] || CATEGORY_ICONS['Otro']}
                </div>

                {/* Glow - visible en hover/touch via CSS */}
                <div 
                  className="carousel-card-glow absolute -inset-4 rounded-3xl pointer-events-none -z-10 opacity-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.5) 0%, rgba(14,165,233,0.3) 40%, transparent 70%)',
                    filter: 'blur(15px)'
                  }}
                />
              </div>

              {/* Nombre de categoría - MISMO ESTILO para TODAS las tarjetas */}
              <span 
                className="carousel-card-label font-bold whitespace-nowrap text-center mt-2 px-3 py-1.5 rounded-full text-xs sm:text-sm shadow-lg text-white bg-brand-600"
                style={{
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                }}
              >
                {service.category}
              </span>
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

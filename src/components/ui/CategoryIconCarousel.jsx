import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/utils/categoryIcons.jsx';

/**
 * CategoryIconCarousel - Carrusel de iconos en espiral/ruleta horizontal
 * 
 * Características:
 * - Efecto de perspectiva 3D con icono central más grande
 * - Iconos laterales reducidos según distancia del centro
 * - Interacción con mouse/touch para navegar
 * - Sincronización con índice de categoría activa
 * - Click para seleccionar categoría
 */
function CategoryIconCarousel({ 
  categories, 
  currentIndex, 
  onIndexChange, 
  onCategoryClick,
  autoRotate = true,
  rotationInterval = 5000 
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const autoRotateRef = useRef(null);

  // Cantidad de iconos visibles a cada lado del centro
  const visibleCount = useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 2; // mobile
      if (window.innerWidth < 1024) return 3; // tablet
      return 4; // desktop
    }
    return 3;
  }, []);

  // Calcular posiciones de iconos con efecto perspectiva
  const getIconStyle = useCallback((index) => {
    const totalItems = categories.length;
    if (totalItems === 0) return {};

    // Calcular distancia desde el centro considerando el array circular
    let diff = index - currentIndex;
    
    // Normalizar para array circular
    if (diff > totalItems / 2) diff -= totalItems;
    if (diff < -totalItems / 2) diff += totalItems;

    // Agregar offset del drag
    const adjustedDiff = diff - (dragOffset / 100);

    // Calcular propiedades basadas en distancia
    const absDistance = Math.abs(adjustedDiff);
    const maxDistance = visibleCount + 1;

    // Ocultar si está muy lejos
    if (absDistance > maxDistance) {
      return { opacity: 0, pointerEvents: 'none' };
    }

    // Escala: máximo en centro (1.0), mínimo en bordes (0.4)
    const scale = Math.max(0.4, 1 - absDistance * 0.15);
    
    // Opacidad: máximo en centro (1.0), mínimo en bordes (0.3)
    const opacity = Math.max(0.3, 1 - absDistance * 0.2);

    // Posición X: espaciado proporcional
    const spacing = 80; // px base entre iconos
    const translateX = adjustedDiff * spacing * (1 - absDistance * 0.05);

    // Profundidad Z (efecto 3D)
    const translateZ = -absDistance * 50;

    // Blur sutil para iconos alejados
    const blur = Math.min(absDistance * 0.5, 2);

    // Z-index basado en distancia (centro tiene mayor z-index)
    const zIndex = 100 - Math.round(absDistance * 10);

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      zIndex,
      transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  }, [categories.length, currentIndex, dragOffset, visibleCount, isDragging]);

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

  // Mouse/Touch handlers para drag
  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setDragOffset(0);
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = clientX - startX;
    setDragOffset(diff);
  }, [isDragging, startX]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Calcular cuántos items mover basado en el drag
    const threshold = 50;
    const itemsToMove = Math.round(dragOffset / -threshold);
    
    if (itemsToMove !== 0) {
      const newIndex = (currentIndex + itemsToMove + categories.length) % categories.length;
      onIndexChange(newIndex);
    }
    
    setDragOffset(0);
  }, [isDragging, dragOffset, currentIndex, categories.length, onIndexChange]);

  // Scroll wheel para navegar
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const direction = e.deltaX > 0 || e.deltaY > 0 ? 1 : -1;
    
    // Debounce para evitar scroll muy rápido
    if (!containerRef.current?.dataset.scrolling) {
      containerRef.current.dataset.scrolling = 'true';
      onIndexChange((currentIndex + direction + categories.length) % categories.length);
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.dataset.scrolling = '';
        }
      }, 200);
    }
  }, [currentIndex, categories.length, onIndexChange]);

  // Auto-rotación
  useEffect(() => {
    if (autoRotate && !isHovering && !isDragging && categories.length > 1) {
      autoRotateRef.current = setInterval(() => {
        onIndexChange((prev) => (prev + 1) % categories.length);
      }, rotationInterval);
    }
    
    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [autoRotate, isHovering, isDragging, categories.length, rotationInterval, onIndexChange]);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Click en icono específico
  const handleIconClick = useCallback((index, category) => {
    if (index === currentIndex) {
      // Si es el central, ejecutar acción
      onCategoryClick?.(category);
    } else {
      // Si no es el central, navegar a él
      onIndexChange(index);
    }
  }, [currentIndex, onIndexChange, onCategoryClick]);

  if (categories.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-20 sm:h-24 md:h-28 lg:h-20 xl:h-24 perspective-[1000px] select-none"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        handleDragEnd();
        setIsHovering(false);
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
      {/* Contenedor central con transform-style 3D */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {categories.map((service, index) => {
          const iconStyle = getIconStyle(index);
          const gradientClass = CATEGORY_COLORS[service.category] || CATEGORY_COLORS['Otro'];
          const isCenter = index === currentIndex;
          
          return (
            <button
              key={service.category}
              id={`category-icon-${index}`}
              onClick={() => handleIconClick(index, service.category)}
              className={`
                absolute flex flex-col items-center justify-center gap-1 sm:gap-2
                cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
                ${isCenter ? 'cursor-pointer' : 'cursor-grab'}
              `}
              style={{
                ...iconStyle,
                transformOrigin: 'center center'
              }}
              role="option"
              aria-selected={isCenter}
              aria-label={`${service.category}${isCenter ? ' - Click para ver proveedores' : ''}`}
              tabIndex={isCenter ? 0 : -1}
            >
              {/* Contenedor del icono con gradiente */}
              <div 
                className={`
                  relative p-2 sm:p-2.5 md:p-3 lg:p-2.5 xl:p-4 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-xl
                  bg-linear-to-br ${gradientClass}
                  shadow-lg hover:shadow-xl
                  transition-all duration-300
                  ${isCenter ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent scale-100' : 'scale-90'}
                  group
                `}
                style={{
                  background: isCenter 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isCenter ? '2px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {/* Icono SVG */}
                <div 
                  className={`
                    text-white drop-shadow-md
                    transition-transform duration-300
                    flex items-center justify-center
                    ${isCenter ? 'group-hover:scale-110 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-7 lg:h-7 xl:w-9 xl:h-9' : 'w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6'}
                    [&>svg]:w-full [&>svg]:h-full
                  `}
                >
                  {CATEGORY_ICONS[service.category] || CATEGORY_ICONS['Otro']}
                </div>

                {/* Efecto de brillo en hover (solo centro) */}
                {isCenter && (
                  <div 
                    className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)'
                    }}
                  />
                )}
              </div>

              {/* Nombre de categoría (solo en centro) */}
              {isCenter && (
                <div className="flex flex-col items-center gap-0 sm:gap-0.5 animate-fade-in">
                  <span 
                    className="text-[10px] sm:text-xs md:text-sm lg:text-[11px] xl:text-base font-bold text-white whitespace-nowrap max-w-[100px] sm:max-w-[130px] md:max-w-40 lg:max-w-[140px] xl:max-w-[200px] truncate text-center"
                    style={{
                      textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.2)'
                    }}
                  >
                    {service.category}
                  </span>
                  
                  {/* Badge indicador de click - visible en todas las resoluciones excepto móvil */}
                  <span 
                    className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 lg:px-1.5 rounded-full text-[7px] sm:text-[8px] md:text-[9px] lg:text-[7px] xl:text-[9px] font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 hover:bg-white/30 transition-all duration-300 cursor-pointer group"
                  >
                    <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-2 lg:h-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="lg:hidden xl:inline">Ver profesionales</span>
                    <span className="hidden lg:inline xl:hidden">Ver</span>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Indicadores de navegación lateral */}
      <div className="absolute left-0.5 sm:left-1 md:left-2 lg:left-1 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => onIndexChange((currentIndex - 1 + categories.length) % categories.length)}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Categoría anterior"
        >
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute right-0.5 sm:right-1 md:right-2 lg:right-1 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => onIndexChange((currentIndex + 1) % categories.length)}
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Categoría siguiente"
        >
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Instrucción de interacción - visible solo en hover, oculta en móvil */}
      <div 
        className={`
          absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 
          text-[7px] sm:text-[8px] lg:text-[7px] text-white/40 font-medium
          transition-opacity duration-300 whitespace-nowrap
          pointer-events-none hidden sm:block
          ${isHovering ? 'opacity-100' : 'opacity-0'}
        `}
      >
        ← Arrastra o usa flechas →
      </div>
    </div>
  );
}

CategoryIconCarousel.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    category: PropTypes.string.isRequired,
    providerCount: PropTypes.number
  })).isRequired,
  currentIndex: PropTypes.number.isRequired,
  onIndexChange: PropTypes.func.isRequired,
  onCategoryClick: PropTypes.func,
  autoRotate: PropTypes.bool,
  rotationInterval: PropTypes.number
};

export default CategoryIconCarousel;

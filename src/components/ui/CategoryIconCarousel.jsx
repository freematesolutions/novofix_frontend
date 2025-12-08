import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CATEGORY_ICONS } from '@/utils/categoryIcons.jsx';

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
  onHoverChange,
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

  // Calcular posiciones de iconos con efecto perspectiva mejorado
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

    // Escala mejorada: centro más prominente (1.0), bordes más pequeños (0.5)
    const scale = Math.max(0.5, 1 - absDistance * 0.12);
    
    // Opacidad mejorada: centro brillante (1.0), bordes más tenues (0.4)
    const opacity = Math.max(0.4, 1 - absDistance * 0.18);

    // Posición X: espaciado proporcional con mejor distribución
    const spacing = 85; // px base entre iconos
    const translateX = adjustedDiff * spacing * (1 - absDistance * 0.04);

    // Profundidad Z mejorada (efecto 3D más pronunciado)
    const translateZ = -absDistance * 60;
    
    // Rotación Y sutil para efecto carrusel 3D
    const rotateY = adjustedDiff * -8;

    // Blur más pronunciado para iconos alejados
    const blur = Math.min(absDistance * 0.8, 2.5);

    // Z-index basado en distancia (centro tiene mayor z-index)
    const zIndex = 100 - Math.round(absDistance * 10);

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      zIndex,
      transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
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
    
    // Debounce para evitar scroll muy rápido (300ms para movimiento más controlado)
    if (!containerRef.current?.dataset.scrolling) {
      containerRef.current.dataset.scrolling = 'true';
      onIndexChange((currentIndex + direction + categories.length) % categories.length);
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.dataset.scrolling = '';
        }
      }, 300);
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
              {/* Contenedor del icono con efectos 3D realistas */}
              <div 
                className={`
                  relative rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-2xl
                  transition-all duration-400 ease-out
                  ${isCenter 
                    ? 'p-3 sm:p-3.5 md:p-4 lg:p-3.5 xl:p-5 scale-100 hover:scale-108' 
                    : 'p-2 sm:p-2.5 md:p-3 lg:p-2.5 xl:p-3 scale-80 hover:scale-85 opacity-70 hover:opacity-85'}
                  group
                `}
                style={{
                  // Fondo con múltiples capas para efecto cristal realista
                  background: isCenter 
                    ? `
                      linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.05) 100%)
                    `
                    : 'linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 100%)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: isCenter 
                    ? '1.5px solid rgba(255,255,255,0.6)' 
                    : '1px solid rgba(255,255,255,0.2)',
                  // Sombras realistas con múltiples capas
                  boxShadow: isCenter 
                    ? `
                      0 10px 40px -10px rgba(0,0,0,0.5),
                      0 6px 20px -5px rgba(0,0,0,0.3),
                      inset 0 1px 1px rgba(255,255,255,0.6),
                      inset 0 -1px 1px rgba(0,0,0,0.1),
                      0 0 60px -10px rgba(255,255,255,0.2)
                    `
                    : `
                      0 4px 20px -5px rgba(0,0,0,0.3),
                      inset 0 1px 1px rgba(255,255,255,0.3)
                    `
                }}
              >
                {/* Efecto de luz superior realista */}
                <div 
                  className="absolute inset-0 rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-2xl pointer-events-none overflow-hidden"
                  style={{
                    background: `
                      linear-gradient(180deg, 
                        rgba(255,255,255,0.4) 0%, 
                        rgba(255,255,255,0.1) 20%, 
                        transparent 50%
                      )
                    `,
                    opacity: isCenter ? 1 : 0.5
                  }}
                />

                {/* Borde luminoso interno sutil */}
                <div 
                  className={`absolute inset-px rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-2xl pointer-events-none ${isCenter ? 'opacity-100' : 'opacity-40'}`}
                  style={{
                    background: 'transparent',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)'
                  }}
                />

                {/* Icono SVG con efectos de profundidad realistas */}
                <div 
                  className={`
                    relative text-white
                    transition-all duration-400 ease-out
                    flex items-center justify-center
                    ${isCenter 
                      ? 'w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-10 lg:h-10 xl:w-12 xl:h-12 group-hover:scale-110' 
                      : 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-6 lg:h-6 xl:w-7 xl:h-7'}
                    [&>svg]:w-full [&>svg]:h-full
                  `}
                  style={{
                    // Sombras múltiples para efecto de profundidad y glow
                    filter: isCenter 
                      ? `
                        drop-shadow(0 2px 3px rgba(0,0,0,0.4))
                        drop-shadow(0 4px 8px rgba(0,0,0,0.2))
                        drop-shadow(0 0 12px rgba(255,255,255,0.3))
                      `
                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                  }}
                >
                  {CATEGORY_ICONS[service.category] || CATEGORY_ICONS['Otro']}
                </div>

                {/* Efectos hover premium (solo centro) */}
                {isCenter && (
                  <>
                    {/* Glow exterior suave */}
                    <div 
                      className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none -z-10"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 60%)',
                        filter: 'blur(12px)'
                      }}
                    />
                    {/* Destello de luz animado */}
                    <div 
                      className="absolute inset-0 rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden"
                    >
                      <div 
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-800 ease-out"
                        style={{
                          background: 'linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Nombre de categoría limpio (solo en centro) */}
              {isCenter && (
                <span 
                  className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-lg font-semibold text-white whitespace-nowrap max-w-30 sm:max-w-36 md:max-w-48 lg:max-w-40 xl:max-w-60 truncate text-center animate-fade-in mt-1"
                  style={{
                    textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.2)'
                  }}
                >
                  {service.category}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Indicadores de navegación lateral mejorados */}
      <div className="absolute left-0.5 sm:left-1 md:left-2 lg:left-1 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => onIndexChange((currentIndex - 1 + categories.length) % categories.length)}
          className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 hover:border-white/50 hover:scale-110 hover:shadow-lg hover:shadow-white/20 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Categoría anterior"
        >
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute right-0.5 sm:right-1 md:right-2 lg:right-1 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => onIndexChange((currentIndex + 1) % categories.length)}
          className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 hover:border-white/50 hover:scale-110 hover:shadow-lg hover:shadow-white/20 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Categoría siguiente"
        >
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Instrucción de interacción - visible solo en hover, oculta en móvil - z-index alto para estar por encima */}
      <div 
        className={`
          absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-150
          text-[8px] sm:text-[9px] lg:text-[8px] text-white/50 font-medium
          transition-opacity duration-300 whitespace-nowrap
          pointer-events-none hidden sm:block
          px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm
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
  onHoverChange: PropTypes.func,
  autoRotate: PropTypes.bool,
  rotationInterval: PropTypes.number
};

export default CategoryIconCarousel;

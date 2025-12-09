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
  // Solo calcula posición base, los efectos hover se aplican en el JSX
  const getIconPosition = useCallback((index) => {
    const totalItems = categories.length;
    if (totalItems === 0) return { isVisible: false };

    // Calcular ángulo en el círculo para este icono
    // Usamos continuousOffset directamente para movimiento fluido
    const baseAngle = ((index - continuousOffset) / totalItems) * Math.PI * 2;
    
    // Agregar offset del drag
    const dragAngle = (dragOffset / 100) * (Math.PI / 4);
    const angle = baseAngle - dragAngle;
    
    // Normalizar ángulo para determinar visibilidad
    let normalizedAngle = angle % (Math.PI * 2);
    if (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
    if (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;
    
    // Mostrar menos tarjetas para que se distingan mejor
    // Reducimos el ángulo visible para mostrar ~3-4 tarjetas
    const visibilityAngle = Math.PI * 0.38; // Aproximadamente 70 grados a cada lado
    if (Math.abs(normalizedAngle) > visibilityAngle) {
      return { isVisible: false };
    }

    // TRAYECTORIA ELÍPTICA - Radio RESPONSIVO ajustado para no desbordar
    let radiusX = 90; // Más pequeño en móviles para no desbordar
    let radiusZ = 40;
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1536) {
        radiusX = 320; radiusZ = 140;
      } else if (width >= 1280) {
        radiusX = 280; radiusZ = 120;
      } else if (width >= 1024) {
        radiusX = 240; radiusZ = 100;
      } else if (width >= 768) {
        radiusX = 180; radiusZ = 80;
      } else if (width >= 640) {
        radiusX = 140; radiusZ = 60;
      } else if (width >= 480) {
        radiusX = 110; radiusZ = 50;
      }
    }
    
    const translateX = Math.sin(angle) * radiusX;
    const translateZ = (Math.cos(angle) - 1) * radiusZ;
    const depthFactor = (Math.cos(angle) + 1) / 2;
    
    // Calcular opacidad basada en la posición - fade suave en los bordes
    const edgeFade = 1 - (Math.abs(normalizedAngle) / visibilityAngle);
    const baseOpacity = Math.max(0.3, Math.min(1, edgeFade * 1.5)) * (0.6 + depthFactor * 0.4);
    
    // Determinar si esta tarjeta está en el centro (ángulo cercano a 0)
    const isCenter = Math.abs(normalizedAngle) < 0.15;

    return {
      isVisible: true,
      translateX,
      translateZ,
      depthFactor,
      opacity: baseOpacity,
      normalizedAngle,
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

  // Mouse/Touch handlers para drag - Solo activa drag después de movimiento significativo
  const handleDragStart = useCallback((e) => {
    // No iniciar drag si el click fue en un botón de tarjeta
    if (e.target.closest('button')) return;
    
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
    const itemsToMove = Math.round(dragOffset / -threshold);
    
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
    // Ajustada para completar una rotación completa en ~18 segundos (más rápido)
    const speed = 0.00045;
    
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

  // Click en icono específico - SIEMPRE navega a la categoría
  const handleIconClick = useCallback((e, index, category) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    e.stopPropagation(); // Prevenir que el evento suba al contenedor
    
    // Si hubo drag significativo, no ejecutar el click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    // Cualquier tarjeta al hacer click va directamente a los proveedores
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
      {/* Contenedor central con padding para las flechas - SIN 3D para que funcione el hover */}
      <div 
        className="absolute inset-0 flex items-center justify-center mx-12 sm:mx-14 md:mx-16 lg:mx-14 xl:mx-18"
      >
        {categories.map((service, index) => {
          const pos = getIconPosition(index);
          
          // Si no es visible, no renderizar
          if (!pos.isVisible) {
            return null;
          }
          
          // Estilos base - usando la opacidad calculada para fade suave
          const baseZIndex = pos.isCenter ? 200 : Math.round(50 + pos.depthFactor * 50);
          // Escala basada en profundidad para efecto 3D visual - centro más grande
          const baseScale = pos.isCenter ? 1.15 : (0.7 + pos.depthFactor * 0.3);
          
          return (
            <button
              key={service.category}
              id={`category-icon-${index}`}
              onClick={(e) => handleIconClick(e, index, service.category)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`carousel-card absolute flex flex-col items-center justify-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none ${pos.isCenter ? 'carousel-card-center' : ''}`}
              style={{
                transform: `translateX(${pos.translateX}px) scale(${baseScale})${pos.isCenter ? ' translateY(-8px)' : ''}`,
                opacity: pos.isCenter ? 1 : pos.opacity,
                zIndex: baseZIndex,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
              }}
              role="option"
              aria-selected={pos.isCenter}
              aria-label={`${service.category} - Click para ver proveedores`}
              tabIndex={pos.isCenter ? 0 : -1}
            >
              {/* TARJETA - usa clase para hover CSS, estilos especiales si está en centro */}
              <div 
                className="carousel-card-inner relative rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-5 xl:p-6"
                style={pos.isCenter ? {
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 60%, rgba(14,165,233,0.2) 100%)',
                  backdropFilter: 'blur(12px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
                  border: '2px solid rgba(251, 191, 36, 0.8)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4), 0 0 0 4px rgba(251,191,36,0.3), 0 0 60px -10px rgba(251,191,36,0.5), inset 0 2px 4px rgba(255,255,255,1)',
                  transition: 'all 0.3s ease-out'
                } : {
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
                  backdropFilter: 'blur(10px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 8px 20px -8px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.25)',
                  transition: 'all 0.3s ease-out'
                }}
              >
                {/* Efecto de luz superior */}
                <div 
                  className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)'
                  }}
                />

                {/* Icono SVG - resaltado si está en centro */}
                <div 
                  className="carousel-card-icon relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-11 lg:h-11 xl:w-13 xl:h-13 [&>svg]:w-full [&>svg]:h-full"
                  style={pos.isCenter ? {
                    color: '#0ea5e9',
                    filter: 'drop-shadow(0 0 10px rgba(14,165,233,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.5))',
                    transform: 'scale(1.1)',
                    transition: 'all 0.3s ease-out'
                  } : {
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    transition: 'all 0.3s ease-out'
                  }}
                >
                  {CATEGORY_ICONS[service.category] || CATEGORY_ICONS['Otro']}
                </div>

                {/* Glow - visible si está en centro */}
                <div 
                  className="carousel-card-glow absolute -inset-4 rounded-3xl pointer-events-none -z-10"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.5) 0%, rgba(14,165,233,0.3) 40%, transparent 70%)',
                    filter: 'blur(15px)',
                    opacity: pos.isCenter ? 0.8 : 0,
                    transition: 'opacity 0.3s ease-out'
                  }}
                />
              </div>

              {/* Nombre de categoría - resaltado si está en centro */}
              <span 
                className="carousel-card-label font-bold whitespace-nowrap text-center mt-2 px-3 py-1 rounded-full text-xs sm:text-sm"
                style={pos.isCenter ? {
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fcd34d',
                  backdropFilter: 'blur(8px)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3), 0 0 20px rgba(251,191,36,0.4)',
                  transform: 'scale(1.05)',
                  transition: 'all 0.3s ease-out'
                } : {
                  background: 'rgba(0,0,0,0.35)',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'all 0.3s ease-out'
                }}
              >
                {service.category}
              </span>
            </button>
          );
        })}
      </div>

      {/* Indicadores de navegación lateral - Posición fija */}
      <div className="absolute left-1 sm:left-2 md:left-3 lg:left-2 xl:left-3 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigatePrev();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-9 lg:h-9 xl:w-11 xl:h-11 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/40 hover:border-white/60 hover:scale-110 hover:shadow-xl hover:shadow-white/25 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Categoría anterior"
          style={{
            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
          }}
        >
          <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute right-1 sm:right-2 md:right-3 lg:right-2 xl:right-3 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigateNext();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-9 lg:h-9 xl:w-11 xl:h-11 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/40 hover:border-white/60 hover:scale-110 hover:shadow-xl hover:shadow-white/25 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Categoría siguiente"
          style={{
            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
          }}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Instrucción de interacción - visible solo en hover */}
      <div 
        className={`
          absolute -top-8 sm:-top-9 left-1/2 -translate-x-1/2 z-50
          text-[9px] sm:text-[10px] lg:text-[9px] text-white/60 font-medium
          transition-opacity duration-300 whitespace-nowrap
          pointer-events-none hidden sm:block
          px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/15
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

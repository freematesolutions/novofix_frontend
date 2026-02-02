import { useState, useEffect, useMemo, useCallback } from 'react';

export default function PortfolioModal({ isOpen, onClose, portfolio, providerName }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'image' | 'video'
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Filter portfolio items
  const filteredPortfolio = useMemo(() => {
    if (!portfolio) return [];
    if (filter === 'all') return portfolio;
    return portfolio.filter(item => item.type === filter);
  }, [portfolio, filter]);

  // Counts for filter tabs
  const counts = useMemo(() => {
    if (!portfolio) return { all: 0, image: 0, video: 0 };
    return {
      all: portfolio.length,
      image: portfolio.filter(item => item.type === 'image').length,
      video: portfolio.filter(item => item.type === 'video').length
    };
  }, [portfolio]);

  // Reset index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
    setIsZoomed(false);
    setZoomPosition({ x: 0, y: 0 });
  }, [filter]);

  // Reset zoom when changing image
  useEffect(() => {
    setIsZoomed(false);
    setZoomPosition({ x: 0, y: 0 });
  }, [selectedIndex]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Detect fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
      );
      setIsFullscreen(isInFullscreen);
    };

    // Initial check
    handleFullscreenChange();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredPortfolio.length - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setSelectedIndex(prev => prev < filteredPortfolio.length - 1 ? prev + 1 : 0);
        break;
      default:
        break;
    }
  }, [isOpen, onClose, filteredPortfolio.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Mouse movement handler with performance optimization
  const handleMouseMove = useCallback((e) => {
    if (isDragging && isZoomed) {
      requestAnimationFrame(() => {
        setZoomPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      });
    }
  }, [isDragging, isZoomed, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle drag events
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen || !portfolio || portfolio.length === 0) return null;

  // Guard against empty filtered portfolio
  const currentItem = filteredPortfolio.length > 0 ? filteredPortfolio[selectedIndex] : null;

  const goToPrevious = () => {
    if (filteredPortfolio.length === 0) return;
    setSelectedIndex((prev) => (prev === 0 ? filteredPortfolio.length - 1 : prev - 1));
  };

  const goToNext = () => {
    if (filteredPortfolio.length === 0) return;
    setSelectedIndex((prev) => (prev === filteredPortfolio.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (e) => {
    if (currentItem && currentItem.type === 'image') {
      e.stopPropagation();
      if (!isZoomed) {
        setIsZoomed(true);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - zoomPosition.x, y: e.clientY - zoomPosition.y });
      e.preventDefault();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full h-full sm:max-w-7xl sm:max-h-[96vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0 bg-white">
          <div className="flex-1 min-w-0 mr-4">
            <h3 id="portfolio-modal-title" className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              Portafolio de {providerName || 'Proveedor'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {selectedIndex + 1} de {filteredPortfolio.length} {filteredPortfolio.length === 1 ? 'elemento' : 'elementos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full shrink-0"
            title="Cerrar (Esc)"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-4 sm:px-6 py-3 border-b bg-gray-50 shrink-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm ${
                filter === 'all'
                  ? 'bg-brand-600 text-white shadow-brand-200'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Todas ({counts.all})
            </button>
            {counts.image > 0 && (
              <button
                onClick={() => setFilter('image')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 shadow-sm ${
                  filter === 'image'
                    ? 'bg-brand-600 text-white shadow-brand-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <span>📷</span>
                <span className="hidden sm:inline">Fotos ({counts.image})</span>
                <span className="sm:hidden">({counts.image})</span>
              </button>
            )}
            {counts.video > 0 && (
              <button
                onClick={() => setFilter('video')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 shadow-sm ${
                  filter === 'video'
                    ? 'bg-brand-600 text-white shadow-brand-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <span>🎥</span>
                <span className="hidden sm:inline">Videos ({counts.video})</span>
                <span className="sm:hidden">({counts.video})</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            {/* Media display */}
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
              {!currentItem ? (
                <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                  No hay elementos disponibles con este filtro
                </div>
              ) : currentItem.type === 'video' ? (
                <div id={`portfolio-video-container-${currentItem._id}`} className="absolute inset-0 video-fullscreen-container">
                  <video
                    key={currentItem._id}
                    src={currentItem.url}
                    controls
                    controlsList="nodownload nofullscreen"
                    className="w-full h-full object-contain bg-black"
                    playsInline
                  />
                  {/* Custom fullscreen button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const container = document.getElementById(`portfolio-video-container-${currentItem._id}`);
                      if (container) {
                        if (container.requestFullscreen) {
                          container.requestFullscreen();
                        } else if (container.webkitRequestFullscreen) {
                          container.webkitRequestFullscreen();
                        } else if (container.msRequestFullscreen) {
                          container.msRequestFullscreen();
                        }
                      }
                    }}
                    className="absolute bottom-20 right-4 bg-black/70 text-white p-2 rounded hover:bg-black/90 transition-all video-custom-fullscreen-btn"
                    title="Pantalla completa"
                    style={{ zIndex: 100 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  {/* Exit fullscreen button - show when fullscreen detected */}
                  {isFullscreen && (
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (document.exitFullscreen) {
                          document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) {
                          document.webkitExitFullscreen();
                        } else if (document.msExitFullscreen) {
                          document.msExitFullscreen();
                        }
                      }}
                      className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-110 active:scale-95"
                      title="Salir de pantalla completa (ESC)"
                      style={{ zIndex: 9999 }}
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <div id={`portfolio-image-container-${currentItem._id}`} className="absolute inset-0 flex items-center justify-center">
                  <img
                    id={`portfolio-image-${currentItem._id}`}
                    key={currentItem._id}
                    src={currentItem.url}
                    alt={currentItem.caption || `Portfolio ${selectedIndex + 1}`}
                    className={`max-w-full max-h-full ${
                      isZoomed 
                        ? 'cursor-move' 
                        : 'cursor-zoom-in'
                    }`}
                    style={isZoomed ? { 
                      transform: `translate3d(${zoomPosition.x}px, ${zoomPosition.y}px, 0) scale(2)`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      willChange: 'transform',
                      transition: 'none'
                    } : {}}
                    onClick={handleImageClick}
                    onMouseDown={handleMouseDown}
                    onDoubleClick={() => {
                      setIsZoomed(false);
                      setZoomPosition({ x: 0, y: 0 });
                    }}
                    loading="lazy"
                  />
                  {/* Exit fullscreen button - inside image container */}
                  {isFullscreen && (
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (document.exitFullscreen) {
                          document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) {
                          document.webkitExitFullscreen();
                        } else if (document.msExitFullscreen) {
                          document.msExitFullscreen();
                        }
                      }}
                      className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-110 active:scale-95"
                      title="Salir de pantalla completa (ESC)"
                      style={{ zIndex: 9999 }}
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              {/* Zoom and Fullscreen indicators */}
              {currentItem && currentItem.type === 'image' && !isZoomed && (
                <>
                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                    Click para ampliar
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const container = document.getElementById(`portfolio-image-container-${currentItem._id}`);
                      if (container) {
                        if (container.requestFullscreen) {
                          container.requestFullscreen();
                        } else if (container.webkitRequestFullscreen) {
                          container.webkitRequestFullscreen();
                        } else if (container.msRequestFullscreen) {
                          container.msRequestFullscreen();
                        }
                      }
                    }}
                    className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg hover:bg-black/90 transition-colors"
                    title="Ver en pantalla completa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Pantalla completa
                  </button>
                </>
              )}
              
              {isZoomed && (
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                  Doble click para restaurar
                </div>
              )}

              {/* Category badge */}
              {currentItem && currentItem.category && (
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                  {currentItem.category}
                </div>
              )}

              {/* Type badge */}
              {currentItem && (
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <span>{currentItem.type === 'video' ? '🎥' : '📷'}</span>
                  <span>{currentItem.type === 'video' ? 'Video' : 'Imagen'}</span>
                </div>
              )}
            </div>

            {/* Navigation arrows - Outside media container */}
            {filteredPortfolio.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                  aria-label="Anterior"
                  title="Anterior (←)"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                  aria-label="Siguiente"
                  title="Siguiente (→)"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Caption and Date */}
          {currentItem && (currentItem.caption || currentItem.uploadedAt) && (
            <div className="px-4 sm:px-6 py-3 space-y-1.5 shrink-0 border-t bg-gray-50">
              {currentItem.caption && (
                <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{currentItem.caption}</p>
              )}
              {currentItem.uploadedAt && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">
                    Subido el {new Date(currentItem.uploadedAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {filteredPortfolio.length > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 shrink-0">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {filteredPortfolio.map((item, index) => (
                <button
                  key={item._id || index}
                  onClick={() => setSelectedIndex(index)}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                    index === selectedIndex
                      ? 'border-brand-600 ring-2 ring-brand-200 shadow-md'
                      : 'border-gray-300 hover:border-brand-400'
                  }`}
                  aria-label={`Ver elemento ${index + 1}`}
                >
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <img
                        src={item.url.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg')}
                        alt={`Video thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Si falla la carga del thumbnail, usar gradiente con ícono
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-linear-to-br from-blue-500 to-purple-600 items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-2xl" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                      </div>
                      <div className="absolute top-1 right-1 bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">VIDEO</div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="hidden sm:flex px-6 py-3 border-t justify-center items-center shrink-0 bg-white">
          <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono shadow-sm">←</kbd>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono shadow-sm">→</kbd>
              <span>Navegar</span>
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono shadow-sm">Esc</kbd>
              <span>Cerrar</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

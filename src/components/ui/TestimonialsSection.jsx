import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import api from '@/state/apiClient.js';
import ImageZoomModal from './ImageZoomModal.jsx';
import ProviderProfileModal from './ProviderProfileModal.jsx';

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }) => {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizes[size]} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ testimonial }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'es';

  const isProvider = testimonial.userRole === 'provider';

  // Get translated comment (review about provider for clients, review about client for providers)
  const getComment = () => {
    if (testimonial.translations?.[currentLang]?.comment) {
      return testimonial.translations[currentLang].comment;
    }
    return testimonial.review?.comment || '';
  };

  const getPlatformComment = () => {
    if (testimonial.platformFeedback?.translations?.[currentLang]?.comment) {
      return testimonial.platformFeedback.translations[currentLang].comment;
    }
    return testimonial.platformFeedback?.comment || '';
  };

  const comment = getComment();
  const platformComment = getPlatformComment();
  
  // Platform rating
  const platformRating = testimonial.platformFeedback?.rating;
  
  // For providers: rating they gave to the client
  const clientRating = isProvider ? (testimonial.rating?.overall || null) : null;

  // Role badge colors
  const roleBadgeStyles = isProvider
    ? 'bg-linear-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200'
    : 'bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200';

  const roleIcon = isProvider ? (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  );

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Header: User Identity (Social Card Style) */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar */}
          {testimonial.userAvatar ? (
            <img 
              src={testimonial.userAvatar} 
              alt={testimonial.userName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ring-2 ring-gray-100 ${isProvider ? 'bg-linear-to-br from-purple-400 to-indigo-500' : 'bg-linear-to-br from-emerald-400 to-teal-500'}`}>
              {testimonial.userName?.charAt(0) || (isProvider ? 'P' : 'C')}
            </div>
          )}
          {/* Name and Role */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">{testimonial.userName}</p>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeStyles}`}>
              {roleIcon}
              <span>{isProvider ? t('testimonials.verifiedProvider') : t('testimonials.verifiedClient')}</span>
            </div>
          </div>
        </div>

        {/* For Clients: Show their review/rating about the provider */}
        {!isProvider && comment && (
          <div className="mb-3 rounded-lg p-3 border bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                </svg>
                <span className="text-xs font-semibold text-emerald-700">
                  {t('testimonials.aboutProvider', { name: testimonial.providerName || t('testimonials.roleProvider') })}
                </span>
              </div>
              {testimonial.rating?.overall && (
                <div className="flex items-center gap-1">
                  <StarRating rating={testimonial.rating.overall} size="xs" />
                  <span className="text-xs font-medium text-emerald-700">{testimonial.rating.overall.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 italic line-clamp-2">
              "{comment}"
            </p>
          </div>
        )}

        {/* For Providers: Show their review/rating about the client */}
        {isProvider && comment && (
          <div className="mb-3 rounded-lg p-3 border bg-linear-to-r from-amber-50 to-orange-50 border-amber-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="text-xs font-semibold text-amber-700">
                  {t('testimonials.aboutClient', { name: testimonial.clientName || t('testimonials.roleClient') })}
                </span>
              </div>
              {clientRating && (
                <div className="flex items-center gap-1">
                  <StarRating rating={clientRating} size="xs" />
                  <span className="text-xs font-medium text-amber-700">{clientRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 italic line-clamp-2">
              "{comment}"
            </p>
          </div>
        )}

        {/* Platform Feedback (main content for provider testimonials, optional for clients) */}
        {testimonial.hasPlatformFeedback && platformComment && (
          <div className={`mb-3 rounded-lg p-3 border ${isProvider ? 'bg-linear-to-r from-purple-50 to-indigo-50 border-purple-100' : 'bg-linear-to-r from-brand-50 to-cyan-50 border-brand-100'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <svg className={`w-4 h-4 ${isProvider ? 'text-purple-600' : 'text-brand-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className={`text-xs font-semibold ${isProvider ? 'text-purple-700' : 'text-brand-700'}`}>
                  {t('testimonials.aboutNovoFix')}
                </span>
              </div>
              {platformRating && (
                <div className="flex items-center gap-1">
                  <StarRating rating={platformRating} size="xs" />
                  <span className={`text-xs font-medium ${isProvider ? 'text-purple-700' : 'text-brand-700'}`}>{platformRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 italic line-clamp-2">
              "{platformComment}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Testimonials Carousel Component - Auto-scroll horizontal with pause on hover/touch
// Optimized for mobile touch interactions
const TestimonialsCarousel = ({ testimonials, onImageClick }) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const lastTimeRef = useRef(0);
  
  // Refs for touch/drag handling (using refs to avoid stale closures)
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false); // Track if significant drag occurred (to prevent click)
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const lastTouchXRef = useRef(0);
  const velocityRef = useRef(0);
  const momentumAnimRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  
  // Auto-scroll speed (pixels per frame at 60fps) - Higher = faster
  const scrollSpeed = 1.2;

  // Pause auto-scroll temporarily (e.g., after user interaction)
  const pauseAutoScroll = useCallback((duration = 3000) => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, duration);
  }, []);

  // Cleanup pause timeout
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const shouldAnimate = scrollRef.current && !isHovering && !isDraggingRef.current && !isPaused && testimonials.length > 1;
    
    if (!shouldAnimate) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }

    const animate = (currentTime) => {
      // Check again inside animation loop
      if (isDraggingRef.current || isPaused || isHovering) {
        animationRef.current = null;
        lastTimeRef.current = 0;
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const container = scrollRef.current;
      if (container) {
        // Scroll from left to right
        container.scrollLeft += scrollSpeed * (deltaTime / 16.67); // Normalize to 60fps
        
        // Reset to beginning when reaching the end (infinite loop)
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll) {
          container.scrollLeft = 0;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isHovering, isPaused, testimonials.length]);

  // Momentum scrolling after touch release
  const applyMomentum = useCallback(() => {
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
    }

    const decelerate = () => {
      const container = scrollRef.current;
      if (!container || Math.abs(velocityRef.current) < 0.5) {
        velocityRef.current = 0;
        return;
      }

      container.scrollLeft -= velocityRef.current;
      velocityRef.current *= 0.95; // Friction

      // Wrap around for infinite scroll
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft <= 0) {
        container.scrollLeft = maxScroll;
      } else if (container.scrollLeft >= maxScroll) {
        container.scrollLeft = 0;
      }

      momentumAnimRef.current = requestAnimationFrame(decelerate);
    };

    momentumAnimRef.current = requestAnimationFrame(decelerate);
  }, []);

  // Mouse handlers for desktop drag scrolling
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollRef.current?.scrollLeft || 0;
    lastTouchXRef.current = e.pageX;
    velocityRef.current = 0;
    
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    
    const x = e.pageX;
    const delta = x - lastTouchXRef.current;
    velocityRef.current = delta;
    lastTouchXRef.current = x;
    
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    applyMomentum();
    pauseAutoScroll(3000);
    setTimeout(() => { hasDraggedRef.current = false; }, 100);
  }, [applyMomentum, pauseAutoScroll]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
      applyMomentum();
      pauseAutoScroll(3000);
    }
  }, [applyMomentum, pauseAutoScroll]);

  // Global mouseup listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        applyMomentum();
        pauseAutoScroll(3000);
        setTimeout(() => { hasDraggedRef.current = false; }, 100);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [applyMomentum, pauseAutoScroll]);

  // Touch handlers for mobile - using refs to avoid stale closures
  const handleTouchStart = useCallback((e) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    scrollLeftRef.current = scrollRef.current?.scrollLeft || 0;
    lastTouchXRef.current = touch.clientX;
    velocityRef.current = 0;
    
    // Stop any ongoing momentum
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
      momentumAnimRef.current = null;
    }
    
    // Stop auto-scroll immediately
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    
    const touch = e.touches[0];
    const x = touch.clientX;
    const delta = x - lastTouchXRef.current;
    velocityRef.current = delta * 0.8; // Dampen velocity for smoother feel
    lastTouchXRef.current = x;
    
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    
    // Prevent page scroll when dragging horizontally
    if (Math.abs(walk) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    applyMomentum();
    pauseAutoScroll(4000); // Longer pause after touch
    setTimeout(() => { hasDraggedRef.current = false; }, 100);
  }, [applyMomentum, pauseAutoScroll]);

  // Scroll wheel handler for horizontal scrolling
  const handleWheel = useCallback((e) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
      pauseAutoScroll(2000);
    }
  }, [pauseAutoScroll]);

  // Register wheel and touch events with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Wheel event
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events - MUST be passive: false to allow preventDefault on mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!testimonials || testimonials.length === 0) return null;

  // Duplicate testimonials for seamless infinite scroll
  const displayTestimonials = testimonials.length < 6 
    ? [...testimonials, ...testimonials, ...testimonials] // Triple for small sets
    : [...testimonials, ...testimonials]; // Double for larger sets

  return (
    <div className="mb-10" ref={containerRef}>
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
        </svg>
        {t('testimonials.userReviews')}
      </h3>
      
      {/* Carousel Container */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing select-none"
        style={{ 
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        {displayTestimonials.map((testimonial, index) => (
          <div 
            key={`${testimonial._id}-${index}`}
            className="shrink-0 w-[320px] sm:w-[350px] md:w-[380px]"
          >
            <TestimonialCard 
              testimonial={testimonial}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlays to indicate more content */}
      <div className="relative -mt-4 h-4 pointer-events-none">
        <div className="absolute left-0 top-0 w-16 h-full bg-linear-to-r from-white to-transparent"></div>
        <div className="absolute right-0 top-0 w-16 h-full bg-linear-to-l from-white to-transparent"></div>
      </div>

      {/* Scroll hint text */}
      <p className="text-center text-xs text-gray-400 mt-2">
        {t('testimonials.scrollHint')}
      </p>
    </div>
  );
};

// Work Photo Gallery Component - Galería de Trabajos Realizados
// Incluye: reseñas de clientes, reseñas de profesionales, portafolio y evidencias
// Agrupados por procedencia con opción de ver perfil del proveedor
// Optimized for mobile touch interactions with horizontal scroll
const WorkPhotoGallery = ({ photos, onImageClick, onViewProfile }) => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const lastTimeRef = useRef(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const currentLang = i18n.language?.split('-')[0] || 'es';
  const initializedRef = useRef(false);
  
  // Refs for touch/drag handling (using refs to avoid stale closures)
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false); // Track if significant drag occurred (to prevent click)
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const lastTouchXRef = useRef(0);
  const velocityRef = useRef(0);
  const momentumAnimRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  
  // Auto-scroll speed (pixels per frame at 60fps) - Higher = faster
  const scrollSpeed = 1.2;

  // Pause auto-scroll temporarily (e.g., after user interaction)
  const pauseAutoScroll = useCallback((duration = 3000) => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, duration);
  }, []);

  // Cleanup pause timeout
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      if (momentumAnimRef.current) {
        cancelAnimationFrame(momentumAnimRef.current);
      }
    };
  }, []);

  // Initialize scroll position to end (for right-to-left scroll)
  useEffect(() => {
    if (!scrollRef.current || !photos || photos.length <= 1 || initializedRef.current) return;
    
    // Wait for DOM to be ready
    const initPosition = () => {
      const container = scrollRef.current;
      if (container && container.scrollWidth > container.clientWidth) {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
        initializedRef.current = true;
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is painted
    requestAnimationFrame(() => {
      requestAnimationFrame(initPosition);
    });
  }, [photos]);

  // Reset initialization when filter changes
  useEffect(() => {
    initializedRef.current = false;
  }, [activeFilter]);

  // Auto-scroll animation - RIGHT TO LEFT
  useEffect(() => {
    const shouldAnimate = scrollRef.current && !isHovering && !isDraggingRef.current && !isPaused && photos && photos.length > 1;
    
    if (!shouldAnimate) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }

    const animate = (currentTime) => {
      // Check again inside animation loop
      if (isDraggingRef.current || isPaused || isHovering) {
        animationRef.current = null;
        lastTimeRef.current = 0;
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const container = scrollRef.current;
      if (container) {
        // Scroll from right to left (decrement scrollLeft)
        container.scrollLeft -= scrollSpeed * (deltaTime / 16.67); // Normalize to 60fps
        
        // Reset to end when reaching the beginning (infinite loop)
        if (container.scrollLeft <= 0) {
          container.scrollLeft = container.scrollWidth - container.clientWidth;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isHovering, isPaused, photos?.length]);

  // Momentum scrolling after touch release
  const applyMomentum = useCallback(() => {
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
    }

    const decelerate = () => {
      const container = scrollRef.current;
      if (!container || Math.abs(velocityRef.current) < 0.5) {
        velocityRef.current = 0;
        return;
      }

      container.scrollLeft -= velocityRef.current;
      velocityRef.current *= 0.95; // Friction

      // Wrap around for infinite scroll
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft <= 0) {
        container.scrollLeft = maxScroll;
      } else if (container.scrollLeft >= maxScroll) {
        container.scrollLeft = 0;
      }

      momentumAnimRef.current = requestAnimationFrame(decelerate);
    };

    momentumAnimRef.current = requestAnimationFrame(decelerate);
  }, []);

  // Mouse handlers for desktop drag scrolling
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollRef.current?.scrollLeft || 0;
    lastTouchXRef.current = e.pageX;
    velocityRef.current = 0;
    
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    
    const x = e.pageX;
    const delta = x - lastTouchXRef.current;
    velocityRef.current = delta;
    lastTouchXRef.current = x;
    
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    applyMomentum();
    pauseAutoScroll(3000);
    setTimeout(() => { hasDraggedRef.current = false; }, 100);
  }, [applyMomentum, pauseAutoScroll]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
      applyMomentum();
      pauseAutoScroll(3000);
    }
  }, [applyMomentum, pauseAutoScroll]);

  // Global mouseup listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        applyMomentum();
        pauseAutoScroll(3000);
        setTimeout(() => { hasDraggedRef.current = false; }, 100);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [applyMomentum, pauseAutoScroll]);

  // Touch handlers for mobile - using refs to avoid stale closures
  const handleTouchStart = useCallback((e) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    scrollLeftRef.current = scrollRef.current?.scrollLeft || 0;
    lastTouchXRef.current = touch.clientX;
    velocityRef.current = 0;
    
    // Stop any ongoing momentum
    if (momentumAnimRef.current) {
      cancelAnimationFrame(momentumAnimRef.current);
      momentumAnimRef.current = null;
    }
    
    // Stop auto-scroll immediately
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    
    const touch = e.touches[0];
    const x = touch.clientX;
    const delta = x - lastTouchXRef.current;
    velocityRef.current = delta * 0.8; // Dampen velocity for smoother feel
    lastTouchXRef.current = x;
    
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    
    // Prevent page scroll when dragging horizontally
    if (Math.abs(walk) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    applyMomentum();
    pauseAutoScroll(4000); // Longer pause after touch
    setTimeout(() => { hasDraggedRef.current = false; }, 100);
  }, [applyMomentum, pauseAutoScroll]);

  // Scroll wheel handler
  const handleWheel = useCallback((e) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
      pauseAutoScroll(2000);
    }
  }, [pauseAutoScroll]);

  // Register wheel and touch events with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Wheel event
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events - MUST be passive: false to allow preventDefault on mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!photos || photos.length === 0) return null;

  // Configuración de colores y iconos por tipo de fuente
  const sourceConfig = {
    client_review: {
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      bgLight: 'bg-emerald-50',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )
    },
    provider_review: {
      color: 'amber',
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      bgLight: 'bg-amber-50',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
        </svg>
      )
    },
    portfolio: {
      color: 'purple',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      bgLight: 'bg-purple-50',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.44-6.19l-2.35 3.02-1.56-1.88c-.2-.25-.58-.24-.78.01l-1.74 2.23c-.26.33-.02.81.39.81h8.98c.41 0 .65-.47.4-.8l-2.55-3.39c-.19-.26-.59-.26-.79 0z"/>
        </svg>
      )
    },
    service_evidence: {
      color: 'blue',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      bgLight: 'bg-blue-50',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      )
    }
  };

  // Función para obtener el thumbnail de videos de Cloudinary
  const getThumbnailUrl = (photo) => {
    if (photo.type === 'video' && photo.url) {
      if (photo.url.includes('cloudinary.com') && photo.url.includes('/video/')) {
        return photo.url.replace('/video/upload/', '/video/upload/so_0,f_jpg,w_400,h_400,c_fill/');
      }
    }
    return photo.url;
  };

  // Función para detectar si es video
  const isVideo = (photo) => {
    return photo.type === 'video' || photo.url?.includes('/video/');
  };

  // Manejar click en la imagen/video
  const handleMediaClick = (photo, e) => {
    e.stopPropagation();
    onImageClick(photo.url, photo);
  };

  // Manejar click en ver perfil
  const handleProfileClick = (photo, e) => {
    e.stopPropagation();
    if (onViewProfile && photo.providerId) {
      onViewProfile(photo.providerId, photo);
    }
  };

  // Obtener la etiqueta de procedencia traducida
  const getSourceLabel = (photo) => {
    if (photo.sourceLabel) {
      return photo.sourceLabel[currentLang] || photo.sourceLabel.es || t(`testimonials.source.${photo.source}`);
    }
    return t(`testimonials.source.${photo.source}`, photo.source);
  };

  // Contar fotos por tipo de fuente
  const sourceCounts = photos.reduce((acc, photo) => {
    const source = photo.source || 'other';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  // Filtrar fotos según el filtro activo
  const filteredPhotos = activeFilter === 'all' 
    ? photos 
    : photos.filter(p => p.source === activeFilter);

  // Photos to display in carousel (duplicate for infinite scroll if needed)
  const displayPhotos = filteredPhotos.length < 8 
    ? [...filteredPhotos, ...filteredPhotos, ...filteredPhotos] 
    : filteredPhotos;

  // Opciones de filtro
  const filterOptions = [
    { key: 'all', label: t('testimonials.filter.all', 'Todos'), count: photos.length },
    { key: 'client_review', label: t('testimonials.filter.clientReviews', 'Reseñas de clientes'), count: sourceCounts.client_review || 0 },
    { key: 'portfolio', label: t('testimonials.filter.portfolio', 'Portafolio'), count: sourceCounts.portfolio || 0 },
    { key: 'service_evidence', label: t('testimonials.filter.evidence', 'Evidencias'), count: sourceCounts.service_evidence || 0 },
    { key: 'provider_review', label: t('testimonials.filter.providerReviews', 'Reseñas de profesionales'), count: sourceCounts.provider_review || 0 },
  ].filter(opt => opt.key === 'all' || opt.count > 0);

  return (
    <div className="mb-10">
      {/* Header con título */}
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {t('testimonials.workGallery')}
      </h3>

      {/* Filtros por procedencia */}
      {filterOptions.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map(option => {
            const config = sourceConfig[option.key] || { bgColor: 'bg-gray-500', textColor: 'text-gray-600' };
            const isActive = activeFilter === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive 
                    ? `${config.bgColor} text-white shadow-md` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.key !== 'all' && sourceConfig[option.key]?.icon}
                <span>{option.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Carousel de fotos/videos - Right to Left */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing select-none"
        style={{ 
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Duplicate photos for infinite scroll */}
        {[...displayPhotos, ...displayPhotos].map((photo, idx) => {
          const config = sourceConfig[photo.source] || sourceConfig.client_review;
          
          return (
            <div 
              key={`${photo.url}-${idx}`}
              className="shrink-0 w-[200px] sm:w-[220px] md:w-[250px] group relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Imagen o thumbnail de video - área clickeable */}
              <div 
                className="absolute inset-0"
                onClick={(e) => !hasDraggedRef.current && handleMediaClick(photo, e)}
              >
                <img 
                  src={getThumbnailUrl(photo)} 
                  alt={`${t('testimonials.work')} - ${photo.category}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                  draggable="false"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiPkltYWdlbjwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
              
              {/* Indicador de video */}
              {isVideo(photo) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 rounded-full p-3 group-hover:bg-black/80 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Badge de procedencia (esquina superior izquierda) */}
              <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.bgColor} shadow-md`}>
                {config.icon}
                <span className="hidden sm:inline max-w-20 truncate">{getSourceLabel(photo)}</span>
              </div>

              {/* Overlay con información del proveedor */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                  {/* Avatar del proveedor */}
                  {photo.providerAvatar ? (
                    <img 
                      src={photo.providerAvatar} 
                      alt={photo.providerName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/50">
                      {photo.providerName?.charAt(0) || 'P'}
                    </div>
                  )}
                  
                  {/* Info del proveedor */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{photo.providerName}</p>
                    <div className="flex items-center gap-1">
                      <StarRating rating={photo.rating || 5} size="xs" />
                      <span className="text-white/70 text-xs truncate">{t(`home.categories.${photo.category}`, photo.category)}</span>
                    </div>
                  </div>

                  {/* Botón ver perfil */}
                  {photo.providerId && onViewProfile && (
                    <button
                      onClick={(e) => handleProfileClick(photo, e)}
                      className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors"
                      title={t('testimonials.viewProfile', 'Ver perfil')}
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

      {/* Gradient overlays to indicate more content */}
      <div className="relative -mt-4 h-4 pointer-events-none">
        <div className="absolute left-0 top-0 w-16 h-full bg-linear-to-r from-white to-transparent"></div>
        <div className="absolute right-0 top-0 w-16 h-full bg-linear-to-l from-white to-transparent"></div>
      </div>

      {/* Scroll hint text */}
      <p className="text-center text-xs text-gray-400 mt-2">
        {t('testimonials.scrollHintGallery')}
      </p>
    </div>
  );
};

// Main Testimonials Section Component
function TestimonialsSection() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState([]);
  const [workPhotos, setWorkPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState(null);
  const [selectedMediaData, setSelectedMediaData] = useState(null);
  // Estado para el modal de perfil del proveedor
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loadingProvider, setLoadingProvider] = useState(false);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await api.get('/guest/testimonials/featured', {
          params: { limit: 20 }
        });
        if (data?.data) {
          setTestimonials(data.data.testimonials || []);
          setWorkPhotos(data.data.workPhotos || []);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const handleImageClick = (url, photoData = null) => {
    setZoomImage(url);
    setSelectedMediaData(photoData);
  };

  // Manejar click en ver perfil del proveedor
  const handleViewProfile = async (providerId, photoData) => {
    if (!providerId) return;
    
    setLoadingProvider(true);
    try {
      // Obtener datos completos del proveedor
      const { data } = await api.get(`/guest/providers/${providerId}`);
      if (data?.data?.provider) {
        setSelectedProvider(data.data.provider);
      }
    } catch (error) {
      console.error('Error fetching provider profile:', error);
      // Mostrar datos básicos si falla la carga completa
      if (photoData) {
        setSelectedProvider({
          _id: providerId,
          profile: { firstName: photoData.providerName, avatar: photoData.providerAvatar },
          providerProfile: {
            businessName: photoData.providerName,
            rating: { average: photoData.rating || 0 },
            services: [{ category: photoData.category }]
          }
        });
      }
    } finally {
      setLoadingProvider(false);
    }
  };

  const isEmpty = !loading && testimonials.length === 0 && workPhotos.length === 0;

  return (
    <div id="testimonials-section" className="py-8 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-linear-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-full border border-amber-200 mb-4">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span className="text-sm font-semibold text-amber-700">{t('testimonials.badge')}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {t('testimonials.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('testimonials.subtitle')}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
            <p className="text-gray-500">{t('testimonials.loading')}</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {isEmpty ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('testimonials.emptyTitle')}</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">{t('testimonials.emptySubtitle')}</p>
            </div>
          ) : (
            <>
              {/* Testimonials Carousel - Opiniones de usuarios primero */}
              {testimonials.length > 0 && (
                <TestimonialsCarousel 
                  testimonials={testimonials}
                  onImageClick={handleImageClick}
                />
              )}

              {/* Work Photos Gallery - Galería después */}
              <WorkPhotoGallery 
                photos={workPhotos} 
                onImageClick={handleImageClick}
                onViewProfile={handleViewProfile}
              />
            </>
          )}

          {/* Platform Impact Stats */}
          <div className="mt-12 bg-linear-to-br from-brand-50 via-white to-cyan-50 rounded-2xl p-8 border border-brand-100">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('testimonials.platformImpact')}</h3>
              <p className="text-gray-600">{t('testimonials.platformImpactDesc')}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">98%</p>
                <p className="text-sm text-gray-600">{t('testimonials.stat1')}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-linear-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">&lt;2h</p>
                <p className="text-sm text-gray-600">{t('testimonials.stat2')}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-linear-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-sm text-gray-600">{t('testimonials.stat3')}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-linear-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">1000+</p>
                <p className="text-sm text-gray-600">{t('testimonials.stat4')}</p>
              </div>
            </div>
          </div>

          {/* Botón Ver más - Enlace a sección de misión/visión */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => {
                const missionSection = document.getElementById('mission-vision-section');
                if (missionSection) {
                  missionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="group flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/50 rounded-full px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-xl bg-linear-to-r from-brand-500 to-brand-600 text-white shadow-lg"
              aria-label={t('testimonials.viewMissionVision')}
            >
              <span className="text-sm font-semibold group-hover:text-white transition-colors">
                {t('testimonials.viewMissionVision')}
              </span>
              <svg 
                className="w-5 h-5 text-white animate-bounce transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <ImageZoomModal
          isOpen={!!zoomImage}
          onClose={() => {
            setZoomImage(null);
            setSelectedMediaData(null);
          }}
          imageUrl={zoomImage}
          alt={t('testimonials.workPhoto')}
          mediaData={selectedMediaData}
        />
      )}

      {/* Provider Profile Modal */}
      {selectedProvider && (
        <ProviderProfileModal
          isOpen={!!selectedProvider}
          onClose={() => setSelectedProvider(null)}
          provider={selectedProvider}
          initialTab="portfolio"
        />
      )}

      {/* Loading overlay para cargar perfil */}
      {loadingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

TestimonialCard.propTypes = {
  testimonial: PropTypes.object.isRequired
};

TestimonialsCarousel.propTypes = {
  testimonials: PropTypes.array.isRequired,
  onImageClick: PropTypes.func.isRequired
};

WorkPhotoGallery.propTypes = {
  photos: PropTypes.array,
  onImageClick: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func
};

export default TestimonialsSection;

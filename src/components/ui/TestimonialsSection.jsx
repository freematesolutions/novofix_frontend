import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import api from '@/state/apiClient.js';
import ImageZoomModal from './ImageZoomModal.jsx';

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
const TestimonialCard = ({ testimonial, onImageClick }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'es';

  const isProvider = testimonial.userRole === 'provider';

  // Get translated comment
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
  // Use allPhotos (combined from review.photos + booking evidence)
  const photos = testimonial.allPhotos || testimonial.review?.photos || [];
  const hasPhotos = photos.length > 0;

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
      {/* Photos Grid */}
      {hasPhotos && (
        <div className="relative">
          {photos.length === 1 ? (
            <div 
              className="aspect-4/3 cursor-pointer overflow-hidden"
              onClick={() => onImageClick(photos[0].url)}
            >
              <img 
                src={photos[0].url} 
                alt={t('testimonials.workPhoto')}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {photos.slice(0, 4).map((photo, idx) => (
                <div 
                  key={idx}
                  className="relative aspect-square cursor-pointer overflow-hidden"
                  onClick={() => onImageClick(photo.url)}
                >
                  <img 
                    src={photo.url} 
                    alt={`${t('testimonials.workPhoto')} ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  {idx === 3 && photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{photos.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Category badge */}
          {testimonial.providerServices?.[0]?.category && (
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-md">
              <span className="text-xs font-medium text-gray-700">
                {t(`home.categories.${testimonial.providerServices[0].category}`, testimonial.providerServices[0].category)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Role Badge + Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadgeStyles}`}>
            {roleIcon}
            <span>{isProvider ? t('testimonials.roleProvider') : t('testimonials.roleClient')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StarRating rating={testimonial.rating?.overall || testimonial.platformFeedback?.rating || 5} size="sm" />
            <span className="text-sm font-medium text-gray-700">
              {(testimonial.rating?.overall || testimonial.platformFeedback?.rating || 5).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Review Comment (for clients reviewing providers) */}
        {!isProvider && comment && (
          <div className="mb-3">
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
              "{comment}"
            </p>
          </div>
        )}

        {/* Platform Feedback (main content for provider testimonials, optional for clients) */}
        {testimonial.hasPlatformFeedback && platformComment && (
          <div className={`mb-3 rounded-lg p-3 border ${isProvider ? 'bg-linear-to-r from-purple-50 to-indigo-50 border-purple-100' : 'bg-linear-to-r from-brand-50 to-cyan-50 border-brand-100'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <svg className={`w-4 h-4 ${isProvider ? 'text-purple-600' : 'text-brand-600'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className={`text-xs font-semibold ${isProvider ? 'text-purple-700' : 'text-brand-700'}`}>
                {t('testimonials.aboutNovoFix')}
              </span>
            </div>
            <p className="text-xs text-gray-600 italic line-clamp-2">
              "{platformComment}"
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Footer: User info */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* User who left the testimonial */}
            <div className="flex items-center gap-2">
              {testimonial.userAvatar ? (
                <img 
                  src={testimonial.userAvatar} 
                  alt={testimonial.userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isProvider ? 'bg-linear-to-br from-purple-400 to-indigo-500' : 'bg-linear-to-br from-gray-400 to-gray-500'}`}>
                  {testimonial.userName?.charAt(0) || (isProvider ? 'P' : 'C')}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{testimonial.userName}</p>
                <p className="text-xs text-gray-500">
                  {isProvider ? t('testimonials.verifiedProvider') : t('testimonials.verifiedClient')}
                </p>
              </div>
            </div>

            {/* Provider info (for client testimonials with work photos) */}
            {!isProvider && hasPhotos && testimonial.providerName && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('testimonials.serviceBy')}</p>
                <p className="text-xs font-medium text-brand-600">{testimonial.providerName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Work Photo Gallery Component
const WorkPhotoGallery = ({ photos, onImageClick }) => {
  const { t } = useTranslation();
  const [visiblePhotos, setVisiblePhotos] = useState(8);

  if (!photos || photos.length === 0) return null;

  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {t('testimonials.workGallery')}
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.slice(0, visiblePhotos).map((photo, idx) => (
          <div 
            key={idx}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => onImageClick(photo.url)}
          >
            <img 
              src={photo.url} 
              alt={`${t('testimonials.work')} - ${photo.category}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium truncate">{photo.providerName}</p>
                <div className="flex items-center gap-1">
                  <StarRating rating={photo.rating || 5} size="xs" />
                  <span className="text-white/80 text-xs">{t(`home.categories.${photo.category}`, photo.category)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {photos.length > visiblePhotos && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisiblePhotos(prev => prev + 8)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            <span>{t('testimonials.showMore')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
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

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await api.get('/guest/testimonials/featured', {
          params: { limit: 12 }
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

  const handleImageClick = (url) => {
    setZoomImage(url);
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
              {/* Testimonials Grid - Opiniones de usuarios primero */}
              {testimonials.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                    </svg>
                    {t('testimonials.userReviews')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.slice(0, 6).map((testimonial) => (
                      <TestimonialCard 
                        key={testimonial._id} 
                        testimonial={testimonial}
                        onImageClick={handleImageClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Work Photos Gallery - Galería después */}
              <WorkPhotoGallery photos={workPhotos} onImageClick={handleImageClick} />
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
          onClose={() => setZoomImage(null)}
          imageUrl={zoomImage}
          alt={t('testimonials.workPhoto')}
        />
      )}
    </div>
  );
}

TestimonialCard.propTypes = {
  testimonial: PropTypes.object.isRequired,
  onImageClick: PropTypes.func.isRequired
};

WorkPhotoGallery.propTypes = {
  photos: PropTypes.array,
  onImageClick: PropTypes.func.isRequired
};

export default TestimonialsSection;

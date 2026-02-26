import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import ProviderProfileModal from './ProviderProfileModal.jsx';
import PortfolioModal from './PortfolioModal.jsx';

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

function FeaturedProviderCard({ provider, onViewProfile }) {
  const { t } = useTranslation();
  const [showProfile, setShowProfile] = useState(false);
  const [showPortfolioGallery, setShowPortfolioGallery] = useState(false);

  // Función helper para generar thumbnail URL de videos de Cloudinary
  const getVideoThumbnailUrl = (videoUrl) => {
    // Si la URL contiene 'cloudinary', usar transformaciones de Cloudinary
    if (videoUrl.includes('cloudinary')) {
      // Extraer la parte de upload y agregar transformación para thumbnail
      // Formato: https://res.cloudinary.com/cloud_name/video/upload/v123/folder/file.mp4
      // Convertir a: https://res.cloudinary.com/cloud_name/video/upload/so_0,f_jpg,w_300,h_300,c_fill/v123/folder/file.mp4
      return videoUrl.replace(
        /\/upload\/(v\d+\/)?/,
        '/upload/so_0,f_jpg,w_300,h_300,c_fill/$1'
      );
    }
    // Fallback: reemplazar extensión de video por .jpg
    return videoUrl.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
  };

  // Extract provider data
  const businessName = provider.providerProfile?.businessName || provider.profile?.firstName || t('home.featuredProviders.professional');
  const businessDescription = provider.providerProfile?.description || provider.providerProfile?.businessDescription || '';
  const rating = provider.providerProfile?.rating?.average || 0;
  const reviewCount = provider.providerProfile?.rating?.count || 0;
  const services = provider.providerProfile?.services || [];
  const profileImage = provider.profile?.avatar || null;
  const portfolio = provider.providerProfile?.portfolio || [];
  const score = provider.score?.total || provider.score || 0;
  const stats = provider.providerProfile?.stats || {};
  const completedJobs = stats.completedJobs || 0;

  // Handle portfolio click
  const handlePortfolioClick = (e) => {
    e.stopPropagation();
    setShowPortfolioGallery(true);
  };

  // Handle card click
  const handleCardClick = () => {
    setShowProfile('about');
    onViewProfile?.(provider);
  };

  return (
    <>
      {/* Featured Provider Card */}
      <div 
        onClick={handleCardClick}
        className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col"
      >
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-brand-400 via-brand-500 to-brand-500"></div>

        {/* Header Section with Avatar and Badges */}
        <div className="relative p-5 pb-3">
          {/* Plan & Score Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {score > 0 && (
              <div className="flex items-center gap-1 bg-brand-50 text-brand-600 px-2 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-xs font-bold">{typeof score === 'number' ? score.toFixed(1) : score}</span>
              </div>
            )}
          </div>

          {/* Avatar and Name */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={businessName}
                  className="w-18 h-18 rounded-xl object-cover ring-2 ring-brand-400 ring-offset-2 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-18 h-18 rounded-xl bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-brand-400 ring-offset-2">
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Verified badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                {businessName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <StarRating rating={rating} size="xs" />
                <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviewCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Service Badge - Only show primary service highlighted */}
        {services.length > 0 && services[0]?.category && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-linear-to-r from-brand-500 to-brand-600 text-white shadow-sm">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {t(`home.categories.${services[0].category}`, services[0].category)}
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="px-5 pb-3">
          {businessDescription ? (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {businessDescription}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {t('ui.providerCard.noDescription')}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-600">
                <b className="text-gray-900">{completedJobs}</b> {t('ui.providerCard.hires')}
              </span>
            </div>
            {portfolio.length > 0 && (
              <button
                onClick={handlePortfolioClick}
                className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-dark-700 font-medium">{portfolio.length} {t('home.featuredProviders.works')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Portfolio Preview */}
        {portfolio.length > 0 && (
          <div className="px-5 pb-3">
            <button
              onClick={handlePortfolioClick}
              className="w-full"
            >
              <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                {portfolio.slice(0, 3).map((item, idx) => {
                  // Generar URL del thumbnail para videos usando transformaciones de Cloudinary
                  const thumbnailUrl = item.type === 'video' 
                    ? getVideoThumbnailUrl(item.url)
                    : item.url;
                  
                  return (
                    <div key={idx} className="relative aspect-square bg-gray-100 overflow-hidden group/img">
                      <img 
                        src={thumbnailUrl} 
                        alt={item.caption || `${t('home.featuredProviders.work')} ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback si no se puede cargar el thumbnail
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback para cuando falla la carga del thumbnail */}
                      <div className="hidden w-full h-full bg-linear-to-br from-gray-300 to-gray-400 items-center justify-center absolute inset-0">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      {/* Indicador de video */}
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      {idx === 2 && portfolio.length > 3 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">+{portfolio.length - 3}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-5 pt-2 mt-auto border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfile('about');
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-linear-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('home.featuredProviders.viewProfile')}
          </button>
        </div>

        {/* Hover arrow indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Modals */}
      <ProviderProfileModal
        isOpen={!!showProfile}
        onClose={() => setShowProfile(false)}
        provider={provider}
        initialTab={typeof showProfile === 'string' ? showProfile : 'about'}
      />

      {showPortfolioGallery && portfolio.length > 0 && (
        <PortfolioModal
          isOpen={showPortfolioGallery}
          onClose={() => setShowPortfolioGallery(false)}
          portfolio={portfolio}
          providerName={businessName}
        />
      )}
    </>
  );
}

FeaturedProviderCard.propTypes = {
  provider: PropTypes.object.isRequired,
  onViewProfile: PropTypes.func
};

export default FeaturedProviderCard;

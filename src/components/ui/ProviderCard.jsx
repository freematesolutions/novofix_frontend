import { useState } from 'react';
import PropTypes from 'prop-types';
import ProviderProfileModal from './ProviderProfileModal.jsx';
import RequestWizardModal from './RequestWizardModal.jsx';
import ImageZoomModal from './ImageZoomModal.jsx';
import { useAuth } from '@/state/AuthContext.jsx';

// Star Rating Component
const StarRating = ({ rating, size = 'sm', dataNavSection }) => {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5' };
  return (
    <div 
      className="flex items-center gap-0.5"
      data-nav-section={dataNavSection}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizes[size]} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          data-nav-section={dataNavSection}
        >
          <path 
            data-nav-section={dataNavSection}
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
          />
        </svg>
      ))}
    </div>
  );
};

// Plan badge configuration
const planConfig = {
  pro: { 
    label: 'PRO', 
    gradient: 'bg-linear-to-r from-purple-500 to-purple-700',
    icon: '👑',
    ring: 'ring-purple-400'
  },
  basic: { 
    label: 'BASIC', 
    gradient: 'bg-linear-to-r from-blue-500 to-blue-600',
    icon: '⭐',
    ring: 'ring-blue-400'
  },
  free: { 
    label: 'FREE', 
    gradient: 'bg-gray-200 text-gray-700',
    icon: '✨',
    ring: 'ring-gray-300'
  }
};

function ProviderCard({ provider, onSelect, onViewPortfolio }) {
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [blockCardClicks, setBlockCardClicks] = useState(false);
  const { isAuthenticated, viewRole } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  
  // Extract provider data
  const businessName = provider.providerProfile?.businessName || provider.profile?.firstName || 'Profesional';
  const rating = provider.providerProfile?.rating?.average || 0;
  const reviewCount = provider.providerProfile?.rating?.count || 0;
  const plan = provider.subscription?.plan || 'free';
  const services = provider.providerProfile?.services || [];
  const profileImage = provider.profile?.avatar || null;
  const portfolio = provider.providerProfile?.portfolio || [];
  const score = provider.score?.total || provider.score || 0;
  const stats = provider.providerProfile?.stats || {};
  const completedJobs = stats.completedJobs || 0;
  const responseRate = stats.responseRate || 0;
  
  const planInfo = planConfig[plan] || planConfig.free;

  // Handler único que maneja TODOS los clicks usando onClickCapture
  const handleCardClickCapture = (e) => {
    if (blockCardClicks) {
      e.stopPropagation();
      return;
    }
    // Click en avatar: ampliar imagen
    const avatarImg = e.target.closest('[data-avatar-img]');
    if (avatarImg) {
      e.stopPropagation();
      setBlockCardClicks(true);
      setShowImageZoom(true);
      return;
    }
    // Buscar si el click fue en un elemento con data-nav-section
    const navElement = e.target.closest('[data-nav-section]');
    if (navElement) {
      const section = navElement.getAttribute('data-nav-section');
      e.stopPropagation();
      setShowProfile(section);
      return;
    }
    // Verificar si es el botón de contacto
    const contactBtn = e.target.closest('[data-action="contact"]');
    if (contactBtn) {
      e.stopPropagation();
      if (!isAuthenticated) {
        alert('Debes iniciar sesión como cliente para contactar proveedores');
        return;
      }
      if (viewRole !== 'client') {
        alert('Solo los clientes pueden enviar solicitudes a proveedores');
        return;
      }
      setShowRequestWizard(true);
      return;
    }
    // Click en área general - ir a about
    setShowProfile('about');
    onSelect?.(provider);
  };

  return (
    <>
      {/* Modern Provider Card */}
      <div 
        onClickCapture={handleCardClickCapture}
        className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 cursor-pointer overflow-hidden w-full max-w-2xl min-w-65 min-h-80 max-h-105 mx-auto"
      >
        {/* Plan badge + Score/Rating: estático en móviles, absoluto en sm+ */}
        <div className="flex items-center gap-2 z-10 mt-2 mb-2 justify-center sm:justify-end sm:absolute sm:top-4 sm:right-4 sm:mt-0 sm:mb-0">
          {/* Score badge */}
          {score > 0 && (
            <div 
              data-nav-section="reviews"
              className="shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
              title="Ver reseñas"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-nav-section="reviews">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" data-nav-section="reviews" />
              </svg>
              <span className="text-sm font-bold" data-nav-section="reviews">{typeof score === 'number' ? score.toFixed(1) : score}</span>
            </div>
          )}
          {/* Plan badge */}
          <div 
            data-nav-section="reviews"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform ${planInfo.gradient}`}
            title="Ver reseñas"
          >
            <span className="text-xs">{planInfo.icon}</span>
            <span className={`text-xs font-bold ${plan === 'free' ? '' : 'text-white'}`}>{planInfo.label}</span>
          </div>
        </div>
        {/* Gradient top border on hover */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-brand-400 via-brand-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        
        {/* Card Content */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 w-full">
            {/* Avatar Section */}
            <div className="shrink-0 flex justify-center sm:block mb-2 sm:mb-0">
              {/* Avatar wrapper con relative para el badge */}
              <div className="relative inline-block">
                {/* Avatar */}
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={businessName}
                    data-avatar-img
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ${planInfo.ring} ring-offset-2 transition-transform duration-300 group-hover:scale-105 cursor-zoom-in`}
                    title="Ampliar imagen"
                  />
                ) : (
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold ring-2 ${planInfo.ring} ring-offset-2 transition-transform duration-300 group-hover:scale-105`}>
                    {businessName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Verified badge */}
                <div className="absolute -top-1 -left-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Header: nombre y rating en fila en sm+, columna en xs */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 mb-2 w-full">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors w-full">
                  {businessName}
                </h3>
                <div 
                  data-nav-section="reviews"
                  className="flex items-center gap-1 mt-1 xs:mt-0 cursor-pointer hover:bg-yellow-50 px-1.5 py-0.5 rounded-lg transition-colors"
                  title="Ver reseñas"
                >
                  <StarRating 
                    rating={rating} 
                    size="sm" 
                    dataNavSection="reviews"
                  />
                  <span 
                    data-nav-section="reviews"
                    className="text-xs sm:text-sm font-medium text-gray-700"
                  >
                    {rating.toFixed(1)}
                  </span>
                  <span 
                    data-nav-section="reviews"
                    className="text-xs sm:text-sm text-gray-400"
                  >
                    ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                {/* Completed jobs */}
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-600">
                    <b className="text-gray-900">{completedJobs}</b> contrataciones
                  </span>
                </div>

                {/* Response rate */}
                {responseRate > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-600">
                      <b className="text-gray-900">{responseRate}%</b> respuesta
                    </span>
                  </div>
                )}

                {/* Portfolio count */}
                {portfolio.length > 0 && (
                  <div 
                    data-nav-section="portfolio"
                    className="flex items-center gap-2 bg-linear-to-r from-purple-500 to-pink-500 px-3 py-2 rounded-xl cursor-pointer shadow-md hover:scale-105 hover:shadow-lg transition-all text-white font-semibold text-sm"
                    title="Explora mis trabajos"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Explora mis trabajos
                  </div>
                )}
              </div>

              {/* Services tags */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {services.slice(0, 2).map((service, idx) => (
                    <span 
                      key={idx}
                      data-nav-section="services"
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100 cursor-pointer hover:bg-brand-100 transition-colors"
                      title="Ver todos los servicios"
                    >
                      {service.category}
                    </span>
                  ))}
                  {services.length > 2 && (
                    <span 
                      data-nav-section="services"
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 cursor-pointer hover:bg-brand-100 hover:text-brand-700 transition-colors"
                      title="Ver todos los servicios"
                    >
                      +{services.length - 2} más
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-auto">
                {/* Contact price link */}
                <button
                  data-action="contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="underline underline-offset-2">Enviar Solicitud</span>
                </button>

                <span className="text-gray-300">|</span>

                {/* View profile button */}
                <button
                  data-nav-section="about"
                  className="inline-flex items-center gap-1.5 bg-linear-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Ver Perfil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hover arrow indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Modal de zoom de imagen del avatar (fuera del card) */}
      {profileImage && (
        <ImageZoomModal
          isOpen={showImageZoom}
          onClose={() => {
            setShowImageZoom(false);
            setTimeout(() => setBlockCardClicks(false), 100);
          }}
          imageUrl={profileImage}
          alt={businessName}
        />
      )}

      {/* Provider Profile Modal */}
      <ProviderProfileModal
        isOpen={!!showProfile}
        onClose={() => setShowProfile(false)}
        provider={provider}
        initialTab={typeof showProfile === 'string' ? showProfile : 'about'}
      />

      {/* Request Wizard Modal */}
      {showRequestWizard && (
        <RequestWizardModal
          provider={provider}
          isOpen={showRequestWizard}
          onClose={() => setShowRequestWizard(false)}
        />
      )}
    </>
  );
}

ProviderCard.propTypes = {
  provider: PropTypes.object.isRequired,
  onSelect: PropTypes.func,
  onViewPortfolio: PropTypes.func
};

export default ProviderCard;

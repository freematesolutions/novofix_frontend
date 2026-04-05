import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/utils/categoryImages.js';


function ServiceCategoryCard({ category, translatedName, translatedDescription, onClick, providerCount, disabled = false }) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Estado para mostrar overlay en móvil al tocar tarjeta inhabilitada
  const [tappedDisabled, setTappedDisabled] = useState(false);
  const imageUrl = CATEGORY_IMAGES[category] || FALLBACK_IMAGE;

  const handleClick = () => {
    if (disabled) {
      // Mostrar overlay en móvil al tocar
      setTappedDisabled(true);
      setTimeout(() => setTappedDisabled(false), 2500);
      return;
    }
    onClick(category);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl bg-white transition-all duration-500 flex flex-col ${
        disabled 
          ? 'cursor-not-allowed hover:-translate-y-2' 
          : 'cursor-pointer hover:-translate-y-2'
      }`}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
    >
      {/* Imagen de fondo con overlay */}
      <div className="relative h-64 sm:h-72 lg:h-80 overflow-hidden">
        {/* Skeleton mientras carga */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-linear-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse z-0" />
        )}
        <img
          src={imageError ? FALLBACK_IMAGE : imageUrl}
          alt={category}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (!imageError) {
              setImageError(true);
              setImageLoaded(false);
            } else {
              setImageLoaded(true);
            }
          }}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
        />
        
        {/* Overlay gradient oscuro */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"></div>

        {/* Overlay para tarjetas sin profesionales — aparece al hover/touch */}
        {disabled && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none
              ${tappedDisabled ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{
              background: 'linear-gradient(135deg, rgba(30,30,30,0.88) 0%, rgba(15,15,15,0.92) 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)'
            }}
          >
            {/* Icono de reloj / próximamente */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 ring-1 ring-white/20">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-accent-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {/* Mensaje */}
            <p className="text-white/90 text-center text-sm sm:text-base font-medium leading-tight px-6 max-w-[85%]">
              {t('home.carousel.disabledTooltip')}
            </p>
          </div>
        )}
        
        {/* Badge de contador flotante — solo para categorías con proveedores */}
        {providerCount !== undefined && providerCount > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">
                {providerCount}
              </span>
            </div>
          </div>
        )}

        {/* Título sobre la imagen — siempre 1 línea */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300 leading-tight wrap-break-word" title={translatedName}>
            {translatedName}
          </h3>
        </div>
      </div>

      {/* Contenido inferior — altura fija para uniformidad entre tarjetas */}
      <div className="flex flex-col p-5 sm:p-6 bg-white">
        {/* Descripción — mostrar completa en todas las resoluciones */}
        <p className="text-gray-600 text-sm sm:text-[0.95rem] leading-relaxed mb-4 wrap-break-word">
          {translatedDescription}
        </p>

        {/* Botón de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className={`font-semibold text-sm transition-colors ${
            disabled
              ? 'text-gray-400 group-hover:text-gray-500' 
              : 'text-brand-600 group-hover:text-brand-700'
          }`}>
            {disabled
              ? t('home.comingSoonAvailable')
              : t('home.viewProfessionals')}
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            disabled
              ? 'bg-gray-100 group-hover:bg-gray-200'
              : 'bg-brand-50 group-hover:bg-brand-600'
          }`}>
            <svg 
              className={`w-4 h-4 transition-all duration-300 ${
                disabled
                  ? 'text-gray-400'
                  : 'text-brand-600 group-hover:text-white group-hover:translate-x-1'
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={disabled ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 5l7 7-7 7'} />
            </svg>
          </div>
        </div>
      </div>

      {/* Borde animado en hover */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-colors duration-300 pointer-events-none ${
        disabled
          ? 'group-hover:border-gray-300' 
          : 'group-hover:border-brand-400'
      }`}></div>
    </div>
  );
}

ServiceCategoryCard.propTypes = {
  category: PropTypes.string.isRequired,
  translatedName: PropTypes.string.isRequired,
  translatedDescription: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  providerCount: PropTypes.number,
  disabled: PropTypes.bool
};

export default ServiceCategoryCard;

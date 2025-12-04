import { useState } from 'react';
import PropTypes from 'prop-types';
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/utils/categoryImages.js';

function ServiceCategoryCard({ category, description, onClick, providerCount }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = CATEGORY_IMAGES[category] || FALLBACK_IMAGE;

  return (
    <button
      onClick={() => onClick(category)}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-[420px] flex flex-col"
    >
      {/* Imagen de fondo con overlay */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageError ? FALLBACK_IMAGE : imageUrl}
          alt={category}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay gradient oscuro */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Badge de contador flotante */}
        {providerCount !== undefined && (
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

        {/* Título sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
            {category}
          </h3>
        </div>
      </div>

      {/* Contenido inferior */}
      <div className="flex-1 flex flex-col p-6 bg-white">
        {/* Descripción */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
          {description}
        </p>

        {/* Botón de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-brand-600 font-semibold text-sm group-hover:text-brand-700 transition-colors">
            Ver profesionales
          </span>
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-600 transition-all duration-300">
            <svg 
              className="w-4 h-4 text-brand-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Borde animado en hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-brand-400 transition-colors duration-300 pointer-events-none"></div>
    </button>
  );
}

ServiceCategoryCard.propTypes = {
  category: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  providerCount: PropTypes.number
};

export default ServiceCategoryCard;

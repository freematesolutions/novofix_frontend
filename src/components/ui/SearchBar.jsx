import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';

function SearchBar({ onSearch, variant = 'default' }) {
  const [textQuery, setTextQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    urgency: ''
  });
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Placeholder dinámico
  const placeholders = [
    'Necesito un plomero urgente...',
    'Busco electricista certificado...',
    'Reparar aire acondicionado...',
    'Servicio de limpieza profunda...',
    'Pintar mi departamento...',
    'Instalación de cerámica...'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotar placeholders
  useEffect(() => {
    if (textQuery) return; // No rotar si hay texto
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [textQuery, placeholders.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (textQuery.trim()) {
      onSearch({ type: 'text', query: textQuery });
    } else if (filters.category || filters.location || filters.urgency) {
      onSearch({ type: 'filters', filters });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const hasActiveFilters = filters.category || filters.location || filters.urgency;
  const isHeroVariant = variant === 'hero';

  return (
    <div className={`
      ${isHeroVariant 
        ? 'bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-xl shadow-2xl shadow-black/20 p-1.5 sm:p-2 lg:p-1.5 xl:p-2' 
        : 'bg-white rounded-xl border shadow-sm p-4 sm:p-6'
      }
      transition-all duration-300
      ${isFocused && isHeroVariant ? 'ring-4 ring-white/50 shadow-3xl transform scale-[1.02]' : ''}
    `}>
      <form onSubmit={handleSearch}>
        {/* Barra de búsqueda principal */}
        <div className={`
          flex items-center gap-1.5 sm:gap-2 lg:gap-1.5
          ${isHeroVariant ? 'bg-gray-50/80 rounded-lg sm:rounded-xl lg:rounded-lg p-1 sm:p-1.5 lg:p-1' : ''}
        `}>
          {/* Icono de búsqueda */}
          <div className={`
            ${isHeroVariant ? 'pl-1.5 sm:pl-2 lg:pl-1.5' : 'hidden'}
          `}>
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 transition-colors duration-300 ${
                isFocused ? 'text-brand-600' : 'text-gray-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input principal */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholders[placeholderIndex]}
              className={`
                w-full bg-transparent border-0 focus:ring-0 focus:outline-none
                ${isHeroVariant 
                  ? 'px-1.5 sm:px-2 lg:px-1.5 py-2 sm:py-3 lg:py-2 xl:py-2.5 text-sm sm:text-base lg:text-sm xl:text-base placeholder:text-gray-400' 
                  : 'px-4 py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-brand-500'
                }
                text-gray-900 font-medium
              `}
            />
            
            {/* Línea animada debajo del input */}
            {isHeroVariant && (
              <div className={`
                absolute bottom-0 left-0 h-0.5 bg-brand-500 transition-all duration-300 rounded-full
                ${isFocused ? 'w-full' : 'w-0'}
              `}></div>
            )}
          </div>

          {/* Separador vertical */}
          {isHeroVariant && (
            <div className="hidden sm:block w-px h-6 lg:h-5 bg-gray-300"></div>
          )}

          {/* Botón de filtros */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`
              flex items-center gap-1.5 font-medium transition-all duration-300 shrink-0
              ${isHeroVariant 
                ? `px-2 sm:px-3 lg:px-2 py-2 sm:py-3 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-lg ${
                    showAdvancedFilters || hasActiveFilters
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
                  }`
                : `px-3 sm:px-4 py-2.5 rounded-lg ${
                    showAdvancedFilters || hasActiveFilters
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border'
                  }`
              }
            `}
            title={showAdvancedFilters ? 'Ocultar filtros' : 'Mostrar filtros avanzados'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden sm:inline lg:hidden xl:inline text-xs sm:text-sm">Filtros</span>
            {hasActiveFilters && (
              <span className={`
                rounded-full w-2 h-2 
                ${isHeroVariant ? 'bg-brand-600' : 'bg-white'}
              `}></span>
            )}
          </button>

          {/* Separador vertical */}
          {isHeroVariant && (
            <div className="hidden sm:block w-px h-6 lg:h-5 bg-gray-300"></div>
          )}

          {/* Botón de búsqueda */}
          <button
            type="submit"
            className={`
              flex items-center justify-center gap-1.5 font-semibold transition-all duration-300 shrink-0
              ${isHeroVariant 
                ? 'bg-brand-600 hover:bg-brand-700 text-white px-3 sm:px-6 lg:px-3 xl:px-5 py-2 sm:py-3 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-lg shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 hover:scale-105 active:scale-95'
                : 'bg-brand-600 text-white px-4 sm:px-6 py-2.5 rounded-lg hover:bg-brand-700'
              }
            `}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className={isHeroVariant ? 'hidden sm:inline' : 'hidden sm:inline'}>Buscar</span>
          </button>
        </div>

        {/* Filtros avanzados expandibles */}
        {showAdvancedFilters && (
          <div className={`
            pt-4 mt-3 border-t space-y-4 
            animate-in fade-in slide-in-from-top-2 duration-200
            ${isHeroVariant ? 'border-gray-200/50 px-2' : ''}
          `}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Categoría */}
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700">
                  📂 Categoría
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white transition-all duration-200 hover:border-gray-300"
                >
                  <option value="">Todas las categorías</option>
                  {SERVICE_CATEGORIES.filter(cat => cat !== 'Otro').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Ubicación */}
              <div className="space-y-1.5">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700">
                  📍 Ubicación
                </label>
                <input
                  id="location"
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Ciudad, código postal..."
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 hover:border-gray-300"
                />
              </div>

              {/* Urgencia */}
              <div className="space-y-1.5">
                <label htmlFor="urgency" className="block text-sm font-semibold text-gray-700">
                  ⏰ Urgencia
                </label>
                <select
                  id="urgency"
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white transition-all duration-200 hover:border-gray-300"
                >
                  <option value="">Cualquier momento</option>
                  <option value="urgent">🔴 Urgente (hoy)</option>
                  <option value="soon">🟡 Pronto (esta semana)</option>
                  <option value="flexible">🟢 Flexible</option>
                </select>
              </div>
            </div>

            {/* Botón para limpiar filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters({ category: '', location: '', urgency: '' })}
                className="text-sm text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-2 hover:gap-3 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar todos los filtros
              </button>
            )}
          </div>
        )}
      </form>

      {/* Sugerencias rápidas - Solo en Hero */}
      {isHeroVariant && !showAdvancedFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 px-2">
          <span className="text-xs text-gray-500 font-medium">Popular:</span>
          {['Plomería', 'Electricidad', 'Limpieza', 'Pintura'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setTextQuery(tag);
                onSearch({ type: 'text', query: tag });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-brand-100 text-gray-600 hover:text-brand-700 rounded-full transition-all duration-200 hover:scale-105"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Tip - Solo fuera del Hero */}
      {!isHeroVariant && (
        <p className="text-xs text-gray-500 mt-4">
          💡 Tip: Describe tu necesidad en lenguaje natural. Ejemplo: &quot;Necesito un plomero para reparar una fuga&quot;
        </p>
      )}
    </div>
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'hero'])
};

export default SearchBar;

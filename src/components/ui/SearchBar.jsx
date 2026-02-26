import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';
import api from '@/state/apiClient.js';

function SearchBar({ onSearch, variant = 'default', noResultsInfo = null, onClearNoResults, providerCountByCategory = {} }) {
  const { t, i18n } = useTranslation();
  const [textQuery, setTextQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    urgency: ''
  });
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // ── Sugerencias inteligentes de categorías detectadas ──
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);

  // Placeholders dinámicos internacionalizados
  const placeholdersFromTranslation = t('home.searchBar.placeholders', { returnObjects: true });
  const placeholders = Array.isArray(placeholdersFromTranslation) 
    ? placeholdersFromTranslation 
    : [t('home.searchBar.placeholder')];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotar placeholders y reiniciar al cambiar idioma
  useEffect(() => {
    if (textQuery) return;
    setPlaceholderIndex(0);
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [textQuery, placeholders.length, i18n.language]);

  // ── Debounced fetch de sugerencias al escribir ──
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const { data } = await api.get('/guest/providers/suggestions', {
        params: { q: query.trim() }
      });
      const newSuggestions = data?.data?.suggestions || [];
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(textQuery);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [textQuery, fetchSuggestions]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Búsqueda combinada: texto + filtros (ya no mutuamente excluyentes) ──
  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);

    const searchPayload = { type: 'combined', query: '', filters: {} };
    if (textQuery.trim()) searchPayload.query = textQuery.trim();
    if (filters.category) searchPayload.filters.category = filters.category;
    if (filters.location) searchPayload.filters.location = filters.location;
    if (filters.urgency) searchPayload.filters.urgency = filters.urgency;

    if (searchPayload.query || Object.keys(searchPayload.filters).length > 0) {
      onSearch(searchPayload);
    }
  };

  // Click en sugerencia de categoría → buscar directamente
  const handleSuggestionClick = (category) => {
    setShowSuggestions(false);
    onSearch({ type: 'combined', query: textQuery.trim(), filters: { category } });
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

          {/* Input principal con sugerencias inteligentes */}
          <div className="flex-1 relative" ref={suggestionsRef}>
            <input
              ref={inputRef}
              type="text"
              value={textQuery}
              onChange={(e) => {
                setTextQuery(e.target.value);
                if (noResultsInfo && onClearNoResults) onClearNoResults();
              }}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
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

            {/* ── Dropdown de sugerencias inteligentes ── */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-[11px] sm:text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('home.searchBar.suggestedCategories')}
                  </p>
                </div>
                <div className="p-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s.category}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(s.category);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 hover:border-brand-300 transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-95"
                    >
                      <span className="text-brand-500">🎯</span>
                      {t(`categories.${s.category}`, s.category)}
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] sm:text-[11px] text-gray-400">
                    {t('home.searchBar.pressEnterOrClick')}
                  </p>
                </div>
              </div>
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
            title={showAdvancedFilters ? t('home.searchBar.hideFilters') : t('home.searchBar.showFilters')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden sm:inline lg:hidden xl:inline text-xs sm:text-sm">{t('home.searchBar.filters')}</span>
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
            <span className={isHeroVariant ? 'hidden sm:inline' : 'hidden sm:inline'}>{t('home.searchBar.button')}</span>
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
                  📂 {t('home.searchBar.category')}
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white transition-all duration-200 hover:border-gray-300"
                >
                  <option value="">{t('home.searchBar.allCategories')}</option>
                  {SERVICE_CATEGORIES.filter(cat => cat !== 'Otro').map(cat => {
                    const hasProviders = (providerCountByCategory[cat] || 0) > 0;
                    return (
                      <option
                        key={cat}
                        value={cat}
                        disabled={!hasProviders}
                        className={!hasProviders ? 'text-gray-400' : ''}
                      >
                        {hasProviders
                          ? `${t(`categories.${cat}`, cat)} (${providerCountByCategory[cat]})`
                          : `${t(`categories.${cat}`, cat)} — ${t('home.searchBar.noProfessionalsYet')}`
                        }
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Ubicación */}
              <div className="space-y-1.5">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700">
                  📍 {t('home.searchBar.location')}
                </label>
                <input
                  id="location"
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder={t('home.searchBar.locationPlaceholder')}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 hover:border-gray-300"
                />
              </div>

              {/* Urgencia */}
              <div className="space-y-1.5">
                <label htmlFor="urgency" className="block text-sm font-semibold text-gray-700">
                  ⏰ {t('home.searchBar.urgency')}
                </label>
                <select
                  id="urgency"
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white transition-all duration-200 hover:border-gray-300"
                >
                  <option value="">{t('home.searchBar.anyTime')}</option>
                  <option value="urgent">🔴 {t('home.searchBar.urgent')}</option>
                  <option value="soon">🟡 {t('home.searchBar.soon')}</option>
                  <option value="flexible">🟢 {t('home.searchBar.flexible')}</option>
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
                {t('home.searchBar.clearFilters')}
              </button>
            )}
          </div>
        )}
      </form>

      {/* ── Feedback inline: no hay profesionales disponibles ── */}
      {noResultsInfo && (
        <div className={`
          mt-3 p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300
          ${noResultsInfo.detectedCategories?.length > 0
            ? 'bg-amber-50/90 border-amber-200'
            : 'bg-gray-50/90 border-gray-200'
          }
        `}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {noResultsInfo.detectedCategories?.length > 0 ? (
                <>
                  <p className="text-xs sm:text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {t('home.searchBar.noProvidersYet')}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {noResultsInfo.detectedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"
                      >
                        🎯 {t(`categories.${cat}`, cat)}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-600">
                    {t('home.searchBar.noProvidersSuggestion')}
                  </p>
                </>
              ) : (
                <p className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('home.searchBar.noResultsGeneric')}
                </p>
              )}
            </div>
            {onClearNoResults && (
              <button
                type="button"
                onClick={onClearNoResults}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tip - Solo fuera del Hero */}
      {!isHeroVariant && (
        <p className="text-xs text-gray-500 mt-4">
          {t('home.searchBar.tip')}
        </p>
      )}
    </div>
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'hero']),
  noResultsInfo: PropTypes.shape({
    detectedCategories: PropTypes.arrayOf(PropTypes.string),
    query: PropTypes.string
  }),
  onClearNoResults: PropTypes.func,
  providerCountByCategory: PropTypes.object
};

export default SearchBar;

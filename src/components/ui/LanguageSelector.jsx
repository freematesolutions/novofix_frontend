import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Iconos de banderas SVG inline para mejor rendimiento
const FlagES = () => (
  <svg className="w-5 h-5 rounded-sm shadow-sm" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="480" fill="#c60b1e"/>
    <rect width="640" height="240" y="120" fill="#ffc400"/>
  </svg>
);

const FlagEN = () => (
  <svg className="w-5 h-5 rounded-sm shadow-sm" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#012169" d="M0 0h640v480H0z"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

export default function LanguageSelector({ className = '', variant = 'default' }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const current = i18n.language || localStorage.getItem('i18nextLng') || 'es';
  const isSpanish = current && current.startsWith('es');
  
  const change = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch { /* ignore storage errors */ }
    setIsOpen(false);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Variante compacta para móvil
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-0.5 ${className}`}>
        <button
          type="button"
          onClick={() => change('es')}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isSpanish 
              ? 'bg-brand-100 ring-2 ring-brand-500 ring-offset-1' 
              : 'hover:bg-gray-100 opacity-60 hover:opacity-100'
          }`}
          aria-label="Español"
          title="Español"
        >
          <FlagES />
        </button>
        <button
          type="button"
          onClick={() => change('en')}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            !isSpanish 
              ? 'bg-brand-100 ring-2 ring-brand-500 ring-offset-1' 
              : 'hover:bg-gray-100 opacity-60 hover:opacity-100'
          }`}
          aria-label="English"
          title="English"
        >
          <FlagEN />
        </button>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Botón principal con dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white/80 backdrop-blur-sm border border-gray-200/80
          hover:bg-white hover:border-brand-300 hover:shadow-md
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-brand-500/50
          ${isOpen ? 'bg-white border-brand-300 shadow-md' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('language.selectLanguage', 'Seleccionar idioma')}
      >
        {/* Bandera actual */}
        <div className="transition-transform duration-200 group-hover:scale-110">
          {isSpanish ? <FlagES /> : <FlagEN />}
        </div>
        
        {/* Código de idioma */}
        <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-600 transition-colors hidden sm:inline">
          {isSpanish ? 'ES' : 'EN'}
        </span>
        
        {/* Icono de chevron */}
        <svg 
          className={`w-3.5 h-3.5 text-gray-400 group-hover:text-brand-500 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute right-0 left-2 sm:left-auto sm:right-0 mt-2 w-48 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-9999 animate-fade-in origin-top-right overflow-visible"
          role="listbox"
          aria-label={t('language.availableLanguages', 'Idiomas disponibles')}
        >
          {/* Header del dropdown */}
          <div className="px-4 py-2 border-b border-gray-100 mb-1">
            <div className="flex items-center gap-2 text-gray-500">
              <GlobeIcon />
              <span className="text-xs font-medium uppercase tracking-wider">
                {t('language.language', 'Idioma')}
              </span>
            </div>
          </div>

          {/* Opción Español */}
          <button
            type="button"
            onClick={() => change('es')}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 text-left
              transition-all duration-200 group
              ${isSpanish 
                ? 'bg-brand-50 text-brand-700' 
                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
              }
            `}
            role="option"
            aria-selected={isSpanish}
          >
            <div className={`transition-transform duration-200 ${isSpanish ? 'scale-110' : 'group-hover:scale-105'}`}>
              <FlagES />
            </div>
            <div className="flex-1">
              <span className="font-medium">Español</span>
              <span className="text-xs text-gray-400 ml-1.5">(ES)</span>
            </div>
            {isSpanish && (
              <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Opción English */}
          <button
            type="button"
            onClick={() => change('en')}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 text-left
              transition-all duration-200 group
              ${!isSpanish 
                ? 'bg-brand-50 text-brand-700' 
                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
              }
            `}
            role="option"
            aria-selected={!isSpanish}
          >
            <div className={`transition-transform duration-200 ${!isSpanish ? 'scale-110' : 'group-hover:scale-105'}`}>
              <FlagEN />
            </div>
            <div className="flex-1">
              <span className="font-medium">English</span>
              <span className="text-xs text-gray-400 ml-1.5">(EN)</span>
            </div>
            {!isSpanish && (
              <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

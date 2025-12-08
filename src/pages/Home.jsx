import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import SearchBar from '@/components/ui/SearchBar.jsx';
import ServiceCategoryCard from '@/components/ui/ServiceCategoryCard.jsx';
import ProviderCard from '@/components/ui/ProviderCard.jsx';
import CategoryIconCarousel from '@/components/ui/CategoryIconCarousel.jsx';
import { CATEGORY_IMAGES } from '@/utils/categoryImages.js';


function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, viewRole } = useAuth();
  const [activeServices, setActiveServices] = useState([]);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [categoryProviders, setCategoryProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated && viewRole === 'provider') {
      navigate('/empleos', { replace: true });
    }
  }, [isAuthenticated, viewRole, navigate]);

  // Limpiar estado solo cuando se hace click en el logo (resetHome = true)
  useEffect(() => {
    if (location.state?.resetHome) {
      setSearchResults(null);
      setSelectedCategory(null);
      setCategoryProviders([]);
      // Limpiar el flag para que no se ejecute en cada render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Obtener servicios activos y categorías
  useEffect(() => {
    const fetchActiveServices = async () => {
      try {
        const { data } = await api.get('/guest/services/active');
        if (data?.data?.services && data.data.services.length > 0) {
          setActiveServices(data.data.services);
          setAllCategories(data.data.services);
        }
      } catch (error) {
        console.error('Error fetching active services:', error);
      }
    };
    fetchActiveServices();
  }, []);

  // Precargar imágenes de categorías - Primera imagen prioritaria
  useEffect(() => {
    if (activeServices.length === 0) return;
    
    const loadImages = async () => {
      // Cargar PRIMERO la imagen inicial para evitar flash
      const firstService = activeServices[0];
      const firstImageUrl = CATEGORY_IMAGES[firstService.category] || CATEGORY_IMAGES['Otro'];
      
      const loadFirstImage = new Promise((resolve) => {
        const img = new Image();
        img.src = firstImageUrl;
        img.onload = () => {
          setFirstImageLoaded(true);
          resolve(true);
        };
        img.onerror = () => {
          setFirstImageLoaded(true); // Mostrar igual aunque falle
          resolve(false);
        };
      });
      
      await loadFirstImage;
      
      // Cargar el resto de imágenes en segundo plano
      const remainingImages = activeServices.slice(1).map((service) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES['Otro'];
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      });
      
      await Promise.all(remainingImages);
      setAllImagesLoaded(true);
    };
    
    loadImages();
  }, [activeServices]);

  // Rotar servicios cada 5 segundos (solo cuando primera imagen está lista)
  useEffect(() => {
    if (activeServices.length === 0 || !firstImageLoaded) return;
    const interval = setInterval(() => {
      setCurrentServiceIndex((prev) => (prev + 1) % activeServices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeServices.length, firstImageLoaded]);

  // Manejar búsqueda
  const handleSearch = useCallback(async (searchData) => {
    setIsSearching(true);
    setSelectedCategory(null); // Limpiar categoría seleccionada
    try {
      // Usar endpoint público para búsqueda (funciona para guest y autenticados)
      const endpoint = '/guest/providers/search';
      
      if (searchData.type === 'text') {
        // Búsqueda por texto
        const { data } = await api.get(endpoint, {
          params: { q: searchData.query, limit: 50 }
        });
        setSearchResults(data?.data?.providers || []);
      } else if (searchData.type === 'filters') {
        // Búsqueda por filtros
        const params = {};
        if (searchData.filters.category) params.category = searchData.filters.category;
        if (searchData.filters.urgency) params.urgency = searchData.filters.urgency;
        // Para ubicación necesitaríamos geocodificación, por ahora solo buscamos por categoría
        const { data } = await api.get(endpoint, { params });
        setSearchResults(data?.data?.providers || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Limpiar búsqueda y volver a categorías
  const handleClearSearch = useCallback(() => {
    setSearchResults(null);
    setSelectedCategory(null);
  }, []);

  // Notificar al Header cuando hay búsqueda o categoría activa
  // Solo para usuarios guest o con viewRole 'client' (no provider)
  useEffect(() => {
    const hasSearch = searchResults !== null || selectedCategory !== null;
    const shouldShowSearch = hasSearch && (!isAuthenticated || viewRole === 'client');
    
    if (shouldShowSearch) {
      const mode = selectedCategory ? 'category' : 'search';
      window.dispatchEvent(new CustomEvent('header:searchbar', {
        detail: {
          show: true,
          mode,
          categoryName: selectedCategory,
          onSearch: handleSearch,
          onBack: handleClearSearch
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('header:searchbar', {
        detail: { show: false, mode: null, categoryName: null, onSearch: null, onBack: null }
      }));
    }
  }, [searchResults, selectedCategory, handleSearch, handleClearSearch, isAuthenticated, viewRole]);

  // Manejar clic en categoría
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setSearchResults(null);
    setLoadingProviders(true);
    
    try {
      const { data } = await api.get('/guest/providers/search', {
        params: { category, limit: 50 }
      });
      setCategoryProviders(data?.data?.providers || []);
    } catch (error) {
      console.error('Error fetching providers for category:', error);
      setCategoryProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Manejar selección de proveedor - ahora manejado por ProviderCard
  const handleProviderSelect = (provider) => {
    console.log('Provider profile viewed:', provider);
  };

  // Manejar vista de portafolio - ahora manejado por ProviderCard
  const handleViewPortfolio = (provider) => {
    console.log('Provider portfolio viewed:', provider);
  };

  return (
    <section className="space-y-12 w-full">
      {/* Hero Section - Solo mostrar cuando no hay resultados de búsqueda */}
      {!searchResults && !selectedCategory && (
        <>
          {/* Hero Section - Altura adaptable usando min-height y max-height */}
          {/* En pantallas cortas (<=800px altura) se ajusta automáticamente */}
          {/* svh = small viewport height, considera la barra de navegación móvil */}
          <div 
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl min-h-80 h-[calc(100svh-180px)] max-h-[600px] sm:min-h-[340px] sm:max-h-[580px] md:min-h-[360px] md:max-h-[620px] lg:min-h-[400px] lg:h-[calc(100svh-140px)] lg:max-h-[calc(100svh-140px)] xl:min-h-[420px] xl:h-[calc(100svh-120px)] xl:max-h-[750px]"
          >
            {/* Contenedor de imágenes de fondo con transiciones suaves */}
            <div className="absolute inset-0">
              {activeServices.length > 0 && firstImageLoaded ? (
                activeServices.map((service, index) => (
                  <div
                    key={service.category}
                    className="absolute inset-0 transition-all duration-1000 ease-in-out"
                    style={{
                      opacity: index === currentServiceIndex ? 1 : 0,
                      transform: index === currentServiceIndex 
                        ? 'scale(1)' 
                        : 'scale(1.1)',
                      zIndex: index === currentServiceIndex ? 1 : 0
                    }}
                  >
                    {/* Imagen de fondo */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES['Otro']})`,
                      }}
                    />
                    
                    {/* Overlay oscuro dinámico con gradiente */}
                    <div className="absolute inset-0 bg-linear-to-br from-gray-900/70 via-brand-900/65 to-gray-900/70" />
                    
                    {/* Overlay con patrón de puntos para textura */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}
                    />
                  </div>
                ))
              ) : (
                // Fallback mientras cargan las imágenes
                <div className="absolute inset-0 bg-linear-to-br from-brand-600 via-brand-500 to-cyan-500">
                  <div className="absolute inset-0 bg-black/20" />
                </div>
              )}
            </div>

            {/* Efectos de luz animados - ocultos en móvil para mejor rendimiento */}
            <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
              <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-brand-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
              <div className="absolute top-0 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-cyan-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-0 left-1/3 w-72 md:w-96 h-72 md:h-96 bg-purple-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Contenido principal - Layout con distribución óptima usando justify-evenly */}
            <div className="relative h-full flex flex-col justify-evenly items-center px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-5 lg:py-2 xl:px-8 xl:py-3" style={{ zIndex: 3 }}>
              
              {/* Sección superior: Badge + Título */}
              <div className="w-full max-w-5xl shrink-0 flex flex-col items-center gap-1.5 sm:gap-2 lg:gap-1.5">
                {/* Badge de categoría */}
                {activeServices.length > 0 && firstImageLoaded && (
                  <div className="relative h-5 sm:h-6 md:h-7 lg:h-5 xl:h-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                    {activeServices.map((service, index) => (
                      <span
                        key={service.category}
                        className={`absolute inset-0 flex items-center justify-center px-3 sm:px-4 py-1 rounded-full text-[9px] sm:text-[11px] lg:text-[9px] xl:text-xs font-semibold tracking-wider uppercase transition-all duration-500 ${
                          index === currentServiceIndex
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95'
                        }`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                        }}
                        aria-hidden={index !== currentServiceIndex}
                      >
                        <span className="truncate max-w-full">{service.category}</span>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Título principal */}
                <div className="text-center w-full pb-2 sm:pb-3 lg:pb-2">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-4xl 2xl:text-5xl font-extrabold text-white leading-tight drop-shadow-2xl">
                    Encuentra el profesional
                    <br />
                    <span className="inline-block bg-linear-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent animate-pulse-slow drop-shadow-lg">
                      que necesitas
                    </span>
                  </h1>
                </div>
              </div>

              {/* Sección central: Carrusel y Buscador */}
              <div className="w-full max-w-5xl shrink-0 flex flex-col items-center gap-4 sm:gap-5 md:gap-6 lg:gap-4 xl:gap-5">
                {/* Carrusel de iconos de categorías */}
                {activeServices.length > 0 && firstImageLoaded && (
                  <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-lg xl:max-w-3xl mx-auto px-1 sm:px-0 pt-2 sm:pt-3 lg:pt-2">
                    <CategoryIconCarousel
                      categories={activeServices}
                      currentIndex={currentServiceIndex}
                      onIndexChange={setCurrentServiceIndex}
                      onCategoryClick={handleCategoryClick}
                      autoRotate={false}
                    />
                  </div>
                )}

                {/* Buscador hero */}
                <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-sm xl:max-w-2xl px-2 sm:px-0">
                  <div 
                    className="p-0.5 rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <SearchBar onSearch={handleSearch} variant="hero" />
                  </div>
                </div>
              </div>

              {/* Sección inferior: Stats, Navegación y Botón - Distribuidos verticalmente */}
              <div className="w-full max-w-5xl shrink-0 flex flex-col items-center gap-3 sm:gap-4 lg:gap-3">
                
                {/* Stats destacados con efecto glassmorphism mejorado */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-3">
                  <div 
                    className="group text-center px-4 py-2 sm:px-5 sm:py-2.5 lg:px-4 lg:py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <span className="block text-base sm:text-lg lg:text-base xl:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{activeServices.length}+</span>
                    <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-white/70 font-medium uppercase tracking-wider">Servicios</span>
                  </div>
                  <div 
                    className="group text-center px-4 py-2 sm:px-5 sm:py-2.5 lg:px-4 lg:py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <span className="block text-base sm:text-lg lg:text-base xl:text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">{activeServices.reduce((sum, service) => sum + (service.providerCount || 0), 0)}+</span>
                    <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-white/70 font-medium uppercase tracking-wider">Profesionales</span>
                  </div>
                  <div 
                    className="group text-center px-4 py-2 sm:px-5 sm:py-2.5 lg:px-4 lg:py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <span className="block text-base sm:text-lg lg:text-base xl:text-xl font-bold text-white group-hover:text-purple-300 transition-colors">24/7</span>
                    <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs text-white/70 font-medium uppercase tracking-wider">Disponible</span>
                  </div>
                </div>

                {/* Indicadores de navegación de categorías - Línea independiente */}
                {activeServices.length > 0 && firstImageLoaded && (
                  <div 
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2"
                    role="tablist"
                    aria-label="Navegación de categorías"
                  >
                    {activeServices.map((service, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentServiceIndex(index)}
                        className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 ${
                          index === currentServiceIndex
                            ? 'w-6 sm:w-8 lg:w-6 xl:w-8 h-2 sm:h-2.5 lg:h-2 bg-white shadow-lg shadow-white/30'
                            : 'w-2 sm:w-2.5 lg:w-2 h-2 sm:h-2.5 lg:h-2 bg-white/30 hover:bg-white/50'
                        }`}
                        role="tab"
                        aria-selected={index === currentServiceIndex}
                        aria-label={`Ver ${service.category}`}
                        tabIndex={index === currentServiceIndex ? 0 : -1}
                      />
                    ))}
                  </div>
                )}

                {/* Botón Ver más - Destacado en línea independiente */}
                <button
                  onClick={() => {
                    const servicesSection = document.getElementById('services-section');
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="group flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full px-5 py-2 sm:px-6 sm:py-2.5 lg:px-5 lg:py-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }}
                  aria-label="Ver más contenido"
                >
                  <span className="text-xs sm:text-sm lg:text-xs text-white font-semibold group-hover:text-yellow-300 transition-colors">
                    Explorar servicios
                  </span>
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 text-white animate-bounce group-hover:text-yellow-300 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Onda decorativa inferior - sutil */}
            <div className="absolute bottom-0 left-0 right-0 z-4 pointer-events-none">
              <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
                <path d="M0,32L80,34.7C160,37,320,43,480,40C640,37,800,27,960,24C1120,21,1280,27,1360,29.3L1440,32L1440,60L1360,60C1280,60,1120,60,960,60C800,60,640,60,480,60C320,60,160,60,80,60L0,60Z" fill="white" fillOpacity="0.03"/>
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Resultados de búsqueda */}
      {isSearching && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="mt-2 text-gray-600">Buscando profesionales...</p>
        </div>
      )}

      {/* Resultados de búsqueda por texto/filtros */}
      {searchResults !== null && !isSearching && (
        <div className="w-full">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">
              {searchResults.length > 0 
                ? `${searchResults.length} profesionales encontrados` 
                : 'No se encontraron profesionales'}
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid gap-6">
                {searchResults.map((provider) => (
                  <ProviderCard
                    key={provider._id}
                    provider={provider}
                    onSelect={handleProviderSelect}
                    onViewPortfolio={handleViewPortfolio}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="mt-4 text-gray-600">No encontramos profesionales con esos criterios</p>
                <p className="mt-2 text-sm text-gray-500">Intenta con otros términos de búsqueda o categorías</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tarjetas de categorías (mostrar solo si no hay búsqueda activa ni categoría seleccionada) */}
      {searchResults === null && !selectedCategory && allCategories.length > 0 && (
        <div id="services-section" className="py-8 scroll-mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Explora nuestros servicios
              </h2>
              <p className="text-gray-600">
                Desliza para ver todos los profesionales disponibles
              </p>
            </div>
          </div>

          {/* Carrusel horizontal con scroll suave */}
          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Botón izquierdo (solo en desktop) */}
            <button
              onClick={() => {
                const container = document.getElementById('services-carousel');
                if (container) {
                  container.scrollBy({ left: -400, behavior: 'smooth' });
                }
              }}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-colors duration-200 group"
              aria-label="Anterior"
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Contenedor del carrusel */}
            <div
              id="services-carousel"
              className="overflow-x-auto overflow-y-visible scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4"
              style={{
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="flex gap-6 min-w-max">
                {allCategories.map((service) => (
                  <div
                    key={service.category}
                    className="w-[320px] sm:w-[360px] shrink-0"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ServiceCategoryCard
                      category={service.category}
                      description={service.description}
                      providerCount={service.providerCount}
                      onClick={handleCategoryClick}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Botón derecho (solo en desktop) */}
            <button
              onClick={() => {
                const container = document.getElementById('services-carousel');
                if (container) {
                  container.scrollBy({ left: 400, behavior: 'smooth' });
                }
              }}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-colors duration-200 group"
              aria-label="Siguiente"
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Indicador de scroll para móviles */}
          <div className="lg:hidden text-center mt-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span>Desliza para ver más</span>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Beneficios - Después de las tarjetas de servicios */}
      {searchResults === null && !selectedCategory && allCategories.length > 0 && (
        <div className="py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir NovoFix?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              La forma más rápida y segura de conectar con profesionales calificados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Beneficio 1 */}
            <div className="group relative bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Conexión Instantánea</h3>
                <p className="text-gray-600">
                  Encuentra y contacta profesionales en minutos, no en días
                </p>
              </div>
            </div>

            {/* Beneficio 2 */}
            <div className="group relative bg-linear-to-br from-emerald-50 to-green-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">100% Verificados</h3>
                <p className="text-gray-600">
                  Todos nuestros profesionales están verificados y calificados
                </p>
              </div>
            </div>

            {/* Beneficio 3 */}
            <div className="group relative bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Precios Transparentes</h3>
                <p className="text-gray-600">
                  Compara presupuestos y elige la mejor opción para ti
                </p>
              </div>
            </div>

            {/* Beneficio 4 */}
            <div className="group relative bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Calidad Garantizada</h3>
                <p className="text-gray-600">
                  Reseñas reales de clientes para ayudarte a decidir
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de proveedores por categoría */}
      {selectedCategory && (
        <div className="w-full">
          <div className="bg-white rounded-xl border p-6">
            {loadingProviders && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                <p className="mt-4 text-gray-600">Cargando profesionales...</p>
              </div>
            )}

            {!loadingProviders && categoryProviders.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-4 text-gray-700 font-semibold text-lg">No hay profesionales disponibles</p>
                <p className="mt-2 text-gray-500 text-sm">Intenta buscar en otra categoría o realiza una búsqueda personalizada</p>
              </div>
            )}

            {!loadingProviders && categoryProviders.length > 0 && (
              <>
                {/* Título estilizado igual que búsqueda */}
                <h2 className="text-xl font-bold mb-4">
                  {categoryProviders.length} {categoryProviders.length === 1 ? 'profesional encontrado' : 'profesionales encontrados'}
                </h2>

                {/* Grid de proveedores */}
                <div className="grid gap-6">
                  {categoryProviders.map((provider) => (
                    <ProviderCard
                      key={provider._id}
                      provider={provider}
                      onSelect={handleProviderSelect}
                      onViewPortfolio={handleViewPortfolio}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}


    </section>
  );
}

export default Home;

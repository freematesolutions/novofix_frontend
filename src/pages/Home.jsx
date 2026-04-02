import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import SearchBar from '@/components/ui/SearchBar.jsx';
import ServiceCategoryCard from '@/components/ui/ServiceCategoryCard.jsx';
import ProviderCard from '@/components/ui/ProviderCard.jsx';
import FeaturedProviderCard from '@/components/ui/FeaturedProviderCard.jsx';
import TestimonialsSection from '@/components/ui/TestimonialsSection.jsx';
import ReelsSection from '@/components/ui/ReelsSection.jsx';
import CategoryIconCarousel from '@/components/ui/CategoryIconCarousel.jsx';
import { SearchResultSkeleton, FeaturedProviderSkeleton } from '@/components/ui/SkeletonLoader.jsx';
// Scroll automático para enfocar la primera tarjeta con proveedores al cargar la sección
// (Este useEffect debe ir dentro del componente Home, no aquí)
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/utils/categoryImages.js';
import { SERVICE_CATEGORIES_WITH_DESCRIPTION } from '@/utils/categories.js';

// Secciones de la página para la navegación flotante
const HOME_SECTIONS = [
  { id: 'hero-section', icon: 'home', labelKey: 'home.nav.hero' },
  { id: 'reels-section', icon: 'reels', labelKey: 'home.nav.reels' },
  { id: 'services-section', icon: 'services', labelKey: 'home.nav.services' },
  { id: 'featured-providers-section', icon: 'featured', labelKey: 'home.nav.featured' },
  { id: 'testimonials-section', icon: 'testimonials', labelKey: 'home.nav.testimonials' },
  { id: 'gallery-section', icon: 'gallery', labelKey: 'home.nav.gallery' },
  { id: 'mission-vision-section', icon: 'mission', labelKey: 'home.nav.mission' }
];

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, viewRole } = useAuth();
  // const [activeServices, setActiveServices] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0); // Índice independiente del carrusel
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedCategories, setDetectedCategories] = useState([]);
  // Info inline para cuando no hay profesionales (se muestra en el SearchBar, no navega a resultados)
  const [noResultsInfo, setNoResultsInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [categoryProviders, setCategoryProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  // const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  // const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  // Map de providerCount por categoría (de la API)
  const [providerCountByCategory, setProviderCountByCategory] = useState({});
  // Total de proveedores únicos (de la API)
  const [totalUniqueProviders, setTotalUniqueProviders] = useState(0);
  // Total de clientes registrados (de la API)
  const [totalClients, setTotalClients] = useState(0);
  // Flag para saber si ya cargaron los datos de la API
  const [dataLoaded, setDataLoaded] = useState(false);
  // Profesionales destacados
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  // Estado para navegación flotante
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const [activeSection, setActiveSection] = useState('hero-section');

  // Efecto para detectar scroll y mostrar/ocultar navegación flotante
  useEffect(() => {
    const handleScroll = () => {
      // Mostrar navegación flotante después de 300px de scroll
      const shouldShow = window.scrollY > 300;
      setShowFloatingNav(shouldShow);

      // Detectar sección activa
      const sections = HOME_SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
      const scrollPosition = window.scrollY + 150; // Offset para mejor detección

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para scroll suave a una sección
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  // Generar dinámicamente nombres y descripciones traducidas de categorías para el carrusel
  // Generar datos de categorías con traducción reactiva
  const allCategoriesWithProviders = useMemo(() => {
    const all = SERVICE_CATEGORIES_WITH_DESCRIPTION.map((cat, idx) => {
      const name = t(`home.categories.${cat.value}`, cat.value);
      const descKey = `home.categoryDescriptions.${cat.value}`;
      let desc = t(descKey);
      if (desc === descKey) desc = cat.description;
      return {
        category: cat.value,
        translatedName: name,
        translatedDescription: desc,
        providerCount: providerCountByCategory[cat.value] || 0,
        hasProviders: dataLoaded ? (providerCountByCategory[cat.value] || 0) > 0 : true,
        instanceId: `cat-${cat.value}-${idx}`
      };
    });

    const withP = all.filter(c => c.hasProviders);
    const noP   = all.filter(c => !c.hasProviders);

    // Si solo hay un grupo, devolver tal cual
    if (withP.length === 0) return all;
    if (noP.length === 0) return withP;

    // Distribuir las tarjetas CON proveedores equitativamente entre las SIN
    // proveedores, SIN duplicar ninguna. Resultado: [noP, noP, ..., withP, noP, ...]
    // donde cada "withP" está separada por aproximadamente la misma cantidad de "noP".
    const result = [];
    const gap = noP.length / (withP.length + 1);
    //  gap = cuántas "noP" poner antes de cada "withP"
    //  +1 para también tener "noP" al final

    let nIdx = 0;
    for (let i = 0; i < withP.length; i++) {
      // Cuántas "noP" van antes de esta "withP"
      const batchEnd = Math.round((i + 1) * gap);
      while (nIdx < batchEnd && nIdx < noP.length) {
        result.push(noP[nIdx++]);
      }
      result.push(withP[i]);
    }
    // Agregar las "noP" restantes al final
    while (nIdx < noP.length) {
      result.push(noP[nIdx++]);
    }

    return result;
  }, [providerCountByCategory, dataLoaded, t]);

  // Cantidad de categorías con proveedores activos
  const categoriesWithProviders = useMemo(() => {
    return Object.values(providerCountByCategory).filter(count => count > 0).length;
  }, [providerCountByCategory]);

  // Categorías ordenadas SOLO para la sección "Explora nuestros servicios" (con traducción reactiva)
  const sortedCategoriesForCards = useMemo(() => {
    const withProviders = [];
    const withoutProviders = [];
    SERVICE_CATEGORIES_WITH_DESCRIPTION.forEach((cat, idx) => {
      const providerCount = providerCountByCategory[cat.value] || 0;
      const hasProviders = dataLoaded ? providerCount > 0 : true;
      const name = t(`home.categories.${cat.value}`, cat.value);
      const descKey = `home.categoryDescriptions.${cat.value}`;
      let desc = t(descKey);
      if (desc === descKey) desc = cat.description;
      const card = {
        category: cat.value,
        translatedName: name,
        translatedDescription: desc,
        providerCount,
        hasProviders,
        instanceId: `cat-${cat.value}-${idx}`
      };
      if (hasProviders) {
        withProviders.push(card);
      } else {
        withoutProviders.push(card);
      }
    });
    return [...withProviders, ...withoutProviders];
  }, [providerCountByCategory, dataLoaded, t]);

  useEffect(() => {
    if (isAuthenticated && viewRole === 'provider') {
      navigate('/empleos', { replace: true });
    }
  }, [isAuthenticated, viewRole, navigate]);

  // Sincronizar categoría desde URL params (para que el botón "atrás" funcione)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      // Si hay categoría en URL pero no en estado, cargar los proveedores
      const loadCategoryFromUrl = async () => {
        setSelectedCategory(categoryFromUrl);
        setSearchResults(null);
        setLoadingProviders(true);
        try {
          const { data } = await api.get('/guest/providers/search', {
            params: { category: categoryFromUrl, limit: 50 }
          });
          setCategoryProviders(data?.data?.providers || []);
        } catch {
          setCategoryProviders([]);
        } finally {
          setLoadingProviders(false);
        }
      };
      loadCategoryFromUrl();
    } else if (!categoryFromUrl && selectedCategory) {
      // Si no hay categoría en URL pero sí en estado, limpiar (usuario hizo "atrás")
      setSelectedCategory(null);
      setCategoryProviders([]);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar estado solo cuando se hace click en el logo (resetHome = true)
  useEffect(() => {
    if (location.state?.resetHome) {
      setSearchResults(null);
      setSelectedCategory(null);
      setCategoryProviders([]);
      setDetectedCategories([]);
      setNoResultsInfo(null);
      // Limpiar el flag y los params de URL
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Escuchar evento de reset desde el Header (cuando logo se clickea estando en /)
  useEffect(() => {
    const handleHomeReset = () => {
      setSearchResults(null);
      setSelectedCategory(null);
      setCategoryProviders([]);
      setDetectedCategories([]);
      setNoResultsInfo(null);
    };
    window.addEventListener('home:reset', handleHomeReset);
    return () => window.removeEventListener('home:reset', handleHomeReset);
  }, []);

  // Obtener servicios activos y categorías
  useEffect(() => {
    const fetchActiveServices = async () => {
      try {
        const { data } = await api.get('/guest/services/active');
        // console.log('API Response - Active Services:', data);
        if (data?.data?.services && data.data.services.length > 0) {
          // setActiveServices(data.data.services);
          setAllCategories(data.data.services);
          // Crear mapa de providerCount por categoría
          const countMap = {};
          data.data.services.forEach(service => {
            countMap[service.category] = service.providerCount || 0;
          });
          // console.log('Provider Count Map:', countMap);
          setProviderCountByCategory(countMap);
          // Guardar el total de proveedores únicos
          if (data.data.totalUniqueProviders !== undefined) {
            setTotalUniqueProviders(data.data.totalUniqueProviders);
          }
          // Guardar el total de clientes registrados
          if (data.data.totalClients !== undefined) {
            setTotalClients(data.data.totalClients);
          }
        } else {
          // console.log('No services with providers found in API response');
        }
        // Marcar que los datos ya cargaron
        setDataLoaded(true);
        // Siempre precargar primera imagen de categorías
        const firstCat = SERVICE_CATEGORIES_WITH_DESCRIPTION[0];
        const firstImageUrl = CATEGORY_IMAGES[firstCat.value] || FALLBACK_IMAGE;
        const img = new Image();
        img.src = firstImageUrl;
        img.onload = () => setFirstImageLoaded(true);
        img.onerror = () => setFirstImageLoaded(true);
      } catch {
        // console.error('Error fetching active services:', error);
        // En caso de error, igual mostrar las categorías y marcar como cargado
        setDataLoaded(true);
        setFirstImageLoaded(true);
      }
    };
    fetchActiveServices();
  }, []);

  // Cargar profesionales destacados
  useEffect(() => {
    const fetchFeaturedProviders = async () => {
      setLoadingFeatured(true);
      try {
        const { data } = await api.get('/guest/providers/featured', {
          params: { limit: 10 }
        });
        if (data?.data?.providers) {
          setFeaturedProviders(data.data.providers);
        }
      } catch {
        // console.error('Error fetching featured providers:', error);
        setFeaturedProviders([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeaturedProviders();
  }, []);

  // Precargar imágenes de TODAS las categorías en segundo plano (en lotes)
  useEffect(() => {
    if (!firstImageLoaded) return;
    let cancelled = false;
    
    const loadImages = async () => {
      const BATCH_SIZE = 4;
      const remaining = allCategoriesWithProviders.slice(1);
      
      for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
        if (cancelled) break;
        const batch = remaining.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((service) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = CATEGORY_IMAGES[service.category] || FALLBACK_IMAGE;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
        }));
      }
    };
    
    loadImages();
    return () => { cancelled = true; };
  }, [firstImageLoaded, allCategoriesWithProviders]);

  // Efecto para desplazar el carrusel de servicios al inicio cuando se cargan las categorías
useEffect(() => {
  if (sortedCategoriesForCards.length > 0 && !searchResults && !selectedCategory && dataLoaded) {
    // Pequeño delay para asegurar que el DOM esté renderizado
    const timer = setTimeout(() => {
      const container = document.getElementById('services-carousel');
      if (container) {
        container.scrollLeft = 0;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [sortedCategoriesForCards, searchResults, selectedCategory, dataLoaded]);

  // NOTA: El fondo del hero ahora es un degradado sólido de marca (sin rotación de imágenes)

  // NOTA: El carrusel de iconos ahora maneja su propia animación CONTINUA internamente
  // mediante requestAnimationFrame en CategoryIconCarousel.jsx (estilo Encarta)

  // Manejar búsqueda — combinada (texto + filtros, no mutuamente excluyentes)
  // Solo navega a página de resultados si hay profesionales; si no, muestra feedback inline en el SearchBar
  const handleSearch = useCallback(async (searchData) => {
    setIsSearching(true);
    setSelectedCategory(null);
    setDetectedCategories([]);
    setNoResultsInfo(null);
    try {
      const endpoint = '/guest/providers/search';
      const params = { limit: 50 };

      // Búsqueda combinada: texto + filtros simultáneos
      if (searchData.query) params.q = searchData.query;
      if (searchData.filters?.category) params.category = searchData.filters.category;
      if (searchData.filters?.location) params.location = searchData.filters.location;
      if (searchData.filters?.urgency) params.urgency = searchData.filters.urgency;

      // Fallback para tipos legacy ('text', 'filters') de otros componentes
      if (searchData.type === 'text' && !params.q) params.q = searchData.query;
      if (searchData.type === 'filters' && searchData.filters) {
        if (searchData.filters.category && !params.category) params.category = searchData.filters.category;
        if (searchData.filters.location && !params.location) params.location = searchData.filters.location;
        if (searchData.filters.urgency && !params.urgency) params.urgency = searchData.filters.urgency;
      }

      const { data } = await api.get(endpoint, { params });
      const providers = data?.data?.providers || [];
      const detected = data?.data?.detectedCategories || [];

      if (providers.length > 0) {
        // Hay profesionales → mostrar página de resultados
        setSearchResults(providers);
        setDetectedCategories(detected);
        setNoResultsInfo(null);
      } else {
        // Sin profesionales → NO navegar a resultados, mostrar feedback inline en SearchBar
        setSearchResults(null);
        setNoResultsInfo({ detectedCategories: detected, query: params.q || '' });
      }
    } catch {
      setSearchResults(null);
      setNoResultsInfo({ detectedCategories: [], query: '' });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Limpiar búsqueda y volver a categorías - usar navegación del historial
  const handleClearSearch = useCallback(() => {
    // Si hay categoría seleccionada, navegar hacia atrás en el historial
    if (selectedCategory) {
      navigate(-1);
    } else {
      // Si solo hay resultados de búsqueda, limpiar el estado
      setSearchResults(null);
      setSelectedCategory(null);
      setDetectedCategories([]);
      setNoResultsInfo(null);
    }
  }, [selectedCategory, navigate]);

  // Limpiar todo desde el SearchBar (botón "Nueva búsqueda")
  const handleClearAllSearch = useCallback(() => {
    setSearchResults(null);
    setSelectedCategory(null);
    setCategoryProviders([]);
    setDetectedCategories([]);
    setNoResultsInfo(null);
    // Limpiar parámetros de URL si hay categoría seleccionada
    if (searchParams.get('category')) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  // Manejar clic en categoría - actualiza URL para que el botón "atrás" funcione
  const handleCategoryClick = async (category) => {
    // console.log('Home: handleCategoryClick llamado con:', category);
    // Actualizar URL con el parámetro de categoría (esto crea una entrada en el historial)
    setSearchParams({ category }, { replace: false });
    setSelectedCategory(category);
    setSearchResults(null);
    setLoadingProviders(true);
    
    try {
      const { data } = await api.get('/guest/providers/search', {
        params: { category, limit: 50 }
      });
      setCategoryProviders(data?.data?.providers || []);
    } catch {
      // console.error('Error fetching providers for category:', error);
      setCategoryProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Manejar selección de proveedor - ahora manejado por ProviderCard
  const handleProviderSelect = () => {
    // console.log('Provider profile viewed');
  };

  // Manejar vista de portafolio - ahora manejado por ProviderCard
  const handleViewPortfolio = () => {
    // console.log('Provider portfolio viewed');
  };

  return (
    <main className="space-y-12 w-full">
      {/* Navegación flotante creativa - Solo visible al hacer scroll */}
      {!searchResults && !selectedCategory && showFloatingNav && (
        <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2 floating-nav floating-nav-desktop">
          {HOME_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 floating-nav-btn ${
                  isActive 
                    ? 'floating-nav-btn--active' 
                    : 'floating-nav-btn--idle'
                }`}
                title={t(section.labelKey)}
                aria-label={t(section.labelKey)}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Iconos SVG para cada sección */}
                {section.icon === 'home' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {section.icon === 'reels' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {section.icon === 'services' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
                {section.icon === 'featured' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
                {section.icon === 'testimonials' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                {section.icon === 'gallery' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {section.icon === 'mission' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {/* Tooltip con nombre de la sección */}
                <span className="absolute right-full mr-3 px-2 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {t(section.labelKey)}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Navegación flotante móvil - Iconos en la parte inferior */}
      {!searchResults && !selectedCategory && showFloatingNav && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden flex items-center gap-1.5 floating-nav floating-nav-mobile">
          {HOME_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 floating-nav-btn ${
                  isActive 
                    ? 'floating-nav-btn--active' 
                    : 'floating-nav-btn--idle'
                }`}
                title={t(section.labelKey)}
                aria-label={t(section.labelKey)}
              >
                {section.icon === 'home' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {section.icon === 'reels' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {section.icon === 'services' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
                {section.icon === 'featured' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
                {section.icon === 'testimonials' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                {section.icon === 'gallery' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {section.icon === 'mission' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Hero Section - Solo mostrar cuando no hay resultados de búsqueda */}
      {!searchResults && !selectedCategory && (
        <>
          {/* Hero Section - Altura fija que garantiza visibilidad de todo el contenido */}
          {/* Ajustada para acomodar las tarjetas de imagen más grandes del carrusel */}
          <div 
            id="hero-section"
            className="relative overflow-hidden rounded-none sm:rounded-2xl min-h-[420px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[580px] xl:min-h-[660px] 2xl:min-h-[740px] scroll-mt-20 -mx-4 sm:-mx-1"
          >
            {/* Fondo degradado sólido de marca — sin imágenes para no competir con el carrusel */}
            <div className="absolute inset-0">
              {/* Degradado principal: Charcoal → Teal profundo → Teal medio */}
              <div className="absolute inset-0 bg-linear-to-br from-dark-900 via-brand-900 to-brand-700" />
              
              {/* Capa sutil de acento para darle calidez */}
              <div 
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  background: 'radial-gradient(ellipse at 80% 20%, var(--color-accent-500) 0%, transparent 60%)'
                }}
              />
              
              {/* Patrón de puntos para textura sutil */}
              <div 
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>

            {/* Efectos de luz animados - ocultos en móvil para mejor rendimiento */}
            <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
              <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-brand-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
              <div className="absolute top-0 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-accent-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-0 left-1/3 w-72 md:w-96 h-72 md:h-96 bg-brand-300/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Contenido principal - Layout con distribución óptima */}
            <div className="relative h-full flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-5 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-5 lg:py-4 xl:px-8 xl:py-5" style={{ zIndex: 3 }}>
              
              {/* Sección superior: Título */}
              <div className="w-full max-w-5xl shrink-0 flex flex-col items-center gap-1.5 sm:gap-2 lg:gap-1.5 pt-2">
                {/* Título principal - texto blanco plano sin animación */}
                <div className="text-center w-full pb-1 sm:pb-2">
                  <h1 className="text-2xl min-[480px]:text-3xl sm:text-4xl font-extrabold leading-tight drop-shadow-2xl" style={{ color: '#f0f0f0' }}>
                    {t('home.title1')}{' '}
                    <span style={{ color: '#f0f0f0' }}>
                      {t('home.title2')}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Buscador hero — glass pill standalone creativo */}
              <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-lg xl:max-w-2xl mx-auto shrink-0 px-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-linear-to-r from-brand-400/20 via-accent-400/15 to-brand-400/20 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div 
                    className="relative rounded-xl sm:rounded-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                  >
                    <SearchBar onSearch={handleSearch} variant="hero" noResultsInfo={noResultsInfo} onClearNoResults={() => setNoResultsInfo(null)} onClearAll={handleClearAllSearch} providerCountByCategory={providerCountByCategory} />
                  </div>
                </div>
              </div>

              {/* Carrusel de tarjetas con imágenes de categorías — borde a borde del hero */}
              {allCategoriesWithProviders.length > 0 && firstImageLoaded && (
                <div className="w-[calc(100%+1.5rem)] sm:w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] lg:w-[calc(100%+2.5rem)] xl:w-[calc(100%+4rem)] -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-5 xl:-mx-8 shrink-0 overflow-hidden">
                  <CategoryIconCarousel
                    categories={allCategoriesWithProviders}
                    currentIndex={carouselIndex}
                    onIndexChange={setCarouselIndex}
                    onCategoryClick={handleCategoryClick}
                    autoRotate={true}
                    rotationInterval={2800}
                  />
                </div>
              )}
            </div>

            {/* Degradado inferior suave — funde el hero con la siguiente sección */}
            <div className="absolute bottom-0 left-0 right-0 z-4 pointer-events-none h-32 sm:h-40 md:h-48" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.03) 15%, rgba(255,255,255,0.10) 35%, rgba(255,255,255,0.30) 55%, rgba(255,255,255,0.60) 75%, rgba(255,255,255,0.90) 90%, #ffffff 100%)' }} />
          </div>
        </>
      )}

      {/* Resultados de búsqueda */}
      {isSearching && (
        <SearchResultSkeleton count={3} />
      )}

      {/* Resultados de búsqueda por texto/filtros */}
      {searchResults !== null && !isSearching && (
        <div className="w-full">
          <div className="bg-white rounded-xl border p-3 sm:p-6">
            {/* Badge de categorías detectadas por búsqueda inteligente */}
            {detectedCategories.length > 0 && (
              <div className="mb-4 p-3 bg-brand-50 border border-brand-200 rounded-xl">
                <p className="text-xs text-brand-600 font-medium mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('home.detectedCategoriesLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-100 text-brand-700 border border-brand-200"
                    >
                      🎯 {t(`home.categories.${cat}`, cat)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-base sm:text-xl font-bold">
                {searchResults.length > 0 
                  ? t('home.foundProfessionals', { count: searchResults.length })
                  : t('home.noProfessionalsFound')}
              </h2>
              <button
                onClick={() => {
                  setSearchResults(null);
                  setSelectedCategory(null);
                  setDetectedCategories([]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-linear-to-r from-brand-100 to-brand-50 text-brand-700 font-semibold border border-brand-200 hover:from-brand-200 hover:to-brand-100 hover:text-brand-900 transition-all text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                style={{ minHeight: 'auto', lineHeight: '1.2' }}
                aria-label={t('common.backToHomeAria')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{t('home.backToHome')}</span>
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid gap-6">
                {searchResults.map((provider) => (
                  <ProviderCard
                    key={provider._id}
                    provider={provider}
                    onSelect={handleProviderSelect}
                    onViewPortfolio={handleViewPortfolio}
                    selectedCategory={selectedCategory}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="mt-4 text-gray-600">{t('home.noProfessionalsCriteria')}</p>
                <p className="mt-2 text-sm text-gray-500">{t('home.tryOtherSearch')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Reels — videos de profesionales estilo TikTok */}
      {searchResults === null && !selectedCategory && (
        <ReelsSection />
      )}

      {/* Tarjetas de categorías (mostrar siempre, usando defaults si no hay proveedores) */}
      {searchResults === null && !selectedCategory && (
        <div id="services-section" className="py-2 scroll-mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {t('header.exploreServices')}
              </h2>
              <p className="text-gray-600">
                {categoriesWithProviders > 0
                  ? t('home.categoriesWithProfessionals', { count: categoriesWithProviders })
                  : t('home.comingSoonProfessionals')
                }
              </p>
            </div>
          </div>

          {/* Carrusel horizontal con scroll suave */}
          <div className="relative">
            {/* Botón izquierdo (solo en desktop) */}
            <button
              onClick={() => {
                const container = document.getElementById('services-carousel');
                if (container) {
                  container.scrollBy({ left: -400, behavior: 'smooth' });
                }
              }}
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-colors duration-200 group"
              aria-label={t('common.previous')}
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Contenedor del carrusel */}
            <div
              id="services-carousel"
              className="overflow-x-auto overflow-y-visible scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pb-4"
              style={{
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="flex gap-6 min-w-max">
                {sortedCategoriesForCards.map((service) => (
                  <div
                    key={service.instanceId}
                    className={`w-[340px] sm:w-[380px] lg:w-[420px] shrink-0${service.hasProviders ? ' service-card-with-providers' : ''}`}
                    style={{ scrollSnapAlign: 'start' }}
                    data-has-providers={service.hasProviders ? 'true' : 'false'}
                  >
                    <ServiceCategoryCard
                      category={service.category}
                      translatedName={service.translatedName}
                      translatedDescription={service.translatedDescription}
                      providerCount={service.providerCount}
                      onClick={handleCategoryClick}
                      disabled={!service.hasProviders}
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
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-colors duration-200 group"
              aria-label={t('common.next')}
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Enlace de texto a sección de profesionales destacados */}
          <div className="text-center mt-1">
            <button
              onClick={() => {
                const featuredSection = document.getElementById('featured-providers-section');
                if (featuredSection) {
                  featuredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="group inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 cursor-pointer transition-colors duration-200 focus:outline-none"
              aria-label={t('home.featuredProviders.viewFeatured')}
            >
              <span className="text-base font-bold text-brand-500 group-hover:text-brand-600 transition-colors">&gt;&gt;</span>
              <span className="group-hover:underline">{t('home.featuredProviders.viewFeatured')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sección de Profesionales Destacados */}
      {searchResults === null && !selectedCategory && (
        <div id="featured-providers-section" className="py-2 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {t('home.featuredProviders.title')}
              </h2>
              <p className="text-gray-600">
                {t('home.featuredProviders.subtitle')}
              </p>
            </div>
            {/* Badge de cantidad */}
            {featuredProviders.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-linear-to-r from-accent-100 to-accent-50 px-4 py-2 rounded-full border border-accent-200">
                <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-sm font-semibold text-accent-700">
                  {t('home.featuredProviders.topRated', { count: featuredProviders.length })}
                </span>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loadingFeatured && (
            <FeaturedProviderSkeleton count={4} />
          )}

          {/* Empty state */}
          {!loadingFeatured && featuredProviders.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-600 font-medium">{t('home.featuredProviders.noProviders')}</p>
              <p className="mt-2 text-sm text-gray-500">{t('home.featuredProviders.comingSoon')}</p>
            </div>
          )}

          {/* Carrusel horizontal de profesionales destacados */}
          {!loadingFeatured && featuredProviders.length > 0 && (
            <div className="relative">
              {/* Botón izquierdo (solo en desktop) */}
              <button
                onClick={() => {
                  const container = document.getElementById('featured-carousel');
                  if (container) {
                    container.scrollBy({ left: -340, behavior: 'smooth' });
                  }
                }}
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-colors duration-200 group"
                aria-label={t('common.previous')}
              >
                <svg className="w-6 h-6 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Contenedor del carrusel */}
              <div
                id="featured-carousel"
                className="overflow-x-auto overflow-y-visible scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pb-4"
                style={{
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div className="flex gap-5 min-w-max">
                  {featuredProviders.map((provider) => (
                    <div
                      key={provider._id}
                      className="w-[300px] sm:w-[320px] shrink-0"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <FeaturedProviderCard
                        provider={provider}
                        onViewProfile={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón derecho (solo en desktop) */}
              <button
                onClick={() => {
                  const container = document.getElementById('featured-carousel');
                  if (container) {
                    container.scrollBy({ left: 340, behavior: 'smooth' });
                  }
                }}
                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center hover:bg-brand-50 transition-colors duration-200 group"
                aria-label={t('common.next')}
              >
                <svg className="w-6 h-6 text-gray-600 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Enlace de texto a sección de testimonios */}
          {!loadingFeatured && featuredProviders.length > 0 && (
            <div className="text-center mt-1">
              <button
                onClick={() => {
                  const testimonialsSection = document.getElementById('testimonials-section');
                  if (testimonialsSection) {
                    testimonialsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 cursor-pointer transition-colors duration-200 focus:outline-none"
                aria-label={t('testimonials.viewTestimonials')}
              >
                <span className="text-base font-bold text-brand-500 group-hover:text-brand-600 transition-colors">&gt;&gt;</span>
                <span className="group-hover:underline">{t('testimonials.viewTestimonials')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sección de Testimonios - Después de profesionales destacados */}
      {searchResults === null && !selectedCategory && (
        <TestimonialsSection />
      )}

      {/* Sección de Beneficios - Después de testimonios */}
      {searchResults === null && !selectedCategory && (
        <div id="mission-vision-section" className="py-2 scroll-mt-20">
          {/* Header de la sección */}
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {t('home.missionVision.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              {t('home.missionVision.subtitle')}
            </p>
          </div>

          {/* Misión y Visión - Cards principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Card de Misión */}
            <div className="group relative bg-linear-to-br from-brand-50 via-brand-50/50 to-accent-50/30 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden border border-brand-100/50">
              {/* Decoraciones de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/20 rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent-200/20 rounded-full -ml-20 -mb-20 group-hover:scale-125 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                {/* Icono */}
                <svg className="w-10 h-10 mb-6 text-gray-400 group-hover:text-brand-500 transition-all duration-300 group-hover:scale-110 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                
                {/* Título */}
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{t('home.missionVision.missionTitle')}</h3>
                  <div className="flex-1 h-px bg-linear-to-r from-brand-300 to-transparent"></div>
                </div>
                
                {/* Contenido */}
                <p className="text-gray-700 text-base leading-snug mb-4">
                  {t('home.missionVision.missionText')}
                </p>
                
                {/* Puntos clave de la misión */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600">{t('home.missionVision.missionPoint1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600">{t('home.missionVision.missionPoint2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600">{t('home.missionVision.missionPoint3')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Visión */}
            <div className="group relative bg-linear-to-br from-accent-50 via-accent-50/30 to-brand-50/30 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden border border-accent-100/50">
              {/* Decoraciones de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-200/20 rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-200/20 rounded-full -ml-20 -mb-20 group-hover:scale-125 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                {/* Icono */}
                <svg className="w-10 h-10 mb-6 text-gray-400 group-hover:text-accent-500 transition-all duration-300 group-hover:scale-110 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                
                {/* Título */}
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{t('home.missionVision.visionTitle')}</h3>
                  <div className="flex-1 h-px bg-linear-to-r from-accent-300 to-transparent"></div>
                </div>
                
                {/* Contenido */}
                <p className="text-gray-700 text-base leading-snug mb-4">
                  {t('home.missionVision.visionText')}
                </p>
                
                {/* Puntos clave de la visión */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600">{t('home.missionVision.visionPoint1')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600">{t('home.missionVision.visionPoint2')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600">{t('home.missionVision.visionPoint3')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nuestros Valores - Fila de 4 cards pequeñas */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">{t('home.missionVision.valuesTitle')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Valor 1 - Confianza */}
              <div className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-emerald-200 text-center">
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:scale-110 transition-all duration-300 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h4 className="font-semibold text-gray-900 mb-1">{t('home.missionVision.value1Title')}</h4>
                <p className="text-sm text-gray-500">{t('home.missionVision.value1Desc')}</p>
              </div>

              {/* Valor 2 - Excelencia */}
              <div className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-accent-200 text-center">
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:scale-110 transition-all duration-300 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h4 className="font-semibold text-gray-900 mb-1">{t('home.missionVision.value2Title')}</h4>
                <p className="text-sm text-gray-500">{t('home.missionVision.value2Desc')}</p>
              </div>

              {/* Valor 3 - Transparencia */}
              <div className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-brand-200 text-center">
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:scale-110 transition-all duration-300 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h4 className="font-semibold text-gray-900 mb-1">{t('home.missionVision.value3Title')}</h4>
                <p className="text-sm text-gray-500">{t('home.missionVision.value3Desc')}</p>
              </div>

              {/* Valor 4 - Innovación */}
              <div className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-dark-200 text-center">
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:scale-110 transition-all duration-300 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h4 className="font-semibold text-gray-900 mb-1">{t('home.missionVision.value4Title')}</h4>
                <p className="text-sm text-gray-500">{t('home.missionVision.value4Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de proveedores por categoría */}
      {selectedCategory && (
        <div className="w-full">
          <div className="rounded-xl bg-white p-3 sm:p-6 min-h-100 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-base sm:text-xl font-bold mb-0 text-gray-900">
                  {categoryProviders.length} {categoryProviders.length === 1 ? t('home.oneProfessionalFound') : t('home.manyProfessionalsFound')} {t('home.inCategory')} <span className="capitalize text-brand-600">{t(`home.categories.${selectedCategory}`, selectedCategory)}</span>
                </h2>
                <button
                  onClick={() => {
                    setSearchResults(null);
                    setSelectedCategory(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-linear-to-r from-brand-100 to-brand-50 text-brand-700 font-semibold border border-brand-200 hover:from-brand-200 hover:to-brand-100 hover:text-brand-900 transition-all text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  style={{ minHeight: 'auto', lineHeight: '1.2' }}
                  aria-label={t('common.backToHomeAria')}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">{t('home.backToHome')}</span>
                </button>
              </div>

              {loadingProviders && (
                <SearchResultSkeleton count={3} />
              )}

              {!loadingProviders && categoryProviders.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="mt-4 text-gray-700 font-semibold text-lg">{t('home.noProfessionalsAvailable')}</p>
                  <p className="mt-2 text-gray-500 text-sm">{t('home.tryOtherCategory')}</p>
                </div>
              )}

              {!loadingProviders && categoryProviders.length > 0 && (
                <div className="grid gap-6">
                  {categoryProviders
                    .slice() // Copia para no mutar el estado
                    .sort((a, b) => {
                      // Ordenar por rating promedio (desc)
                      const ratingA = a.providerProfile?.rating?.average ?? 0;
                      const ratingB = b.providerProfile?.rating?.average ?? 0;
                      if (ratingB !== ratingA) return ratingB - ratingA;
                      // Si el rating es igual, ordenar por plan (PRO > BASIC > FREE)
                      const planOrder = { pro: 3, basic: 2, free: 1 };
                      const planA = planOrder[a.subscription?.plan] || 0;
                      const planB = planOrder[b.subscription?.plan] || 0;
                      return planB - planA;
                    })
                    .map((provider) => (
                      <ProviderCard
                        key={provider._id}
                        provider={provider}
                        onSelect={handleProviderSelect}
                        onViewPortfolio={handleViewPortfolio}
                        selectedCategory={selectedCategory}
                      />
                    ))}
                </div>
              )}
          </div>
        </div>
      )}


    </main>
  );
}

export default Home;


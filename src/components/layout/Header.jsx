import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { getSocket, on as socketOn, emit as socketEmit, setGlobalUserId, getGlobalUserId } from '@/state/socketClient.js';
import { useAuth } from '@/state/AuthContext.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import SearchBar from '@/components/ui/SearchBar.jsx';
import api from '@/state/apiClient.js';

function Header() {
  const { user, role, roles, viewRole, isAuthenticated, changeViewRole, startRoleSwitch, clearViewRoleLock, logout, pendingVerification } = useAuth();
  const navigate = useNavigate();

  // Move all hooks to the top, before any return
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const toast = useToast();
  const [unreadAdmin, setUnreadAdmin] = useState(0);
  // In-app notifications (visible for any authenticated user)
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  // Lightweight counters for nav badges
  const [counters, setCounters] = useState({ notificationsUnread: 0, client: null, provider: null });
  // Subscription upgrade hints (provider mode)
  const [upgradeHint, setUpgradeHint] = useState({ show: false, reason: '' });
  const location = useLocation();
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const headerRef = useRef(null);
  // Refs para manejo de click afuera en menús flotantes
  const notifMenuRef = useRef(null);
  const notifToggleRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountToggleRef = useRef(null);
  const [canScrollNavLeft, setCanScrollNavLeft] = useState(false);
  const [canScrollNavRight, setCanScrollNavRight] = useState(false);
  const activeNavLinkRef = useRef(null);
  const socketRef = useRef(null);
  const userIdRef = useRef(null); // Ref para mantener el userId actual para evitar stale closures
  const viewRoleRef = useRef(null); // Ref para mantener viewRole actual
  const toastRef = useRef(null); // Ref para toast para evitar re-runs del useEffect
  const navigateRef = useRef(null); // Ref para navigate para evitar re-runs del useEffect
  
  // Estado para SearchBar integrado en Header
  const [searchBarState, setSearchBarState] = useState({
    show: false,
    mode: null, // 'category' | 'search'
    categoryName: null,
    onSearch: null,
    onBack: null
  });

  // Estado para animación de placeholder del SearchBar
  const [searchNeedsAnimation, setSearchNeedsAnimation] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchInputRef = useRef(null);
  const searchPlaceholderRef = useRef(null);

  // No mostrar header mientras loading o user no resuelto pero hay token (evita parpadeo de menú guest)
  // Bloquear header si usuario pendiente de verificación
  const isBlocked = (user && user.emailVerified !== true) || pendingVerification;

  // Mantener userId global para evitar stale closures en listeners de socket
  // El usuario puede tener .id o ._id dependiendo de la fuente
  const currentUserIdValue = user?.id ? String(user.id) : (user?._id ? String(user._id) : null);
  
  // Actualizar el userId global en el módulo de socket
  if (currentUserIdValue) {
    setGlobalUserId(currentUserIdValue);
  }
  
  // También mantener refs locales para otros usos
  userIdRef.current = currentUserIdValue;
  viewRoleRef.current = viewRole;
  toastRef.current = toast;
  navigateRef.current = navigate;

  // Compute responsive-safe display name
  const firstName = user?.profile?.firstName?.trim?.() || '';
  const lastName = user?.profile?.lastName?.trim?.() || '';
  //const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const email = user?.email || '';
  const initials = (() => {
    const a = (firstName || '').charAt(0).toUpperCase();
    const b = (lastName || '').charAt(0).toUpperCase();
    if (a || b) return `${a}${b}` || a || b || '';
    const userPart = (email.split('@')[0] || '').trim();
    return (userPart.charAt(0) || 'U').toUpperCase();
  })();
  // Note: no unused variable; compute inline when needed

  const closeMenu = () => {
    // If focus is inside the mobile menu, move it back to the toggle button before hiding (a11y)
    try {
      const active = document.activeElement;
      if (active && mobileMenuRef.current?.contains(active)) {
        mobileToggleRef.current?.focus();
      }
    } catch { /* ignore */ }
    setOpen(false);
  };

  // Escuchar eventos de búsqueda desde Home.jsx
  useEffect(() => {
    const handleSearchBarUpdate = (event) => {
      setSearchBarState(event.detail);
    };
    
    window.addEventListener('header:searchbar', handleSearchBarUpdate);
    return () => window.removeEventListener('header:searchbar', handleSearchBarUpdate);
  }, []);

  // Ocultar SearchBar cuando el usuario es provider o está en páginas de auth
  useEffect(() => {
    const authRoutes = ['/login', '/registrarse', '/recuperar-contrasena', '/restablecer-contrasena'];
    const isAuthRoute = authRoutes.some(route => location.pathname.startsWith(route));
    
    if ((isAuthenticated && viewRole === 'provider') || isAuthRoute) {
      setSearchBarState({
        show: false,
        mode: null,
        categoryName: null,
        onSearch: null,
        onBack: null
      });
    }
  }, [isAuthenticated, viewRole, location.pathname]);

  // Close menus with Escape for accessibility
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Mirror close behavior: restore focus if it was inside the mobile menu
        try {
          const active = document.activeElement;
          if (active && mobileMenuRef.current?.contains(active)) {
            mobileToggleRef.current?.focus();
          }
        } catch { /* ignore */ }
        setOpen(false);
        setAccountOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Cerrar menús al hacer click fuera o navegar
  useEffect(() => {
    const handleClickOutside = (e) => {
      const t = e.target;
      // Notificaciones
      const clickInNotif = (notifMenuRef.current && notifMenuRef.current.contains(t)) || (notifToggleRef.current && notifToggleRef.current.contains(t));
      if (!clickInNotif) setNotifOpen(false);
      // Cuenta
      const clickInAccount = (accountMenuRef.current && accountMenuRef.current.contains(t)) || (accountToggleRef.current && accountToggleRef.current.contains(t));
      if (!clickInAccount) setAccountOpen(false);
      // Menú móvil
      const clickInMobile = (mobileMenuRef.current && mobileMenuRef.current.contains(t)) || (mobileToggleRef.current && mobileToggleRef.current.contains(t));
      if (!clickInMobile) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Cerrar menús cuando cambia la ruta
  useEffect(() => {
    setNotifOpen(false);
    setAccountOpen(false);
    setOpen(false);
  }, [location.pathname]);

  // Exponer altura del header como variable CSS para headers pegajosos por página
  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight || 0;
        document.documentElement.style.setProperty('--app-header-h', `${h}px`);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    // Cambios de estado que alteran altura (ej. searchBarState.show)
    const timer = setTimeout(updateHeaderHeight, 50);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timer);
    };
  }, [searchBarState.show]);

  // Update nav scroll buttons visibility
  const updateNavScrollState = () => {
    const el = navRef.current;
    if (!el) { setCanScrollNavLeft(false); setCanScrollNavRight(false); return; }
    const { scrollLeft, clientWidth, scrollWidth } = el;
    // Solo mostrar botones si realmente hay contenido que scrollear (margen de 5px para precisión)
    const needsScroll = scrollWidth > clientWidth + 5;
    setCanScrollNavLeft(needsScroll && scrollLeft > 5);
    setCanScrollNavRight(needsScroll && scrollLeft + clientWidth < scrollWidth - 5);
  };

  // Centrar el elemento activo de forma robusta
  const centerActiveNav = useCallback(() => {
    const nav = navRef.current;
    const active = activeNavLinkRef.current;
    if (!nav || !active) return;

    // Usar scrollIntoView con inline:'center' evita cálculos manuales y reflows inesperados
    try {
      active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    } catch {
      // Fallback a cálculo manual si el navegador no soporta inline:'center'
      const scrollOffset = active.offsetLeft - (nav.clientWidth / 2) + (active.offsetWidth / 2);
      const clampedOffset = Math.max(0, Math.min(scrollOffset, nav.scrollWidth - nav.clientWidth));
      nav.scrollTo({ left: clampedOffset, behavior: 'smooth' });
    }

    // Recalcular visibilidad de botones tras el scroll
    setTimeout(updateNavScrollState, 600);
  }, []);

  useEffect(() => {
    updateNavScrollState();
    const onResize = () => updateNavScrollState();
    window.addEventListener('resize', onResize);
    const el = navRef.current;
    if (el) el.addEventListener('scroll', updateNavScrollState, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      if (el) el.removeEventListener('scroll', updateNavScrollState);
    };
  }, [viewRole]); // Re-run when viewRole changes to update scroll buttons for different menus

  // Resetear input cuando cambia el estado de búsqueda
  useEffect(() => {
    if (searchBarState.show) {
      console.log('Header SearchBar shown, resetting input');
      setSearchInputValue('');
      if (searchInputRef.current) {
        searchInputRef.current.value = '';
      }
    }
  }, [searchBarState.show]);

  // Debug: verificar que el placeholder se renderiza
  useEffect(() => {
    if (searchBarState.show && !searchInputValue) {
      console.log('Placeholder should be visible', {
        placeholderExists: !!searchPlaceholderRef.current,
        inputValue: searchInputValue,
        placeholderText: searchBarState.categoryName ? `Buscar en ${searchBarState.categoryName}...` : 'Buscar servicios profesionales...'
      });
    }
  }, [searchBarState.show, searchInputValue, searchBarState.categoryName]);

  // Detección de overflow para animación de placeholder
  useEffect(() => {
    if (!searchBarState.show) return;
    
    const checkOverflow = () => {
      console.log('Header checkOverflow called', { 
        inputExists: !!searchInputRef.current, 
        placeholderExists: !!searchPlaceholderRef.current,
        windowWidth: window.innerWidth,
        searchInputValue
      });
      
      // Verificar overflow en cualquier resolución donde pueda no caber
      if (searchInputRef.current && searchPlaceholderRef.current) {
        // Dar tiempo para que el DOM se renderice
        setTimeout(() => {
          if (searchInputRef.current && searchPlaceholderRef.current) {
            // Obtener padding real del input
            const inputStyle = window.getComputedStyle(searchInputRef.current);
            const paddingLeft = parseFloat(inputStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(inputStyle.paddingRight) || 0;
            
            const inputWidth = searchInputRef.current.offsetWidth - paddingLeft - paddingRight - 10; // 10px de margen extra
            const placeholderWidth = searchPlaceholderRef.current.scrollWidth; // scrollWidth en lugar de offsetWidth
            
            const needsAnim = placeholderWidth > inputWidth;
            console.log('Header overflow check:', { 
              inputWidth, 
              placeholderWidth,
              paddingLeft,
              paddingRight,
              needsAnimation: needsAnim,
              windowWidth: window.innerWidth
            });
            setSearchNeedsAnimation(needsAnim);
          }
        }, 150);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [searchBarState.show, searchInputValue]);

  // Scroll al elemento activo del nav cuando cambia la ruta - Siempre centrar
  useLayoutEffect(() => {
    // Esperar al siguiente frame para asegurar layout listo
    const timer = setTimeout(() => {
      requestAnimationFrame(centerActiveNav);
    }, 200);
    return () => clearTimeout(timer);
  }, [location.pathname, viewRole, centerActiveNav]);

  const LinkClass = (isActive) => {
    // Color neutro (no activo) por rol con estilos premium mejorados
    const neutralByRole = role === 'guest'
      ? 'text-gray-600'
      : (viewRole === 'provider'
          ? 'text-brand-600'
          : viewRole === 'client'
            ? 'text-emerald-600'
            : viewRole === 'admin'
              ? 'text-indigo-600'
              : 'text-gray-600');
    
    // Estilos activos premium con gradientes y efectos de sombra mejorados
    const activeByRole = role === 'guest'
      ? 'bg-gray-900 text-white shadow-lg ring-1 ring-gray-700/50'
      : (viewRole === 'provider'
          ? 'bg-brand-600 text-white shadow-lg ring-1 ring-brand-500/40'
          : viewRole === 'client'
            ? 'bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-500/40'
            : viewRole === 'admin'
              ? 'bg-purple-600 text-white shadow-lg ring-1 ring-purple-500/40'
              : 'bg-gray-700 text-white shadow-lg');
    
    // Hover states mejorados con transiciones suaves
    const hoverByRole = role === 'guest'
      ? 'hover:bg-gray-100/80 hover:text-gray-900 hover:shadow-md hover:scale-[1.02]'
      : (viewRole === 'provider'
          ? 'hover:bg-linear-to-r hover:from-brand-50 hover:to-cyan-50 hover:text-brand-700 hover:shadow-md hover:scale-[1.02] hover:ring-1 hover:ring-brand-200'
          : viewRole === 'client'
            ? 'hover:bg-linear-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700 hover:shadow-md hover:scale-[1.02] hover:ring-1 hover:ring-emerald-200'
            : viewRole === 'admin'
              ? 'hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02] hover:ring-1 hover:ring-indigo-200'
              : 'hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:scale-[1.02]');
    
    // En resoluciones intermedias (md a lg) solo mostrar iconos más grandes, en lg+ mostrar texto
    return `nav-link-tooltip group relative px-3 py-2 md:px-4 md:py-2.5 lg:px-3.5 lg:py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out backdrop-blur-sm ${isActive ? `${activeByRole}` : `${neutralByRole} ${hoverByRole}`}`;
  };
  
  // Componente para link con tooltip (showLabel fuerza mostrar texto siempre, ej. en menú móvil)
  // Diseño premium con efectos visuales modernos
  const NavLinkWithTooltip = ({ to, onClick, icon, label, badge, end = false, showLabel = false }) => (
    <NavLink
      to={to}
      end={end}
      title={!showLabel ? label : undefined}
      onClick={(e) => {
        // Hacer scroll al elemento cuando se clickea (solo en desktop nav)
        if (!showLabel) {
          const target = e.currentTarget;
          if (navRef.current) {
            // Delay más largo para permitir que la navegación complete antes de scrollear
            setTimeout(() => {
              const nav = navRef.current;
              if (nav && target) {
                try {
                  target.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                } catch {
                  const scrollOffset = target.offsetLeft - (nav.clientWidth / 2) + (target.offsetWidth / 2);
                  const clampedOffset = Math.max(0, Math.min(scrollOffset, nav.scrollWidth - nav.clientWidth));
                  nav.scrollTo({ left: clampedOffset, behavior: 'smooth' });
                }
                // Actualizar botones después del scroll
                setTimeout(updateNavScrollState, 600);
              }
            }, 120);
          }
        }
        onClick && onClick(e);
      }}
      className={({isActive}) => showLabel 
        ? `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ease-out ${isActive 
            ? (viewRole === 'provider' 
                ? 'bg-linear-to-r from-brand-50 via-brand-50 to-cyan-50 text-brand-700 ring-2 ring-brand-200/60 shadow-sm' 
              : viewRole === 'client' 
                ? 'bg-linear-to-r from-emerald-50 via-emerald-50 to-teal-50 text-emerald-700 ring-2 ring-emerald-200/60 shadow-sm' 
              : viewRole === 'admin' 
                ? 'bg-linear-to-r from-indigo-50 via-indigo-50 to-purple-50 text-indigo-700 ring-2 ring-indigo-200/60 shadow-sm' 
              : 'bg-gray-100 text-gray-900 ring-2 ring-gray-200/60 shadow-sm') 
            : 'text-gray-700 hover:bg-linear-to-r hover:from-gray-50/80 hover:to-gray-100/80 hover:text-gray-900 hover:shadow-sm'}`
        : LinkClass(isActive)
      }
    >
      {({isActive}) => showLabel ? (
        // Modo móvil: diseño premium con icono + texto + efectos
        <>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ease-out ${isActive 
            ? (viewRole === 'provider' 
                ? 'bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/30' 
              : viewRole === 'client' 
                ? 'bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
              : viewRole === 'admin' 
                ? 'bg-linear-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30' 
              : 'bg-linear-to-br from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/30') 
            : 'bg-linear-to-br from-gray-100 to-gray-200 text-gray-500 group-hover:from-emerald-100 group-hover:to-teal-100 group-hover:text-emerald-600 group-hover:shadow-md'}`}>
            <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <span className="font-semibold">{label}</span>
            {isActive && (
              <span className={`text-[10px] font-medium uppercase tracking-wide ${
                viewRole === 'provider' ? 'text-brand-500' 
                : viewRole === 'client' ? 'text-emerald-500' 
                : viewRole === 'admin' ? 'text-indigo-500' 
                : 'text-gray-500'
              }`}>
                Activo
              </span>
            )}
          </div>
          {badge && (
            <div className="relative">
              {badge}
              {/* Efecto de brillo animado para badges */}
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none"></span>
            </div>
          )}
        </>
      ) : (
        // Modo desktop: iconos con tooltip nativo en tablets, texto completo en lg+
        <>
          <span 
            ref={(el) => { if (isActive) activeNavLinkRef.current = el; }}
            className="flex items-center gap-2 relative"
          >
            <span className={`[&>svg]:w-5 [&>svg]:h-5 lg:[&>svg]:w-4.5 lg:[&>svg]:h-4.5 flex items-center transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
              {icon}
            </span>
            <span className="hidden lg:inline tracking-tight">{label}</span>
            {badge && (
              <span className="relative">
                {badge}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  );

  const RoleLinks = ({ isMobile = false }) => (
    <>
      {role === 'guest' && (
        <>
          <NavLinkWithTooltip
            to="/"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            label="Explora nuestros servicios"
            showLabel={isMobile}
          />
          <NavLinkWithTooltip
            to="/unete"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
            label="Únete como profesional"
            showLabel={isMobile}
          />
        </>
      )}

      {(isAuthenticated && viewRole === 'client') && (
        <>
          {roles?.includes('provider') ? (
            <>
              <NavLinkWithTooltip
                to="/mis-solicitudes"
                end
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6a1 1 0 001 1h6" />
                </svg>}
                label="Solicitudes"
                showLabel={isMobile}
                badge={Number(counters?.client?.requestsOpen||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white min-w-5 shadow-lg shadow-emerald-500/40 ring-2 ring-white/30 animate-pulse-badge">
                    {counters.client.requestsOpen > 99 ? '99+' : counters.client.requestsOpen}
                  </span>
                )}
              />
              <NavLinkWithTooltip
                to="/reservas"
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
                </svg>}
                label="Reservas"
                showLabel={isMobile}
                badge={Number(counters?.client?.bookingsUpcoming||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white min-w-5 shadow-lg shadow-teal-500/40 ring-2 ring-white/30">
                    {counters.client.bookingsUpcoming > 99 ? '99+' : counters.client.bookingsUpcoming}
                  </span>
                )}
              />
              <NavLinkWithTooltip
                to="/mis-mensajes"
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>}
                label="Mensajes"
                showLabel={isMobile}
                badge={Number(counters?.client?.chatsUnread||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-violet-500 to-purple-500 text-white min-w-5 shadow-lg shadow-violet-500/40 ring-2 ring-white/30 animate-pulse-badge">
                    {counters.client.chatsUnread > 99 ? '99+' : counters.client.chatsUnread}
                  </span>
                )}
              />
              <NavLinkWithTooltip
                to="/empleos"
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>}
                label="Empleos"
                showLabel={isMobile}
                badge={Number(counters?.provider?.jobs||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-brand-500 to-cyan-500 text-white min-w-5 shadow-lg shadow-brand-500/40 ring-2 ring-white/30">
                    {counters.provider.jobs > 99 ? '99+' : counters.provider.jobs}
                  </span>
                )}
              />
            </>
          ) : (
            <>
              <NavLinkWithTooltip
                to="/mis-solicitudes"
                end
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6a1 1 0 001 1h6" />
                </svg>}
                label="Solicitudes"
                showLabel={isMobile}
                badge={Number(counters?.client?.requestsOpen||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 text-white min-w-5 shadow-lg shadow-emerald-500/40 ring-2 ring-white/30 animate-pulse-badge">
                    {counters.client.requestsOpen > 99 ? '99+' : counters.client.requestsOpen}
                  </span>
                )}
              />
              <NavLinkWithTooltip
                to="/reservas"
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
                </svg>}
                label="Reservas"
                showLabel={isMobile}
                badge={Number(counters?.client?.bookingsUpcoming||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-teal-500 to-cyan-500 text-white min-w-5 shadow-lg shadow-teal-500/40 ring-2 ring-white/30">
                    {counters.client.bookingsUpcoming > 99 ? '99+' : counters.client.bookingsUpcoming}
                  </span>
                )}
              />
              <NavLinkWithTooltip
                to="/mis-mensajes"
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>}
                label="Mensajes"
                showLabel={isMobile}
                badge={Number(counters?.client?.chatsUnread||0) > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-violet-500 to-purple-500 text-white min-w-5 shadow-lg shadow-violet-500/40 ring-2 ring-white/30 animate-pulse-badge">
                    {counters.client.chatsUnread > 99 ? '99+' : counters.client.chatsUnread}
                  </span>
                )}
              />
              <NavLinkWithTooltip
                to="/provider/onboarding"
                onClick={closeMenu}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v3m0 0v3m0-3h3m-3 0h-3" opacity="0.5" />
                </svg>}
                label="Ser profesional"
                showLabel={isMobile}
              />
            </>
          )}
        </>
      )}

      {(isAuthenticated && viewRole === 'provider') && (
        <>
          <NavLinkWithTooltip
            to="/empleos"
            end
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            label="Empleos"
            showLabel={isMobile}
            badge={Number(counters?.provider?.jobs||0) > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-brand-500 to-cyan-500 text-white min-w-5 shadow-lg shadow-brand-500/30 animate-pulse-badge">
                {counters.provider.jobs > 99 ? '99+' : counters.provider.jobs}
              </span>
            )}
          />
          <NavLinkWithTooltip
            to="/mensajes"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            label="Solicitudes"
            showLabel={isMobile}
            badge={Number(counters?.provider?.proposalsActive||0) > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-cyan-500 to-blue-500 text-white min-w-5 shadow-lg shadow-cyan-500/30">
                {counters.provider.proposalsActive > 99 ? '99+' : counters.provider.proposalsActive}
              </span>
            )}
          />
          <NavLinkWithTooltip
            to="/portafolio"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            label="Portafolio"
            showLabel={isMobile}
          />
          <NavLinkWithTooltip
            to="/plan"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
            label="Plan"
            showLabel={isMobile}
          />
          <NavLinkWithTooltip
            to="/servicios"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            label="Servicios"
            showLabel={isMobile}
            badge={Number(counters?.provider?.services||0) > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-2 py-1 rounded-full bg-linear-to-r from-brand-500 to-cyan-500 text-white min-w-5 shadow-lg shadow-brand-500/30">
                {counters.provider.services > 99 ? '99+' : counters.provider.services}
              </span>
            )}
          />
          <NavLinkWithTooltip
            to="/calendario"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            label="Calendario"
            showLabel={isMobile}
          />
          <NavLinkWithTooltip
            to="/referidos"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            label="Referidos"
            showLabel={isMobile}
          />
          <NavLinkWithTooltip
            to="/reservas"
            onClick={closeMenu}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            label="Reservas"
            showLabel={isMobile}
            badge={Number(counters?.provider?.bookingsUpcoming||0) > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] leading-none font-bold px-1.5 py-0.5 rounded-full bg-brand-500 text-white min-w-4.5 shadow-sm">
                {counters.provider.bookingsUpcoming > 99 ? '99+' : counters.provider.bookingsUpcoming}
              </span>
            )}
          />
        </>
      )}

      {(isAuthenticated && viewRole === 'admin') && (
        <>
          <NavLink
            to="/admin"
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              `group relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive
                  ? 'bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}>
                  <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <span className={isMobile ? '' : 'hidden lg:inline'}>Sistema</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/admin/alertas"
            onClick={closeMenu}
            className={({ isActive }) =>
              `group relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive
                  ? 'bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}>
                  <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadAdmin > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full shadow-lg animate-pulse ring-2 ring-white">
                      {unreadAdmin > 99 ? '99+' : unreadAdmin}
                    </span>
                  )}
                </span>
                <span className={isMobile ? '' : 'hidden lg:inline'}>Alertas</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/admin/moderacion"
            onClick={closeMenu}
            className={({ isActive }) =>
              `group relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive
                  ? 'bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}>
                  <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <span className={isMobile ? '' : 'hidden lg:inline'}>Moderación</span>
              </>
            )}
          </NavLink>
        </>
      )}
    </>
  );

  // Auto-ajuste del modo visual según la ruta actual (solo para usuarios con el rol correspondiente)
  const pathRole = useMemo(() => {
    const p = location.pathname || '';
    // Mapear rutas fuertes a roles específicos
    const providerPaths = [
      '/empleos', '/mensajes', '/servicios', '/calendario', '/referidos', '/plan', '/empleos/'
    ];
    // Nota: '/reservas' es compartida entre cliente y proveedor, tratar como neutral (sin auto-switch)
    const clientPaths = [
      '/mis-solicitudes', '/mis-solicitudes/nueva', '/mis-solicitudes/'
    ];
    if (providerPaths.some(seg => p === seg || p.startsWith(seg))) return 'provider';
    if (clientPaths.some(seg => p === seg || p.startsWith(seg))) return 'client';
    if (p.startsWith('/admin')) return 'admin';
    return '';
  }, [location.pathname]);

  // Navigate to a sensible landing when user manually switches mode from an area of the other role
  // IMPORTANTE: Esta función combina navegación + cambio de rol con flag de transición para evitar flash
  const switchToRole = useCallback((target) => {
    // 1. Activar flag de transición ANTES de cualquier cambio
    // Esto evita que los componentes muestren mensajes de "esta sección es para X"
    startRoleSwitch();
    
    // 2. Navegar a la nueva ruta
    if (target === 'provider') {
      if (pathRole === 'client' || pathRole === '' || pathRole === 'admin') {
        navigate('/empleos', { replace: true });
      }
    } else if (target === 'client') {
      navigate('/', { replace: true });
    }
    
    // 3. Cambiar el rol (esto también desactiva el flag de transición)
    // Usamos setTimeout(0) para ejecutar después del ciclo actual de eventos
    setTimeout(() => {
      changeViewRole(target);
    }, 0);
  }, [pathRole, navigate, changeViewRole, startRoleSwitch]);

  // Saber si el modo actual está fijado manualmente
  const isViewLocked = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('view_role_lock');
      const lockedRole = raw ? (JSON.parse(raw)?.role || '').toLowerCase() : '';
      return !!lockedRole && lockedRole === viewRole;
    } catch {
      return false;
    }
  }, [viewRole]);

  // Color del indicador/etiquetas según rol activo
  const roleColorClass = useMemo(() => {
    switch (viewRole) {
      case 'provider':
        return 'text-brand-700';
      case 'client':
        return 'text-emerald-700';
      case 'admin':
        return 'text-indigo-700';
      default:
        return 'text-gray-700';
    }
  }, [viewRole]);

  // Colores de acento (logo, botones primarios) por rol
  const accent = useMemo(() => {
    const r = role === 'guest' ? 'guest' : viewRole;
    switch (r) {
      case 'provider':
        return {
          text600: 'text-brand-600',
          hoverText700: 'hover:text-brand-700',
          bg600: 'bg-brand-600',
          hoverBg700: 'hover:bg-brand-700',
          ring500: 'focus:ring-brand-500',
          hoverRing500: 'hover:ring-brand-500',
          border200: 'border-brand-200',
          border300: 'border-brand-300',
          hoverBg50: 'hover:bg-brand-50'
        };
      case 'client':
        return {
          text600: 'text-emerald-600',
          hoverText700: 'hover:text-emerald-700',
          bg600: 'bg-emerald-600',
          hoverBg700: 'hover:bg-emerald-700',
          ring500: 'focus:ring-emerald-500',
          hoverRing500: 'hover:ring-emerald-500',
          border200: 'border-emerald-200',
          border300: 'border-emerald-300',
          hoverBg50: 'hover:bg-emerald-50'
        };
      case 'admin':
        return {
          text600: 'text-indigo-600',
          hoverText700: 'hover:text-indigo-700',
          bg600: 'bg-indigo-600',
          hoverBg700: 'hover:bg-indigo-700',
          ring500: 'focus:ring-indigo-500',
          hoverRing500: 'hover:ring-indigo-500',
          border200: 'border-indigo-200',
          border300: 'border-indigo-300',
          hoverBg50: 'hover:bg-indigo-50'
        };
      default: // guest (negro)
        return {
          text600: 'text-black',
          hoverText700: 'hover:text-black',
          bg600: 'bg-black',
          hoverBg700: 'hover:bg-gray-900',
          ring500: 'focus:ring-gray-800',
          hoverRing500: 'hover:ring-gray-800',
          border200: 'border-gray-300',
          border300: 'border-gray-400',
          hoverBg50: 'hover:bg-gray-50'
        };
    }
  }, [role, viewRole]);

  useEffect(() => {
    if (!pathRole) return; // rutas neutrales no cambian el modo
    // Solo cambiar si el usuario realmente tiene ese rol (o es admin)
    const can = pathRole === 'guest' || roles?.includes(pathRole) || role === pathRole;
    // Respetar bloqueo de vista por acción manual: solo desbloquear si se sale del área
    let lockedRole = '';
    try {
      const raw = sessionStorage.getItem('view_role_lock');
      if (raw) lockedRole = (JSON.parse(raw)?.role || '').toLowerCase();
    } catch { /* ignore */ }

    if (can && pathRole !== viewRole) {
      if (lockedRole && lockedRole !== pathRole) {
        // Saliendo del área bloqueada -> liberar bloqueo y aplicar auto
        try { sessionStorage.removeItem('view_role_lock'); } catch { /* ignore */ }
        changeViewRole(pathRole);
      } else if (!lockedRole) {
        // No hay bloqueo -> auto-ajustar
        changeViewRole(pathRole);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathRole]);

  // Admin unread badge (admin-only) + global unread for bell (all roles)
  useEffect(() => {
    let intervalId;
    let mounted = true;

    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications?limit=1');
        const count = data?.data?.unreadCount || 0;
        if (!mounted) return;
        setUnreadCount(count);
        // For admin menu badge we keep a separate counter
        if (role === 'admin') setUnreadAdmin(count); else setUnreadAdmin(0);
      } catch {/* ignore */}
    };

    if (isAuthenticated && user?.emailVerified === true) {
      fetchUnread();
      // Polling cada 2 minutos para reducir carga en el servidor (los WebSockets actualizan en tiempo real)
      intervalId = setInterval(fetchUnread, 120000);
      const handleUpdated = () => fetchUnread();
      window.addEventListener('notifications:updated', handleUpdated);
      return () => {
        mounted = false;
        clearInterval(intervalId);
        window.removeEventListener('notifications:updated', handleUpdated);
      };
    }
  }, [role, isAuthenticated, user]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || user?.emailVerified !== true) return;
    setNotifLoading(true);
    try {
      const { data } = await api.get('/notifications?page=1&limit=5');
      setNotifications(data?.data?.notifications || []);
      setUnreadCount(data?.data?.unreadCount || 0);
    } catch {/* ignore */}
    finally { setNotifLoading(false); }
  }, [isAuthenticated, user?.emailVerified]);

  useEffect(() => {
    if (notifOpen && user?.emailVerified === true) {
      loadNotifications();
    }
  }, [notifOpen, loadNotifications, user]);

  // Fetch counters periodically and on auth/role changes
  useEffect(() => {
    let mounted = true;
    let intervalId;
    const fetchCounters = async () => {
      if (!isAuthenticated || user?.emailVerified !== true) return;
      try {
        const { data } = await api.get('/counters');
        const payload = data?.data || { notificationsUnread: 0 };
        if (!mounted) return;
        setCounters(payload);
      } catch { /* ignore */ }
    };
    if (isAuthenticated && user?.emailVerified === true) {
      fetchCounters();
      // Polling cada 2 minutos para reducir carga (WebSockets manejan actualizaciones en tiempo real)
      intervalId = setInterval(fetchCounters, 120000);
      const onUpdate = () => fetchCounters();
      window.addEventListener('notifications:updated', onUpdate);
      return () => {
        mounted = false;
        clearInterval(intervalId);
        window.removeEventListener('notifications:updated', onUpdate);
      };
    }
  }, [isAuthenticated, role, roles, viewRole, user]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      // Optimistic update
      setNotifications((arr) => arr.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (role === 'admin') setUnreadAdmin((c) => Math.max(0, c - 1));
    } catch {/* ignore */}
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      setNotifications((arr) => arr.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      if (role === 'admin') setUnreadAdmin(0);
    } catch {/* ignore */}
  };

  // Realtime notifications via Socket.IO
  useEffect(() => {
    // Use shared socket; subscribe to notifications and counters
    const s = getSocket();
    socketRef.current = s;
    
    // Solo necesitamos socket y autenticación para registrar listeners
    // El userId se lee dinámicamente desde userIdRef dentro de los handlers
    if (!isAuthenticated || !s) {
      console.log('🔌 Socket listener not registered:', { isAuthenticated, hasSocket: !!s });
      return;
    }

    console.log('🔌 Registering socket listeners (userId will be read from ref)');

    const onConnect = () => {
      console.log('🔌 Socket connected');
      try { socketEmit('subscribe_notifications'); } catch { /* ignore */ }
    };
    const onNotification = (payload) => {
      // payload shape from server: { id, type, title, message, timestamp }
      setUnreadCount((c) => c + 1);
      if (role === 'admin') setUnreadAdmin((c) => c + 1);
      // Optimistically add to dropdown list if it's open
      setNotifications((prev) => {
        const item = {
          _id: payload?.id || payload?._id,
          id: payload?.id || payload?._id,
          type: payload?.type,
          title: payload?.title || 'Notificación',
          message: payload?.message,
          createdAt: payload?.timestamp || new Date().toISOString(),
          read: false
        };
        const next = [item, ...prev];
        // cap to 10 items to avoid overgrowth in dropdown
        return next.slice(0, 10);
      });
      // Broadcast for any other listeners (e.g., admin page badges)
      try { window.dispatchEvent(new CustomEvent('notifications:updated')); } catch {/* ignore */}
    };
    const onCountersUpdate = () => {
      // When server signals counters changed, refresh immediately
      try {
        api.get('/counters').then(({ data }) => {
          const payload = data?.data || {};
          setCounters(payload);
        }).catch(() => {});
      } catch {/* ignore */}
    };
    
    // Listener para nuevos mensajes de chat - mostrar toast y actualizar contador
    // Usar getGlobalUserId() para obtener el userId dinámicamente (variable de módulo, no ref de React)
    const onNewChatMessage = (payload) => {
      const msg = payload?.message || payload;
      const chatId = payload?.chatId || payload?.chat;
      const chatType = payload?.chatType;
      const relatedTo = payload?.relatedTo;
      
      // Obtener senderId como string para comparación correcta
      const senderId = String(msg?.sender?._id || msg?.sender?.id || msg?.sender || '');
      // Leer userId desde la variable global del módulo (evita stale closures)
      const myUserId = getGlobalUserId() || '';
      
      console.log('📨 onNewChatMessage:', { senderId, myUserId, chatId, msgType: msg?.type });
      
      // No notificar si no tenemos userId (usuario no autenticado)
      if (!myUserId) {
        console.log('📨 Skipping toast - no current user ID');
        return;
      }
      
      // No notificar si el mensaje es del usuario actual
      if (senderId && senderId === myUserId) {
        console.log('📨 Skipping toast - message is from current user');
        return;
      }
      
      // Solo notificar si el mensaje es de tipo texto (no sistema)
      if (msg?.type === 'system') {
        console.log('📨 Skipping toast - system message');
        return;
      }
      
      const senderName = msg?.sender?.name ||
                        msg?.sender?.profile?.firstName || 
                        msg?.sender?.providerProfile?.businessName || 
                        'Nuevo mensaje';
      const messageText = msg?.content?.text || msg?.content || 'Tienes un nuevo mensaje';
      
      // Determinar a dónde navegar cuando se haga click
      const getNavigatePath = () => {
        // Usar ref para obtener viewRole actual
        const currentViewRole = viewRoleRef.current;
        // Navegar a la página de mensajes con el chatId como param
        if (chatId) {
          return currentViewRole === 'provider' 
            ? `/mensajes?chat=${chatId}`
            : `/mis-mensajes?chat=${chatId}`;
        }
        // Fallback a la página de mensajes sin chat específico
        return currentViewRole === 'provider' ? '/mensajes' : '/mis-mensajes';
      };
      
      // Mostrar toast moderno con acción
      // Usar refs para toast y navigate para evitar stale closures
      toastRef.current?.chat(
        `💬 ${senderName}`,
        messageText.length > 60 ? messageText.substring(0, 60) + '...' : messageText,
        { 
          duration: 8000,
          action: {
            label: 'Ver mensaje →',
            onClick: () => {
              navigateRef.current?.(getNavigatePath());
            }
          }
        }
      );
      
      // Reproducir sonido de notificación
      try {
        const audio = document.getElementById('notification-sound');
        if (audio) {
          audio.currentTime = 0;
          audio.volume = 0.5;
          audio.play().catch(() => {}); // Ignorar si autoplay está bloqueado
        }
      } catch {/* ignore */}
      
      // Actualizar contadores
      onCountersUpdate();
      
      console.log('📩 New chat message received:', { chatId, senderId, senderName, chatType });
    };

    const offConnect = socketOn('connect', onConnect);
    const offNotif = socketOn('notification', onNotification);
    const offCounters = socketOn('counters_update', onCountersUpdate);
    const offNewMessage = socketOn('new_message', onNewChatMessage);
    
    console.log('✅ Socket listeners registered for events: connect, notification, counters_update, new_message');
    
    return () => {
      console.log('🔌 Cleaning up socket listeners (caused by dependency change)');
      try { offConnect(); offNotif(); offCounters(); offNewMessage(); } catch { /* ignore */ }
    };
    // Dependencias mínimas: solo isAuthenticated
    // toast y navigate se leen desde refs para evitar re-runs innecesarios
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Provider upgrade banner: check subscription status and local upgrade_hint
  const subscriptionCacheRef = useRef({ ts: 0, payload: null });
  const subscriptionFetchInFlightRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      if (!isAuthenticated || viewRole !== 'provider') { setUpgradeHint({ show: false, reason: '' }); return; }
      // Reutilizar caché por 60s para evitar 429
      const now = Date.now();
      const cacheAge = now - subscriptionCacheRef.current.ts;
      if (cacheAge < 60000 && subscriptionCacheRef.current.payload) {
        const { sub, plan } = subscriptionCacheRef.current.payload;
        const localHint = localStorage.getItem('upgrade_hint') === '1';
        let show = false; let reason = '';
        if (!sub || sub.status !== 'active') { show = true; reason = 'Tu suscripción está inactiva. Actívala para obtener más leads.'; }
        if (plan?.features?.leadLimit >= 0 && sub?.leadsUsed >= plan.features.leadLimit) { show = true; reason = 'Has alcanzado tu límite mensual de leads. Mejora tu plan para continuar.'; }
        if (localHint) { show = true; reason = reason || 'Mejora tu plan para continuar.'; }
        if (mounted) setUpgradeHint({ show, reason });
        return;
      }
      if (subscriptionFetchInFlightRef.current) return; // evitar solapamientos
      subscriptionFetchInFlightRef.current = true;
      try {
        const { data } = await api.get('/provider/subscription/status');
        const sub = data?.data?.subscription;
        const plan = data?.data?.plan;
        subscriptionCacheRef.current = { ts: Date.now(), payload: { sub, plan } };
        const localHint = localStorage.getItem('upgrade_hint') === '1';
        let show = false; let reason = '';
        if (!sub || sub.status !== 'active') { show = true; reason = 'Tu suscripción está inactiva. Actívala para obtener más leads.'; }
        if (plan?.features?.leadLimit >= 0 && sub?.leadsUsed >= plan.features.leadLimit) { show = true; reason = 'Has alcanzado tu límite mensual de leads. Mejora tu plan para continuar.'; }
        if (localHint) { show = true; reason = reason || 'Mejora tu plan para continuar.'; }
        if (mounted) setUpgradeHint({ show, reason });
      } catch {
        // Si el servidor rate-limitea (429) mantener último estado sin spamear
        if (mounted) setUpgradeHint(h => ({ ...h }));
      } finally {
        subscriptionFetchInFlightRef.current = false;
      }
    };
    fetchStatus();
    // Permitir invalidación manual externa
    const onInvalidate = () => { subscriptionCacheRef.current.ts = 0; fetchStatus(); };
    window.addEventListener('subscription:invalidate', onInvalidate);
    return () => { mounted = false; window.removeEventListener('subscription:invalidate', onInvalidate); };
  }, [isAuthenticated, viewRole]);

  if (isBlocked) {
    // No renderizar header ni menú si está pendiente de verificación
    return null;
  }
  return (
    <>
    <header ref={headerRef} className="header-glass bg-white/70 backdrop-blur-2xl border-b border-gray-100/80 sticky top-0 z-50 transition-all duration-500 shadow-sm hover:shadow-md" role="banner">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>
      
      {/* Primera fila: Logo + Navegación/SearchBar + Usuario */}
      <div className="relative container mx-auto px-2 sm:px-4 lg:px-6 min-h-14 sm:min-h-16 py-2 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link 
            to={isAuthenticated && viewRole === 'admin' ? '/admin' : isAuthenticated && viewRole === 'provider' ? '/empleos' : '/'} 
            state={isAuthenticated && (viewRole === 'provider' || viewRole === 'admin') ? undefined : { resetHome: true }}
            className={`flex items-center gap-2 sm:gap-3 group transition-all duration-300 ${role === 'guest' ? 'text-brand-600 hover:text-brand-700' : `${accent.text600} ${accent.hoverText700}`}`}
          >
            {/* Logo icon mejorado con efectos premium */}
            <div className="relative">
              {/* Glow effect animado */}
              <div className="absolute inset-0 bg-linear-to-br from-brand-400/40 to-cyan-400/40 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-125 animate-pulse-slow"></div>
              <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 group-hover:scale-110"></div>
              {/* Logo NovoFix - SVG optimizado */}
              <img 
                src="/novofix-logo.svg" 
                alt="NovoFix Logo" 
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative drop-shadow-lg"
              />
            </div>
            {/* Brand name con efecto hover y gradiente mejorado */}
            <span className={`text-xl sm:text-2xl font-bold tracking-tight transition-all duration-300 ${searchBarState.show ? 'hidden sm:inline' : ''}`}>
              <span className="bg-linear-to-r from-brand-600 via-brand-500 to-cyan-500 bg-clip-text text-transparent group-hover:from-brand-700 group-hover:via-brand-600 group-hover:to-cyan-600 transition-all duration-300">Novo</span>
              <span className="text-gray-800 group-hover:text-gray-900 transition-colors duration-300">Fix</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-2 min-w-0 flex-1 overflow-visible">
          {/* SearchBar integrado cuando hay búsqueda activa */}
          {searchBarState.show && (
            <div className="flex-1 min-w-0 max-w-md animate-fade-in">
              {/* SearchBar compacto unificado para categorías y búsquedas */}
              <form onSubmit={(e) => { e.preventDefault(); if (searchBarState.onSearch) searchBarState.onSearch({ type: 'text', query: e.target.elements.search.value }); }} className="flex gap-0 sm:gap-2 items-center">
                <div className="animated-placeholder-wrapper flex-1 min-w-0 border border-gray-200/80 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300">
                  <input
                    ref={searchInputRef}
                    name="search"
                    type="text"
                    placeholder=" "
                    onInput={(e) => setSearchInputValue(e.target.value)}
                    className="w-full min-w-0 px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 border-0 focus:outline-none rounded-lg sm:rounded-xl bg-transparent"
                    title={searchBarState.categoryName ? `Buscar en ${searchBarState.categoryName}` : 'Buscar servicios'}
                  />
                  <span 
                    ref={searchPlaceholderRef} 
                    className={`animated-placeholder ${searchNeedsAnimation ? 'overflow' : ''}`}
                    style={{ display: searchInputValue ? 'none' : 'block' }}
                  >
                    {searchBarState.categoryName ? `Buscar en ${searchBarState.categoryName}...` : 'Buscar servicios profesionales...'}
                  </span>
                </div>
                <button
                  ref={accountToggleRef}
                  type="submit"
                  className="bg-linear-to-r from-brand-600 to-brand-500 text-white w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl hover:from-brand-700 hover:to-brand-600 shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95"
                  aria-label="Buscar"
                >
                  <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
          )}
          
          {/* Navegación siempre visible */}
          {(role === 'guest' || (isAuthenticated && (viewRole === 'provider' || viewRole === 'admin' || viewRole === 'client'))) && (
            <div className={`relative hidden md:block ${searchBarState.show ? 'shrink min-w-0 max-w-xs lg:max-w-sm' : 'flex-1 min-w-0'}`}>
              <nav
                ref={navRef}
                className={`flex items-center text-sm overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth pr-8 pl-8 w-full py-2 ${searchBarState.show ? 'gap-2' : 'gap-1'}`}
                role="navigation"
                aria-label="Menú principal"
              >
                <RoleLinks />
              </nav>
              {/* Botones de scroll sin gradientes */}
              {canScrollNavLeft && (
                <button
                  type="button"
                  className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg text-gray-600 hover:text-brand-600 hover:bg-white hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-400 transition-all duration-200 hover:scale-110"
                  aria-label="Desplazar menú a la izquierda"
                  onClick={() => {
                    navRef.current?.scrollBy({ left: -100, behavior: 'smooth' });
                    setTimeout(updateNavScrollState, 400);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M12.78 4.22a.75.75 0 010 1.06L8.56 9.5l4.22 4.22a.75.75 0 11-1.06 1.06l-4.75-4.75a.75.75 0 010-1.06l4.75-4.75a.75.75 0 011.06 0z" clipRule="evenodd"/></svg>
                </button>
              )}
              {canScrollNavRight && (
                <button
                  type="button"
                  className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg text-gray-600 hover:text-brand-600 hover:bg-white hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-400 transition-all duration-200 hover:scale-110"
                  aria-label="Desplazar menú a la derecha"
                  onClick={() => {
                    navRef.current?.scrollBy({ left: 100, behavior: 'smooth' });
                    setTimeout(updateNavScrollState, 400);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M7.22 15.78a.75.75 0 010-1.06L11.44 10.5 7.22 6.28a.75.75 0 111.06-1.06l4.75 4.75a.75.75 0 010 1.06l-4.75 4.75a.75.75 0 01-1.06 0z" clipRule="evenodd"/></svg>
                </button>
              )}
            </div>
          )}

          {/* Mobile bell (always visible for authenticated users on small screens) */}
          {isAuthenticated && (
            <div className="relative md:hidden shrink-0 ml-auto" ref={notifToggleRef}>
              <button
                type="button"
                aria-label="Notificaciones"
                className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md ${accent.text600} ${accent.hoverText700} focus:outline-none focus:ring-2 focus:ring-offset-1 ${accent.ring500} ${accent.border200} hover:border-brand-300 transition-all duration-300 hover:scale-105`}
                onClick={() => setNotifOpen(v => !v)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 005 13h14a1 1 0 00.707-1.707L19 10.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center text-[10px] leading-none font-bold px-1.5 py-0.5 rounded-full bg-linear-to-r from-red-500 to-red-600 text-white min-w-5 shadow-lg shadow-red-500/30 ring-2 ring-white animate-bounce-subtle">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div ref={notifMenuRef} className={`absolute right-0 mt-3 w-80 max-w-[95vw] rounded-2xl border bg-white/95 backdrop-blur-xl shadow-2xl py-2 z-50 ${accent.border200} ring-1 ring-black/5 animate-slide-down`} role="menu" aria-label="Notificaciones">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900">Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">({unreadCount} nuevas)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors" onClick={markAll}>Marcar todas</button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifLoading && (
                      <div className="px-4 py-8 text-center">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Cargando...</p>
                      </div>
                    )}
                    {!notifLoading && notifications.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Sin notificaciones</p>
                      </div>
                    )}
                    {notifications.map((n, index) => {
                      const id = n._id || n.id;
                      return (
                        <div key={id} className={`px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50 ${!n.read ? 'bg-brand-50/50 border-l-3 border-l-brand-500' : ''} ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-gray-300' : 'bg-brand-500 animate-pulse'}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{n.title || 'Notificación'}</div>
                              <div className="text-gray-600 line-clamp-2 mt-0.5">{n.message || n.body || '—'}</div>
                              <div className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                            </div>
                            {!n.read && (
                              <button
                                className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-lg shrink-0 transition-colors"
                                onClick={() => markRead(id)}
                              >
                                Leída
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Link 
                      to="/notificaciones" 
                      className="flex items-center justify-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 py-2 rounded-lg transition-colors" 
                      onClick={()=> setNotifOpen(false)}
                    >
                      Ver todas las notificaciones
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className={`md:hidden inline-flex items-center justify-center rounded-xl p-2 sm:p-2.5 border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 ${accent.ring500} ${accent.text600} ${accent.hoverText700} ${open ? `bg-gray-100 ${accent.border300} shadow-inner` : `bg-white/90 backdrop-blur-sm ${accent.border200} shadow-sm hover:shadow-md`} ${!isAuthenticated ? 'ml-auto' : ''} shrink-0 hover:scale-105 active:scale-95`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            ref={mobileToggleRef}
            onClick={() => setOpen((v) => !v)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 transition-all duration-300 ease-out ${open ? 'rotate-180 scale-90' : 'rotate-0'}`}>
              {open ? (
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              )}
            </svg>
          </button>

          {/* Desktop auth actions */
          }
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {role === 'guest' ? (
              <>
                <Link 
                  to="/login" 
                  className="group inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-linear-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Inicia Sesión
                </Link>
                <Link 
                  to="/registrarse" 
                  className="group inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Regístrate
                </Link>
              </>
            ) : (
              <>
                {/* Role switch (md+), placed before bell and account */}
                {roles?.includes('client') && roles?.includes('provider') && (
                  <div className="hidden md:flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 text-xs whitespace-nowrap shadow-inner" role="tablist" aria-label="Cambiar modo">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewRole === 'client'}
                      className={`relative px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${viewRole === 'client' ? 'bg-white text-emerald-700 shadow-md ring-1 ring-emerald-200' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                      onClick={() => switchToRole('client')}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Cliente
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewRole === 'provider'}
                      className={`relative px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${viewRole === 'provider' ? 'bg-white text-brand-700 shadow-md ring-1 ring-brand-200' : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50/50'}`}
                      onClick={() => switchToRole('provider')}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Profesional
                      </span>
                    </button>
                    {isViewLocked && (
                      <span className={`ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium ${roleColorClass} bg-yellow-50 px-1.5 py-0.5 rounded-md ring-1 ring-yellow-200`} title="Modo fijado manualmente" aria-label="Modo fijado manualmente">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-yellow-600">
                          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
                        </svg>
                        Fijado
                      </span>
                    )}
                  </div>
                )}

                {/* Bell notifications (all roles) */}
                <div className="relative ml-2">
                  <button
                    type="button"
                    aria-label="Notificaciones"
                    className={`group inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md ${accent.text600} ${accent.hoverText700} focus:outline-none focus:ring-2 focus:ring-offset-1 ${accent.ring500} ${accent.border200} hover:border-brand-300 transition-all duration-300 hover:scale-105`}
                    onClick={() => setNotifOpen(v => !v)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                      <path d="M12 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 005 13h14a1 1 0 00.707-1.707L19 10.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center text-[10px] leading-none font-bold px-1.5 py-0.5 rounded-full bg-linear-to-r from-red-500 to-red-600 text-white min-w-5 shadow-lg shadow-red-500/30 ring-2 ring-white animate-bounce-subtle">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div ref={notifMenuRef} className={`absolute right-0 mt-3 w-96 max-w-[90vw] sm:max-w-[70vw] md:max-w-[60vw] rounded-2xl border bg-white/95 backdrop-blur-xl shadow-2xl py-2 z-50 ${accent.border200} ring-1 ring-black/5 animate-slide-down`} role="menu" aria-label="Notificaciones">
                      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-50 flex items-center justify-center shadow-inner">
                            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">Notificaciones</span>
                            {unreadCount > 0 && (
                              <p className="text-xs text-gray-500">{unreadCount} sin leer</p>
                            )}
                          </div>
                        </div>
                        <button className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors" onClick={markAll}>
                          Marcar todas leídas
                        </button>
                      </div>
                      <div className="max-h-96 overflow-auto">
                        {notifLoading && (
                          <div className="px-4 py-10 text-center">
                            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-sm text-gray-500">Cargando notificaciones...</p>
                          </div>
                        )}
                        {!notifLoading && notifications.length === 0 && (
                          <div className="px-4 py-10 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Sin notificaciones</p>
                            <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando tengas nuevas</p>
                          </div>
                        )}
                        {notifications.map((n, index) => {
                          const id = n._id || n.id;
                          return (
                            <div key={id} className={`px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-brand-50/50 border-l-3 border-l-brand-500' : ''} ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-all duration-300 ${n.read ? 'bg-gray-300' : 'bg-brand-500 ring-4 ring-brand-100 animate-pulse'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900">{n.title || 'Notificación'}</div>
                                  <div className="text-gray-600 line-clamp-2 mt-0.5">{n.message || n.body || '—'}</div>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-gray-400">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
                                    {!n.read && (
                                      <button
                                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                                        onClick={(e) => { e.stopPropagation(); markRead(id); }}
                                      >
                                        Marcar como leída
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                        <Link 
                          to="/notificaciones" 
                          className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 py-2.5 rounded-xl transition-all duration-200 group" 
                          onClick={()=> setNotifOpen(false)}
                        >
                          Ver todas las notificaciones
                          <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                

                <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={()=>setAccountOpen((v)=>!v)}
                  className={`group inline-flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl border-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-lg ${accent.text600} ${accent.hoverText700} focus:outline-none focus:ring-2 focus:ring-offset-1 ${accent.ring500} ${accountOpen ? `${accent.border300} shadow-md` : 'border-gray-200 hover:border-brand-200'} min-w-0 max-w-[40vw] md:max-w-[28vw] lg:max-w-[22vw] 2xl:max-w-[20vw] transition-all duration-300 hover:scale-[1.02]`}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label={`Menú de cuenta: ${firstName || email || 'Cuenta'}`}
                >
                  {/* Avatar o iniciales con ring mejorado */}
                  <div className={`relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-offset-1 transition-all duration-300 group-hover:ring-offset-2 ${viewRole === 'provider' ? 'ring-brand-400 bg-linear-to-br from-brand-100 to-brand-50' : viewRole === 'client' ? 'ring-emerald-400 bg-linear-to-br from-emerald-100 to-emerald-50' : viewRole === 'admin' ? 'ring-indigo-400 bg-linear-to-br from-indigo-100 to-indigo-50' : 'ring-gray-300 bg-linear-to-br from-gray-100 to-gray-50'}`}>
                    {user?.profile?.avatar ? (
                      <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-sm font-bold ${viewRole === 'provider' ? 'text-brand-700' : viewRole === 'client' ? 'text-emerald-700' : viewRole === 'admin' ? 'text-indigo-700' : 'text-gray-600'}`}>{initials}</span>
                    )}
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
                  </div>
                  {/* Nombre completo truncado en pantallas grandes */}
                  <div className="hidden lg:flex flex-col items-start min-w-0">
                    <span
                      className="font-semibold text-gray-900 truncate max-w-[20vw] lg:max-w-[20ch] xl:max-w-[28ch]"
                      title={firstName || email || 'Cuenta'}
                    >
                      {firstName || email || 'Cuenta'}
                    </span>
                    {/* Chip de modo actual inline */}
                    {role !== 'guest' && (
                      <span className={`text-[10px] font-medium ${viewRole === 'provider' ? 'text-brand-600' : viewRole === 'client' ? 'text-emerald-600' : viewRole === 'admin' ? 'text-indigo-600' : 'text-gray-500'}`}>
                        Modo {viewRole === 'provider' ? 'Profesional' : viewRole === 'client' ? 'Cliente' : viewRole === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                    )}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${accountOpen ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                </button>
                {accountOpen && (
                  <div
                    ref={accountMenuRef}
                    role="menu"
                    className={`absolute right-0 mt-3 w-72 rounded-2xl border bg-white/95 backdrop-blur-xl shadow-2xl py-0 z-50 ${accent.border200} ring-1 ring-black/5 overflow-hidden animate-slide-down`}
                  >
                    {/* Header del menú con info del usuario mejorado */}
                    <div className={`px-4 py-4 bg-linear-to-br ${viewRole === 'provider' ? 'from-brand-50 to-brand-100/50' : viewRole === 'client' ? 'from-emerald-50 to-emerald-100/50' : viewRole === 'admin' ? 'from-indigo-50 to-indigo-100/50' : 'from-gray-50 to-gray-100/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-white shadow-lg ${viewRole === 'provider' ? 'bg-brand-100' : viewRole === 'client' ? 'bg-emerald-100' : viewRole === 'admin' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          {user?.profile?.avatar ? (
                            <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className={`text-lg font-bold ${viewRole === 'provider' ? 'text-brand-700' : viewRole === 'client' ? 'text-emerald-700' : viewRole === 'admin' ? 'text-indigo-700' : 'text-gray-600'}`}>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{firstName || 'Mi cuenta'}</p>
                          <p className="text-xs text-gray-500 truncate">{email}</p>
                          {/* Role badge */}
                          {role !== 'guest' && (
                            (() => {
                              let lockedRole = '';
                              try {
                                const raw = sessionStorage.getItem('view_role_lock');
                                if (raw) lockedRole = (JSON.parse(raw)?.role || '').toLowerCase();
                              } catch { /* ignore */ }
                              const isLocked = lockedRole && lockedRole === viewRole;
                              const chipLabel = viewRole === 'provider' ? 'Profesional' : viewRole === 'client' ? 'Cliente' : viewRole === 'admin' ? 'Admin' : 'Modo';
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full ${viewRole === 'provider' ? 'bg-brand-100 text-brand-700' : viewRole === 'client' ? 'bg-emerald-100 text-emerald-700' : viewRole === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'} ${isLocked ? 'ring-1 ring-yellow-400' : ''}`}
                                >
                                  {isLocked && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-yellow-600">
                                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {chipLabel}
                                </span>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Menu items */}
                    <div className="py-2">
                      <Link to="/perfil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group" onClick={()=>setAccountOpen(false)}>
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="font-medium">Mi Perfil</span>
                      </Link>
                    {(viewRole === 'provider') && (
                      <>
                        <Link to="/portafolio" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group" onClick={()=>setAccountOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-medium">Mi Portafolio</span>
                        </Link>
                        <Link to="/plan" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group" onClick={()=>setAccountOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <span className="font-medium">Pagos y Plan</span>
                        </Link>
                      </>
                    )}
                    {/* Switch de modo si multi-rol */}
                    {roles?.includes('client') && roles?.includes('provider') && (
                      <>
                        <div className="my-2 mx-4 border-t border-gray-100"></div>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group" onClick={()=>{ const next = viewRole === 'client' ? 'provider' : 'client'; switchToRole(next); setAccountOpen(false); }}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewRole === 'client' ? 'bg-brand-50 group-hover:bg-brand-100' : 'bg-emerald-50 group-hover:bg-emerald-100'}`}>
                            <svg className={`w-4 h-4 transition-colors ${viewRole === 'client' ? 'text-brand-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                          <span className="font-medium">Cambiar a modo {viewRole === 'client' ? 'Profesional' : 'Cliente'}</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group" onClick={()=>{ clearViewRoleLock(); toast.info('Modo automático restablecido'); setAccountOpen(false); }}>
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-yellow-50 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                          <span className="font-medium">Modo automático</span>
                        </button>
                      </>
                    )}
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50/50 py-2">
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group" onClick={()=>{ setAccountOpen(false); setConfirmOut(true); }}>
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="font-medium">Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </>
            )}
          </div>

          {/* Rectificado: Se elimina la navegación después de la cuenta para Cliente; ahora siempre va antes de la cuenta */}
        </div>
      </div>

      {/* Mobile dropdown panel with animation */}
      <div
        id="mobile-menu"
        aria-hidden={!open}
        ref={mobileMenuRef}
        inert={!open}
        className={
          `md:hidden border-t bg-white/95 backdrop-blur-xl overflow-y-auto transition-all duration-300 ease-out ${accent.border200} ` +
          (open ? 'max-h-[calc(100vh-4rem)] opacity-100 translate-y-0 shadow-xl' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none')
        }
      >
  <div className={`container mx-auto ${role === 'guest' ? 'pl-4 pr-0' : 'px-4'} py-4 flex flex-col gap-3 text-sm min-w-0`}>
          <nav role="navigation" aria-label="Menú principal móvil" className="contents">
          
          {/* User info section for mobile - Premium design */}
          {isAuthenticated && role !== 'guest' && (
            <div className={`pb-4 mb-3 border-b border-gray-100 -mx-4 px-4 bg-linear-to-br ${viewRole === 'provider' ? 'from-brand-50/50 to-transparent' : viewRole === 'client' ? 'from-emerald-50/50 to-transparent' : viewRole === 'admin' ? 'from-indigo-50/50 to-transparent' : 'from-gray-50/50 to-transparent'}`}>
              <div className="flex items-center gap-4">
                {/* Avatar mejorado */}
                <div className={`relative w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-offset-2 shadow-lg ${viewRole === 'provider' ? 'ring-brand-400' : viewRole === 'client' ? 'ring-emerald-400' : viewRole === 'admin' ? 'ring-indigo-400' : 'ring-gray-300'}`}>
                  {user?.profile?.avatar ? (
                    <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-lg font-bold ${viewRole === 'provider' ? 'text-brand-700' : viewRole === 'client' ? 'text-emerald-700' : viewRole === 'admin' ? 'text-indigo-700' : 'text-gray-600'}`}>{initials}</span>
                  )}
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base truncate">
                    {firstName && lastName ? `${firstName} ${lastName}` : firstName || email || 'Usuario'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{email}</div>
                  
                  {/* Role badge mejorado */}
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      let lockedRole = '';
                      try {
                        const raw = sessionStorage.getItem('view_role_lock');
                        if (raw) lockedRole = (JSON.parse(raw)?.role || '').toLowerCase();
                      } catch { /* ignore */ }
                      const isLocked = lockedRole && lockedRole === viewRole;
                      const chipLabel = viewRole==='provider' ? 'Profesional' : viewRole==='client' ? 'Cliente' : viewRole==='admin' ? 'Admin' : 'Usuario';
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${viewRole==='provider' ? 'bg-linear-to-r from-brand-500 to-brand-600 text-white' : viewRole==='client' ? 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white' : viewRole==='admin' ? 'bg-linear-to-r from-indigo-500 to-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} ${isLocked ? 'ring-2 ring-yellow-300 ring-offset-1' : ''}`}
                        >
                          {isLocked && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {chipLabel}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Visible role switch for multi-role users (mobile) - Mejorado */}
          {roles?.includes('client') && roles?.includes('provider') && (
            <div className="flex items-center gap-2 mb-3 p-1 bg-gray-100/80 rounded-xl" aria-label="Cambiar modo">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${viewRole === 'client' ? 'bg-white text-emerald-700 shadow-md ring-1 ring-emerald-200' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                onClick={() => switchToRole('client')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Cliente
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${viewRole === 'provider' ? 'bg-white text-brand-700 shadow-md ring-1 ring-brand-200' : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50/50'}`}
                onClick={() => switchToRole('provider')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Profesional
              </button>
              {isViewLocked && (
                <span className={`ml-1 inline-flex items-center gap-1 text-[10px] font-medium ${roleColorClass} bg-yellow-50 px-2 py-1 rounded-lg`} title="Modo fijado manualmente" aria-label="Modo fijado manualmente">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-yellow-600">
                    <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          )}
          
          {/* Navigation links - Grid style */}
          <div className="flex flex-col gap-1">
            <RoleLinks isMobile />
          </div>
          
          {/* Bottom section */}
          <div className="pt-4 border-t border-gray-100 mt-3">
            {role === 'guest' ? (
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={closeMenu} className="group inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-white bg-linear-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-lg shadow-brand-500/25 transition-all duration-300">
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Inicia Sesión
                </Link>
                <Link to="/registrarse" onClick={closeMenu} className="group inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-300">
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Regístrate gratis
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Link to="/perfil" onClick={closeMenu} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-medium">Mi Perfil</span>
                </Link>
                {viewRole === 'provider' && (
                  <>
                    <Link to="/portafolio" onClick={closeMenu} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium">Mi Portafolio</span>
                    </Link>
                    <Link to="/plan" onClick={closeMenu} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <span className="font-medium">Pagos y Plan</span>
                    </Link>
                  </>
                )}
                {roles?.includes('client') && roles?.includes('provider') && (
                  <>
                    <div className="my-2 border-t border-gray-100"></div>
                    <button onClick={()=>{ const next = viewRole === 'client' ? 'provider' : 'client'; switchToRole(next); closeMenu(); }} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewRole === 'client' ? 'bg-brand-50 group-hover:bg-brand-100' : 'bg-emerald-50 group-hover:bg-emerald-100'}`}>
                        <svg className={`w-4 h-4 transition-colors ${viewRole === 'client' ? 'text-brand-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <span className="font-medium">Cambiar a modo {viewRole === 'client' ? 'Profesional' : 'Cliente'}</span>
                    </button>
                    <button onClick={()=>{ clearViewRoleLock(); toast.info('Modo automático restablecido'); closeMenu(); }} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-yellow-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <span className="font-medium">Modo automático</span>
                    </button>
                  </>
                )}
                <div className="my-2 border-t border-gray-100"></div>
                <button onClick={()=>{ setConfirmOut(true); closeMenu(); }} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="font-medium">Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
          </nav>
        </div>
      </div>
      {/* Confirm logout modal */}
      <Modal
        open={confirmOut}
        title="Confirmar cierre de sesión"
        onClose={()=>setConfirmOut(false)}
        actions={
          <>
            <Button variant="secondary" onClick={()=>setConfirmOut(false)}>Cancelar</Button>
            <Button onClick={()=>{ 
              // Importante: navegar ANTES de logout para evitar que las páginas de proveedor
              // muestren "Esta sección es para proveedores" durante la transición
              setConfirmOut(false); 
              setOpen(false); 
              navigate('/');
              // Pequeño delay para permitir que la navegación complete antes de limpiar el estado
              setTimeout(() => {
                logout();
                toast.info('Sesión finalizada');
              }, 50);
            }}>Cerrar sesión</Button>
          </>
        }
      >
        ¿Seguro que deseas finalizar la sesión?
      </Modal>
    </header>
    {isAuthenticated && viewRole==='provider' && upgradeHint.show && (
      <div className="bg-linear-to-r from-amber-50 via-amber-100/80 to-amber-50 border-b border-amber-200 text-amber-900 text-sm shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          {/* Layout responsive: stack en móvil, row en desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Contenido principal: icono + texto */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-200/50 flex items-center justify-center shrink-0 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.6A1.75 1.75 0 0116.768 17H3.232a1.75 1.75 0 01-1.492-2.302l6.517-11.6zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75v-3.5a.75.75 0 011.5 0v3.5A.75.75 0 0110 12z" clipRule="evenodd"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-800 text-sm">¡Impulsa tu negocio!</p>
                <p className="text-amber-700 text-xs leading-relaxed line-clamp-2">{upgradeHint.reason || 'Aumenta tu visibilidad y leads mejorando tu plan.'}</p>
              </div>
            </div>
            {/* Botones de acción: inline en móvil, shrink-0 en desktop */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
              <Link to="/plan" className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 hover:shadow-lg transition-all duration-300 hover:scale-105 whitespace-nowrap">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Ver planes
              </Link>
              <button 
                className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-200/50 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap" 
                onClick={()=>{ try { localStorage.removeItem('upgrade_hint'); } catch {/* ignore storage errors */}; setUpgradeHint({ show: false, reason: '' }); }}
              >
                Ocultar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Header;


import { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';

/* ─────────────────────────────────────────────
   SVG icon helpers (matching Header icon style)
   ───────────────────────────────────────────── */
const IconHome = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconRequests = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconJobs = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconContracts = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const IconMessages = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconProfile = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconPortfolio = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconPlan = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconServices = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconCalendar = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconReferrals = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconMore = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconClose = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconSwitch = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IconBecomePro = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const IconReviews = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconMyReviews = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

/* ─────────────────────────────────────────────
   Routes where the bottom nav should be hidden
   ───────────────────────────────────────────── */
const HIDDEN_ROUTES = [
  '/login',
  '/registrarse',
  '/unete',
  '/registro-proveedor',
  '/olvide-contrasena',
  '/restablecer-contrasena',
  '/verificar-email',
  '/payment',
];

function MobileBottomNav() {
  const { t } = useTranslation();
  const { isAuthenticated, viewRole, role, roles, changeViewRole, startRoleSwitch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close "more" panel on route change
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [moreOpen]);

  const handleMoreNav = useCallback((to) => {
    setMoreOpen(false);
    navigate(to);
  }, [navigate]);

  // Role switch handler (same logic as Header.jsx switchToRole)
  const handleSwitchRole = useCallback(() => {
    setMoreOpen(false);
    const target = viewRole === 'provider' ? 'client' : 'provider';
    startRoleSwitch();
    if (target === 'provider') {
      navigate('/empleos', { replace: true });
    } else {
      navigate('/mis-solicitudes', { replace: true });
    }
    setTimeout(() => { changeViewRole(target); }, 0);
  }, [viewRole, navigate, changeViewRole, startRoleSwitch]);

  // Multi-role check
  const isMultiRole = roles?.includes('provider') && roles?.includes('client');

  // Don't render for guests, unauthenticated users, or admin
  if (!isAuthenticated || role === 'guest' || viewRole === 'admin') return null;

  // Don't render on hidden routes
  const isHidden = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
  if (isHidden) return null;

  // ── Build primary (bar) and secondary ("more" grid) items ──
  let primaryItems = [];
  let secondaryItems = [];

  if (viewRole === 'provider') {
    primaryItems = [
      { to: '/empleos', icon: IconJobs, label: t('header.jobs'), end: true },
      { to: '/mensajes', icon: IconMessages, label: t('header.messages') },
      { to: '/reservas', icon: IconContracts, label: t('header.bookings') },
      { to: '/perfil', icon: IconProfile, label: t('header.myProfile') },
    ];
    secondaryItems = [
      { to: '/portafolio', icon: IconPortfolio, label: t('header.portfolio') },
      { to: '/servicios', icon: IconServices, label: t('header.services') },
      { to: '/plan', icon: IconPlan, label: t('header.plan') },
      { to: '/calendario', icon: IconCalendar, label: t('header.calendar') },
      { to: '/referidos', icon: IconReferrals, label: t('header.referrals') },
      { to: '/resenas', icon: IconReviews, label: t('header.myReviews') },
    ];
    // Multi-role: add "Modo Cliente" at the end
    if (isMultiRole) {
      secondaryItems.push(
        { action: 'switchRole', icon: IconSwitch, label: t('header.modeClient') }
      );
    }
  } else {
    // Client
    primaryItems = [
      { to: '/', icon: IconHome, label: t('common.home'), end: true },
      { to: '/mis-solicitudes', icon: IconRequests, label: t('header.requests'), end: true },
      { to: '/reservas', icon: IconContracts, label: t('header.bookings') },
      { to: '/mis-mensajes', icon: IconMessages, label: t('header.messages') },
      { to: '/perfil', icon: IconProfile, label: t('header.myProfile') },
    ];
    // Client secondary: reviews + role actions
    secondaryItems = [
      { to: '/mis-resenas', icon: IconMyReviews, label: t('header.myReviews') },
    ];
    if (isMultiRole) {
      // Multi-role client: add "Modo Profesional"
      secondaryItems.push(
        { action: 'switchRole', icon: IconSwitch, label: t('header.modeProfessional') }
      );
    } else {
      // Client-only: add "Ser profesional"
      secondaryItems.push(
        { action: 'becomePro', icon: IconBecomePro, label: t('header.becomeProfessional') }
      );
    }
  }

  // Check if any secondary item is the current route (to highlight "More" button)
  const moreIsActive = secondaryItems.some(it => it.to && location.pathname.startsWith(it.to));

  return (
    <>
      {/* ── Backdrop overlay when "More" is open ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] md:hidden transition-opacity duration-200"
          style={{ zIndex: 9989 }}
          aria-hidden="true"
        />
      )}

      <nav
        ref={moreRef}
        className="mobile-bottom-nav-wrapper"
        role="navigation"
        aria-label={t('header.mobileMenu')}
      >
        {/* ── "More" flyout panel ── */}
        {moreOpen && secondaryItems.length > 0 && (() => {
          const navItems = secondaryItems.filter(it => !it.action);
          const actionItems = secondaryItems.filter(it => !!it.action);
          return (
            <div className="mobile-more-panel">
              {/* Mode indicator header */}
              <div className="mobile-more-mode-header">
                <span className="mobile-more-mode-dot" />
                <span className="mobile-more-mode-label">
                  {viewRole === 'provider' ? t('header.modeProfessional') : t('header.modeClient')}
                </span>
              </div>
              {/* Navigation items grid */}
              <div className="mobile-more-grid">
                {navItems.map((item) => {
                  const isActive = item.to ? location.pathname.startsWith(item.to) : false;
                  return (
                    <button
                      key={item.to}
                      onClick={() => handleMoreNav(item.to)}
                      className={`mobile-more-item ${isActive ? 'mobile-more-item--active' : ''}`}
                    >
                      <span className={`mobile-more-icon ${isActive ? 'mobile-more-icon--active' : ''}`}>
                        <item.icon className="w-6 h-6" />
                      </span>
                      <span className={`mobile-more-label ${isActive ? 'mobile-more-label--active' : ''}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Divider + action items (role switch / become pro) */}
              {actionItems.length > 0 && (
                <>
                  <div className="mobile-more-divider" />
                  <div className="mobile-more-actions">
                    {actionItems.map((item) => (
                      <button
                        key={item.action}
                        onClick={() => {
                          if (item.action === 'switchRole') handleSwitchRole();
                          else if (item.action === 'becomePro') { setMoreOpen(false); navigate('/provider/onboarding'); }
                        }}
                        className="mobile-more-action-btn"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── Main bottom bar ── */}
        <div className="mobile-bottom-nav">
          <div className="mobile-bottom-nav-inner">
            {primaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `mobile-bottom-nav-item ${isActive ? 'mobile-bottom-nav-item--active' : 'mobile-bottom-nav-item--idle'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`mobile-bottom-nav-icon ${isActive ? 'mobile-bottom-nav-icon--active' : ''}`}>
                      <item.icon className="w-[22px] h-[22px]" />
                    </span>
                    <span className={`mobile-bottom-nav-label ${isActive ? 'mobile-bottom-nav-label--active' : ''}`}>
                      {item.label}
                    </span>
                    {isActive && <span className="mobile-bottom-nav-indicator" />}
                  </>
                )}
              </NavLink>
            ))}

            {/* "More" toggle — only for provider (client has 5 items, no overflow) */}
            {secondaryItems.length > 0 && (
              <button
                onClick={() => setMoreOpen(prev => !prev)}
                className={`mobile-bottom-nav-item ${moreOpen || moreIsActive ? 'mobile-bottom-nav-item--active' : 'mobile-bottom-nav-item--idle'}`}
                aria-expanded={moreOpen}
                aria-label={t('header.openMenu')}
              >
                <span className={`mobile-bottom-nav-icon ${moreOpen || moreIsActive ? 'mobile-bottom-nav-icon--active' : ''}`}>
                  {moreOpen ? <IconClose className="w-[22px] h-[22px]" /> : <IconMore className="w-[22px] h-[22px]" />}
                </span>
                <span className={`mobile-bottom-nav-label ${moreOpen || moreIsActive ? 'mobile-bottom-nav-label--active' : ''}`}>
                  {t('header.seeMore')}
                </span>
                {moreIsActive && !moreOpen && <span className="mobile-bottom-nav-indicator" />}
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileBottomNav;

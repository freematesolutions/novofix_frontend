import { useAuth } from '@/state/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { slugifyCategory } from '@/utils/categories.js';

// Top-of-mind categories surfaced in the footer to seed internal linking
// for SEO. They map 1:1 to the `/categorias/:slug` landings emitted by the
// dynamic sitemap, distributing crawl-budget on every page of the SPA.
const FOOTER_CATEGORIES = [
  'Reparaciones',
  'Plomería',
  'Electricidad',
  'Climatización',
  'Limpieza',
  'Pintura',
  'Jardinería',
  'Mudanzas',
];

function Footer() {
  const { role, viewRole, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const r = role === 'guest' ? 'guest' : viewRole;

  // Check if MobileBottomNav would be visible (same logic as MobileBottomNav)
  const isHiddenRoute = ['/login','/registrarse','/unete','/registro-proveedor','/verificar-email','/olvide-contrasena','/restablecer-contrasena'].some(rt => location.pathname.startsWith(rt));
  const hasBottomNav = isAuthenticated && role !== 'guest' && viewRole !== 'admin' && !isHiddenRoute;
  const accent = (() => {
    switch (r) {
      case 'provider':
        return { text: 'text-brand-400', hover: 'hover:text-brand-300', border: 'border-brand-700/40' };
      case 'client':
        return { text: 'text-emerald-400', hover: 'hover:text-emerald-300', border: 'border-emerald-700/40' };
      case 'admin':
        return { text: 'text-indigo-400', hover: 'hover:text-indigo-300', border: 'border-indigo-700/40' };
      default:
        return { text: 'text-brand-400', hover: 'hover:text-brand-300', border: 'border-brand-700/40' };
    }
  })();
  return (
    <footer className={`border-t bg-dark-800 ${accent.border}${hasBottomNav ? ' pb-16 md:pb-0' : ''}`} role="contentinfo">
      {/* Categorías populares — links internos para SEO (Phase 7).
          Se ocultan en rutas de auth y admin para no añadir ruido visual
          en flujos críticos donde el usuario no debe distraerse. */}
      {!isHiddenRoute && viewRole !== 'admin' && (
        <nav
          className={`border-b ${accent.border} bg-dark-800/50`}
          aria-label={t('footer.categoriesAriaLabel', 'Categorías populares')}
        >
          <div className="container mx-auto px-4 py-4 sm:py-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">
              {t('footer.popularCategories')}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/categorias/${slugifyCategory(cat)}`}
                    className={`text-gray-400 ${accent.hover} transition-colors`}
                  >
                    {t(`home.categories.${cat}`, cat)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      <div className="container mx-auto px-4 py-6 text-sm text-gray-400 flex flex-col md:flex-row gap-2 md:gap-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <p>&copy; {new Date().getFullYear()}</p>
          <span className="font-bold">
            <span className={`${accent.text}`}>Novo</span>
            <span className="text-white">Fix</span>
          </span>
          <span className="hidden sm:inline">- {t('footer.tagline')}</span>
        </div>
        <nav className="flex items-center gap-4" role="navigation" aria-label={t('footer.ariaLabel', 'Enlaces del pie')}>
          <Link to={`/terminos?from=${encodeURIComponent(location.pathname)}`} className={`${accent.text} ${accent.hover} transition-colors`}>{t('footer.terms')}</Link>
          <Link to={`/privacidad?from=${encodeURIComponent(location.pathname)}`} className={`${accent.text} ${accent.hover} transition-colors`}>{t('footer.privacy')}</Link>
          <Link to={`/sobre-nosotros?from=${encodeURIComponent(location.pathname)}`} className={`${accent.text} ${accent.hover} transition-colors`}>{t('footer.aboutUs')}</Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;

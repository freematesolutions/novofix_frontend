import { useAuth } from '@/state/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

function Footer() {
  const { role, viewRole } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const r = role === 'guest' ? 'guest' : viewRole;
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
    <footer className={`border-t bg-dark-800 ${accent.border}`} role="contentinfo">
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

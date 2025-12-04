import { useAuth } from '@/state/AuthContext.jsx';

function Footer() {
  const { role, viewRole } = useAuth();
  const r = role === 'guest' ? 'guest' : viewRole;
  const accent = (() => {
    switch (r) {
      case 'provider':
        return { text600: 'text-brand-600', hoverText700: 'hover:text-brand-700', border200: 'border-brand-200' };
      case 'client':
        return { text600: 'text-emerald-600', hoverText700: 'hover:text-emerald-700', border200: 'border-emerald-200' };
      case 'admin':
        return { text600: 'text-indigo-600', hoverText700: 'hover:text-indigo-700', border200: 'border-indigo-200' };
      default:
        return { text600: 'text-brand-600', hoverText700: 'hover:text-brand-700', border200: 'border-brand-200' };
    }
  })();
  return (
    <footer className={`border-t bg-white/80 ${accent.border200}`} role="contentinfo">
      <div className="container mx-auto px-4 py-6 text-sm text-gray-600 flex flex-col md:flex-row gap-2 md:gap-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <p>&copy; {new Date().getFullYear()}</p>
          <span className="font-bold">
            <span className={`${accent.text600}`}>Novo</span>
            <span className="text-gray-900">Fix</span>
          </span>
          <span className="hidden sm:inline">- Servicios Profesionales al Instante</span>
        </div>
        <nav className="flex items-center gap-4" role="navigation" aria-label="Enlaces del pie">
          <a href="#accesibilidad" className={`${accent.text600} ${accent.hoverText700}`}>Accesibilidad</a>
          <a href="#privacidad" className={`${accent.text600} ${accent.hoverText700}`}>Privacidad</a>
          <a href="#soporte" className={`${accent.text600} ${accent.hoverText700}`}>Soporte</a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;

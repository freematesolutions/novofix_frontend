import { useTranslation } from 'react-i18next';

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation();
  const current = i18n.language || localStorage.getItem('i18nextLng') || 'es';
  const change = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch {};
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => change('es')}
        className={`px-2 py-1 text-xs rounded ${current && current.startsWith('es') ? 'bg-gray-100' : 'bg-transparent'}`}
        aria-label="Español"
      >ES</button>
      <button
        type="button"
        onClick={() => change('en')}
        className={`px-2 py-1 text-xs rounded ${current && current.startsWith('en') ? 'bg-gray-100' : 'bg-transparent'}`}
        aria-label="English"
      >EN</button>
    </div>
  );
}

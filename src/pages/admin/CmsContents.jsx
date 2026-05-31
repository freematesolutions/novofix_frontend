// pages/admin/CmsContents.jsx
//
// Lista de contenidos editoriales gestionados por el CMS. Cada fila lleva al
// editor (/admin/contenidos/:key). Mantiene paleta dark + brand de los demás
// dashboards admin.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import { HiDocumentText, HiPencilAlt, HiCheckCircle, HiExclamation } from 'react-icons/hi';

const KEY_ICONS = {
  terms: '📜',
  privacy: '🔒',
  about: '👥',
  hero: '🎯',
  contact: '✉️'
};

export default function CmsContents() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/cms/contents');
      setItems(data?.data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.loadError'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { if (isAuthenticated && role === 'admin') load(); }, [isAuthenticated, role, load]);

  useEffect(() => { if (!isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  if (role !== 'admin') return <Alert type="warning">{t('admin.dashboard.adminOnly')}</Alert>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl p-6 sm:p-8 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <HiDocumentText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">{t('cmsAdmin.contents.title')}</h1>
            <p className="text-brand-300 text-sm">{t('cmsAdmin.contents.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="text-center py-10 text-gray-500">{t('common.loading')}…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => navigate(`/admin/contenidos/${it.key}`)}
              className="text-left bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md rounded-xl p-4 sm:p-5 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl shrink-0">{KEY_ICONS[it.key] || '📄'}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {t(`cmsAdmin.keys.${it.key}`, it.key)}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {it.exists
                      ? t('cmsAdmin.contents.version', { v: it.version })
                      : t('cmsAdmin.contents.notPublished')}
                  </p>
                </div>
                <HiPencilAlt className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
              </div>

              {/* Estado por idioma */}
              <div className="flex gap-2 text-xs">
                {['es', 'en'].map((loc) => {
                  const has = it.locales?.[loc]?.hasContent;
                  return (
                    <span
                      key={loc}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                        has ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {has ? <HiCheckCircle className="w-3.5 h-3.5" /> : <HiExclamation className="w-3.5 h-3.5" />}
                      {loc.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

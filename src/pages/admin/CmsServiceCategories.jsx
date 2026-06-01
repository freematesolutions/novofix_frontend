// pages/admin/CmsServiceCategories.jsx
//
// Permite al admin renombrar las ETIQUETAS VISIBLES (ES/EN) y la DESCRIPCIÓN
// corta de las 22 categorías de servicio sin modificar la clave canónica.
//
// La clave canónica (Reparaciones, Plomería, Electricidad…) NO se edita aquí
// porque está acoplada a:
//   - perfiles de proveedores (providerProfile.services[].category)
//   - solicitudes de servicio (basicInfo.category)
//   - motor de matching (busca por igualdad exacta)
//   - URLs SEO ya indexadas (/categorias/plomeria, etc.)
// Cambiarla rompería datos históricos y SEO.
//
// UX:
//   - Inputs prellenados con el override existente o, si no hay, con el texto
//     ORIGINAL del sitio (leído del JSON de i18n directo, NO del runtime de
//     i18next porque ese ya tiene los overrides aplicados por
//     useServiceCategoryLabels).
//   - Cada input muestra "Original: …" como referencia inmutable.
//   - Al guardar, los campos cuyo valor coincida EXACTAMENTE con el original
//     se mandan como string vacío → el backend los trata como "sin override"
//     → la categoría sigue usando el texto del i18n para ese campo/idioma.
//   - Se permite editar SOLO un idioma o SOLO label/description: lo que no se
//     toque, no se ensucia.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import { refreshServiceCategoryLabels } from '@/state/useServiceCategoryLabels.js';
import esTranslation from '@/locales/es/translation.json';
import enTranslation from '@/locales/en/translation.json';
import { HiViewGrid, HiSave, HiRefresh, HiSearch, HiCheckCircle } from 'react-icons/hi';

// Lee los textos ORIGINALES directamente del JSON empaquetado.
// Usamos el JSON crudo en vez de t() porque al boot el hook
// useServiceCategoryLabels ya pisa el bundle con los overrides — y aquí
// necesitamos el valor inmutable de fábrica.
const SOURCES = { es: esTranslation, en: enTranslation };
function originalLabel(key, locale) {
  return SOURCES[locale]?.home?.categories?.[key] || key;
}
function originalDescription(key, locale) {
  return SOURCES[locale]?.home?.categoryDescriptions?.[key] || '';
}

export default function CmsServiceCategories() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');

  // Memoizamos los originales por categoría (no cambian nunca).
  const originals = useMemo(() => {
    const map = {};
    for (const it of items) {
      const k = it.canonicalKey;
      map[k] = {
        label: { es: originalLabel(k, 'es'), en: originalLabel(k, 'en') },
        description: { es: originalDescription(k, 'es'), en: originalDescription(k, 'en') }
      };
    }
    return map;
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/cms/service-categories');
      const list = data?.data?.items || [];
      setItems(list);
      // Prefill: override si existe; si no, texto original de fábrica.
      const initial = {};
      for (const it of list) {
        const k = it.canonicalKey;
        initial[k] = {
          label: {
            es: it.label?.es || originalLabel(k, 'es'),
            en: it.label?.en || originalLabel(k, 'en')
          },
          description: {
            es: it.description?.es || originalDescription(k, 'es'),
            en: it.description?.en || originalDescription(k, 'en')
          }
        };
      }
      setEdits(initial);
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.serviceCategories.loadError'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { if (isAuthenticated && role === 'admin') load(); }, [isAuthenticated, role, load]);
  useEffect(() => { if (!isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);

  const updateField = (key, group, locale, value) => {
    setEdits((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [group]: { ...prev[key]?.[group], [locale]: value }
      }
    }));
  };

  // Si el valor coincide exactamente con el original → mandar vacío para que
  // el backend lo trate como "no hay override" en ese campo/idioma.
  const stripIfOriginal = (key, group, locale, value) => {
    const orig = originals[key]?.[group]?.[locale] || '';
    return (value || '').trim() === orig.trim() ? '' : value;
  };

  const saveOne = async (key) => {
    setSavingKey(key); setError(''); setSuccess('');
    try {
      const e = edits[key];
      const payload = {
        label: {
          es: stripIfOriginal(key, 'label', 'es', e.label.es),
          en: stripIfOriginal(key, 'label', 'en', e.label.en)
        },
        description: {
          es: stripIfOriginal(key, 'description', 'es', e.description.es),
          en: stripIfOriginal(key, 'description', 'en', e.description.en)
        }
      };
      // Si TODO quedó vacío equivale a "no hay override" → borramos cualquier
      // override previo en una sola operación.
      const allEmpty =
        !payload.label.es && !payload.label.en &&
        !payload.description.es && !payload.description.en;

      if (allEmpty) {
        await api.delete(`/admin/cms/service-categories/${encodeURIComponent(key)}`);
        setSuccess(t('cmsAdmin.serviceCategories.resetDone', { key }));
      } else {
        await api.put(`/admin/cms/service-categories/${encodeURIComponent(key)}`, payload);
        setSuccess(t('cmsAdmin.serviceCategories.saved', { key }));
      }
      refreshServiceCategoryLabels(i18n);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.serviceCategories.saveError'));
    } finally { setSavingKey(null); }
  };

  const resetOne = async (key) => {
    if (!confirm(t('cmsAdmin.serviceCategories.confirmReset', { key }))) return;
    setSavingKey(key); setError(''); setSuccess('');
    try {
      await api.delete(`/admin/cms/service-categories/${encodeURIComponent(key)}`);
      setSuccess(t('cmsAdmin.serviceCategories.resetDone', { key }));
      refreshServiceCategoryLabels(i18n);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.serviceCategories.resetError'));
    } finally { setSavingKey(null); }
  };

  if (!isAuthenticated) return null;
  if (role !== 'admin') return <Alert type="warning">{t('admin.dashboard.adminOnly')}</Alert>;

  const filtered = items.filter((it) =>
    !query || it.canonicalKey.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl p-6 sm:p-8 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <HiViewGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">{t('cmsAdmin.serviceCategories.title')}</h1>
            <p className="text-brand-300 text-sm">{t('cmsAdmin.serviceCategories.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Aviso de seguridad */}
      <Alert type="info">
        <p className="text-sm">
          <strong>{t('cmsAdmin.serviceCategories.warningTitle')}:</strong>{' '}
          {t('cmsAdmin.serviceCategories.warningBody')}
        </p>
      </Alert>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Buscador */}
      <div className="relative">
        <HiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder={t('cmsAdmin.serviceCategories.searchPlaceholder')}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">{t('common.loading')}…</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => {
            const e = edits[it.canonicalKey] || { label: { es: '', en: '' }, description: { es: '', en: '' } };
            const orig = originals[it.canonicalKey] || { label: { es: '', en: '' }, description: { es: '', en: '' } };
            const busy = savingKey === it.canonicalKey;
            return (
              <div key={it.canonicalKey} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 text-gray-700 rounded px-2 py-0.5">
                      {it.canonicalKey}
                    </span>
                    {it.hasOverride && (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
                        <HiCheckCircle className="w-3.5 h-3.5" />
                        {t('cmsAdmin.serviceCategories.customized')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {it.hasOverride && (
                      <button
                        type="button"
                        onClick={() => resetOne(it.canonicalKey)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 text-xs text-amber-700 hover:bg-amber-50 px-2 py-1 rounded disabled:opacity-50"
                        title={t('cmsAdmin.serviceCategories.resetHelp')}
                      >
                        <HiRefresh className="w-3.5 h-3.5" />
                        {t('cmsAdmin.serviceCategories.resetButton')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveOne(it.canonicalKey)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-brand-500 hover:bg-brand-600 text-white text-sm disabled:opacity-60"
                    >
                      <HiSave className="w-3.5 h-3.5" />
                      {busy ? t('cmsAdmin.editor.saving') : t('common.save')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['es', 'en'].map((loc) => (
                    <div key={loc} className="border border-gray-200 rounded-lg p-3 bg-gray-50/40">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-2">{loc.toUpperCase()}</p>

                      <label className="block text-xs text-gray-600 mb-1">{t('cmsAdmin.serviceCategories.labelField')}</label>
                      <input
                        type="text"
                        value={e.label[loc]}
                        onChange={(ev) => updateField(it.canonicalKey, 'label', loc, ev.target.value)}
                        placeholder={orig.label[loc]}
                        maxLength={200}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 bg-white text-sm"
                      />
                      <p className="text-[11px] text-gray-400 mt-0.5 mb-2 truncate" title={orig.label[loc]}>
                        {t('cmsAdmin.serviceCategories.originalHint', { value: orig.label[loc] })}
                      </p>

                      <label className="block text-xs text-gray-600 mb-1">{t('cmsAdmin.serviceCategories.descriptionField')}</label>
                      <input
                        type="text"
                        value={e.description[loc]}
                        onChange={(ev) => updateField(it.canonicalKey, 'description', loc, ev.target.value)}
                        placeholder={orig.description[loc]}
                        maxLength={200}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 bg-white text-sm"
                      />
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate" title={orig.description[loc]}>
                        {t('cmsAdmin.serviceCategories.originalHint', { value: orig.description[loc] || '—' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

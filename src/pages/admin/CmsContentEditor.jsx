// pages/admin/CmsContentEditor.jsx
//
// Editor de un contenido CMS específico (terms, privacy, about, hero, contact).
// - Tabs ES / EN
// - Lista de secciones editables (id, label, markdown)
// - Preview en vivo del markdown renderizado en el cliente (sólo visual; el
//   render canónico se hace en el server al guardar)
// - Historial colapsable con rollback a una versión previa
//
// Toda la maquetación es mobile-first y consistente con la paleta NovoFix.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import CmsRichContent from '@/components/cms/CmsRichContent.jsx';
import { invalidateCmsCache } from '@/state/useCmsContent.js';
import {
  HiArrowLeft, HiSave, HiPlus, HiTrash, HiEye, HiEyeOff, HiClock, HiRefresh
} from 'react-icons/hi';

const LOCALES = ['es', 'en'];

// Renderer markdown muy minimalista para el preview en vivo (cliente).
// El render real y la sanitización se hacen siempre en el backend al guardar.
function previewMarkdownToHtml(md = '') {
  // Escapamos primero y luego transformamos las marcas más comunes.
  const esc = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\*)([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>').concat('</p>');
}

export default function CmsContentEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { key } = useParams();
  const { role, isAuthenticated } = useAuth();

  const [doc, setDoc] = useState(null);
  const [locale, setLocale] = useState('es');
  const [draft, setDraft] = useState({ title: '', sections: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  // True cuando el draft visible vino de la plantilla canónica (no del doc en BD).
  // Sirve para mostrar el banner "Plantilla precargada — Publica para guardar".
  const [usingDefaultsDraft, setUsingDefaultsDraft] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/admin/cms/contents/${key}`);
      setDoc(data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.editor.loadError'));
    } finally { setLoading(false); }
  }, [key, t]);

  useEffect(() => { if (isAuthenticated && role === 'admin') load(); }, [isAuthenticated, role, load]);
  useEffect(() => { if (!isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);

  // Reset draft al cambiar locale o cargar doc.
  // Si el doc no tiene secciones reales (vacío o sólo un placeholder del seed
  // antiguo), usamos la PLANTILLA canónica (defaults) como borrador inicial —
  // sin persistir nada hasta que el admin haga "Publicar". Así el editor
  // siempre muestra el contenido completo del sitio para editar encima.
  useEffect(() => {
    if (!doc) return;
    const src = doc.translations?.[locale] || { title: '', sections: [] };
    const liveSections = Array.isArray(src.sections) ? src.sections : [];
    const looksMinimal = liveSections.length < 2; // 0 ó 1 sección = casi vacío
    const fallback = doc.defaults?.[locale];
    const useFallback = looksMinimal && fallback && Array.isArray(fallback.sections) && fallback.sections.length > 0;

    if (useFallback) {
      setDraft({
        title: src.title || fallback.title || '',
        sections: fallback.sections.map((s) => ({
          id: s.id, label: s.label || '', bodyMarkdown: s.bodyMarkdown || ''
        }))
      });
      setUsingDefaultsDraft(true);
    } else {
      setDraft({
        title: src.title || '',
        sections: liveSections.map((s) => ({
          id: s.id, label: s.label || '', bodyMarkdown: s.bodyMarkdown || ''
        }))
      });
      setUsingDefaultsDraft(false);
    }
    setSuccess('');
  }, [doc, locale]);

  const updateSection = (idx, patch) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    }));
  };

  const addSection = () => {
    const nextId = `section-${draft.sections.length + 1}-${Date.now().toString(36).slice(-4)}`;
    setDraft((d) => ({
      ...d,
      sections: [...d.sections, { id: nextId, label: '', bodyMarkdown: '' }]
    }));
  };

  const removeSection = (idx) => {
    if (!confirm(t('cmsAdmin.editor.confirmRemoveSection'))) return;
    setDraft((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        locale,
        title: draft.title.trim(),
        sections: draft.sections.map((s) => ({
          id: s.id?.trim() || `section-${Date.now().toString(36)}`,
          label: s.label || '',
          bodyMarkdown: s.bodyMarkdown || ''
        }))
      };
      const { data } = await api.put(`/admin/cms/contents/${key}`, payload);
      setSuccess(t('cmsAdmin.editor.saved', { v: data?.data?.version }));
      invalidateCmsCache(key); // hace que la cache del frontend se refresque al navegar
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.editor.saveError'));
    } finally { setSaving(false); }
  };

  const doRollback = async (version) => {
    if (!confirm(t('cmsAdmin.editor.confirmRollback', { v: version }))) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.post(`/admin/cms/contents/${key}/rollback/${version}`);
      setSuccess(t('cmsAdmin.editor.rolledBack', { v: data?.data?.version }));
      invalidateCmsCache(key);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.editor.rollbackError'));
    } finally { setSaving(false); }
  };

  const doResetFromDefaults = async () => {
    if (!confirm(t('cmsAdmin.editor.confirmReset'))) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.post(`/admin/cms/contents/${key}/reset-from-defaults`, { locale: 'both' });
      const counts = data?.data?.sectionsCount || {};
      setSuccess(t('cmsAdmin.editor.resetDone', { es: counts.es ?? 0, en: counts.en ?? 0 }));
      invalidateCmsCache(key);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.editor.resetError'));
    } finally { setSaving(false); }
  };

  const previewHtmls = useMemo(
    () => draft.sections.map((s) => previewMarkdownToHtml(s.bodyMarkdown)),
    [draft.sections]
  );

  if (!isAuthenticated) return null;
  if (role !== 'admin') return <Alert type="warning">{t('admin.dashboard.adminOnly')}</Alert>;
  if (loading) return <div className="text-center py-10 text-gray-500">{t('common.loading')}…</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate('/admin/contenidos')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" /> {t('cmsAdmin.editor.back')}
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <HiClock className="w-4 h-4" />
          {doc?.publishedAt
            ? t('cmsAdmin.editor.lastPublished', { date: new Date(doc.publishedAt).toLocaleString() })
            : t('cmsAdmin.editor.neverPublished')}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          {t(`cmsAdmin.keys.${key}`, key)}
        </h1>
        <p className="text-sm text-gray-500">
          {t('cmsAdmin.editor.version', { v: doc?.version || 0 })}
        </p>

        {/* Tabs idioma */}
        <div className="mt-4 flex gap-2 border-b border-gray-200">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                locale === loc
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {loc.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-brand-600"
              title={showPreview ? t('cmsAdmin.editor.hidePreview') : t('cmsAdmin.editor.showPreview')}
            >
              {showPreview ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
              {showPreview ? t('cmsAdmin.editor.hidePreview') : t('cmsAdmin.editor.showPreview')}
            </button>
          </div>
        </div>

        {error && <div className="mt-4"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mt-4"><Alert type="success">{success}</Alert></div>}
        {usingDefaultsDraft && (
          <div className="mt-4"><Alert type="info">{t('cmsAdmin.editor.defaultsPrefilledNotice')}</Alert></div>
        )}

        {/* Título */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('cmsAdmin.editor.titleField')}
          </label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            maxLength={280}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            placeholder={t('cmsAdmin.editor.titlePlaceholder')}
          />
        </div>

        {/* Secciones */}
        <div className="mt-6 space-y-5">
          {draft.sections.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              {t('cmsAdmin.editor.noSections')}
            </p>
          )}
          {draft.sections.map((s, idx) => (
            <div key={`${s.id}-${idx}`} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded px-2 py-0.5">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  value={s.id}
                  onChange={(e) => updateSection(idx, { id: e.target.value })}
                  className="font-mono text-xs px-2 py-1 rounded border border-gray-300 bg-white w-44"
                  placeholder="section-id"
                />
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => updateSection(idx, { label: e.target.value })}
                  className="flex-1 px-2 py-1 rounded border border-gray-300 bg-white text-sm"
                  placeholder={t('cmsAdmin.editor.sectionLabel')}
                />
                <button
                  onClick={() => removeSection(idx)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                  title={t('cmsAdmin.editor.removeSection')}
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>

              <div className={`grid gap-3 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                <textarea
                  value={s.bodyMarkdown}
                  onChange={(e) => updateSection(idx, { bodyMarkdown: e.target.value })}
                  rows={10}
                  className="w-full font-mono text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
                  placeholder={t('cmsAdmin.editor.markdownPlaceholder')}
                />
                {showPreview && (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3 bg-white overflow-auto max-h-96">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                      {t('cmsAdmin.editor.preview')}
                    </p>
                    <CmsRichContent html={previewHtmls[idx]} />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-brand-300 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <HiPlus className="w-4 h-4" /> {t('cmsAdmin.editor.addSection')}
          </button>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex items-center justify-between gap-2 flex-wrap sticky bottom-2 bg-white/90 backdrop-blur p-2 rounded-lg">
          <button
            type="button"
            onClick={doResetFromDefaults}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm disabled:opacity-60 transition-colors"
            title={t('cmsAdmin.editor.resetHelp')}
          >
            <HiRefresh className="w-4 h-4" />
            {t('cmsAdmin.editor.resetFromDefaults')}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-60 transition-colors"
          >
            <HiSave className="w-4 h-4" />
            {saving ? t('cmsAdmin.editor.saving') : t('cmsAdmin.editor.save')}
          </button>
        </div>
      </div>

      {/* Historial */}
      {doc?.history?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 flex items-center gap-2">
              <HiClock className="w-5 h-5 text-brand-500" />
              {t('cmsAdmin.editor.history')} ({doc.history.length})
            </span>
            <span className="text-xs text-gray-500">
              {showHistory ? t('common.collapse') : t('common.expand')}
            </span>
          </button>
          {showHistory && (
            <ul className="divide-y divide-gray-100 border-t border-gray-100">
              {doc.history.slice().reverse().map((h) => (
                <li key={`${h.version}-${h.editedAt}`} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm">
                    <span className="font-mono font-semibold text-brand-600">v{h.version}</span>
                    <span className="text-gray-500 ml-2">[{(h.locale || '').toUpperCase()}]</span>
                    <span className="text-gray-700 ml-2">{h.titleSnapshot || <em className="text-gray-400">{t('cmsAdmin.editor.untitled')}</em>}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({h.sectionsCount} {t('cmsAdmin.editor.sectionsCount')})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {h.editedAt ? new Date(h.editedAt).toLocaleString() : ''}
                    </span>
                    <button
                      onClick={() => doRollback(h.version)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2 py-1 rounded disabled:opacity-50"
                      title={t('cmsAdmin.editor.rollback')}
                    >
                      <HiRefresh className="w-3.5 h-3.5" />
                      {t('cmsAdmin.editor.rollback')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

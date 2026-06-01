// pages/admin/CmsFaqManager.jsx
//
// CRUD de Preguntas Frecuentes. Crear, editar y eliminar items bilingües.
// Reordenar simple por campo `order` (input numérico) — un drag&drop completo
// puede agregarse después; este enfoque cubre el caso de uso sin agregar
// dependencias nuevas.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import CmsRichContent from '@/components/cms/CmsRichContent.jsx';
import { invalidateFaqCache } from '@/state/useCmsFaq.js';
import { HiPlus, HiTrash, HiSave, HiQuestionMarkCircle, HiPencilAlt, HiX, HiRefresh } from 'react-icons/hi';

const CATEGORIES = ['general', 'client', 'provider', 'payment', 'account'];

const EMPTY_FORM = {
  id: null,
  category: 'general',
  order: 100,
  active: true,
  question: { es: '', en: '' },
  answerMarkdown: { es: '', en: '' }
};

export default function CmsFaqManager() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/cms/faq');
      setItems(data?.data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.faq.loadError'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { if (isAuthenticated && role === 'admin') load(); }, [isAuthenticated, role, load]);
  useEffect(() => { if (!isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(false); };

  const startEdit = (it) => {
    setForm({
      id: it.id,
      category: it.category,
      order: it.order,
      active: it.active,
      question: { es: it.question?.es || '', en: it.question?.en || '' },
      answerMarkdown: { es: it.answerMarkdown?.es || '', en: it.answerMarkdown?.en || '' }
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e?.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        category: form.category,
        order: Number(form.order) || 100,
        active: !!form.active,
        question: form.question,
        answerMarkdown: form.answerMarkdown
      };
      if (form.id) {
        await api.put(`/admin/cms/faq/${form.id}`, payload);
        setSuccess(t('cmsAdmin.faq.updated'));
      } else {
        await api.post('/admin/cms/faq', payload);
        setSuccess(t('cmsAdmin.faq.created'));
      }
      invalidateFaqCache();
      resetForm();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.faq.saveError'));
    } finally { setSaving(false); }
  };

  const remove = async (it) => {
    if (!confirm(t('cmsAdmin.faq.confirmDelete'))) return;
    setSaving(true); setError('');
    try {
      await api.delete(`/admin/cms/faq/${it.id}`);
      setSuccess(t('cmsAdmin.faq.deleted'));
      invalidateFaqCache();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.faq.deleteError'));
    } finally { setSaving(false); }
  };

  // Reimporta los FAQs canónicos del sitio (los mismos textos que aparecen en
  // la Home). Modo `replace` por defecto: borra todo lo existente y vuelve a
  // sembrar. Útil cuando el seed inicial dejó dummies o se quiere empezar de
  // cero alineado al copy oficial.
  const resetFromDefaults = async () => {
    if (!confirm(t('cmsAdmin.faq.confirmResetFromDefaults'))) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.post('/admin/cms/faq/reset-from-defaults', { mode: 'replace' });
      const r = data?.data || {};
      setSuccess(t('cmsAdmin.faq.resetFromDefaultsDone', {
        removed: r.removed || 0,
        created: r.created || 0
      }));
      invalidateFaqCache();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('cmsAdmin.faq.resetFromDefaultsError'));
    } finally { setSaving(false); }
  };

  if (!isAuthenticated) return null;
  if (role !== 'admin') return <Alert type="warning">{t('admin.dashboard.adminOnly')}</Alert>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl p-6 sm:p-8 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <HiQuestionMarkCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">{t('cmsAdmin.faq.title')}</h1>
            <p className="text-brand-300 text-sm">{t('cmsAdmin.faq.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Acción global: reimportar plantilla del sitio.
          Útil cuando la BBDD tiene dummies viejos y se quieren reemplazar por
          las preguntas reales que aparecen en la Home. */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="text-sm text-amber-900">
          <p className="font-medium">{t('cmsAdmin.faq.resetFromDefaultsTitle')}</p>
          <p className="text-amber-800/80">{t('cmsAdmin.faq.resetFromDefaultsHelp')}</p>
        </div>
        <button
          type="button"
          onClick={resetFromDefaults}
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm disabled:opacity-60"
        >
          <HiRefresh className="w-4 h-4" />
          {t('cmsAdmin.faq.resetFromDefaultsButton')}
        </button>
      </div>

      {/* Formulario crear/editar */}
      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {editing ? t('cmsAdmin.faq.editingTitle') : t('cmsAdmin.faq.newTitle')}
          </h2>
          {editing && (
            <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center gap-1">
              <HiX className="w-4 h-4" /> {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="block mb-1 text-gray-600">{t('cmsAdmin.faq.category')}</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`faqPage.categories.${c}`)}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-gray-600">{t('cmsAdmin.faq.order')}</span>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span>{t('cmsAdmin.faq.active')}</span>
          </label>
        </div>

        {/* Bilingüe ES + EN */}
        {['es', 'en'].map((loc) => (
          <div key={loc} className="border border-gray-200 rounded-lg p-3 bg-gray-50/40">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-2">{loc.toUpperCase()}</p>
            <label className="block text-sm mb-3">
              <span className="block mb-1 text-gray-600">{t('cmsAdmin.faq.question')}</span>
              <input
                type="text"
                value={form.question[loc]}
                onChange={(e) => setForm((f) => ({ ...f, question: { ...f.question, [loc]: e.target.value } }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                placeholder={loc === 'es' ? '¿Cómo funciona...?' : 'How does... work?'}
                required={loc === 'es'}
              />
            </label>
            <label className="block text-sm">
              <span className="block mb-1 text-gray-600">{t('cmsAdmin.faq.answer')} (Markdown)</span>
              <textarea
                value={form.answerMarkdown[loc]}
                onChange={(e) => setForm((f) => ({ ...f, answerMarkdown: { ...f.answerMarkdown, [loc]: e.target.value } }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm bg-white"
                placeholder={t('cmsAdmin.faq.answerPlaceholder')}
              />
            </label>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-60 transition-colors"
          >
            <HiSave className="w-4 h-4" />
            {saving ? t('cmsAdmin.editor.saving') : editing ? t('common.update') : t('cmsAdmin.faq.create')}
          </button>
        </div>
      </form>

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t('cmsAdmin.faq.listTitle')} ({items.length})</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-500">{t('common.loading')}…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-gray-500">{t('cmsAdmin.faq.empty')}</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((it) => (
              <li key={it.id} className="px-4 sm:px-6 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono bg-brand-50 text-brand-700 rounded px-1.5 py-0.5">
                        {t(`faqPage.categories.${it.category}`)}
                      </span>
                      <span className="text-xs text-gray-500">#{it.order}</span>
                      {!it.active && (
                        <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                          {t('cmsAdmin.faq.inactive')}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{it.question?.es || it.question?.en || '—'}</p>
                    {it.question?.en && it.question?.es && (
                      <p className="text-xs text-gray-500 mt-0.5">EN: {it.question.en}</p>
                    )}
                    <details className="mt-2">
                      <summary className="text-xs text-brand-600 cursor-pointer hover:text-brand-700">
                        {t('cmsAdmin.faq.previewAnswer')}
                      </summary>
                      <div className="mt-2 text-sm">
                        <CmsRichContent html={it.answerHtml?.es || it.answerHtml?.en || ''} />
                      </div>
                    </details>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(it)}
                      className="p-2 rounded hover:bg-brand-50 text-brand-600"
                      title={t('common.edit')}
                    >
                      <HiPencilAlt className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(it)}
                      disabled={saving}
                      className="p-2 rounded hover:bg-red-50 text-red-500 disabled:opacity-50"
                      title={t('common.delete')}
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

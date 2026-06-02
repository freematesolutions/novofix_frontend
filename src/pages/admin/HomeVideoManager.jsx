// pages/admin/HomeVideoManager.jsx
//
// Panel admin para gestionar el video del Home (Req 16).
// Permite:
//   - Subir un video a Cloudinary (mp4/mov/webm), o
//   - Pegar una URL externa (YouTube, Vimeo o MP4 directo).
//   - Setear poster, títulos ES/EN y habilitar/deshabilitar la sección.

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiArrowLeft, HiUpload, HiTrash, HiSave, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import api from '@/state/apiClient.js';
import { useAuth } from '@/state/AuthContext.jsx';
import Alert from '@/components/ui/Alert.jsx';

const ACCEPTED_VIDEO = 'video/mp4,video/webm,video/quicktime';
const MAX_BYTES = 200 * 1024 * 1024; // 200MB (alineado con multer)

function classifyProvider(url) {
  if (!url) return 'external';
  const u = url.toLowerCase();
  if (u.includes('youtube.com/') || u.includes('youtu.be/')) return 'youtube';
  if (u.includes('vimeo.com/')) return 'vimeo';
  if (u.includes('cloudinary.com/')) return 'cloudinary';
  return 'external';
}

export default function HomeVideoManager() {
  const { t } = useTranslation();
  const { role, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    enabled: false,
    videoUrl: '',
    posterUrl: '',
    cloudinaryId: '',
    titleEs: '',
    titleEn: ''
  });

  const provider = useMemo(() => classifyProvider(form.videoUrl), [form.videoUrl]);

  useEffect(() => {
    let alive = true;
    api.get('/admin/site-settings/home-video')
      .then((res) => {
        if (!alive) return;
        const v = res?.data?.data?.value || {};
        setForm({
          enabled: Boolean(v.enabled),
          videoUrl: v.videoUrl || '',
          posterUrl: v.posterUrl || '',
          cloudinaryId: v.cloudinaryId || '',
          titleEs: v.titleEs || '',
          titleEn: v.titleEn || ''
        });
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.message || t('admin.homeVideo.loadError', 'Error al cargar el ajuste'));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [t]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset input
    if (!file) return;
    setError(''); setSuccess('');
    if (file.size > MAX_BYTES) {
      setError(t('admin.homeVideo.tooLarge', 'El archivo supera los 200MB permitidos.'));
      return;
    }
    if (!file.type.startsWith('video/')) {
      setError(t('admin.homeVideo.notVideo', 'El archivo debe ser un video.'));
      return;
    }
    try {
      setUploading(true);
      setUploadProgress(0);
      const fd = new FormData();
      fd.append('files', file);
      const res = await api.post('/uploads/files', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 min para videos grandes
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });
      const uploaded = res?.data?.data?.files || res?.data?.files || [];
      const first = uploaded[0];
      if (!first?.secureUrl && !first?.url) {
        throw new Error('Upload did not return a URL');
      }
      setForm((p) => ({
        ...p,
        videoUrl: first.secureUrl || first.url,
        cloudinaryId: first.cloudinaryId || first.public_id || ''
      }));
      setSuccess(t('admin.homeVideo.uploadOk', 'Video subido. No olvides guardar los cambios.'));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || t('admin.homeVideo.uploadError', 'Error al subir el video'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearVideo = () => {
    setForm((p) => ({ ...p, videoUrl: '', cloudinaryId: '', posterUrl: '' }));
    setSuccess(''); setError('');
  };

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (form.enabled && !form.videoUrl.trim()) {
      setError(t('admin.homeVideo.urlRequired', 'Debes indicar una URL de video o subir uno antes de habilitar.'));
      return;
    }
    try {
      setSaving(true);
      await api.put('/admin/site-settings/home-video', {
        enabled: form.enabled,
        videoUrl: form.videoUrl.trim(),
        posterUrl: form.posterUrl.trim(),
        cloudinaryId: form.cloudinaryId.trim(),
        titleEs: form.titleEs.trim(),
        titleEn: form.titleEn.trim()
      });
      setSuccess(t('admin.homeVideo.saveOk', 'Cambios guardados correctamente.'));
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.homeVideo.saveError', 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Alert type="warning">{t('admin.dashboard.adminOnly')}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition" aria-label="Volver">
          <HiArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t('admin.homeVideo.title', 'Video del Home')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('admin.homeVideo.subtitle', 'Gestiona el video destacado que se muestra en la portada del sitio.')}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
          <HiExclamationCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
          <HiCheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
          {t('common.loading', 'Cargando...')}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {/* Enable switch */}
          <div className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{t('admin.homeVideo.enable', 'Mostrar video en el Home')}</p>
              <p className="text-xs text-gray-500">
                {t('admin.homeVideo.enableHelp', 'Si lo desactivas, la sección quedará oculta hasta que la vuelvas a habilitar.')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.enabled}
                onChange={(e) => setField('enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          {/* Upload + Preview agrupados para que el resultado de subir/reemplazar/eliminar quede visible junto a la barra de progreso */}
          <div className="p-5 space-y-4">
            <div>
              <p className="font-semibold text-gray-900">{t('admin.homeVideo.uploadTitle', 'Subir video (Cloudinary)')}</p>
              <p className="text-xs text-gray-500">
                {t('admin.homeVideo.uploadHelp', 'MP4 / WebM / MOV — máximo 200MB.')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm cursor-pointer transition ${uploading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}>
                <HiUpload className="w-4 h-4" />
                {uploading
                  ? t('admin.homeVideo.uploading', 'Subiendo... {{p}}%', { p: uploadProgress })
                  : (form.videoUrl
                      ? t('admin.homeVideo.replaceFile', 'Reemplazar archivo')
                      : t('admin.homeVideo.chooseFile', 'Elegir archivo'))}
                <input type="file" accept={ACCEPTED_VIDEO} className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>

            {/* Barra de progreso visible durante la subida */}
            {uploading && (
              <div className="space-y-1.5" aria-live="polite">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div
                    className="h-full bg-linear-to-r from-brand-500 to-brand-600 transition-all duration-200 ease-out"
                    style={{ width: `${Math.max(2, uploadProgress)}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                    {t('admin.homeVideo.uploadingHint', 'Subiendo a Cloudinary, no cierres esta ventana...')}
                  </span>
                  <span className="font-semibold tabular-nums">{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Vista previa inline para ver el resultado de la subida/reemplazo/eliminación sin scrollear */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{t('admin.homeVideo.previewTitle', 'Vista previa')}</p>
                {form.videoUrl ? (
                  <button
                    type="button"
                    onClick={handleClearVideo}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiTrash className="w-3.5 h-3.5" />
                    {t('admin.homeVideo.delete', 'Eliminar')}
                  </button>
                ) : null}
              </div>

              {form.videoUrl ? (
                <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video shadow">
                  {provider === 'youtube' || provider === 'vimeo' ? (
                    <PreviewIframe url={form.videoUrl} provider={provider} />
                  ) : (
                    <video
                      src={form.videoUrl}
                      poster={form.posterUrl || undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover bg-black"
                    />
                  )}
                </div>
              ) : (
                <label className={`relative w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-brand-400 transition aspect-video flex flex-col items-center justify-center text-center px-6 ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <HiUpload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">
                    {t('admin.homeVideo.emptyTitle', 'Aún no hay video')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('admin.homeVideo.emptyHint', 'Haz clic aquí para subir un video o pega una URL externa abajo.')}
                  </p>
                  <input type="file" accept={ACCEPTED_VIDEO} className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {/* External URL */}
          <div className="p-5 space-y-3">
            <p className="font-semibold text-gray-900">{t('admin.homeVideo.externalTitle', 'URL externa')}</p>
            <p className="text-xs text-gray-500">
              {t('admin.homeVideo.externalHelp', 'YouTube, Vimeo o un MP4/WebM hospedado en otro sitio. Se detecta automáticamente.')}
            </p>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={(e) => setField('videoUrl', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {form.videoUrl && (
              <p className="text-xs text-gray-500">
                {t('admin.homeVideo.detected', 'Tipo detectado')}: <strong className="text-gray-700">{provider}</strong>
              </p>
            )}
          </div>

          {/* Poster */}
          <div className="p-5 space-y-3">
            <p className="font-semibold text-gray-900">{t('admin.homeVideo.posterTitle', 'Imagen de portada (opcional)')}</p>
            <p className="text-xs text-gray-500">
              {t('admin.homeVideo.posterHelp', 'Solo se aplica a videos directos (Cloudinary/MP4). YouTube y Vimeo muestran su propio thumbnail.')}
            </p>
            <input
              type="url"
              placeholder="https://..."
              value={form.posterUrl}
              onChange={(e) => setField('posterUrl', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
          </div>

          {/* Titles */}
          <div className="p-5 space-y-3">
            <p className="font-semibold text-gray-900">{t('admin.homeVideo.titlesTitle', 'Títulos (opcionales)')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Español</label>
                <input
                  type="text"
                  value={form.titleEs}
                  onChange={(e) => setField('titleEs', e.target.value)}
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">English</label>
                <input
                  type="text"
                  value={form.titleEn}
                  onChange={(e) => setField('titleEn', e.target.value)}
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 rounded-b-2xl">
            <div className="text-xs text-gray-500">
              {saving
                ? t('admin.homeVideo.savingHint', 'Aplicando cambios en el servidor...')
                : t('admin.homeVideo.savingIdle', 'Los cambios se aplican al instante en la portada del sitio.')}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed ${saving ? 'bg-brand-700' : 'bg-brand-600 hover:bg-brand-700 hover:shadow-md active:scale-[0.98]'}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {t('common.saving', 'Guardando...')}
                </>
              ) : (
                <>
                  <HiSave className="w-4 h-4" />
                  {t('common.save', 'Guardar')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewIframe({ url, provider }) {
  let src = url;
  try {
    if (provider === 'youtube') {
      const u = new URL(url);
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.replace(/^\//, '').split('/')[0]
        : u.searchParams.get('v');
      if (id) src = `https://www.youtube.com/embed/${id}`;
    } else if (provider === 'vimeo') {
      const u = new URL(url);
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) src = `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* noop */ }
  return (
    <iframe
      src={src}
      title="preview"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="absolute inset-0 w-full h-full border-0"
    />
  );
}

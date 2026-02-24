import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MapPicker from '@/components/ui/MapPicker.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from '@/components/ui/UploadProgress.jsx';

const URGENCY = [
  { value: 'immediate', label: 'client.createRequest.urgency.immediate' },
  { value: 'scheduled', label: 'client.createRequest.urgency.scheduled' }
];

export default function EditRequest() {
  const { t } = useTranslation();
  const { role, roles, viewRole, clearError, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loadingRequest, setLoadingRequest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [hasProposals, setHasProposals] = useState(false);
  const [form, setForm] = useState({
    category: '',
    urgency: URGENCY[0].value,
    title: '',
    description: '',
    subcategory: '',
    address: '',
    preferredDate: '',
    budgetAmount: '',
    currency: 'USD'
  });
  const [formErrors, setFormErrors] = useState({});
  const [coords, setCoords] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    progress: 0,
    fileName: '',
    message: '',
    totalFiles: 0,
    currentFile: 0,
    status: 'uploading'
  });

  useEffect(() => { clearError?.(); }, [clearError]);

  const isClientCapable = (
    viewRole === 'client' || role === 'client' || roles?.includes('client') || roles?.includes('provider')
  );

  // Load request data
  const loadRequest = useCallback(async () => {
    if (!id) return;
    setLoadingRequest(true);
    setError('');
    try {
      const { data } = await api.get(`/client/requests/${id}`);
      const sr = data?.data?.request || data?.data;
      if (!sr) {
        setError(t('client.editRequest.notFound', 'Solicitud no encontrada'));
        return;
      }
      setRequest(sr);
      setHasProposals(Array.isArray(sr.proposals) && sr.proposals.length > 0);
      // Populate form
      setForm({
        category: sr.basicInfo?.category || '',
        urgency: sr.basicInfo?.urgency || 'immediate',
        title: sr.basicInfo?.title || '',
        description: sr.basicInfo?.description || '',
        subcategory: sr.basicInfo?.subcategory || '',
        address: sr.location?.address || '',
        preferredDate: sr.scheduling?.preferredDate ? new Date(sr.scheduling.preferredDate).toISOString().split('T')[0] : '',
        budgetAmount: sr.budget?.amount || '',
        currency: sr.budget?.currency || 'USD'
      });
      // Set coordinates
      if (sr.location?.coordinates) {
        setCoords({ lat: sr.location.coordinates.lat, lng: sr.location.coordinates.lng });
      }
      // Set media
      setPhotos(sr.media?.photos || []);
      setVideos(sr.media?.videos || []);
    } catch (err) {
      setError(err?.response?.data?.message || t('client.editRequest.loadError', 'Error al cargar solicitud'));
    } finally {
      setLoadingRequest(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (isAuthenticated && isClientCapable) loadRequest();
  }, [isAuthenticated, isClientCapable, loadRequest]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  if (!isClientCapable) return <Alert type="warning">{t('client.requests.clientOnlySection')}</Alert>;

  const validate = () => {
    const errs = {};
    if (!form.title || form.title.trim().length < 4) errs.title = t('client.createRequest.validation.titleRequired');
    if (!form.description || form.description.trim().length < 10) errs.description = t('client.createRequest.validation.descriptionRequired');
    if (!form.category) errs.category = t('client.createRequest.validation.categoryRequired');
    if (!form.address || form.address.trim().length < 3) errs.address = t('client.createRequest.validation.addressRequired');
    if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) errs.coordinates = t('client.createRequest.validation.locationRequired');
    if (!form.budgetAmount || Number(form.budgetAmount) <= 0) errs.budgetAmount = t('client.createRequest.validation.budgetRequired');
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory || undefined,
        urgency: form.urgency,
        address: form.address.trim(),
        coordinates: coords,
        preferredDate: form.preferredDate || undefined,
        budget: { amount: Number(form.budgetAmount), currency: form.currency || 'USD' },
        photos,
        videos
      };
      const { data } = await api.put(`/client/requests/${id}`, payload);
      if (data?.success) {
        toast.success(t('client.editRequest.updateSuccess', 'Solicitud actualizada correctamente'));
        navigate('/mis-solicitudes');
      } else {
        toast.warning(data?.message || t('client.editRequest.updateError', 'Error al actualizar'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.editRequest.updateError', 'Error al actualizar');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingRequest) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-16">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500">{t('client.editRequest.loading', 'Cargando solicitud...')}</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <Alert type="error">{error || t('client.editRequest.notFound', 'Solicitud no encontrada')}</Alert>
        <Button variant="secondary" onClick={() => navigate('/mis-solicitudes')}>
          {t('client.proposals.backToRequests', 'Volver a solicitudes')}
        </Button>
      </div>
    );
  }

  const canEditCategory = !hasProposals;
  const canEditTitle = !hasProposals;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Indicador de progreso */}
        <UploadProgress {...uploadProgress} />

        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="relative flex items-center gap-4">
            <button
              onClick={() => navigate('/mis-solicitudes')}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{t('client.editRequest.title', 'Editar solicitud')}</h1>
              <p className="text-sm text-emerald-100 mt-0.5">
                {t('client.editRequest.subtitle', 'Actualiza los detalles de tu solicitud')}
              </p>
            </div>
          </div>
        </div>

        {/* Warning if has proposals */}
        {hasProposals && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">{t('client.editRequest.hasProposalsWarning', 'Esta solicitud ya tiene propuestas')}</p>
              <p className="mt-1 text-amber-700">{t('client.editRequest.hasProposalsDetail', 'No podrás cambiar el título ni la categoría, pero sí puedes actualizar la descripción, fotos, ubicación y presupuesto.')}</p>
            </div>
          </div>
        )}

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={onSubmit} className={`space-y-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-100/60 shadow-lg p-6 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
          {/* Categoría y urgencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.category')}</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-700"
                value={form.category ? t(`home.categories.${form.category}`, form.category) : ''}
                disabled={true}
                title={canEditCategory ? undefined : t('client.editRequest.categoryLocked', 'La categoría no se puede cambiar')}
              />
              {!canEditCategory && <p className="text-xs text-gray-500 mt-1">{t('client.editRequest.categoryLocked', 'La categoría no se puede cambiar')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.urgencyLabel')}</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                value={form.urgency}
                onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))}
              >
                {URGENCY.map((u) => <option key={u.value} value={u.value}>{t(u.label)}</option>)}
              </select>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.titleLabel')}</label>
            <input
              className={`mt-1 w-full border rounded-xl px-3 py-2.5 transition-all ${
                !canEditTitle ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400'
              }`}
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              disabled={!canEditTitle}
            />
            {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
            {!canEditTitle && <p className="text-xs text-gray-500 mt-1">{t('client.editRequest.titleLocked', 'El título no se puede cambiar después de recibir propuestas')}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.descriptionLabel')}</label>
            <textarea
              rows={5}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
            {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
          </div>

          {/* Fotos y videos */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.attachMultimedia')}</label>
            
            {/* Photos */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('client.createRequest.photosLabel')}
              </div>
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-20 h-20 border border-gray-200 rounded-xl overflow-hidden group">
                      <img src={p.url} alt="foto" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  const validation = validateFiles(files, {
                    maxFiles: 10, maxSizeMB: 200,
                    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                  });
                  if (!validation.valid) { validation.errors.forEach(err => toast.error(err)); return; }
                  setUploadingMedia(true);
                  try {
                    setUploadProgress({ show: true, progress: 0, message: t('client.createRequest.compressingImages'), totalFiles: validation.validFiles.length, currentFile: 0, status: 'compressing' });
                    const compressedFiles = await compressImages(validation.validFiles, { maxSizeMB: 2, maxWidthOrHeight: 1920, initialQuality: 0.85 });
                    setUploadProgress(prev => ({ ...prev, progress: 30, message: t('client.createRequest.uploadingPhotos', { size: 0 }), status: 'uploading' }));
                    const fd = new FormData();
                    compressedFiles.forEach((f) => fd.append('files', f));
                    fd.append('type', 'photos');
                    const res = await api.post('/uploads/service-request/media', fd, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                      timeout: 600000,
                      onUploadProgress: (ev) => {
                        if (!ev.total) return;
                        setUploadProgress(prev => ({ ...prev, progress: 30 + Math.round((ev.loaded / ev.total) * 60) }));
                      }
                    });
                    const uploaded = Array.isArray(res?.data?.data?.photos) ? res.data.data.photos : [];
                    if (uploaded.length) {
                      setPhotos(prev => [...prev, ...uploaded]);
                      setUploadProgress({ show: true, progress: 100, message: t('client.createRequest.photosUploaded'), totalFiles: uploaded.length, currentFile: uploaded.length, status: 'success' });
                      setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 2000);
                      toast.success(t('client.createRequest.photosUploadedSuccess', { count: uploaded.length }));
                    }
                  } catch (err) {
                    toast.error(err?.response?.data?.message || t('client.createRequest.photosUploadError'));
                    setUploadProgress({ show: true, progress: 0, message: t('client.createRequest.photoUploadErrorMessage'), status: 'error' });
                    setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 3000);
                  } finally { setUploadingMedia(false); }
                  e.target.value = '';
                }}
                className="block w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            {/* Videos */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('client.createRequest.videosLabel')}
              </div>
              {videos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {videos.map((v, idx) => (
                    <div key={idx} className="relative w-20 h-20 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-900 text-white text-[10px] group">
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setVideos(prev => prev.filter((_, i) => i !== idx))}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  const validation = validateFiles(files, {
                    maxFiles: 10, maxSizeMB: 200,
                    allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/webm']
                  });
                  if (!validation.valid) { validation.errors.forEach(err => toast.error(err)); return; }
                  setUploadingMedia(true);
                  try {
                    const fd = new FormData();
                    validation.validFiles.forEach((f) => fd.append('files', f));
                    fd.append('type', 'videos');
                    setUploadProgress({ show: true, progress: 0, message: t('client.createRequest.uploadingVideos', { size: 0 }), totalFiles: validation.validFiles.length, currentFile: 0, status: 'uploading' });
                    const res = await api.post('/uploads/service-request/media', fd, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                      timeout: 600000,
                      onUploadProgress: (ev) => {
                        if (!ev.total) return;
                        setUploadProgress(prev => ({ ...prev, progress: Math.round((ev.loaded / ev.total) * 90) }));
                      }
                    });
                    const uploaded = Array.isArray(res?.data?.data?.videos) ? res.data.data.videos : [];
                    if (uploaded.length) {
                      setVideos(prev => [...prev, ...uploaded]);
                      setUploadProgress({ show: true, progress: 100, message: t('client.createRequest.videosUploaded'), totalFiles: uploaded.length, currentFile: uploaded.length, status: 'success' });
                      setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 2000);
                      toast.success(t('client.createRequest.videosUploadedSuccess', { count: uploaded.length }));
                    }
                  } catch (err) {
                    toast.error(err?.response?.data?.message || t('client.createRequest.videosUploadError'));
                    setUploadProgress({ show: true, progress: 0, message: t('client.createRequest.videoUploadErrorMessage'), status: 'error' });
                    setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 3000);
                  } finally { setUploadingMedia(false); }
                  e.target.value = '';
                }}
                className="block w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            {uploadingMedia && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {t('client.createRequest.uploadingFiles')}
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.mapLocation')}</label>
            <div className="mt-1">
              <MapPicker value={coords} onChange={setCoords} />
            </div>
            {formErrors.coordinates && <p className="text-xs text-red-600 mt-1">{formErrors.coordinates}</p>}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.addressLabel')}</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            />
            {formErrors.address && <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>}
          </div>

          {/* Fecha y presupuesto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.preferredDate')}</label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                value={form.preferredDate}
                onChange={(e) => setForm(f => ({ ...f, preferredDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('client.createRequest.estimatedBudget')} ({form.currency})</label>
              <div className="mt-1 flex gap-2">
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2.5"
                  value={form.currency}
                  onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="MXN">MXN</option>
                  <option value="ARS">ARS</option>
                </select>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  value={form.budgetAmount}
                  onChange={(e) => setForm(f => ({ ...f, budgetAmount: e.target.value }))}
                />
              </div>
              {formErrors.budgetAmount && <p className="text-xs text-red-600 mt-1">{formErrors.budgetAmount}</p>}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              {t('client.editRequest.saveChanges', 'Guardar cambios')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/mis-solicitudes')}
              className="px-5 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

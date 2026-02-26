import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import PortfolioModal from '@/components/ui/PortfolioModal.jsx';
import MapPicker from '@/components/ui/MapPicker.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from '@/components/ui/UploadProgress.jsx';

const URGENCY = [
  { value: 'immediate', label: 'client.createRequest.urgency.immediate' },
  { value: 'scheduled', label: 'client.createRequest.urgency.scheduled' }
];

export default function CreateRequest() {
  const { t } = useTranslation();
  const { role, roles, viewRole, clearError, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
  // Arrancamos sin coordenadas para permitir geolocalización en el MapPicker
  const [coords, setCoords] = useState(null);
  const [eligibility, setEligibility] = useState({ loading: false, count: null, providers: [] });
  const [lastEligibilityAt, setLastEligibilityAt] = useState(null);
  const [photos, setPhotos] = useState([]); // [{ url, cloudinaryId, caption }]
  const [videos, setVideos] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState([]); // IDs de proveedores seleccionados
  const [sendToAll, setSendToAll] = useState(true); // Por defecto enviar a todos
  const [portfolioModal, setPortfolioModal] = useState({ isOpen: false, portfolio: [], providerName: '' });
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    progress: 0,
    fileName: '',
    message: 'Subiendo archivos...',
    totalFiles: 0,
    currentFile: 0,
    status: 'uploading'
  });

  // Cargar categorías activas al montar
  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        setLoadingCategories(true);
        const { data } = await api.get('/client/categories/active');
        const cats = data?.data?.categories || [];
        setCategories(cats);
        // Establecer primera categoría como default si no hay selección
        if (cats.length > 0 && !form.category) {
          setForm(f => ({ ...f, category: cats[0].value }));
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchActiveCategories();
  }, [toast]);

  const fetchEligibility = useCallback(async () => {
    if (!form.category) {
      console.log('⚠️ No category selected, skipping eligibility check');
      return;
    }
    
    console.log('🔍 Fetching eligibility for:', { category: form.category, urgency: form.urgency, hasCoords: !!coords });
    setEligibility(e => ({ ...e, loading: true }));
    try {
      const params = { category: form.category, urgency: form.urgency, include: 'details', limit: 5 };
      if (
        coords &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng) &&
        (coords.lat !== 0 || coords.lng !== 0)
      ) {
        params.lat = coords.lat;
        params.lng = coords.lng;
        console.log('📍 Using coordinates:', params.lat, params.lng);
      } else {
        console.log('📍 No valid coordinates, category-only search');
      }
      
      const { data } = await api.get(`/client/eligibility`, { params });
      console.log('✅ Eligibility response:', data);
      
      const count = data?.data?.totalEligible ?? 0;
      const providers = Array.isArray(data?.data?.providers) ? data.data.providers : [];
      
      console.log(`📊 Found ${count} eligible providers, ${providers.length} with details`);
      
      setEligibility({ loading: false, count, providers });
      setLastEligibilityAt(new Date());
    } catch (err) {
      console.error('❌ Eligibility fetch error:', err);
      setEligibility({ loading: false, count: null, providers: [] });
    }
  }, [form.category, form.urgency, coords]);

  useEffect(() => {
    const t = setTimeout(fetchEligibility, 400); // debounce
    return () => clearTimeout(t);
  }, [fetchEligibility]);

  useEffect(() => { clearError?.(); }, [clearError]);

  const isClientCapable = useMemo(() => (
    viewRole === 'client' || role === 'client' || roles?.includes('client') || roles?.includes('provider')
  ), [viewRole, role, roles]);

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isClientCapable) {
    return <Alert type="warning">{t('client.requests.clientOnlySection')}</Alert>;
  }

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

  const toggleProviderSelection = (providerId) => {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedProviders.length === eligibility.providers.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(eligibility.providers.map(p => p._id));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Validar selección de proveedores si no es "enviar a todos"
    if (!sendToAll && selectedProviders.length === 0) {
      toast.error(t('client.createRequest.selectProviderError'));
      return;
    }

    setLoading(true); setError('');
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
        preferredTime: undefined,
        budget: { amount: Number(form.budgetAmount), currency: form.currency || 'USD' },
        photos,
        videos,
        visibility: 'auto',
        // Agregar proveedores específicos si no se envía a todos
        targetProviders: sendToAll ? undefined : selectedProviders
      };
      const { data } = await api.post('/client/requests', payload);
      if (data?.success) {
        toast.success(t('client.createRequest.createdSuccess', { count: sendToAll ? t('client.createRequest.allEligible') : selectedProviders.length }));
        navigate('/mis-solicitudes');
      } else {
        toast.warning(data?.message || t('client.createRequest.createError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.createRequest.createError');
      setError(msg);
    } finally { setLoading(false); }
  };

  const saveDraft = async () => {
    if (!validate()) return;
    setLoading(true); setError('');
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
        preferredTime: undefined,
        budget: { amount: Number(form.budgetAmount), currency: form.currency || 'USD' },
        photos,
        videos,
        visibility: 'auto',
        saveAsDraft: true
      };
      const { data } = await api.post('/client/requests', payload);
      if (data?.success) {
        toast.success(t('client.createRequest.draftSaved'));
        navigate('/mis-solicitudes');
      } else {
        toast.warning(data?.message || t('client.createRequest.draftError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.createRequest.draftError');
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Indicador de progreso */}
      <UploadProgress {...uploadProgress} />

      <div>
        <h2 className="text-2xl font-semibold">{t('client.createRequest.title')}</h2>
        <p className="text-sm text-gray-600">{t('client.createRequest.subtitle')}</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={onSubmit} className={`space-y-4 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
        {/* Primero categoría y urgencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">{t('client.createRequest.category')}</label>
            {loadingCategories ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                {t('client.createRequest.loadingCategories')}
              </div>
            ) : categories.length === 0 ? (
              <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                {t('client.createRequest.noCategories')}
              </div>
            ) : (
              <select 
                className="mt-1 w-full border rounded-md px-3 py-2" 
                value={form.category} 
                onChange={(e)=>setForm(f=>({...f, category: e.target.value}))}
                disabled={categories.length === 0}
              >
                {categories.map((c)=> (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.providerCount} {c.providerCount === 1 ? 'proveedor' : 'proveedores'})
                  </option>
                ))}
              </select>
            )}
            {formErrors.category && <p className="text-xs text-red-600 mt-1">{formErrors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">{t('client.createRequest.urgencyLabel')}</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={form.urgency} onChange={(e)=>setForm(f=>({...f, urgency: e.target.value}))}>
              {URGENCY.map((u)=> <option key={u.value} value={u.value}>{t(u.label)}</option>)}
            </select>
          </div>
        </div>

        {/* Elegibilidad basada en categoría/urgencia y coordenadas si disponibles */}
        <div className="p-3 rounded-md border bg-gray-50 text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              {eligibility.loading && <span>{t('client.createRequest.calculatingEligibility')}</span>}
              {!eligibility.loading && eligibility.count !== null && (
                eligibility.count === 0
                  ? <span className="text-red-600">{t('client.createRequest.noProvidersEligibility')}</span>
                  : <span className="text-brand-700">{t('client.createRequest.eligibleProviders', { count: eligibility.count })}</span>
              )}
              {!eligibility.loading && eligibility.count === null && <span>{t('client.createRequest.eligibilityError')}</span>}
            </div>
            <Button type="button" variant="secondary" onClick={fetchEligibility} disabled={eligibility.loading}>
              {t('common.update')}
            </Button>
          </div>
          
          {lastEligibilityAt && (
            <div className="text-xs text-gray-500 mb-2">{t('client.createRequest.lastUpdate')}: {lastEligibilityAt.toLocaleTimeString()}</div>
          )}
          
          {(!eligibility.loading && Array.isArray(eligibility.providers) && eligibility.providers.length > 0) && (
              <div className="mt-3 text-xs">
                <div className="mb-3 p-3 bg-brand-50 border border-brand-200 rounded-md">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToAll}
                        onChange={(e) => {
                          setSendToAll(e.target.checked);
                          if (e.target.checked) {
                            setSelectedProviders([]);
                          }
                        }}
                        className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                      />
                      <span>{t('client.createRequest.sendToAllProviders')}</span>
                    </label>
                  </div>
                  {!sendToAll && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-200">
                      <span className="text-xs text-gray-600">
                        {t('client.createRequest.selectedCount', { selected: selectedProviders.length, total: eligibility.providers.length })}
                      </span>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                      >
                        {selectedProviders.length === eligibility.providers.length ? t('client.createRequest.deselectAll') : t('client.createRequest.selectAll')}
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-gray-900 mb-2 font-semibold text-sm">{t('client.createRequest.providersSortedByScore')}</div>
                <ul className="space-y-3 mt-2">
                  {eligibility.providers.map((p, idx) => (
                    <li key={p._id || idx} className={`text-gray-700 rounded-lg p-3 border shadow-sm ${
                      p.canReceiveLeads === false 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : selectedProviders.includes(p._id) && !sendToAll
                        ? 'bg-brand-50 border-brand-300'
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        {!sendToAll && (
                          <div className="shrink-0 pt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedProviders.includes(p._id)}
                              onChange={() => toggleProviderSelection(p._id)}
                              disabled={p.canReceiveLeads === false}
                              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {p.businessName || p.profile?.firstName || t('client.proposals.provider')}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                            {p.canReceiveLeads === false && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800 font-medium">
                                {t('client.createRequest.limitReached')}
                              </span>
                            )}
                            {p.plan && (
                              <span className={`px-1.5 py-0.5 rounded font-medium ${
                                p.plan === 'pro' ? 'bg-brand-100 text-brand-700' :
                                p.plan === 'basic' ? 'bg-gray-100 text-gray-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {p.plan.toUpperCase()}
                              </span>
                            )}
                            {p.rating != null && (
                              <span className="text-yellow-600 flex items-center gap-0.5">
                                ★ {Number(p.rating).toFixed(1)}
                              </span>
                            )}
                            {p.distance != null && (
                              <span className="text-gray-500">
                                📍 {(p.distance / 1000).toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {/* Score */}
                          <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase">Score</div>
                            <div className="text-sm font-bold text-brand-600">{p.score?.toFixed(1) || 'N/A'}</div>
                          </div>
                          
                          {/* Portfolio badge and button */}
                          {p.portfolio && p.portfolio.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setPortfolioModal({
                                isOpen: true,
                                portfolio: p.portfolio,
                                providerName: p.businessName || p.profile?.firstName || 'Proveedor'
                              })}
                              className="flex items-center gap-1 px-2 py-1 bg-accent-100 hover:bg-accent-200 text-accent-700 rounded text-[10px] font-medium transition-colors"
                              title="Ver portafolio"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span>{t('client.createRequest.portfolio')} ({p.portfolio.length})</span>
                            </button>
                          ) : (
                            <div className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-[10px] font-medium">
                              {t('client.createRequest.noPortfolio')}
                            </div>
                          )}
                        </div>
                      </div>
                      {p.canReceiveLeads === false && (
                        <div className="mt-1 text-[10px] text-yellow-700 italic">
                          {t('client.createRequest.limitReachedDescription')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        {/* Resto de campos */}
        <div>
          <label className="block text-sm font-medium">{t('client.createRequest.titleLabel')}</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={form.title} onChange={(e)=>setForm(f=>({...f, title: e.target.value}))} />
          {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
        </div>
        {/* Adjuntos multimedia */}
        <div className="space-y-2">
          <div className="text-sm font-medium">{t('client.createRequest.attachMultimedia')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MediaUploader
              label={t('client.createRequest.photosLabel')}
              accept="image/*"
              onUpload={async (files) => {
                if (!files || files.length === 0) return;
                
                // Validar archivos
                const validation = validateFiles(files, {
                  maxFiles: 10,
                  maxSizeMB: 200,
                  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                });

                if (!validation.valid) {
                  validation.errors.forEach(err => toast.error(err));
                  return;
                }

                setUploadingMedia(true);
                try {
                  // Comprimir imágenes
                  setUploadProgress({
                    show: true,
                    progress: 0,
                    fileName: '',
                    message: t('client.createRequest.compressingImages'),
                    totalFiles: validation.validFiles.length,
                    currentFile: 0,
                    status: 'compressing'
                  });

                  const compressedFiles = await compressImages(validation.validFiles, {
                    maxSizeMB: 2,
                    maxWidthOrHeight: 1920,
                    initialQuality: 0.85
                  }, (progress) => {
                    setUploadProgress(prev => ({
                      ...prev,
                      progress: progress.percentage * 0.3,
                      currentFile: progress.current
                    }));
                  });

                  // Subir archivos
                  const totalSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
                  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
                  
                  setUploadProgress(prev => ({
                    ...prev,
                    progress: 30,
                    message: t('client.createRequest.uploadingPhotos', { size: totalSizeMB }),
                    status: 'uploading',
                    fileName: compressedFiles[0]?.name || ''
                  }));

                  const fd = new FormData();
                  compressedFiles.forEach((f) => fd.append('files', f));
                  fd.append('type', 'photos');
                  
                  console.log('📤 Uploading photos:', compressedFiles.length, 'files,', totalSizeMB, 'MB');

                  const res = await api.post('/uploads/service-request/media', fd, { 
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 600000,
                    onUploadProgress: (progressEvent) => {
                      if (!progressEvent.total) return;
                      
                      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                      // 30% compresión + 60% subida = 90% (deja 10% para procesamiento)
                      const adjustedProgress = 30 + Math.round((percentCompleted * 60) / 100);
                      
                      setUploadProgress(prev => ({
                        ...prev,
                        progress: Math.min(adjustedProgress, 90),
                        message: `Subiendo fotos... (${totalSizeMB}MB)`
                      }));
                    }
                  });
                  
                  // Mostrar procesamiento
                  setUploadProgress(prev => ({
                    ...prev,
                    progress: 95,
                    message: t('client.createRequest.processingPhotos'),
                    status: 'processing'
                  }));
                  
                  console.log('✅ Upload response:', res.data);
                  
                  const uploaded = Array.isArray(res?.data?.data?.photos) ? res.data.data.photos : [];
                  if (uploaded.length) {
                    setPhotos((prev) => [...prev, ...uploaded]);
                    
                    setUploadProgress({
                      show: true,
                      progress: 100,
                      message: t('client.createRequest.photosUploaded'),
                      totalFiles: uploaded.length,
                      currentFile: uploaded.length,
                      status: 'success'
                    });

                    setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 2000);
                    toast.success(t('client.createRequest.photosUploadedSuccess', { count: uploaded.length }));
                  }
                } catch (e) {
                  console.error('❌ Upload error:', e);
                  const errorMsg = e?.response?.data?.message || t('client.createRequest.photosUploadError');
                  
                  setUploadProgress({
                    show: true,
                    progress: 0,
                    message: t('client.createRequest.photoUploadErrorMessage'),
                    status: 'error'
                  });
                  setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 3000);
                  
                  toast.error(errorMsg);
                }
                finally { setUploadingMedia(false); }
              }}
            >
              {!!photos?.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                      <img src={p.url} alt="foto" className="w-full h-full object-cover" />
                      <button type="button" className="absolute -top-1 -right-1 bg-white/80 text-red-600 rounded-full px-1 text-xs" onClick={() => setPhotos(prev => prev.filter((_,i)=> i!==idx))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </MediaUploader>
            <MediaUploader
              label={t('client.createRequest.videosLabel')}
              accept="video/*"
              onUpload={async (files) => {
                if (!files || files.length === 0) return;
                
                // Validar archivos
                const validation = validateFiles(files, {
                  maxFiles: 10,
                  maxSizeMB: 200,
                  allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/webm']
                });

                if (!validation.valid) {
                  validation.errors.forEach(err => toast.error(err));
                  return;
                }
                
                setUploadingMedia(true);
                try {
                  const totalSize = validation.validFiles.reduce((sum, f) => sum + f.size, 0);
                  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
                  
                  setUploadProgress({
                    show: true,
                    progress: 0,
                    fileName: validation.validFiles[0]?.name || '',
                    message: t('client.createRequest.uploadingVideos', { size: totalSizeMB }),
                    totalFiles: validation.validFiles.length,
                    currentFile: 0,
                    status: 'uploading'
                  });

                  const fd = new FormData();
                  validation.validFiles.forEach((f) => fd.append('files', f));
                  fd.append('type', 'videos');
                  
                  console.log(`📤 Uploading ${validation.validFiles.length} video(s), total size: ${totalSizeMB}MB`);

                  const res = await api.post('/uploads/service-request/media', fd, { 
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 600000, // 10 minutos
                    onUploadProgress: (progressEvent) => {
                      if (!progressEvent.total) return;
                      
                      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                      // Limitar a 90% para dejar margen al procesamiento
                      const adjustedProgress = Math.round((percentCompleted * 90) / 100);
                      
                      setUploadProgress(prev => ({
                        ...prev,
                        progress: Math.min(adjustedProgress, 90),
                        message: `Subiendo videos... (${totalSizeMB}MB)`
                      }));
                    }
                  });
                  
                  // Mostrar procesamiento
                  setUploadProgress(prev => ({
                    ...prev,
                    progress: 95,
                    message: t('client.createRequest.processingVideos'),
                    status: 'processing'
                  }));
                  
                  console.log('✅ Upload response:', res.data);
                  
                  const uploaded = Array.isArray(res?.data?.data?.videos) ? res.data.data.videos : [];
                  if (uploaded.length) {
                    setVideos((prev) => [...prev, ...uploaded]);
                    
                    setUploadProgress({
                      show: true,
                      progress: 100,
                      message: t('client.createRequest.videosUploaded'),
                      totalFiles: uploaded.length,
                      currentFile: uploaded.length,
                      status: 'success'
                    });

                    setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 2000);
                    toast.success(t('client.createRequest.videosUploadedSuccess', { count: uploaded.length }));
                  }
                } catch (e) {
                  console.error('❌ Upload error:', e);
                  let errorMsg = t('client.createRequest.videosUploadError');
                  
                  if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
                    errorMsg = t('client.createRequest.videoTooLarge');
                  } else if (e?.response?.data?.message) {
                    errorMsg = e.response.data.message;
                  }
                  
                  setUploadProgress({
                    show: true,
                    progress: 0,
                    message: t('client.createRequest.videoUploadErrorMessage'),
                    status: 'error'
                  });
                  setTimeout(() => setUploadProgress(prev => ({ ...prev, show: false })), 3000);
                  
                  toast.error(errorMsg);
                }
                finally { setUploadingMedia(false); }
              }}
            >
              {!!videos?.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {videos.map((v, idx) => (
                    <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden flex items-center justify-center bg-black text-white text-[10px]">
                      <span>Video</span>
                      <button type="button" className="absolute -top-1 -right-1 bg-white/80 text-red-600 rounded-full px-1 text-xs" onClick={() => setVideos(prev => prev.filter((_,i)=> i!==idx))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </MediaUploader>
          </div>
          {uploadingMedia && (
            <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-3 py-2 rounded-md">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('client.createRequest.uploadingFiles')}</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">{t('client.createRequest.mapLocation')}</label>
          <div className="mt-1">
            <MapPicker value={coords} onChange={setCoords} />
          </div>
          {formErrors.coordinates && <p className="text-xs text-red-600 mt-1">{formErrors.coordinates}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">{t('client.createRequest.descriptionLabel')}</label>
          <textarea rows={5} className="mt-1 w-full border rounded-md px-3 py-2" value={form.description} onChange={(e)=>setForm(f=>({...f, description: e.target.value}))} />
          {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">{t('client.createRequest.addressLabel')}</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={form.address} onChange={(e)=>setForm(f=>({...f, address: e.target.value}))} />
          {formErrors.address && <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">{t('client.createRequest.preferredDate')}</label>
            <input type="date" className="mt-1 w-full border rounded-md px-3 py-2" value={form.preferredDate} onChange={(e)=>setForm(f=>({...f, preferredDate: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium">{t('client.createRequest.estimatedBudget')} ({form.currency})</label>
            <div className="mt-1 flex gap-2">
              <select className="border rounded-md px-3 py-2" value={form.currency} onChange={(e)=>setForm(f=>({...f, currency: e.target.value}))}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
                <option value="ARS">ARS</option>
              </select>
              <input type="number" min="1" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.budgetAmount} onChange={(e)=>setForm(f=>({...f, budgetAmount: e.target.value}))} />
            </div>
            {formErrors.budgetAmount && <p className="text-xs text-red-600 mt-1">{formErrors.budgetAmount}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            const disabledPublish = !eligibility.loading && eligibility.count === 0;
            const tooltipText = disabledPublish ? 'No hay proveedores disponibles para esta categoría/urgencia en tu zona' : undefined;
            return (
              <span className={disabledPublish ? 'inline-block' : ''} title={tooltipText}>
                <Button type="submit" loading={loading} disabled={disabledPublish}>{t('client.createRequest.publishRequest')}</Button>
              </span>
            );
          })()}
          <Button type="button" variant="secondary" onClick={saveDraft} disabled={loading}>{t('client.createRequest.saveDraft')}</Button>
          <Button type="button" variant="ghost" onClick={()=>navigate('/mis-solicitudes')}>{t('common.cancel')}</Button>
        </div>
      </form>

      {/* Portfolio Modal */}
      <PortfolioModal
        isOpen={portfolioModal.isOpen}
        onClose={() => setPortfolioModal({ isOpen: false, portfolio: [], providerName: '' })}
        portfolio={portfolioModal.portfolio}
        providerName={portfolioModal.providerName}
      />
    </div>
  );
}

// Inline helper component for media uploads (local to this file)
function MediaUploader({ label, accept, onUpload, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        type="file"
        multiple
        accept={accept}
        onChange={(e) => onUpload?.(e.target.files)}
        className="block w-full border rounded-md px-3 py-2 text-sm"
      />
      {children}
    </div>
  );
}

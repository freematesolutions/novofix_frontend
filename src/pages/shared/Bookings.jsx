import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from '@/components/ui/UploadProgress.jsx';
import { getTranslatedRequestInfo, getTranslatedReviewInfo, useCurrentLanguage } from '@/utils/translations.js';

const PROVIDER_STATUSES = [
  { value: 'completed', labelKey: 'shared.bookings.status.completed' },
  { value: 'cancelled', labelKey: 'shared.bookings.status.cancelled' }
];

// Mapa de transiciones simplificado: confirmed → completed directamente
const STATUS_FLOW = {
  confirmed: { next: 'completed', labelKey: 'shared.bookings.actions.confirmBooking', icon: '✅' },
  completed: null,
  cancelled: null
};

const CATEGORY_KEYS = ['professionalism', 'quality', 'punctuality', 'communication', 'value'];

const buildCategoryMap = (value) => CATEGORY_KEYS.reduce((acc, key) => {
  acc[key] = value;
  return acc;
}, {});

const calculateOverallFromCategories = (cats) => {
  const total = CATEGORY_KEYS.reduce((sum, key) => sum + Number(cats[key] || 0), 0);
  const avg = total / CATEGORY_KEYS.length;
  return Math.max(1, Math.round(avg));
};

export default function Bookings() {
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage(); // Hook reactivo al cambio de idioma
  const { viewRole, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [updating, setUpdating] = useState(''); // bookingId
  const [chatLoading, setChatLoading] = useState(''); // bookingId while opening chat
  // Filtros
  const [statusFilter, setStatusFilter] = useState(''); // '' = todos
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('');
  // Evidencia modal
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceBooking, setEvidenceBooking] = useState(null);
  const [evidenceType, setEvidenceType] = useState('before'); // before|during|after
  const [evidenceFiles, setEvidenceFiles] = useState([]); // Array of File objects
  const [evidencePreviews, setEvidencePreviews] = useState([]); // Array of preview objects
  const [evidenceCaptions, setEvidenceCaptions] = useState([]); // Array of captions
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceProgress, setEvidenceProgress] = useState({
    show: false,
    progress: 0,
    fileName: '',
    message: 'Procesando archivos...',
    totalFiles: 0,
    currentFile: 0,
    status: 'uploading'
  });
  // Lightbox para evidencias (imágenes)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState([]); // array de { url, kind: 'image'|'video' }
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Reseñas
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewOverall, setReviewOverall] = useState(5);
  const [reviewCats, setReviewCats] = useState(buildCategoryMap(5));
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [reviewsByBooking, setReviewsByBooking] = useState({}); // bookingId -> review
  const [reviewLoadingMap, setReviewLoadingMap] = useState({}); // bookingId -> bool
  // Feedback de plataforma (cliente califica NovoFix)
  const [platformRating, setPlatformRating] = useState(0); // 0 = no calificado
  const [platformComment, setPlatformComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  // Responder reseña (proveedor)
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseReview, setResponseReview] = useState(null);
  const [responseComment, setResponseComment] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseMode, setResponseMode] = useState('create'); // 'create' | 'edit'
  // Reseña del proveedor hacia el cliente
  const [clientReviewOpen, setClientReviewOpen] = useState(false);
  const [clientReviewBooking, setClientReviewBooking] = useState(null);
  const [clientReviewOverall, setClientReviewOverall] = useState(5);
  const [clientReviewCats, setClientReviewCats] = useState({ communication: 5, punctuality: 5, respect: 5, clarity: 5, payment: 5 });
  const [clientReviewComment, setClientReviewComment] = useState('');
  const [clientReviewLoading, setClientReviewLoading] = useState(false);
  const [clientReviewedIds, setClientReviewedIds] = useState(new Set());
  const [sentClientReviews, setSentClientReviews] = useState({}); // Calificaciones enviadas por el proveedor (para mostrar)
  // Feedback de plataforma desde proveedor
  const [providerPlatformRating, setProviderPlatformRating] = useState(0);
  const [providerPlatformComment, setProviderPlatformComment] = useState('');
  const [providerWouldRecommend, setProviderWouldRecommend] = useState(true);
  // Para que el cliente vea la reseña que el proveedor le dejó
  const [viewClientReviewOpen, setViewClientReviewOpen] = useState(false);
  const [viewClientReviewData, setViewClientReviewData] = useState(null);
  const [viewClientReviewLoading, setViewClientReviewLoading] = useState({});
  const [clientReviewsByBooking, setClientReviewsByBooking] = useState({});

  // Paginación básica
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  useEffect(()=>{ clearError?.(); }, [clearError]);

  // Usar viewRole para usuarios multirol (determina qué vista está activa)
  const isProvider = viewRole === 'provider';
  const isClient = viewRole === 'client';

  // Endpoint compartido según rol (server valida ownership)
  const listEndpoint = (isProvider || isClient) ? '/bookings' : null;

  // Función para cargar una reseña individual (definida primero para poder usarla en load)
  const loadSingleReview = async (bookingId) => {
    setReviewLoadingMap((m)=> ({ ...m, [bookingId]: true }));
    try {
      const r = await api.get(`/reviews/booking/${bookingId}`);
      const review = r?.data?.data?.review || null;
      if (review) {
        setReviewsByBooking((prev)=> ({ ...prev, [bookingId]: review }));
      } else {
        // Marcar como cargado sin reseña para no reintentar
        setReviewsByBooking((prev)=> ({ ...prev, [bookingId]: null }));
      }
    } catch {
      // Si hay error (ej: 404), marcar como null para que se pueda crear
      setReviewsByBooking((prev)=> ({ ...prev, [bookingId]: null }));
    } finally {
      setReviewLoadingMap((m)=> ({ ...m, [bookingId]: false }));
    }
  };

  // Función para cargar la reseña que el proveedor dejó al cliente
  const loadClientReview = async (bookingId) => {
    setViewClientReviewLoading((m)=> ({ ...m, [bookingId]: true }));
    try {
      const r = await api.get(`/reviews/client/booking/${bookingId}`);
      const review = r?.data?.data?.review || null;
      setClientReviewsByBooking((prev)=> ({ ...prev, [bookingId]: review }));
      return review;
    } catch {
      setClientReviewsByBooking((prev)=> ({ ...prev, [bookingId]: null }));
      return null;
    } finally {
      setViewClientReviewLoading((m)=> ({ ...m, [bookingId]: false }));
    }
  };

  // Abrir modal para que el cliente vea la reseña del proveedor
  const openViewClientReview = async (booking) => {
    // Si ya está cargada, usar cache
    if (clientReviewsByBooking[booking._id] !== undefined) {
      setViewClientReviewData(clientReviewsByBooking[booking._id]);
      if (clientReviewsByBooking[booking._id]) {
        setViewClientReviewOpen(true);
      } else {
        toast.info(t('shared.bookings.review.noProviderReview'));
      }
      return;
    }
    // Cargar la reseña
    const review = await loadClientReview(booking._id);
    if (review) {
      setViewClientReviewData(review);
      setViewClientReviewOpen(true);
    } else {
      toast.info(t('shared.bookings.review.noProviderReview'));
    }
  };

  const load = async () => {
    if (!listEndpoint) return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page);
      params.set('limit', limit);
      // Enviar el viewRole activo para usuarios multirol
      if (viewRole) params.set('viewRole', viewRole);
      const url = `${listEndpoint}?${params.toString()}`;
      const { data } = await api.get(url);
      const list = data?.data?.bookings || data?.bookings || [];
      const pg = data?.data?.pagination || data?.pagination;
      if (pg?.pages) setPages(pg.pages);
      setBookings(list);
      // Resetear el cache de reseñas
      setReviewsByBooking({});
      setClientReviewsByBooking({});
      
      // Pre-cargar reseñas para bookings completados (solo para clientes)
      if (isClient) {
        const completedBookings = list.filter(b => b.status === 'completed');
        completedBookings.forEach(b => {
          loadSingleReview(b._id);
        });
      }
      
      // Pre-cargar calificaciones enviadas al cliente para proveedores
      if (isProvider) {
        const completedBookings = list.filter(b => b.status === 'completed');
        const existingClientReviewIds = new Set();
        const sentReviewsMap = {};
        
        // Cargar cada calificación enviada al cliente
        await Promise.all(completedBookings.map(async (b) => {
          try {
            const res = await api.get(`/reviews/client/booking/${b._id}`);
            const review = res?.data?.data?.review;
            if (review) {
              existingClientReviewIds.add(b._id);
              sentReviewsMap[b._id] = review;
            }
          } catch {
            // Si hay error (404 o similar), no existe la reseña
          }
        }));
        
        setClientReviewedIds(existingClientReviewIds);
        setSentClientReviews(sentReviewsMap);
      }
    } catch (err) {
      setError(err?.response?.data?.message || t('shared.bookings.errors.loadFailed'));
    } finally { setLoading(false); }
  };
  const openResponse = (review) => {
    setResponseReview(review);
    setResponseComment('');
    setResponseMode('create');
    setResponseOpen(true);
  };

  const openEditResponse = (review) => {
    setResponseReview(review);
    setResponseComment(review?.providerResponse?.comment || '');
    setResponseMode('edit');
    setResponseOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseReview || !responseComment.trim()) {
      toast.warning(t('shared.bookings.validation.writeResponse'));
      return;
    }
    setResponseLoading(true);
    try {
      if (responseMode === 'edit') {
        await api.patch(`/reviews/${responseReview._id}/response`, { comment: responseComment });
        toast.success(t('shared.bookings.success.responseUpdated'));
      } else {
        await api.put(`/reviews/${responseReview._id}/response`, { comment: responseComment });
        toast.success(t('shared.bookings.success.responsePublished'));
      }
      // Actualizar en memoria
      const bookingId = responseReview.booking;
      setReviewsByBooking((prev) => ({
        ...prev,
        [bookingId]: {
          ...prev[bookingId],
          providerResponse: { comment: responseComment, respondedAt: new Date().toISOString() }
        }
      }));
      // Refrescar desde servidor para sincronizar estado/moderación
  try { await loadSingleReview(bookingId); } catch { /* noop */ }
      setResponseOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('shared.bookings.errors.responsePublishFailed'));
    } finally {
      setResponseLoading(false);
    }
  };

  const handleDeleteResponse = async (review) => {
    if (!review) return;
    if (!window.confirm(t('shared.bookings.confirm.deleteResponse'))) return;
    try {
      await api.delete(`/reviews/${review._id}/response`);
      const bookingId = review.booking;
      setReviewsByBooking((prev) => ({
        ...prev,
        [bookingId]: {
          ...prev[bookingId],
          providerResponse: undefined
        }
      }));
      toast.success(t('shared.bookings.success.responseDeleted'));
      // Refrescar estado de la review
  try { await loadSingleReview(bookingId); } catch { /* noop */ }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('shared.bookings.errors.deleteFailed'));
    }
  };

  useEffect(()=>{ if (isAuthenticated && (isProvider || isClient)) load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [isAuthenticated, isProvider, isClient, statusFilter, page]);

  // Filtrado local por fecha y texto
  const filtered = useMemo(() => {
    let list = bookings;
    // Fecha
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (to) {
        // incluir el día completo de 'to'
        to.setHours(23, 59, 59, 999);
      }
      list = list.filter((b) => {
        const d = b?.schedule?.scheduledDate ? new Date(b.schedule.scheduledDate) : null;
        if (!d) return false; // si hay filtro de fecha, ignorar los que no tienen fecha
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    // Búsqueda
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b)=>{
        const title = b?.serviceRequest?.basicInfo?.title?.toLowerCase() || '';
        const provider = b?.provider?.providerProfile?.businessName?.toLowerCase() || '';
        const client = (b?.client?.profile?.firstName + ' ' + (b?.client?.profile?.lastName || '')).toLowerCase();
        const clientEmail = b?.client?.email?.toLowerCase() || '';
        return title.includes(q) || provider.includes(q) || client.includes(q) || clientEmail.includes(q);
      });
    }
    return list;
  }, [bookings, dateFrom, dateTo, search]);

  const isMediaImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');
  const isMediaVideo = (url) => /\.(mp4|webm|ogg)$/i.test(url || '');

  const openLightbox = (items, startIndex = 0) => {
    if (!items || items.length === 0) return;
    setLightboxItems(items);
    setLightboxIndex(Math.max(0, Math.min(startIndex, items.length - 1)));
    setLightboxOpen(true);
  };
  const prevLightbox = () => setLightboxIndex((i) => (i - 1 + lightboxItems.length) % lightboxItems.length);
  const nextLightbox = () => setLightboxIndex((i) => (i + 1) % lightboxItems.length);

  const openEvidence = (booking) => {
    setEvidenceBooking(booking);
    setEvidenceType('before');
    setEvidenceFiles([]);
    setEvidencePreviews([]);
    setEvidenceCaptions([]);
    setEvidenceProgress({ show: false, progress: 0, fileName: '', message: '', totalFiles: 0, currentFile: 0, status: 'uploading' });
    setEvidenceOpen(true);
  };

  // Manejar selección de archivos para evidencia
  const handleEvidenceFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validar archivos
    const validation = validateFiles(files, {
      maxFiles: 10,
      maxSizeMB: 200,
      allowedTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/webm'
      ]
    });

    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    setEvidenceFiles(validation.validFiles);
    setEvidenceCaptions(new Array(validation.validFiles.length).fill(''));

    // Generar previews
    const newPreviews = validation.validFiles.map(file => {
      const isVideo = file.type.startsWith('video/');
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
        size: `${sizeMB}MB`
      };
    });
    setEvidencePreviews(newPreviews);
  };

  // Eliminar un archivo de la selección
  const removeEvidenceFile = (index) => {
    const newFiles = [...evidenceFiles];
    const newPreviews = [...evidencePreviews];
    const newCaptions = [...evidenceCaptions];
    
    // Revocar URL del preview
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    newCaptions.splice(index, 1);
    
    setEvidenceFiles(newFiles);
    setEvidencePreviews(newPreviews);
    setEvidenceCaptions(newCaptions);
  };

  // Actualizar caption de un archivo
  const updateEvidenceCaption = (index, value) => {
    const newCaptions = [...evidenceCaptions];
    newCaptions[index] = value;
    setEvidenceCaptions(newCaptions);
  };

  const handleUploadEvidence = async () => {
    if (!evidenceBooking) return;
    if (!evidenceFiles || evidenceFiles.length === 0) {
      toast.warning(t('shared.bookings.validation.selectFile'));
      return;
    }
    
    setEvidenceLoading(true);
    const totalFiles = evidenceFiles.length;
    
    try {
      let processedFiles = [...evidenceFiles];
      const hasVideos = evidenceFiles.some(f => f.type.startsWith('video/'));
      const imageFiles = evidenceFiles.filter(f => f.type.startsWith('image/'));

      // 1. Comprimir imágenes
      if (imageFiles.length > 0) {
        setEvidenceProgress({
          show: true,
          progress: 0,
          fileName: '',
          message: t('shared.bookings.progress.compressing'),
          totalFiles,
          currentFile: 0,
          status: 'compressing'
        });

        try {
          const compressedImages = await compressImages(imageFiles, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85
          }, (progress) => {
            setEvidenceProgress(prev => ({
              ...prev,
              progress: (progress.percentage * 0.2),
              currentFile: progress.current
            }));
          });

          // Reemplazar imágenes originales con comprimidas
          processedFiles = evidenceFiles.map(file => {
            if (file.type.startsWith('image/')) {
              const compressedIndex = imageFiles.indexOf(file);
              return compressedImages[compressedIndex];
            }
            return file;
          });
        } catch (compressError) {
          console.warn('Compression failed, using original files:', compressError);
        }
      } else if (hasVideos) {
        setEvidenceProgress({
          show: true,
          progress: 0,
          fileName: processedFiles[0]?.name || '',
          message: t('shared.bookings.progress.preparingVideos'),
          totalFiles,
          currentFile: 0,
          status: 'uploading'
        });
      }

      // 2. Subir archivos a Cloudinary
      setEvidenceProgress(prev => ({
        ...prev,
        progress: 20,
        message: hasVideos ? t('shared.bookings.progress.uploadingWithVideos') : t('shared.bookings.progress.uploading'),
        status: 'uploading',
        fileName: processedFiles[0]?.name || ''
      }));

      const form = new FormData();
      processedFiles.forEach((f) => form.append('files', f));
      form.append('context', 'booking_evidence');
      form.append('captions', JSON.stringify(evidenceCaptions));

      const upRes = await api.post('/uploads/booking-evidence', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutos
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const baseProgress = imageFiles.length > 0 ? 20 : 0;
          const progressRange = imageFiles.length > 0 ? 70 : 90;
          const adjustedProgress = baseProgress + Math.round((percentCompleted * progressRange) / 100);
          
          setEvidenceProgress(prev => ({
            ...prev,
            progress: Math.min(adjustedProgress, 90),
            message: hasVideos ? t('shared.bookings.progress.uploading') : t('shared.bookings.progress.uploadingImages')
          }));
        }
      });

      const uploaded = upRes?.data?.data?.files || upRes?.data?.files || [];
      const urls = uploaded.map((u) => u.secureUrl || u.url).filter(Boolean);
      if (urls.length === 0) throw new Error(t('shared.bookings.errors.noEvidenceUrls'));

      // 3. Registrar evidencia en el booking
      setEvidenceProgress(prev => ({
        ...prev,
        progress: 95,
        message: t('shared.bookings.progress.saving'),
        status: 'processing'
      }));

      const payload = { 
        type: evidenceType, 
        urls, 
        descriptions: evidenceCaptions.filter(c => c.trim()) 
      };
      await api.post(`/bookings/${evidenceBooking._id}/evidence`, payload);
      
      setEvidenceProgress({
        show: true,
        progress: 100,
        fileName: '',
        message: t('shared.bookings.success.evidenceUploaded'),
        totalFiles,
        currentFile: totalFiles,
        status: 'success'
      });

      setTimeout(() => {
        setEvidenceProgress(prev => ({ ...prev, show: false }));
        setEvidenceOpen(false);
        toast.success(t('shared.bookings.success.filesUploaded', { count: urls.length }));
        load();
      }, 1500);
      
    } catch (err) {
      setEvidenceProgress({
        show: true,
        progress: 0,
        fileName: '',
        message: t('shared.bookings.errors.evidenceUploadFailed'),
        totalFiles,
        currentFile: 0,
        status: 'error'
      });
      toast.error(err?.response?.data?.message || err?.message || t('shared.bookings.errors.evidenceUploadFailed'));
      setTimeout(() => {
        setEvidenceProgress(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleOverallChange = (value) => {
    setReviewOverall(value);
    setReviewCats(buildCategoryMap(value));
  };

  const handleCategoryChange = (key, value) => {
    const next = { ...reviewCats, [key]: value };
    setReviewCats(next);
    setReviewOverall(calculateOverallFromCategories(next));
  };

  const openReview = (booking) => {
    setReviewBooking(booking);
    handleOverallChange(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewFiles([]);
    // Reset platform feedback
    setPlatformRating(0);
    setPlatformComment('');
    setWouldRecommend(true);
    setReviewOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;
    if (!reviewComment.trim()) {
      toast.warning(t('shared.bookings.validation.commentRequired'));
      return;
    }
    setReviewLoading(true);
    try {
      // Subir fotos si hay - con compresión optimizada
      let photos = [];
      if (reviewFiles && reviewFiles.length > 0) {
        const files = Array.from(reviewFiles);
        
        // Validar archivos
        const validation = validateFiles(files, {
          maxFiles: 5,
          maxSizeMB: 50,
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        });
        
        if (!validation.valid) {
          validation.errors.forEach(err => toast.error(err));
          setReviewLoading(false);
          return;
        }
        
        // Comprimir imágenes antes de subir
        let processedFiles = validation.validFiles;
        try {
          const compressedImages = await compressImages(validation.validFiles, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85
          });
          processedFiles = compressedImages;
        } catch (compressError) {
          console.warn('Compression failed, using original files:', compressError);
        }
        
        const form = new FormData();
        processedFiles.forEach((f)=> form.append('files', f));
        const upRes = await api.post('/uploads/files', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000 // 2 minutos
        });
        const uploaded = upRes?.data?.data?.files || upRes?.data?.files || [];
        photos = uploaded.map((u)=> ({ url: u.secureUrl || u.url, cloudinaryId: u.cloudinaryId || u.public_id })).filter(p=> p.url);
      }

      const payload = {
        overall: Number(reviewOverall),
        categories: {
          professionalism: Number(reviewCats.professionalism),
          quality: Number(reviewCats.quality),
          punctuality: Number(reviewCats.punctuality),
          communication: Number(reviewCats.communication),
          value: Number(reviewCats.value)
        },
        title: reviewTitle,
        comment: reviewComment,
        photos
      };

      // Agregar feedback de plataforma si el usuario calificó
      if (platformRating > 0) {
        payload.platformFeedback = {
          rating: platformRating,
          comment: platformComment.trim() || '',
          wouldRecommend
        };
      }

      await api.post(`/bookings/${reviewBooking._id}/reviews`, payload);
      toast.success(t('shared.bookings.success.reviewThanks'));
      setReviewOpen(false);
      // Ocultar CTA para este booking en esta sesión
      setReviewedIds((prev)=> new Set(prev).add(reviewBooking._id));
      // Refrescar resumen de reseña en la tarjeta
      try {
        const r = await api.get(`/reviews/booking/${reviewBooking._id}`);
        const review = r?.data?.data?.review || null;
        if (review) {
          setReviewsByBooking((prev)=> ({ ...prev, [reviewBooking._id]: review }));
        }
  } catch { /* noop */ }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || t('shared.bookings.errors.reviewFailed');
      toast.error(msg);
    } finally {
      setReviewLoading(false);
    }
  };

  // ========== FUNCIONES PARA RESEÑA DEL PROVEEDOR HACIA EL CLIENTE ==========
  const openClientReview = (booking) => {
    setClientReviewBooking(booking);
    setClientReviewOverall(5);
    setClientReviewCats({ communication: 5, punctuality: 5, respect: 5, clarity: 5, payment: 5 });
    setClientReviewComment('');
    // Reset platform feedback del proveedor
    setProviderPlatformRating(0);
    setProviderPlatformComment('');
    setProviderWouldRecommend(true);
    setClientReviewOpen(true);
  };

  const handleClientOverallChange = (value) => {
    setClientReviewOverall(value);
    setClientReviewCats({ communication: value, punctuality: value, respect: value, clarity: value, payment: value });
  };

  const handleClientCategoryChange = (key, value) => {
    const next = { ...clientReviewCats, [key]: value };
    setClientReviewCats(next);
    const avg = Object.values(next).reduce((s, v) => s + v, 0) / 5;
    setClientReviewOverall(Math.max(1, Math.round(avg)));
  };

  const handleSubmitClientReview = async () => {
    if (!clientReviewBooking) return;
    setClientReviewLoading(true);
    try {
      const payload = {
        overall: clientReviewOverall,
        categories: clientReviewCats,
        comment: clientReviewComment.trim()
      };

      // Agregar feedback de plataforma si el proveedor calificó
      if (providerPlatformRating > 0) {
        payload.platformFeedback = {
          rating: providerPlatformRating,
          comment: providerPlatformComment.trim() || '',
          wouldRecommend: providerWouldRecommend
        };
      }

      await api.post(`/reviews/client/booking/${clientReviewBooking._id}`, payload);
      toast.success(t('shared.bookings.success.clientReviewThanks'));
      setClientReviewOpen(false);
      setClientReviewedIds((prev) => new Set(prev).add(clientReviewBooking._id));
      
      // Guardar la calificación enviada para mostrarla en la UI
      const sentReview = {
        rating: {
          overall: clientReviewOverall,
          categories: clientReviewCats
        },
        review: {
          comment: clientReviewComment.trim()
        }
      };
      setSentClientReviews((prev) => ({ ...prev, [clientReviewBooking._id]: sentReview }));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || t('shared.bookings.errors.clientReviewFailed');
      toast.error(msg);
    } finally {
      setClientReviewLoading(false);
    }
  };

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isProvider && !isClient) {
    return <Alert type="warning">{t('shared.bookings.errors.roleRequired')}</Alert>;
  }

  const updateStatus = async (bookingId, status) => {
    if (!isProvider) return;
    setUpdating(bookingId);
    try {
      const { data } = await api.put(`/provider/proposals/bookings/${bookingId}/status`, { status });
      if (data?.success) {
        toast.success(t('shared.bookings.success.statusUpdated'));
        load();
      } else {
        toast.warning(data?.message || t('shared.bookings.errors.updateFailed'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('shared.bookings.errors.updateStatusError'));
    } finally { setUpdating(''); }
  };

  const confirmCompletion = async (bookingId) => {
    if (!isClient) return;
    setUpdating(bookingId);
    try {
      const { data } = await api.post(`/client/bookings/${bookingId}/confirm-completion`);
      if (data?.success) {
        toast.success(t('shared.bookings.success.serviceConfirmed'));
        load();
      } else {
        toast.warning(data?.message || t('shared.bookings.errors.confirmFailed'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('shared.bookings.errors.confirmError'));
    } finally { setUpdating(''); }
  };

  // Abrir chat para comunicarse sobre la reserva
  const openBookingChat = async (booking) => {
    setChatLoading(booking._id);
    try {
      const { data } = await api.post(`/chats/booking/${booking._id}`);
      if (data?.success && data?.data?.chat) {
        // Navegar a la ruta correcta según el rol del usuario
        const chatRoute = isProvider ? '/mensajes' : '/mis-mensajes';
        navigate(`${chatRoute}?chat=${data.data.chat._id}`);
      } else {
        toast.error(data?.message || t('shared.bookings.errors.chatError'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('shared.bookings.errors.chatError'));
    } finally {
      setChatLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado Premium con esquinas redondeadas - diferenciado por rol */}
        <div
          className={`overflow-hidden rounded-2xl ${isProvider ? 'bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600' : isClient ? 'bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600' : 'bg-linear-to-br from-gray-600 via-gray-700 to-gray-800'} p-6 sm:p-8 text-white relative`}
        >
          {/* Decoración del header */}
          <div className={`absolute top-0 right-0 w-64 h-64 ${isProvider ? 'bg-cyan-400/20' : 'bg-teal-400/20'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none`}></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {isProvider ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {isProvider ? t('shared.bookings.title.provider') : t('shared.bookings.title.client')}
                </h1>
                <p className={`text-sm mt-0.5 ${isProvider ? 'text-brand-100' : 'text-emerald-100'}`}>
                  {isProvider 
                    ? t('shared.bookings.subtitle.provider') 
                    : t('shared.bookings.subtitle.client')}
                </p>
              </div>
            </div>
            
            {/* Stats mini - diferenciados por rol */}
            <div className="hidden sm:flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{filtered.length}</div>
                <div className="text-xs text-white/80 font-medium">{t('shared.bookings.stats.total')}</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {isProvider 
                    ? filtered.filter(b => ['confirmed', 'in_progress', 'provider_en_route'].includes(b.status)).length
                    : filtered.filter(b => b.status === 'completed').length
                  }
                </div>
                <div className="text-xs text-white/80 font-medium">
                  {isProvider ? t('shared.bookings.stats.pending') : t('shared.bookings.stats.completed')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Premium */}
        <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg shadow-gray-900/5 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Estado */}
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('shared.bookings.filters.status')}
              </label>
              <select 
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all duration-300 min-w-45" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t('shared.bookings.filters.allStatuses')}</option>
                <option value="confirmed">✓ {t('shared.bookings.status.confirmed')}</option>
                <option value="provider_en_route">🚗 {t('shared.bookings.status.providerEnRoute')}</option>
                <option value="in_progress">⚡ {t('shared.bookings.status.inProgress')}</option>
                <option value="completed">✅ {t('shared.bookings.status.completed')}</option>
                <option value="cancelled">❌ {t('shared.bookings.status.cancelled')}</option>
              </select>
            </div>
            
            {/* Fechas */}
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex flex-col flex-1 sm:flex-initial">
                <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('shared.bookings.filters.from')}
                </label>
                <input 
                  type="date" 
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all duration-300" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)} 
                />
              </div>
              <div className="flex flex-col flex-1 sm:flex-initial">
                <label className="text-xs font-medium text-gray-600 mb-1.5">{t('shared.bookings.filters.to')}</label>
                <input 
                  type="date" 
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all duration-300" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)} 
                />
              </div>
            </div>
            
            {/* Búsqueda */}
            <div className="flex-1 flex flex-col w-full lg:w-auto">
              <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('shared.bookings.filters.search')}
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('shared.bookings.filters.searchPlaceholder')} 
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all duration-300" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Botón limpiar */}
            {(dateFrom || dateTo || statusFilter || search) && (
              <button
                onClick={() => { setStatusFilter(''); setSearch(''); setDateFrom(''); setDateTo(''); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('shared.bookings.filters.clear')}
              </button>
            )}
          </div>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        
        {/* Loading state premium */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-teal-100/40 shadow-lg">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-teal-500/20"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">{t('shared.bookings.loading')}</p>
          </div>
        )}

        {/* Empty state premium */}
        {!loading && (!filtered || filtered.length === 0) && (
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-teal-200 shadow-lg p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-teal-50/50 via-transparent to-emerald-50/50"></div>
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('shared.bookings.empty.title')}</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {bookings.length === 0 
                  ? t('shared.bookings.empty.noBookings')
                  : t('shared.bookings.empty.noResults')}
              </p>
            </div>
          </div>
        )}
        {filtered.map((b) => {
          // Status configuration for premium badges
          const statusConfig = {
            pending: { color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⏳', labelKey: 'shared.bookings.status.pending' },
            confirmed: { color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '✓', labelKey: 'shared.bookings.status.confirmed' },
            in_progress: { color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '🔄', labelKey: 'shared.bookings.status.inProgress' },
            completed: { color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✅', labelKey: 'shared.bookings.status.completed' },
            cancelled: { color: 'from-red-500 to-rose-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '✗', labelKey: 'shared.bookings.status.cancelled' },
          };
          const currentStatus = statusConfig[b.status] || statusConfig.pending;
          
          return (
            <div key={b._id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden">
              {/* Status color bar */}
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-linear-to-b ${currentStatus.color} rounded-l-2xl`} />
              
              {/* Premium corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-emerald-500/5 via-teal-500/3 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="p-5 pl-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Service Info */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate group-hover:text-emerald-700 transition-colors">
                        {getTranslatedRequestInfo(b.serviceRequest, currentLang).title || t('shared.bookings.service')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border`}>
                          <span>{currentStatus.icon}</span>
                          {t(currentStatus.labelKey)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Schedule & Location */}
                  <div className="space-y-2">
                    {b.schedule?.scheduledDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-teal-50 to-emerald-50 text-teal-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>{new Date(b.schedule.scheduledDate).toLocaleString()}</span>
                      </div>
                    )}
                    {b.serviceRequest?.location?.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-emerald-50 to-cyan-50 text-emerald-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="truncate">{b.serviceRequest.location.address}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Evidence Section */}
                  {(b?.serviceEvidence && (b.serviceEvidence.before?.length || b.serviceEvidence.during?.length || b.serviceEvidence.after?.length)) && (
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {t('shared.bookings.evidence.title')}
                      </div>
                      {['before','during','after'].map((section)=>{
                        const items = b.serviceEvidence?.[section] || [];
                        if (!items.length) return null;
                        const label = section === 'before' ? t('shared.bookings.evidence.before') : section === 'during' ? t('shared.bookings.evidence.during') : t('shared.bookings.evidence.after');
                        const sectionColor = section === 'before' ? 'amber' : section === 'during' ? 'blue' : 'emerald';
                        return (
                          <div key={section}>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-${sectionColor}-50 text-${sectionColor}-700 mb-2`}>
                              {label} · {items.length}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {items.slice(0,6).map((ev, idx)=>{
                                const url = ev.url;
                                if (isMediaImage(url)) {
                                  const imageItems = items.filter(it=> isMediaImage(it.url)).map(it=> ({ url: it.url, kind: 'image' }));
                                  const imageIndex = imageItems.findIndex(it=> it.url === url);
                                  return (
                                    <button type="button" key={idx} onClick={()=> openLightbox(imageItems, imageIndex)} className="group/thumb w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-100 hover:border-emerald-300 bg-gray-50 transition-all hover:scale-105 hover:shadow-lg">
                                      <img src={url} alt={ev.description || 'evidencia'} className="w-full h-full object-cover"/>
                                    </button>
                                  );
                                }
                                if (isMediaVideo(url)) {
                                  const videoItems = items.filter(it=> isMediaVideo(it.url)).map(it=> ({ url: it.url, kind: 'video' }));
                                  const videoIndex = videoItems.findIndex(it=> it.url === url);
                                  return (
                                    <button type="button" key={idx} onClick={()=> openLightbox(videoItems, videoIndex)} className="flex w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-indigo-300 bg-linear-to-br from-gray-800 to-gray-900 text-white text-[10px] items-center justify-center transition-all hover:scale-105 hover:shadow-lg">
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    </button>
                                  );
                                }
                                return (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-100 hover:border-teal-300 bg-gray-50 text-gray-500 text-[10px] items-center justify-center transition-all hover:scale-105 hover:shadow-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  </a>
                                );
                              })}
                              {items.length > 6 && (
                                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium">+{items.length - 6}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Column 2: Pricing & Participants */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Pricing card */}
                  <div className="p-4 rounded-xl bg-linear-to-br from-emerald-50/80 via-teal-50/50 to-cyan-50/30 border border-emerald-100/50">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('shared.bookings.pricing.totalAmount')}</div>
                    <div className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {b.proposal?.pricing?.amount ? Intl.NumberFormat('es-AR',{style:'currency', currency: b.proposal?.pricing?.currency || 'USD'}).format(b.proposal.pricing.amount) : '—'}
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-teal-500 text-white text-sm font-medium shadow-lg shadow-teal-500/20">
                        {(b.provider?.providerProfile?.businessName || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">{t('shared.bookings.participants.provider')}</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{b.provider?.providerProfile?.businessName || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-emerald-500 to-green-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/20">
                        {(b.client?.profile?.firstName || b.client?.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">{t('shared.bookings.participants.client')}</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{b.client?.profile?.firstName || b.client?.email || '—'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Summary */}
                  {reviewsByBooking[b._id] !== undefined && reviewsByBooking[b._id] !== null && (
                    <div className="p-4 rounded-xl bg-linear-to-br from-amber-50/80 to-yellow-50/50 border border-amber-100/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <span className="text-sm font-medium text-gray-700">{t('shared.bookings.review.serviceReview')}</span>
                        </div>
                        {reviewsByBooking[b._id].status === 'flagged' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{t('shared.bookings.review.inModeration')}</span>
                        )}
                      </div>
                      {reviewsByBooking[b._id].status === 'flagged' && (
                        <div className="text-[11px] text-amber-600 mb-2 p-2 rounded-lg bg-amber-100/50">{t('shared.bookings.review.moderationNote')}</div>
                      )}
                      <div className="flex items-center gap-1 text-lg font-bold text-amber-600 mb-1">
                        {reviewsByBooking[b._id].rating?.overall || '—'}
                        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      </div>
                      {reviewsByBooking[b._id].review?.comment && (
                        <p className="text-xs text-gray-600 line-clamp-2 italic">"{getTranslatedReviewInfo(reviewsByBooking[b._id], currentLang).comment}"</p>
                      )}
                      {/* Fotos de la reseña */}
                      {reviewsByBooking[b._id].review?.photos?.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-500 mb-2">{t('shared.bookings.review.attachedPhotos')}</div>
                          <div className="flex gap-2 flex-wrap">
                            {reviewsByBooking[b._id].review.photos.slice(0, 4).map((photo, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openLightbox(reviewsByBooking[b._id].review.photos.map(p => p.url), idx)}>
                                <img src={photo.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                {idx === 3 && reviewsByBooking[b._id].review.photos.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                    +{reviewsByBooking[b._id].review.photos.length - 4}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {reviewsByBooking[b._id].providerResponse?.comment ? (
                        <div className="mt-3 p-3 rounded-lg bg-white/80 border border-gray-100">
                          <div className="text-xs font-medium text-gray-500 mb-1">{t('shared.bookings.review.providerResponse')}</div>
                          <p className="text-xs text-gray-700">{getTranslatedReviewInfo(reviewsByBooking[b._id], currentLang).providerResponseComment}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                            {reviewsByBooking[b._id].providerResponse.respondedAt && (
                              <span>{new Date(reviewsByBooking[b._id].providerResponse.respondedAt).toLocaleDateString()}</span>
                            )}
                            {reviewsByBooking[b._id].providerResponse.editedAt && (
                              <span className="italic">({t('shared.bookings.review.edited')})</span>
                            )}
                          </div>
                          {isProvider && (
                            <div className="mt-2 flex items-center gap-2">
                              <button onClick={()=> openEditResponse(reviewsByBooking[b._id])} className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline">{t('shared.bookings.actions.edit')}</button>
                              <button onClick={()=> handleDeleteResponse(reviewsByBooking[b._id])} className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline">{t('shared.bookings.actions.delete')}</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        isProvider && (
                          <button onClick={()=> openResponse(reviewsByBooking[b._id])} className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            {t('shared.bookings.actions.respondReview')}
                          </button>
                        )
                      )}
                    </div>
                  )}
                  
                  {/* Botones de reseña según estado */}
                  {/* Para PROVEEDORES: Mostrar botón para cargar reseña existente o mensaje si no hay */}
                  {isProvider && reviewsByBooking[b._id] === undefined && (
                    <button onClick={()=> loadSingleReview(b._id)} disabled={!!reviewLoadingMap[b._id]} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm text-gray-600 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {reviewLoadingMap[b._id] ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      )}
                      {t('shared.bookings.actions.showReview')}
                    </button>
                  )}
                  
                  {/* Para PROVEEDORES: Mostrar mensaje cuando no hay reseña */}
                  {isProvider && reviewsByBooking[b._id] === null && (
                    <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{t('shared.bookings.review.noClientReview')}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t('shared.bookings.review.willAppearHere')}</p>
                    </div>
                  )}

                  {/* Para PROVEEDORES: Botón para calificar al cliente */}
                  {isProvider && b.status === 'completed' && !clientReviewedIds.has(b._id) && (
                    <button 
                      onClick={() => openClientReview(b)}
                      className="w-full px-4 py-2.5 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('shared.bookings.actions.rateClient')}
                    </button>
                  )}
                  
                  {/* Para PROVEEDORES: Ya calificó al cliente - mostrar calificación enviada */}
                  {isProvider && clientReviewedIds.has(b._id) && sentClientReviews[b._id] && (
                    <div className="w-full p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
                      {/* Header con checkmark */}
                      <div className="flex items-center gap-2 text-teal-700 font-medium text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {t('shared.bookings.review.clientReviewSent')}
                      </div>
                      
                      {/* Calificación con estrellas */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600">{t('shared.bookings.modal.overallRating')}:</span>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <svg key={s} className={`w-3.5 h-3.5 ${s <= (sentClientReviews[b._id]?.rating?.overall || 0) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{(sentClientReviews[b._id]?.rating?.overall || 0).toFixed(1)}</span>
                      </div>
                      
                      {/* Comentario si existe */}
                      {sentClientReviews[b._id]?.review?.comment && (
                        <p className="text-xs text-gray-600 italic bg-white/50 p-2 rounded-lg">
                          "{sentClientReviews[b._id].review.comment}"
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Para CLIENTES: Mostrar botón según si ya existe reseña o no */}
                  {isClient && b.status === 'completed' && (
                    <>
                      {/* Cargando estado de reseña */}
                      {reviewsByBooking[b._id] === undefined && reviewLoadingMap[b._id] && (
                        <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          {t('shared.bookings.review.verifying')}
                        </div>
                      )}
                      
                      {/* No hay reseña (null) - mostrar botón para crear */}
                      {reviewsByBooking[b._id] === null && !reviewedIds.has(b._id) && (
                        <button 
                          onClick={()=> openReview(b)} 
                          className="w-full px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white text-sm font-medium shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          ⭐ {t('shared.bookings.actions.leaveReview')}
                        </button>
                      )}
                      
                      {/* Aún no se ha cargado (undefined) y no está cargando - mostrar botón para crear */}
                      {reviewsByBooking[b._id] === undefined && !reviewLoadingMap[b._id] && !reviewedIds.has(b._id) && (
                        <button 
                          onClick={()=> openReview(b)} 
                          className="w-full px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white text-sm font-medium shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          ⭐ {t('shared.bookings.actions.leaveReview')}
                        </button>
                      )}
                      
                      {/* Ya se envió reseña en esta sesión */}
                      {reviewedIds.has(b._id) && (
                        <div className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ✓ {t('shared.bookings.review.reviewSent')}
                        </div>
                      )}
                      
                      {/* Botón para ver reseña que el proveedor dejó al cliente */}
                      <button 
                        onClick={() => openViewClientReview(b)}
                        disabled={viewClientReviewLoading[b._id]}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm text-gray-600 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {viewClientReviewLoading[b._id] ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        )}
                        {t('shared.bookings.actions.viewProviderReview')}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Column 3: Actions */}
                <div className="lg:col-span-3 flex flex-col gap-3">
                  {isProvider && (
                    <>
                      {/* Botón principal de avance de estado - solo si hay siguiente estado válido */}
                      {STATUS_FLOW[b.status] && (
                        <button 
                          onClick={()=>updateStatus(b._id, STATUS_FLOW[b.status].next)} 
                          disabled={updating === b._id}
                          className={`w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                            b.status === 'confirmed' 
                              ? 'bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25 hover:shadow-blue-500/40'
                              : b.status === 'provider_en_route'
                              ? 'bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 hover:shadow-amber-500/40'
                              : 'bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40'
                          }`}
                        >
                          {updating === b._id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          ) : (
                            <span className="text-base">{STATUS_FLOW[b.status].icon}</span>
                          )}
                          {t(STATUS_FLOW[b.status].labelKey)}
                        </button>
                      )}
                      
                      {/* Estado completado - badge de éxito */}
                      {b.status === 'completed' && (
                        <div className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {t('shared.bookings.status.serviceCompleted')}
                        </div>
                      )}
                      
                      {/* Status dropdown para cambios manuales (solo estados válidos desde el actual) */}
                      {b.status !== 'completed' && b.status !== 'cancelled' && (
                        <div className="relative">
                          <select 
                            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 cursor-pointer" 
                            value="" 
                            onChange={(e)=> updateStatus(b._id, e.target.value)} 
                            disabled={updating === b._id}
                          >
                            <option value="" disabled>{t('shared.bookings.actions.changeStatus')}</option>
                            {PROVIDER_STATUSES.filter(s => {
                              // Filtrar solo transiciones válidas desde el estado actual
                              const validTransitions = {
                                'confirmed': ['provider_en_route', 'cancelled'],
                                'provider_en_route': ['in_progress', 'cancelled'],
                                'in_progress': ['completed', 'cancelled']
                              };
                              return validTransitions[b.status]?.includes(s.value);
                            }).map((s)=> (
                              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      )}
                      
                      {/* Upload evidence button */}
                      <button 
                        onClick={()=> openEvidence(b)} 
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {t('shared.bookings.actions.uploadEvidence')}
                      </button>
                      
                      {/* Chat button - para comunicarse con el cliente */}
                      {b.status !== 'cancelled' && (
                        <button 
                          onClick={()=> openBookingChat(b)} 
                          disabled={chatLoading === b._id}
                          className="w-full px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm font-medium text-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {chatLoading === b._id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          )}
                          {t('shared.bookings.actions.openChat')}
                        </button>
                      )}
                    </>
                  )}
                  {isClient && (
                    <>
                      {/* Pago pendiente - mostrar en cualquier estado si el pago no está completado */}
                      {b?.payment?.status !== 'completed' && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {t('shared.bookings.payment.pending')}
                          </div>
                          {b?.payment?.stripePaymentIntentId && (
                            <button 
                              onClick={()=> navigate(`/payment/${b.payment.stripePaymentIntentId}`)} 
                              className="w-full px-4 py-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium shadow-lg shadow-amber-500/25 transition-all"
                            >
                              {t('shared.bookings.payment.payNow')}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Botón confirmar finalización - solo para status que permiten completarse */}
                      {['confirmed', 'provider_en_route', 'in_progress'].includes(b.status) && (
                        <button 
                          onClick={()=>confirmCompletion(b._id)} 
                          disabled={updating === b._id}
                          className="w-full px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {updating === b._id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                          {t('shared.bookings.actions.confirmCompletion')}
                        </button>
                      )}
                      
                      {/* Chat button - para comunicarse con el proveedor */}
                      {b.status !== 'cancelled' && (
                        <button 
                          onClick={()=> openBookingChat(b)} 
                          disabled={chatLoading === b._id}
                          className="w-full px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm font-medium text-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {chatLoading === b._id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          )}
                          {t('shared.bookings.actions.openChat')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación premium */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8 mb-4">
          <button 
            disabled={page <= 1} 
            onClick={()=> setPage((p)=> Math.max(1, p - 1))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 text-sm font-medium text-gray-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('shared.bookings.pagination.previous')}
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <span className="text-sm text-gray-600">{t('shared.bookings.pagination.page')}</span>
            <span className="text-sm font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{page}</span>
            <span className="text-sm text-gray-600">{t('shared.bookings.pagination.of')}</span>
            <span className="text-sm font-medium text-gray-700">{pages}</span>
          </div>
          
          <button 
            disabled={page >= pages} 
            onClick={()=> setPage((p)=> Math.min(pages, p + 1))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 text-sm font-medium text-gray-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
          >
            {t('shared.bookings.pagination.next')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Modal evidencia - Versión mejorada con previews y progreso */}
      <Modal open={evidenceOpen} onClose={()=> !evidenceLoading && setEvidenceOpen(false)} title={t('shared.bookings.modal.evidenceTitle')} size="lg">
        <div className="space-y-5">
          {/* Indicador de progreso */}
          <UploadProgress {...evidenceProgress} />
          
          {/* Header decorativo */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-100/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{t('shared.bookings.modal.documentWork')}</h4>
              <p className="text-sm text-gray-500">{t('shared.bookings.modal.evidenceSubtitle')}</p>
            </div>
          </div>
          
          {/* Tipo de evidencia */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t('shared.bookings.modal.serviceStage')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'before', labelKey: 'shared.bookings.evidence.before', icon: '🏠', bgActive: 'bg-amber-50', borderActive: 'border-amber-400', textActive: 'text-amber-700', shadow: 'shadow-amber-500/10' },
                { value: 'during', labelKey: 'shared.bookings.evidence.during', icon: '🔧', bgActive: 'bg-blue-50', borderActive: 'border-blue-400', textActive: 'text-blue-700', shadow: 'shadow-blue-500/10' },
                { value: 'after', labelKey: 'shared.bookings.evidence.after', icon: '✨', bgActive: 'bg-emerald-50', borderActive: 'border-emerald-400', textActive: 'text-emerald-700', shadow: 'shadow-emerald-500/10' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEvidenceType(opt.value)}
                  disabled={evidenceLoading}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    evidenceType === opt.value
                      ? `${opt.borderActive} ${opt.bgActive} shadow-lg ${opt.shadow}`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } disabled:opacity-50`}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className={`text-sm font-medium ${evidenceType === opt.value ? opt.textActive : 'text-gray-700'}`}>{t(opt.labelKey)}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Zona de upload drag & drop */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t('shared.bookings.modal.filesLabel')}
            </label>
            
            {/* Área de drop con estilo mejorado */}
            <div className="relative">
              <input 
                id="evidence-file-input"
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={handleEvidenceFileSelect}
                disabled={evidenceLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all ${
                evidencePreviews.length > 0 
                  ? 'border-teal-300 bg-teal-50/30' 
                  : 'border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/30'
              }`}>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-teal-400 to-emerald-500 text-white mb-4 shadow-lg shadow-teal-500/25">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {evidencePreviews.length > 0 
                    ? t('shared.bookings.modal.filesSelected', { count: evidencePreviews.length })
                    : t('shared.bookings.modal.dragDropFiles')}
                </p>
                <p className="text-xs text-gray-500">{t('shared.bookings.modal.acceptedFormats')}</p>
              </div>
            </div>
          </div>
          
          {/* Previews de archivos seleccionados */}
          {evidencePreviews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{t('shared.bookings.modal.preview')}</label>
                <button 
                  onClick={() => {
                    evidencePreviews.forEach(p => URL.revokeObjectURL(p.url));
                    setEvidenceFiles([]);
                    setEvidencePreviews([]);
                    setEvidenceCaptions([]);
                    const input = document.getElementById('evidence-file-input');
                    if (input) input.value = '';
                  }}
                  disabled={evidenceLoading}
                  className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  {t('shared.bookings.modal.clearAll')}
                </button>
              </div>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-h-80 overflow-y-auto p-1">
                {evidencePreviews.map((preview, idx) => (
                  <div key={idx} className="group relative">
                    {/* Preview container */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 group-hover:border-teal-300 transition-all shadow-sm">
                      {preview.type === 'video' ? (
                        <video
                          src={preview.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={preview.url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Overlay con info */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium truncate">{preview.name}</p>
                          <p className="text-white/70 text-xs">{preview.size}</p>
                        </div>
                      </div>
                      
                      {/* Badge de tipo */}
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        preview.type === 'video' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-teal-500 text-white'
                      }`}>
                        {preview.type === 'video' ? `🎬 ${t('shared.bookings.modal.video')}` : `📷 ${t('shared.bookings.modal.image')}`}
                      </div>
                      
                      {/* Botón eliminar */}
                      <button
                        onClick={() => removeEvidenceFile(idx)}
                        disabled={evidenceLoading}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Input de descripción */}
                    <input
                      type="text"
                      placeholder={t('shared.bookings.modal.descriptionPlaceholder')}
                      value={evidenceCaptions[idx] || ''}
                      onChange={(e) => updateEvidenceCaption(idx, e.target.value)}
                      disabled={evidenceLoading}
                      className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 disabled:opacity-50 disabled:bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button 
              onClick={()=> setEvidenceOpen(false)} 
              disabled={evidenceLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all disabled:opacity-50"
            >
              {t('shared.bookings.modal.cancel')}
            </button>
            <button 
              onClick={handleUploadEvidence} 
              disabled={evidenceLoading || evidenceFiles.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-medium shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {evidenceLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  {t('shared.bookings.modal.uploading')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  {evidenceFiles.length > 0 ? t('shared.bookings.modal.uploadFiles', { count: evidenceFiles.length }) : t('shared.bookings.modal.uploadEvidence')}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal reseña */}
      <Modal open={reviewOpen} onClose={()=> setReviewOpen(false)} title={t('shared.bookings.modal.reviewTitle')}>
        <div className="space-y-5">
          {/* Header decorativo */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-100/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/25">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{t('shared.bookings.modal.shareExperience')}</h4>
              <p className="text-sm text-gray-500">{t('shared.bookings.modal.helpOthers')}</p>
            </div>
          </div>
          
          {/* Calificaciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {t('shared.bookings.modal.ratings')}
            </label>
            
            {/* Calificación general destacada */}
            <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-yellow-50 border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('shared.bookings.modal.overallRating')}</span>
                <div className="flex items-center gap-1">
                  {[5,4,3,2,1].map(n => (
                    <button 
                      key={n} 
                      type="button"
                      onClick={() => handleOverallChange(n)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        reviewOverall >= n 
                          ? 'text-amber-400 scale-110' 
                          : 'text-gray-300 hover:text-amber-200'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </button>
                  )).reverse()}
                </div>
              </div>
            </div>
            
            {/* Categorías específicas - 1 columna en móviles pequeños */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { key: 'professionalism', labelKey: 'shared.bookings.modal.professionalism', icon: '💼' },
                { key: 'quality', labelKey: 'shared.bookings.modal.quality', icon: '⭐' },
                { key: 'punctuality', labelKey: 'shared.bookings.modal.punctuality', icon: '⏰' },
                { key: 'communication', labelKey: 'shared.bookings.modal.communication', icon: '💬' },
                { key: 'value', labelKey: 'shared.bookings.modal.value', icon: '💰' }
              ].map((cat)=> (
                <div key={cat.key} className="p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">{t(cat.labelKey)}</span>
                  </div>
                  <select 
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all" 
                    value={reviewCats[cat.key]} 
                    onChange={(e)=> handleCategoryChange(cat.key, Number(e.target.value))}
                  >
                    {[5,4,3,2,1].map(n=> <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          
          {/* Título */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {t('shared.bookings.modal.titleOptional')}
            </label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all" 
              value={reviewTitle} 
              onChange={(e)=> setReviewTitle(e.target.value)} 
              placeholder={t('shared.bookings.modal.titlePlaceholder')}
            />
          </div>
          
          {/* Comentario */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {t('shared.bookings.modal.comment')}
            </label>
            <textarea 
              rows={4} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 resize-none transition-all" 
              value={reviewComment} 
              onChange={(e)=> setReviewComment(e.target.value)} 
              placeholder={t('shared.bookings.modal.commentPlaceholder')} 
            />
          </div>
          
          {/* Fotos */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('shared.bookings.modal.photosOptional')}
            </label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={(e)=> setReviewFiles(e.target.files)} 
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50/30 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-500 file:text-white hover:file:bg-amber-600 transition-all cursor-pointer"
            />
          </div>

          {/* ========== SECCIÓN FEEDBACK DE LA PLATAFORMA (Opcional) ========== */}
          <div className="space-y-3 p-4 rounded-xl bg-linear-to-br from-brand-50 via-cyan-50 to-teal-50 border border-brand-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-teal-500 text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{t('shared.bookings.modal.platformFeedbackTitle')}</h4>
                <p className="text-xs text-gray-500">{t('shared.bookings.modal.platformFeedbackSubtitle')}</p>
              </div>
            </div>

            {/* Rating de la plataforma */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600">{t('shared.bookings.modal.platformRating')}</span>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <button 
                    key={n}
                    type="button"
                    onClick={() => setPlatformRating(platformRating === n ? 0 : n)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      platformRating >= n 
                        ? 'text-brand-500 scale-110' 
                        : 'text-gray-300 hover:text-brand-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </button>
                ))}
              </div>
              {platformRating > 0 && (
                <span className="text-xs text-brand-600 font-medium">{platformRating}/5</span>
              )}
            </div>

            {/* Solo mostrar el resto si calificó la plataforma */}
            {platformRating > 0 && (
              <>
                {/* ¿Recomendarías NovoFix? */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600">{t('shared.bookings.modal.wouldRecommend')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        wouldRecommend 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👍 {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        !wouldRecommend 
                          ? 'bg-red-500 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👎 {t('common.no')}
                    </button>
                  </div>
                </div>

                {/* Comentario sobre la plataforma */}
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-brand-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none transition-all"
                  value={platformComment}
                  onChange={(e) => setPlatformComment(e.target.value)}
                  placeholder={t('shared.bookings.modal.platformCommentPlaceholder')}
                />
              </>
            )}
          </div>
          
          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={()=> setReviewOpen(false)} 
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all"
            >
              {t('shared.bookings.modal.cancel')}
            </button>
            <button 
              onClick={handleSubmitReview} 
              disabled={reviewLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white text-sm font-medium shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {reviewLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              )}
              {t('shared.bookings.modal.submitReview')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Lightbox imágenes evidencia */}
      <Modal open={lightboxOpen} onClose={()=> setLightboxOpen(false)} title={t('shared.bookings.modal.evidenceViewer', { current: lightboxIndex+1, total: lightboxItems.length })}>
        <div className="flex flex-col items-center gap-4">
          {/* Media viewer */}
          <div className="relative w-full flex items-center justify-center bg-gray-900/5 rounded-2xl overflow-hidden min-h-75">
            {lightboxItems[lightboxIndex] && (
              lightboxItems[lightboxIndex].kind === 'image' ? (
                <img src={lightboxItems[lightboxIndex].url} alt="evidencia" className="max-h-[70vh] w-auto rounded-xl shadow-2xl" />
              ) : (
                <video src={lightboxItems[lightboxIndex].url} controls className="max-h-[70vh] w-auto rounded-xl shadow-2xl" />
              )
            )}
          </div>
          
          {/* Navigation */}
          {lightboxItems.length > 1 && (
            <div className="flex items-center gap-4">
              <button 
                onClick={prevLightbox} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {t('shared.bookings.pagination.previous')}
              </button>
              
              {/* Dots indicator */}
              <div className="flex items-center gap-1.5">
                {lightboxItems.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === lightboxIndex 
                        ? 'bg-teal-500 scale-125' 
                        : 'bg-gray-300'
                    }`} 
                  />
                ))}
              </div>
              
              <button 
                onClick={nextLightbox} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
              >
                {t('shared.bookings.pagination.next')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal responder reseña (proveedor) */}
      <Modal open={responseOpen} onClose={()=> setResponseOpen(false)} title={responseMode === 'edit' ? t('shared.bookings.modal.editResponse') : t('shared.bookings.modal.respondReviewTitle')}>
        <div className="space-y-5">
          {/* Header decorativo */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-teal-50 via-cyan-50 to-emerald-50 border border-teal-100/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{responseMode === 'edit' ? t('shared.bookings.modal.editResponse') : t('shared.bookings.modal.respondToClient')}</h4>
              <p className="text-sm text-gray-500">{t('shared.bookings.modal.responsePublic')}</p>
            </div>
          </div>
          
          {/* Reseña del cliente */}
          {responseReview?.review?.comment && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                {t('shared.bookings.modal.clientComment')}
              </label>
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-sm text-gray-700 italic">
                "{responseReview.review.comment}"
              </div>
            </div>
          )}
          
          {/* Alerta de moderación */}
          {responseReview?.status === 'flagged' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">{t('shared.bookings.modal.reviewInModeration')}</p>
                <p className="text-xs text-amber-700 mt-1">{t('shared.bookings.modal.moderationDelay')}</p>
              </div>
            </div>
          )}
          
          {/* Tu respuesta */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {t('shared.bookings.modal.yourResponse')}
            </label>
            <textarea 
              rows={4} 
              maxLength={800} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 resize-none transition-all" 
              value={responseComment} 
              onChange={(e)=> setResponseComment(e.target.value)} 
              placeholder={t('shared.bookings.modal.responsePlaceholder')}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('shared.bookings.modal.responseHint')}
              </p>
              <span className={`text-xs font-medium ${responseComment.length > 700 ? 'text-amber-600' : 'text-gray-400'}`}>{responseComment.length}/800</span>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={()=> setResponseOpen(false)} 
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all"
            >
              {t('shared.bookings.modal.cancel')}
            </button>
            <button 
              onClick={handleSubmitResponse} 
              disabled={responseLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {responseLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              )}
              {responseMode === 'edit' ? t('shared.bookings.modal.update') : t('shared.bookings.modal.publishResponse')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal calificar cliente (proveedor) */}
      <Modal open={clientReviewOpen} onClose={() => setClientReviewOpen(false)} title={t('shared.bookings.modal.clientReviewTitle')}>
        <div className="space-y-5">
          {/* Header decorativo */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-teal-50 via-cyan-50 to-blue-50 border border-teal-100/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{t('shared.bookings.modal.rateClientExperience')}</h4>
              <p className="text-sm text-gray-500">{t('shared.bookings.modal.rateClientSubtitle')}</p>
            </div>
          </div>

          {/* Calificación general */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {t('shared.bookings.modal.overallRating')}
            </label>
            <div className="p-4 rounded-xl bg-linear-to-br from-teal-50 to-cyan-50 border border-teal-100">
              <div className="flex items-center justify-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <button 
                    key={n}
                    type="button"
                    onClick={() => handleClientOverallChange(n)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      clientReviewOverall >= n 
                        ? 'text-teal-500 scale-110' 
                        : 'text-gray-300 hover:text-teal-300'
                    }`}
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Categorías del cliente - 1 columna en móviles pequeños para evitar superposición */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { key: 'communication', labelKey: 'shared.bookings.modal.clientCommunication', icon: '💬' },
                { key: 'punctuality', labelKey: 'shared.bookings.modal.clientPunctuality', icon: '⏰' },
                { key: 'respect', labelKey: 'shared.bookings.modal.clientRespect', icon: '🤝' },
                { key: 'clarity', labelKey: 'shared.bookings.modal.clientClarity', icon: '📋' },
                { key: 'payment', labelKey: 'shared.bookings.modal.clientPayment', icon: '💳' }
              ].map((cat) => (
                <div key={cat.key} className="p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">{t(cat.labelKey)}</span>
                  </div>
                  <select 
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all" 
                    value={clientReviewCats[cat.key]} 
                    onChange={(e) => handleClientCategoryChange(cat.key, Number(e.target.value))}
                  >
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Comentario opcional */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {t('shared.bookings.modal.commentOptional')}
            </label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 resize-none transition-all"
              value={clientReviewComment}
              onChange={(e) => setClientReviewComment(e.target.value)}
              placeholder={t('shared.bookings.modal.clientCommentPlaceholder')}
            />
          </div>

          {/* ========== SECCIÓN FEEDBACK DE LA PLATAFORMA (Proveedor) ========== */}
          <div className="space-y-3 p-4 rounded-xl bg-linear-to-br from-brand-50 via-cyan-50 to-teal-50 border border-brand-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-teal-500 text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{t('shared.bookings.modal.platformFeedbackTitle')}</h4>
                <p className="text-xs text-gray-500">{t('shared.bookings.modal.platformFeedbackProviderSubtitle')}</p>
              </div>
            </div>

            {/* Rating de la plataforma */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600">{t('shared.bookings.modal.platformRating')}</span>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <button 
                    key={n}
                    type="button"
                    onClick={() => setProviderPlatformRating(providerPlatformRating === n ? 0 : n)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      providerPlatformRating >= n 
                        ? 'text-brand-500 scale-110' 
                        : 'text-gray-300 hover:text-brand-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </button>
                ))}
              </div>
              {providerPlatformRating > 0 && (
                <span className="text-xs text-brand-600 font-medium">{providerPlatformRating}/5</span>
              )}
            </div>

            {providerPlatformRating > 0 && (
              <>
                {/* ¿Recomendarías NovoFix? */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600">{t('shared.bookings.modal.wouldRecommendPlatform')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProviderWouldRecommend(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        providerWouldRecommend 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👍 {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProviderWouldRecommend(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        !providerWouldRecommend 
                          ? 'bg-red-500 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👎 {t('common.no')}
                    </button>
                  </div>
                </div>

                {/* Comentario sobre la plataforma */}
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-brand-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none transition-all"
                  value={providerPlatformComment}
                  onChange={(e) => setProviderPlatformComment(e.target.value)}
                  placeholder={t('shared.bookings.modal.platformCommentProviderPlaceholder')}
                />
              </>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={() => setClientReviewOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all"
            >
              {t('shared.bookings.modal.cancel')}
            </button>
            <button 
              onClick={handleSubmitClientReview}
              disabled={clientReviewLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {clientReviewLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {t('shared.bookings.modal.submitClientReview')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para ver la reseña que el proveedor dejó al cliente */}
      <Modal open={viewClientReviewOpen} onClose={() => setViewClientReviewOpen(false)} title={t('shared.bookings.modal.providerReviewTitle')}>
        <div className="space-y-4 p-4">
          {viewClientReviewData ? (
            <>
              {/* Información del proveedor */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                  🔧
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('shared.bookings.modal.fromProvider')}</p>
                  <p className="text-xs text-gray-500">{new Date(viewClientReviewData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Calificación general */}
              <div className="text-center py-3">
                <p className="text-sm text-gray-500 mb-2">{t('shared.bookings.modal.overallRating')}</p>
                <div className="flex items-center justify-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className={`w-8 h-8 ${s <= (viewClientReviewData.rating?.overall || 0) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{(viewClientReviewData.rating?.overall || 0).toFixed(1)}</p>
              </div>

              {/* Categorías */}
              {viewClientReviewData.rating?.categories && (
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 p-3 bg-gray-50 rounded-xl overflow-hidden">
                  {Object.entries(viewClientReviewData.rating.categories).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs sm:text-sm gap-2 overflow-hidden">
                      <span className="text-gray-600 truncate">{t(`shared.bookings.modal.client${key.charAt(0).toUpperCase() + key.slice(1)}`)}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1,2,3,4,5].map((s) => (
                          <svg key={s} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${s <= value ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comentario */}
              {viewClientReviewData.review?.comment && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">{t('shared.bookings.modal.comment')}</p>
                  <p className="text-sm text-gray-700 italic">"{viewClientReviewData.review.comment}"</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('shared.bookings.review.noProviderReview')}</p>
            </div>
          )}

          {/* Cerrar */}
          <div className="pt-2">
            <button 
              onClick={() => setViewClientReviewOpen(false)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all"
            >
              {t('shared.bookings.modal.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

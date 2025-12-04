import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button.jsx';
import MapPicker from './MapPicker.jsx';
import api from '@/state/apiClient';
import { useToast } from './Toast.jsx';
import { useNavigate } from 'react-router-dom';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from './UploadProgress.jsx';

// ============================================================================
// ICONS - Iconos SVG modernos inline
// ============================================================================
const Icons = {
  Close: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Send: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Warning: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Photo: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Video: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Play: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
    </svg>
  ),
  Upload: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  MapPin: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

// ============================================================================
// STEPS CONFIGURATION - Configuración de pasos con iconos y colores
// ============================================================================
const STEPS = [
  { 
    id: 'description', 
    title: 'Descripción', 
    shortTitle: 'Descripción',
    description: 'Cuéntanos qué necesitas',
    icon: '📝',
    color: 'from-blue-500 to-indigo-500'
  },
  { 
    id: 'media', 
    title: 'Multimedia', 
    shortTitle: 'Media',
    description: 'Adjunta fotos o videos',
    icon: '📸',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'location', 
    title: 'Ubicación', 
    shortTitle: 'Ubicación',
    description: 'Dónde se realizará',
    icon: '📍',
    color: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'date', 
    title: 'Fecha', 
    shortTitle: 'Fecha',
    description: 'Cuándo lo necesitas',
    icon: '📅',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    id: 'budget', 
    title: 'Presupuesto', 
    shortTitle: 'Precio',
    description: 'Tu presupuesto estimado',
    icon: '💰',
    color: 'from-green-500 to-emerald-500'
  }
];

// ============================================================================
// URGENCY OPTIONS - Opciones de urgencia con estilos
// ============================================================================
const URGENCY_OPTIONS = [
  { 
    value: 'scheduled', 
    label: 'Programado', 
    description: 'Puedo esperar unos días',
    icon: '🗓️',
    color: 'border-blue-200 bg-blue-50 hover:border-blue-400'
  },
  { 
    value: 'immediate', 
    label: 'Urgente', 
    description: 'Lo necesito lo antes posible',
    icon: '⚡',
    color: 'border-red-200 bg-red-50 hover:border-red-400'
  }
];

// ============================================================================
// CURRENCY OPTIONS
// ============================================================================
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso MX' },
  { code: 'ARS', symbol: '$', name: 'Peso AR' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RequestWizardModal({ provider, isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    progress: 0,
    fileName: '',
    message: 'Subiendo archivos...',
    totalFiles: 0,
    currentFile: 0,
    status: 'uploading'
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    urgency: 'scheduled',
    address: '',
    coordinates: null,
    preferredDate: '',
    budgetAmount: '',
    currency: 'USD',
    photos: [],
    videos: []
  });

  const [formErrors, setFormErrors] = useState({});

  // Inicializar categoría con la del proveedor
  useEffect(() => {
    if (provider && isOpen) {
      const providerCategories = provider.providerProfile?.services || [];
      const firstCategory = providerCategories[0]?.category || '';
      setFormData(prev => ({
        ...prev,
        category: firstCategory
      }));
    }
  }, [provider, isOpen]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setCompletedSteps([]);
      setFormData({
        title: '',
        description: '',
        category: '',
        subcategory: '',
        urgency: 'scheduled',
        address: '',
        coordinates: null,
        preferredDate: '',
        budgetAmount: '',
        currency: 'USD',
        photos: [],
        videos: []
      });
      setFormErrors({});
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Auto-fill address from map coordinates using reverse geocoding
  const handleLocationSelect = async (coordinates) => {
    updateField('coordinates', coordinates);
    
    if (!coordinates || !coordinates.lat || !coordinates.lng) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const address = data.address;
          const parts = [];
          
          if (address.road) parts.push(address.road);
          if (address.house_number) parts.push(address.house_number);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
          if (address.state) parts.push(address.state);
          
          const formattedAddress = parts.join(', ');
          if (formattedAddress) {
            updateField('address', formattedAddress);
          }
        }
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0:
        if (!formData.description || formData.description.trim().length < 10) {
          errors.description = 'La descripción debe tener al menos 10 caracteres';
        }
        if (!formData.urgency) {
          errors.urgency = 'Selecciona el nivel de urgencia';
        }
        break;
      case 1:
        break;
      case 2:
        if (!formData.address || formData.address.trim().length < 3) {
          errors.address = 'La dirección es requerida';
        }
        if (!formData.coordinates || !Number.isFinite(formData.coordinates.lat) || !Number.isFinite(formData.coordinates.lng)) {
          errors.coordinates = 'Debes seleccionar una ubicación en el mapa';
        }
        break;
      case 3:
        break;
      case 4:
        if (!formData.budgetAmount || Number(formData.budgetAmount) <= 0) {
          errors.budgetAmount = 'El presupuesto debe ser mayor a 0';
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (targetIndex) => {
    if (targetIndex === currentStep) return;
    const canAccess = targetIndex === 0 || completedSteps.includes(targetIndex - 1);

    if (canAccess) {
      setCurrentStep(targetIndex);
    } else {
      toast.warning(`Debes completar el paso anterior antes de continuar`);
    }
  };

  const handleCloseAttempt = () => {
    const hasData = 
      formData.title || 
      formData.description || 
      formData.address ||
      formData.photos.length > 0 || 
      formData.videos.length > 0 ||
      formData.budgetAmount;

    if (hasData) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  const handleMediaUpload = async (files, type) => {
    if (!files || files.length === 0) return;
    
    const allowedTypes = type === 'photos' 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/webm'];

    const validation = validateFiles(files, {
      maxFiles: 10,
      maxSizeMB: 200,
      allowedTypes
    });

    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    const localPreviews = [];
    for (const file of validation.validFiles) {
      const preview = URL.createObjectURL(file);
      localPreviews.push({
        url: preview,
        cloudinaryId: 'uploading',
        caption: '',
        isLocal: true,
        fileName: file.name
      });
    }
    
    updateField(type, [...formData[type], ...localPreviews]);
    setUploadingMedia(true);
    
    try {
      let processedFiles = validation.validFiles;

      if (type === 'photos') {
        setUploadProgress({
          show: true,
          progress: 0,
          fileName: '',
          message: 'Comprimiendo imágenes...',
          totalFiles: validation.validFiles.length,
          currentFile: 0,
          status: 'compressing'
        });

        try {
          processedFiles = await compressImages(validation.validFiles, {
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
        } catch (compressError) {
          console.warn('Compression failed, using original files:', compressError);
        }
      } else {
        setUploadProgress({
          show: true,
          progress: 0,
          fileName: processedFiles[0]?.name || '',
          message: 'Preparando subida de videos...',
          totalFiles: validation.validFiles.length,
          currentFile: 0,
          status: 'uploading'
        });
      }

      const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      setUploadProgress(prev => ({
        ...prev,
        progress: type === 'photos' ? 30 : 0,
        message: `Subiendo ${type === 'photos' ? 'fotos' : 'videos'} (${totalSizeMB}MB)...`,
        status: 'uploading',
        fileName: processedFiles[0]?.name || ''
      }));

      const fd = new FormData();
      processedFiles.forEach((f) => fd.append('files', f));
      fd.append('type', type);

      const res = await api.post('/uploads/service-request/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const baseProgress = type === 'photos' ? 30 : 0;
          const progressRange = type === 'photos' ? 60 : 90;
          const adjustedProgress = baseProgress + Math.round((percentCompleted * progressRange) / 100);
          
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.min(adjustedProgress, 90),
            message: `Subiendo ${type === 'photos' ? 'fotos' : 'videos'}... (${totalSizeMB}MB)`
          }));
        }
      });

      setUploadProgress(prev => ({
        ...prev,
        progress: 95,
        message: 'Procesando archivos en Cloudinary...',
        status: 'processing'
      }));

      const uploaded = Array.isArray(res?.data?.data?.[type]) ? res.data.data[type] : [];
      if (uploaded.length) {
        const nonLocalFiles = formData[type].filter(item => !item.isLocal);
        updateField(type, [...nonLocalFiles, ...uploaded]);
        
        localPreviews.forEach(preview => {
          if (preview.isLocal) {
            URL.revokeObjectURL(preview.url);
          }
        });
        
        setUploadProgress({
          show: true,
          progress: 100,
          fileName: '',
          message: '¡Archivos subidos exitosamente!',
          totalFiles: validation.validFiles.length,
          currentFile: validation.validFiles.length,
          status: 'success'
        });

        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, show: false }));
        }, 2000);

        toast.success(`${uploaded.length} ${type === 'photos' ? 'foto(s)' : 'video(s)'} subido(s)`);
      }
    } catch (e) {
      console.error('Upload error:', e);
      
      const nonLocalFiles = formData[type].filter(item => !item.isLocal);
      updateField(type, nonLocalFiles);
      
      localPreviews.forEach(preview => {
        if (preview.isLocal) {
          URL.revokeObjectURL(preview.url);
        }
      });
      
      let errorMsg = `No se pudieron subir los ${type === 'photos' ? 'fotos' : 'videos'}`;
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        errorMsg = 'El archivo es demasiado grande o la conexión es lenta. Intenta con un archivo más pequeño.';
      } else if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      }
      
      setUploadProgress({
        show: true,
        progress: 0,
        fileName: '',
        message: 'Error al subir archivos',
        totalFiles: validation.validFiles.length,
        currentFile: 0,
        status: 'error'
      });

      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, show: false }));
      }, 3000);

      toast.error(errorMsg);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (type, index) => {
    updateField(type, formData[type].filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    if (!formData.category) {
      toast.error('No se pudo determinar la categoría del servicio');
      return;
    }

    setLoading(true);
    try {
      const autoTitle = formData.description.trim().substring(0, 50) + 
                       (formData.description.trim().length > 50 ? '...' : '');
      
      const payload = {
        title: autoTitle,
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        urgency: formData.urgency,
        address: formData.address.trim(),
        coordinates: formData.coordinates,
        preferredDate: formData.preferredDate || undefined,
        budget: {
          amount: Number(formData.budgetAmount),
          currency: formData.currency
        },
        photos: formData.photos,
        videos: formData.videos,
        visibility: 'auto',
        targetProviders: provider ? [provider._id] : undefined
      };

      const { data } = await api.post('/client/requests', payload);
      
      if (data?.success) {
        const providerName = provider?.providerProfile?.businessName || provider?.profile?.firstName || 'el proveedor';
        toast.success(`¡Solicitud enviada exitosamente a ${providerName}!`);
        onClose();
        navigate('/mis-solicitudes');
      } else {
        toast.warning(data?.message || 'No se pudo crear la solicitud');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      const msg = err?.response?.data?.message || 'Error al crear la solicitud';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !provider) return null;

  const providerName = provider.providerProfile?.businessName || provider.profile?.firstName || 'este profesional';
  const providerAvatar = provider.providerProfile?.avatar || provider.profile?.avatar;
  const step = STEPS[currentStep];

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      {/* Indicador de progreso de subida */}
      <UploadProgress {...uploadProgress} />

      {/* Modal de confirmación de cierre */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-modal-enter">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-zoom-in">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Warning className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ¿Cancelar solicitud?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Se perderá toda la información que has ingresado.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Continuar
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop con blur */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-modal-enter"
          onClick={handleCloseAttempt}
        />
        
        {/* Modal content */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ============================================================ */}
          {/* COMPACT HEADER - Encabezado compacto con gradiente */}
          {/* ============================================================ */}
          <div className={`relative bg-linear-to-r ${step.color} p-4`}>
            {/* Botón cerrar */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-3 right-3 z-30 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center transition-all"
              title="Cerrar"
            >
              <Icons.Close className="w-5 h-5 text-white" />
            </button>

            {/* Provider info mini */}
            <div className="flex items-center gap-3">
              {/* Avatar pequeño */}
              <div className="relative shrink-0">
                {providerAvatar ? (
                  <img 
                    src={providerAvatar} 
                    alt={providerName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-lg font-bold">
                    {providerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-lg">{step.icon}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-white">
                <h2 className="text-base sm:text-lg font-bold truncate pr-8">
                  Solicitud para {providerName}
                </h2>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span>Paso {currentStep + 1}/{STEPS.length}</span>
                  <span>•</span>
                  <span>{step.title}</span>
                </div>
              </div>
            </div>

            {/* Progress bar inline */}
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* STEP NAVIGATION - Navegación horizontal de pasos */}
          {/* ============================================================ */}
          <div className="bg-gray-50 border-b px-2 py-2">
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((s, idx) => {
                const isCompleted = completedSteps.includes(idx);
                const isCurrent = idx === currentStep;
                const canNavigate = idx === 0 || completedSteps.includes(idx - 1);
                const isClickable = !isCurrent && (isCompleted || canNavigate);
                
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    disabled={!isClickable && !isCurrent}
                    className={`
                      flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all
                      ${isCurrent ? 'bg-white shadow-sm' : ''}
                      ${isClickable ? 'hover:bg-white/70 cursor-pointer' : ''}
                      ${!isClickable && !isCurrent ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={s.title}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                      ${isCompleted ? 'bg-green-500 text-white' : 
                        isCurrent ? 'bg-brand-600 text-white' : 
                        'bg-gray-200 text-gray-500'}
                    `}>
                      {isCompleted ? <Icons.Check className="w-4 h-4" /> : <span>{s.icon}</span>}
                    </div>
                    <span className={`text-[10px] sm:text-xs text-center truncate w-full ${
                      isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {s.shortTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SCROLLABLE CONTENT - Contenido del paso actual */}
          {/* ============================================================ */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Step header */}
              <div className="mb-5">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{step.icon}</span>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{step.description}</p>
              </div>

              {/* ==================== STEP 0: DESCRIPTION ==================== */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  {/* Description textarea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Qué servicio necesitas? *
                    </label>
                    <textarea
                      rows={5}
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      className={`
                        w-full border-2 rounded-xl px-4 py-3 text-gray-900 
                        placeholder:text-gray-400 resize-none transition-colors
                        focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                        ${formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                      `}
                      placeholder="Describe detalladamente lo que necesitas...

Ejemplo: Tengo una fuga de agua en el baño principal que está afectando la pared. El problema parece venir de debajo del lavabo."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.description ? (
                        <p className="text-xs text-red-600">{formErrors.description}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Mínimo 10 caracteres</p>
                      )}
                      <span className="text-xs text-gray-400">
                        {formData.description.length} caracteres
                      </span>
                    </div>
                  </div>

                  {/* Urgency selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      ¿Qué tan urgente es? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {URGENCY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('urgency', option.value)}
                          className={`
                            relative p-4 rounded-xl border-2 text-left transition-all
                            ${formData.urgency === option.value 
                              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' 
                              : option.color}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{option.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{option.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                            </div>
                          </div>
                          {formData.urgency === option.value && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                              <Icons.Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {formErrors.urgency && (
                      <p className="text-xs text-red-600 mt-2">{formErrors.urgency}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== STEP 1: MEDIA ==================== */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Tip banner */}
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <Icons.Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Tip</p>
                      <p className="text-sm text-blue-700">Las imágenes se comprimen automáticamente para subir más rápido sin perder calidad.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Photos upload */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icons.Photo className="w-5 h-5 text-purple-600" />
                        <label className="text-sm font-semibold text-gray-700">Fotos</label>
                        <span className="text-xs text-gray-400">(opcional)</span>
                      </div>
                      
                      <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'}
                      `}>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center">
                          Haz clic o arrastra imágenes
                        </span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e.target.files, 'photos')}
                          className="hidden"
                          disabled={uploadingMedia}
                        />
                      </label>

                      {formData.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {formData.photos.map((photo, idx) => (
                            <div key={idx} className="relative group aspect-square">
                              <img
                                src={photo.url}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {photo.isLocal && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              {!photo.isLocal && (
                                <button
                                  type="button"
                                  onClick={() => removeMedia('photos', idx)}
                                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Icons.Close className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos upload */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icons.Video className="w-5 h-5 text-pink-600" />
                        <label className="text-sm font-semibold text-gray-700">Videos</label>
                        <span className="text-xs text-gray-400">(máx 200MB)</span>
                      </div>
                      
                      <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50/50'}
                      `}>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center">
                          Haz clic o arrastra videos
                        </span>
                        <span className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, WebM</span>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleMediaUpload(e.target.files, 'videos')}
                          className="hidden"
                          disabled={uploadingMedia}
                        />
                      </label>

                      {formData.videos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {formData.videos.map((video, idx) => (
                            <div key={idx} className="relative group aspect-video">
                              <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
                                <video
                                  src={video.url}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                    <Icons.Play className="w-4 h-4 text-gray-800 ml-0.5" />
                                  </div>
                                </div>
                                {video.isLocal && (
                                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                                    <span className="text-xs text-white">Subiendo...</span>
                                  </div>
                                )}
                              </div>
                              {!video.isLocal && (
                                <button
                                  type="button"
                                  onClick={() => removeMedia('videos', idx)}
                                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Icons.Close className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: LOCATION ==================== */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Map */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Selecciona en el mapa *
                    </label>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                      <MapPicker
                        value={formData.coordinates}
                        onChange={handleLocationSelect}
                      />
                    </div>
                    {formErrors.coordinates && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.coordinates}
                      </p>
                    )}
                  </div>

                  {/* Address input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dirección del servicio *
                    </label>
                    <div className="relative">
                      <Icons.MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className={`
                          w-full border-2 rounded-xl pl-10 pr-4 py-3 text-gray-900 
                          placeholder:text-gray-400 transition-colors
                          focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                          ${formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                        `}
                        placeholder="La dirección se completará automáticamente al seleccionar en el mapa"
                      />
                    </div>
                    {formErrors.address ? (
                      <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        💡 Puedes editar la dirección manualmente si es necesario
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: DATE ==================== */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-sm text-amber-800">
                      Este paso es <strong>opcional</strong>. Si no tienes una fecha específica, puedes dejarlo en blanco.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Cuándo necesitas el servicio?
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => updateField('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  {/* Quick date options */}
                  <div>
                    <p className="text-sm text-gray-500 mb-3">O selecciona una opción rápida:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Hoy', days: 0 },
                        { label: 'Mañana', days: 1 },
                        { label: 'Esta semana', days: 7 },
                        { label: 'Próxima semana', days: 14 }
                      ].map((opt) => {
                        const date = new Date();
                        date.setDate(date.getDate() + opt.days);
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = formData.preferredDate === dateStr;
                        
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => updateField('preferredDate', dateStr)}
                            className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all
                              ${isSelected 
                                ? 'bg-brand-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 4: BUDGET ==================== */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  {/* Budget input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tu presupuesto estimado *
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={formData.currency}
                        onChange={(e) => updateField('currency', e.target.value)}
                        className="w-28 border-2 border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:border-brand-500"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </option>
                        ))}
                      </select>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={formData.budgetAmount}
                          onChange={(e) => updateField('budgetAmount', e.target.value)}
                          className={`
                            w-full border-2 rounded-xl px-4 py-3 text-gray-900 text-lg font-semibold
                            placeholder:text-gray-400 placeholder:font-normal transition-colors
                            focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                            ${formErrors.budgetAmount ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                          `}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {formErrors.budgetAmount && (
                      <p className="text-xs text-red-600 mt-2">{formErrors.budgetAmount}</p>
                    )}
                  </div>

                  {/* Quick budget options */}
                  <div>
                    <p className="text-sm text-gray-500 mb-3">Rangos sugeridos:</p>
                    <div className="flex flex-wrap gap-2">
                      {[50, 100, 200, 500, 1000].map((amount) => {
                        const isSelected = Number(formData.budgetAmount) === amount;
                        return (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => updateField('budgetAmount', amount.toString())}
                            className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all
                              ${isSelected 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                          >
                            ${amount}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      Resumen de tu solicitud
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 shrink-0">📝</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Descripción</p>
                          <p className="text-sm text-gray-900 line-clamp-2">{formData.description || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 shrink-0">📍</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Ubicación</p>
                          <p className="text-sm text-gray-900 truncate">{formData.address || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 shrink-0">📅</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Fecha</p>
                          <p className="text-sm text-gray-900">{formData.preferredDate || 'No especificada'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 shrink-0">📸</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Archivos adjuntos</p>
                          <p className="text-sm text-gray-900">
                            {formData.photos.length} foto(s), {formData.videos.length} video(s)
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Presupuesto</span>
                        <span className="text-xl font-bold text-green-600">
                          {CURRENCIES.find(c => c.code === formData.currency)?.symbol}
                          {Number(formData.budgetAmount || 0).toLocaleString()} {formData.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* FOOTER - Botones de navegación */}
          {/* ============================================================ */}
          <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium transition-all
                ${currentStep === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-200'}
              `}
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep ? 'bg-brand-600 w-4' : 
                    completedSteps.includes(idx) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={uploadingMedia}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                <span>Continuar</span>
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                loading={loading} 
                disabled={uploadingMedia}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
              >
                <Icons.Send className="w-4 h-4" />
                <span>Enviar Solicitud</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

RequestWizardModal.propTypes = {
  provider: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RequestWizardModal;

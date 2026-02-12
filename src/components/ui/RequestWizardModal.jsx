import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';
import MapPicker from './MapPicker.jsx';
import api from '@/state/apiClient';
import { useToast } from './Toast.jsx';
import { useNavigate } from 'react-router-dom';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from './UploadProgress.jsx';
import { getProblemsForCategory, categoryRequiresLocation } from '@/utils/categoryProblems.js';

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
  ),
  Wrench: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

// ============================================================================
// STEPS CONFIGURATION - Configuración de pasos con iconos y colores
// ============================================================================
const STEPS = [
  { 
    id: 'problems', 
    titleKey: 'problems', 
    shortTitleKey: 'problems',
    descriptionKey: 'problemsHint',
    icon: '🔧',
    color: 'from-brand-500 to-brand-600'
  },
  { 
    id: 'media', 
    titleKey: 'media', 
    shortTitleKey: 'photosVideos',
    descriptionKey: 'mediaHint',
    icon: '📸',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'location', 
    titleKey: 'location', 
    shortTitleKey: 'location',
    descriptionKey: 'locationHint',
    icon: '📍',
    color: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'date', 
    titleKey: 'date', 
    shortTitleKey: 'date',
    descriptionKey: 'dateHint',
    icon: '📅',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    id: 'budget', 
    titleKey: 'summary', 
    shortTitleKey: 'summary',
    descriptionKey: 'summaryHint',
    icon: '📋',
    color: 'from-green-500 to-emerald-500'
  }
];

// ============================================================================
// URGENCY OPTIONS - Opciones de urgencia con estilos
// ============================================================================
const URGENCY_OPTIONS = [
  { 
    value: 'scheduled', 
    labelKey: 'scheduled', 
    descriptionKey: 'scheduledDesc',
    icon: '🗓️',
    color: 'border-blue-200 bg-blue-50 hover:border-blue-400'
  },
  { 
    value: 'immediate', 
    labelKey: 'urgent', 
    descriptionKey: 'urgentDesc',
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
function RequestWizardModal({ provider, isOpen, onClose, initialCategory = null }) {
  const { t } = useTranslation();
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
    selectedProblems: [], // IDs de problemas seleccionados
    additionalDetails: '', // Detalles adicionales opcionales
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

  // Obtener problemas disponibles según la categoría del proveedor
  const availableProblems = useMemo(() => {
    if (!formData.category) return [];
    return getProblemsForCategory(formData.category);
  }, [formData.category]);

  // Inicializar categoría: usa initialCategory si viene, o la primera del proveedor
  useEffect(() => {
    if (provider && isOpen) {
      const providerCategories = provider.providerProfile?.services || [];
      
      // Si viene initialCategory y el proveedor la ofrece, usarla
      let categoryToUse = '';
      if (initialCategory) {
        const hasCategory = providerCategories.some(s => s.category === initialCategory);
        if (hasCategory) {
          categoryToUse = initialCategory;
        } else {
          // Fallback a la primera categoría del proveedor
          categoryToUse = providerCategories[0]?.category || '';
        }
      } else {
        categoryToUse = providerCategories[0]?.category || '';
      }
      
      setFormData(prev => ({
        ...prev,
        category: categoryToUse,
        selectedProblems: [] // Reset problemas al cambiar categoría
      }));
    }
  }, [provider, isOpen, initialCategory]);

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
        selectedProblems: [],
        additionalDetails: '',
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

  // Función para toggle de selección de problema
  const toggleProblem = (problemId) => {
    setFormData(prev => {
      const isSelected = prev.selectedProblems.includes(problemId);
      const newSelected = isSelected
        ? prev.selectedProblems.filter(id => id !== problemId)
        : [...prev.selectedProblems, problemId];
      return { ...prev, selectedProblems: newSelected };
    });
    // Limpiar error si se selecciona algo
    if (formErrors.selectedProblems) {
      setFormErrors(prev => ({ ...prev, selectedProblems: undefined }));
    }
  };

  // Generar descripción automática basada en problemas seleccionados
  const generateAutoDescription = () => {
    if (formData.selectedProblems.length === 0) return '';
    
    const problemNames = formData.selectedProblems.map(problemId => {
      const key = `ui.categoryProblems.${formData.category}.${problemId}.name`;
      return t(key, { defaultValue: problemId });
    });
    
    let description = problemNames.join(', ');
    if (formData.additionalDetails?.trim()) {
      description += `. ${formData.additionalDetails.trim()}`;
    }
    return description;
  };

  // La ubicación es siempre opcional para todas las categorías
  const locationRequired = false;

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Paso de selección de problemas
        if (!formData.selectedProblems || formData.selectedProblems.length === 0) {
          errors.selectedProblems = t('ui.categoryProblems.noProblemsSelected');
        }
        if (!formData.urgency) {
          errors.urgency = t('ui.requestWizard.selectUrgency');
        }
        break;
      case 1: // Media - opcional, siempre válido
        break;
      case 2: // Location - condicional según categoría
        // Solo validar si la categoría requiere ubicación O si el usuario ingresó datos parciales
        if (locationRequired) {
          if (!formData.address || formData.address.trim().length < 3) {
            errors.address = t('ui.requestWizard.addressRequired');
          }
          if (!formData.coordinates || !Number.isFinite(formData.coordinates.lat) || !Number.isFinite(formData.coordinates.lng)) {
            errors.coordinates = t('ui.requestWizard.selectLocationOnMap');
          }
        } else {
          // Para categorías remotas: si puso dirección, debe ser válida
          if (formData.address && formData.address.trim().length > 0 && formData.address.trim().length < 3) {
            errors.address = t('ui.requestWizard.addressTooShort');
          }
        }
        break;
      case 3: // Date - opcional, siempre válido
        break;
      case 4: // Summary
        // El paso de resumen no requiere validación adicional
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para omitir paso opcional
  const handleSkipStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
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
      toast.warning(t('ui.requestWizard.completePreviousStep'));
    }
  };

  const handleCloseAttempt = () => {
    const hasData = 
      formData.title || 
      formData.description || 
      formData.address ||
      formData.photos.length > 0 || 
      formData.videos.length > 0;

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
          message: t('ui.requestWizard.compressingImages'),
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
          message: t('ui.requestWizard.preparingVideoUpload'),
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
        message: t('ui.requestWizard.uploadingMedia', { type: type === 'photos' ? t('ui.requestWizard.photos') : t('ui.requestWizard.videos'), size: totalSizeMB }),
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
            message: t('ui.requestWizard.uploadingMedia', { type: type === 'photos' ? t('ui.requestWizard.photos') : t('ui.requestWizard.videos'), size: totalSizeMB })
          }));
        }
      });

      setUploadProgress(prev => ({
        ...prev,
        progress: 95,
        message: t('ui.requestWizard.processingCloudinary'),
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
          message: t('ui.requestWizard.filesUploadedSuccess'),
          totalFiles: validation.validFiles.length,
          currentFile: validation.validFiles.length,
          status: 'success'
        });

        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, show: false }));
        }, 2000);

        toast.success(t('ui.requestWizard.filesUploaded', { count: uploaded.length, type: type === 'photos' ? t('ui.requestWizard.photoPlural') : t('ui.requestWizard.videoPlural') }));
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
      
      let errorMsg = t('ui.requestWizard.uploadFailed', { type: type === 'photos' ? t('ui.requestWizard.photos') : t('ui.requestWizard.videos') });
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        errorMsg = t('ui.requestWizard.fileTooLarge');
      } else if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      }
      
      setUploadProgress({
        show: true,
        progress: 0,
        fileName: '',
        message: t('ui.requestWizard.uploadError'),
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
      toast.error(t('ui.requestWizard.categoryNotDetermined'));
      return;
    }

    setLoading(true);
    let data;
    try {
      // Generate description from selected problems + additional details
      const generatedDescription = generateAutoDescription();
      const autoTitle = generatedDescription.substring(0, 50) + 
                       (generatedDescription.length > 50 ? '...' : '');
      
      // Construir payload - ubicación solo si está completa
      const hasValidLocation = formData.address?.trim() && 
                               formData.coordinates?.lat && 
                               formData.coordinates?.lng;
      
      const payload = {
        title: autoTitle,
        description: generatedDescription,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        urgency: formData.urgency,
        // Solo incluir ubicación si está completa
        address: hasValidLocation ? formData.address.trim() : undefined,
        coordinates: hasValidLocation ? formData.coordinates : undefined,
        preferredDate: formData.preferredDate || undefined,
        budget: formData.budgetAmount ? {
          amount: Number(formData.budgetAmount),
          currency: formData.currency
        } : undefined,
        photos: formData.photos,
        videos: formData.videos,
        visibility: 'auto',
        targetProviders: provider ? [provider._id] : undefined
      };
      data = await api.post('/client/requests', payload);
    } catch (err) {
      // Si es timeout pero la solicitud se creó, intentar fallback
      if (err.code === 'ECONNABORTED' && err.message?.includes('timeout')) {
        toast.info(t('ui.requestWizard.requestMayBeCreated'));
        onClose();
        navigate('/mis-solicitudes');
        return;
      } else {
        console.error('Error creating request:', err);
        const msg = err?.response?.data?.message || t('ui.requestWizard.createError');
        toast.error(msg);
        return;
      }
    } finally {
      setLoading(false);
    }

    if (data?.data?.success) {
      const providerName = provider?.providerProfile?.businessName || provider?.profile?.firstName || t('ui.requestWizard.theProvider');
      toast.success(t('ui.requestWizard.requestSent', { provider: providerName }));
      onClose();
      navigate('/mis-solicitudes');
    } else {
      toast.warning(data?.data?.message || t('ui.requestWizard.couldNotCreate'));
    }
  };

  if (!isOpen || !provider) return null;

  const providerName = provider.providerProfile?.businessName || provider.profile?.firstName || t('ui.requestWizard.thisProfessional');
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
                {t('ui.requestWizard.cancelRequest')}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('ui.requestWizard.dataWillBeLost')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {t('ui.requestWizard.continue')}
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                {t('ui.requestWizard.yesCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal principal */}
      <div className="fixed inset-0 z-60 flex items-center justify-center pt-20 pb-4 px-2 sm:pt-24 sm:pb-6 sm:px-4 lg:pt-20 lg:pb-8 lg:px-8">
        {/* Backdrop con blur */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-modal-enter"
          onClick={handleCloseAttempt}
        />
        {/* Modal content */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden animate-zoom-in z-60"
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
                  {t('ui.requestWizard.requestForCategory', { 
                    provider: providerName, 
                    category: formData.category || t('ui.requestWizard.service') 
                  })}
                </h2>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span>{t('ui.requestWizard.stepOf', { current: currentStep + 1, total: STEPS.length })}</span>
                  <span>•</span>
                  <span>{t(`ui.requestWizard.steps.${step.titleKey}`)}</span>
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
                      {t(`ui.requestWizard.steps.${s.shortTitleKey}`)}
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
                  {t(`ui.requestWizard.steps.${step.titleKey}`)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{t(`ui.requestWizard.steps.${step.descriptionKey}`)}</p>
              </div>

              {/* ==================== STEP 0: PROBLEM SELECTION ==================== */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  {/* Info banner */}
                  <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4">
                    <Icons.Wrench className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-brand-800">{t('ui.categoryProblems.selectTitle')}</p>
                      <p className="text-sm text-brand-700">{t('ui.categoryProblems.selectSubtitle')}</p>
                    </div>
                  </div>

                  {/* Problem Grid Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        {t('ui.requestWizard.whatProblemHave')} *
                      </label>
                      {formData.selectedProblems.length > 0 && (
                        <span className="text-xs font-medium text-brand-600 bg-brand-100 px-2 py-1 rounded-full">
                          {t('ui.requestWizard.problemsSelectedSummary', { count: formData.selectedProblems.length })}
                        </span>
                      )}
                    </div>
                    
                    {/* Problems Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {availableProblems.map((problem) => {
                        const isSelected = formData.selectedProblems.includes(problem.id);
                        const isOther = problem.id === 'other';
                        
                        return (
                          <button
                            key={problem.id}
                            type="button"
                            onClick={() => toggleProblem(problem.id)}
                            className={`
                              relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all group
                              ${isSelected 
                                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' 
                                : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'}
                              ${isOther ? 'col-span-2 sm:col-span-1' : ''}
                            `}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xl sm:text-2xl shrink-0">{problem.icon}</span>
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium text-sm sm:text-base truncate ${isSelected ? 'text-brand-800' : 'text-gray-900'}`}>
                                  {t(`ui.categoryProblems.${formData.category}.${problem.id}.name`)}
                                </p>
                                <p className="text-xs text-gray-500 truncate hidden sm:block">
                                  {t(`ui.categoryProblems.${formData.category}.${problem.id}.desc`)}
                                </p>
                              </div>
                            </div>
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                                <Icons.Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {formErrors.selectedProblems && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.selectedProblems}
                      </p>
                    )}
                  </div>

                  {/* Additional Details - Optional textarea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.categoryProblems.additionalDetails')}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.additionalDetails}
                      onChange={(e) => updateField('additionalDetails', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 
                        placeholder:text-gray-400 resize-none transition-colors
                        focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder={t('ui.categoryProblems.additionalDetailsPlaceholder')}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t('ui.requestWizard.characters', { count: formData.additionalDetails.length })}
                    </p>
                  </div>

                  {/* Urgency selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('ui.requestWizard.howUrgent')} *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {URGENCY_OPTIONS.map((option) => {
                        const isSelected = formData.urgency === option.value;
                        const isUrgent = option.value === 'immediate';
                        
                        // Estilos cuando está seleccionado
                        const selectedStyles = isUrgent
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                          : 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20';
                        
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('urgency', option.value)}
                            className={`
                              relative p-4 rounded-xl border-2 text-left transition-all
                              ${isSelected ? selectedStyles : option.color}
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{option.icon}</span>
                              <div>
                                <p className="font-semibold text-gray-900">{t(`ui.requestWizard.urgency.${option.labelKey}`)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{t(`ui.requestWizard.urgency.${option.descriptionKey}`)}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${isUrgent ? 'bg-red-500' : 'bg-brand-500'}`}>
                                <Icons.Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
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
                      <p className="text-sm font-medium text-blue-800">{t('ui.requestWizard.tip')}</p>
                      <p className="text-sm text-blue-700">{t('ui.requestWizard.compressionTip')}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Photos upload */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icons.Photo className="w-5 h-5 text-purple-600" />
                        <label className="text-sm font-semibold text-gray-700">{t('ui.requestWizard.photos')}</label>
                        <span className="text-xs text-gray-400">({t('ui.requestWizard.optional')})</span>
                      </div>
                      
                      <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'}
                      `}>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center">
                          {t('ui.requestWizard.clickOrDragImages')}
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
                                alt={t('ui.requestWizard.photoAlt', { number: idx + 1 })}
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
                        <label className="text-sm font-semibold text-gray-700">{t('ui.requestWizard.videos')}</label>
                        <span className="text-xs text-gray-400">({t('ui.requestWizard.maxSize', { size: '200MB' })})</span>
                      </div>
                      
                      <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50/50'}
                      `}>
                        <Icons.Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center">
                          {t('ui.requestWizard.clickOrDragVideos')}
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
                                    <span className="text-xs text-white">{t('ui.requestWizard.uploading')}</span>
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
                  {/* Banner informativo según si es obligatorio u opcional */}
                  {!locationRequired && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-xl">💻</span>
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          {t('ui.requestWizard.locationOptionalTitle')}
                        </p>
                        <p className="text-sm text-blue-700">
                          {t('ui.requestWizard.locationOptionalDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Map */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.requestWizard.selectOnMap')} {locationRequired && '*'}
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
                      {t('ui.requestWizard.serviceAddress')} {locationRequired && '*'}
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
                        placeholder={t('ui.requestWizard.addressAutoComplete')}
                      />
                    </div>
                    {formErrors.address ? (
                      <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        💡 {t('ui.requestWizard.canEditAddress')}
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
                      {t('ui.requestWizard.stepOptional')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('ui.requestWizard.whenNeeded')}
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
                    <p className="text-sm text-gray-500 mb-3">{t('ui.requestWizard.orSelectQuickOption')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { labelKey: 'today', days: 0 },
                        { labelKey: 'tomorrow', days: 1 },
                        { labelKey: 'thisWeek', days: 7 },
                        { labelKey: 'nextWeek', days: 14 }
                      ].map((opt) => {
                        const date = new Date();
                        date.setDate(date.getDate() + opt.days);
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = formData.preferredDate === dateStr;
                        
                        return (
                          <button
                            key={opt.labelKey}
                            type="button"
                            onClick={() => updateField('preferredDate', dateStr)}
                            className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all
                              ${isSelected 
                                ? 'bg-brand-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                          >
                            {t(`ui.requestWizard.dateOptions.${opt.labelKey}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 4: RESUMEN ==================== */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  {/* Request completeness indicator */}
                  {(() => {
                    const hasLocation = formData.address?.trim() && formData.coordinates?.lat;
                    const hasDate = !!formData.preferredDate;
                    const hasMedia = formData.photos.length > 0 || formData.videos.length > 0;
                    const isComplete = hasLocation && hasDate && hasMedia;
                    
                    return (
                      <div className={`rounded-xl p-4 flex items-start gap-3 ${
                        isComplete 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-amber-50 border border-amber-200'
                      }`}>
                        <span className="text-xl">{isComplete ? '✅' : '💡'}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>
                            {isComplete 
                              ? t('ui.requestWizard.requestComplete')
                              : t('ui.requestWizard.requestIncomplete')
                            }
                          </p>
                          {!isComplete && (
                            <p className="text-sm text-amber-700 mt-1">
                              {t('ui.requestWizard.incompleteHint')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary card */}
                  <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      {t('ui.requestWizard.requestSummary')}
                    </h4>
                    <div className="space-y-3">
                      {/* Selected Problems */}
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 shrink-0">🔧</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{t('ui.requestWizard.steps.problems')}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {formData.selectedProblems.map((problemId) => {
                              const problem = availableProblems.find(p => p.id === problemId);
                              return problem ? (
                                <span 
                                  key={problemId}
                                  className="inline-flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full"
                                >
                                  <span>{problem.icon}</span>
                                  {t(`ui.categoryProblems.${formData.category}.${problemId}.name`)}
                                </span>
                              ) : null;
                            })}
                          </div>
                          {formData.additionalDetails && (
                            <p className="text-xs text-gray-600 mt-2 italic">
                              "{formData.additionalDetails.substring(0, 80)}{formData.additionalDetails.length > 80 ? '...' : ''}"
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(0)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {t('ui.requestWizard.edit')}
                        </button>
                      </div>
                      
                      {/* Location - con indicador de opcional */}
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 ${formData.address ? 'text-gray-400' : 'text-amber-400'}`}>📍</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">
                            {t('ui.requestWizard.steps.location')}
                            {!locationRequired && <span className="text-gray-400 ml-1">({t('ui.requestWizard.optional')})</span>}
                          </p>
                          <p className={`text-sm truncate ${formData.address ? 'text-gray-900' : 'text-amber-600 italic'}`}>
                            {formData.address || t('ui.requestWizard.notSpecified')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {formData.address ? t('ui.requestWizard.edit') : t('ui.requestWizard.add')}
                        </button>
                      </div>
                      
                      {/* Date - con indicador de opcional */}
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 ${formData.preferredDate ? 'text-gray-400' : 'text-amber-400'}`}>📅</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">
                            {t('ui.requestWizard.steps.date')}
                            <span className="text-gray-400 ml-1">({t('ui.requestWizard.optional')})</span>
                          </p>
                          <p className={`text-sm ${formData.preferredDate ? 'text-gray-900' : 'text-amber-600 italic'}`}>
                            {formData.preferredDate || t('ui.requestWizard.notSpecified')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {formData.preferredDate ? t('ui.requestWizard.edit') : t('ui.requestWizard.add')}
                        </button>
                      </div>
                      
                      {/* Urgency */}
                      <div className="flex items-start gap-3">
                        <span className="text-gray-400 shrink-0">⚡</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{t('ui.requestWizard.urgencyLabel')}</p>
                          <p className="text-sm text-gray-900">
                            {formData.urgency === 'immediate' ? `🔴 ${t('ui.requestWizard.urgency.urgent')}` : `🔵 ${t('ui.requestWizard.urgency.scheduled')}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(0)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
                        >
                          {t('ui.requestWizard.edit')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Archivos adjuntos con miniaturas */}
                  {(formData.photos.length > 0 || formData.videos.length > 0) && (
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-lg">📸</span>
                          {t('ui.requestWizard.attachedFiles', { count: formData.photos.length + formData.videos.length })}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          {t('ui.requestWizard.editFiles')}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {/* Miniaturas de fotos */}
                        {formData.photos.map((photo, index) => (
                          <div 
                            key={`photo-${index}`} 
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group"
                          >
                            <img
                              src={photo.url || photo.preview || URL.createObjectURL(photo)}
                              alt={t('ui.requestWizard.photoAlt', { number: index + 1 })}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newPhotos = formData.photos.filter((_, i) => i !== index);
                                  updateField('photos', newPhotos);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                title={t('ui.requestWizard.deletePhoto')}
                              >
                                <Icons.Close className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {t('ui.requestWizard.photoLabel')}
                            </div>
                          </div>
                        ))}
                        
                        {/* Miniaturas de videos */}
                        {formData.videos.map((video, index) => (
                          <div 
                            key={`video-${index}`} 
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-200 group"
                          >
                            <video
                              src={video.url || video.preview || URL.createObjectURL(video)}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 rounded-full p-2">
                                <Icons.Play className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVideos = formData.videos.filter((_, i) => i !== index);
                                  updateField('videos', newVideos);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                title={t('ui.requestWizard.deleteVideo')}
                              >
                                <Icons.Close className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {t('ui.requestWizard.videoLabel')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay archivos */}
                  {formData.photos.length === 0 && formData.videos.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-300 text-center">
                      <span className="text-3xl mb-2 block">📷</span>
                      <p className="text-sm text-gray-500 mb-2">{t('ui.requestWizard.noFilesAttached')}</p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        + {t('ui.requestWizard.addPhotosOrVideos')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* FOOTER - Botones de navegación */}
          {/* ============================================================ */}
          <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Botón Cancelar */}
              <button
                type="button"
                onClick={handleCloseAttempt}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all"
              >
                <Icons.Close className="w-4 h-4" />
                <span className="hidden sm:inline">{t('ui.requestWizard.cancel')}</span>
              </button>
              
              {/* Botón Anterior */}
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
                <span className="hidden sm:inline">{t('ui.requestWizard.previous')}</span>
              </button>
            </div>

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
              <div className="flex items-center gap-2">
                {/* Botón Omitir - visible en pasos opcionales (Media, Ubicación, Fecha) */}
                {(currentStep === 1 || currentStep === 2 || currentStep === 3) && (
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all"
                  >
                    <span>{t('ui.requestWizard.skip')}</span>
                    <Icons.ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={uploadingMedia}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all disabled:opacity-50"
                >
                  <span>{t('ui.requestWizard.continue')}</span>
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={handleSubmit} 
                loading={loading} 
                disabled={uploadingMedia}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
              >
                <Icons.Send className="w-4 h-4" />
                <span>{t('ui.requestWizard.sendRequest')}</span>
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

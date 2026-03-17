import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';
import { compressImages, validateFiles } from '@/utils/fileCompression.js';
import UploadProgress from '@/components/ui/UploadProgress.jsx';

export default function PortfolioManager({ initialPortfolio = [], onUpdate, activeFilter = 'all' }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [dragOverImages, setDragOverImages] = useState(false);
  const [dragOverVideos, setDragOverVideos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    progress: 0,
    fileName: '',
    message: t('account.portfolioManager.processingFiles'),
    totalFiles: 0,
    currentFile: 0,
    status: 'uploading'
  });

  // Usar directamente initialPortfolio del prop en lugar de estado local
  const portfolio = initialPortfolio;

  const handleFileSelect = async (files, type = 'all') => {
    const fileArray = Array.from(files);
    
    // Filtrar según tipo si se especifica
    const filtered = type === 'all' ? fileArray
      : type === 'images' ? fileArray.filter(f => f.type.startsWith('image/'))
      : fileArray.filter(f => f.type.startsWith('video/'));

    if (filtered.length === 0) {
      toast.error(type === 'images' 
        ? t('account.portfolioManager.onlyImagesAllowed')
        : type === 'videos' 
          ? t('account.portfolioManager.onlyVideosAllowed')
          : t('account.portfolioManager.selectAtLeastOne'));
      return;
    }
    
    // Validar archivos
    const validation = validateFiles(filtered, {
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

    // Subir directamente sin paso de preview
    await uploadFiles(validation.validFiles);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOverImages(false);
    setDragOverVideos(false);
    if (uploading) return;
    const files = e.dataTransfer?.files;
    if (files?.length) handleFileSelect(files, type);
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    if (type === 'images') setDragOverImages(true);
    else setDragOverVideos(true);
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    if (type === 'images') setDragOverImages(false);
    else setDragOverVideos(false);
  };

  const uploadFiles = async (filesToUpload) => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const totalFiles = filesToUpload.length;
      let processedFiles = [...filesToUpload];
      const hasVideos = filesToUpload.some(f => f.type.startsWith('video/'));

      // 1. Comprimir imágenes antes de subir
      const imageFiles = filesToUpload.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        setUploadProgress({
          show: true,
          progress: 0,
          fileName: '',
          message: t('account.portfolioManager.compressingImages'),
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
            setUploadProgress(prev => ({
              ...prev,
              progress: (progress.percentage * 0.2), // 20% del progreso total para compresión
              currentFile: progress.current
            }));
          });

          // Reemplazar imágenes originales con comprimidas
          processedFiles = filesToUpload.map(file => {
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
        // Si solo hay videos, mostrar progreso desde el inicio
        setUploadProgress({
          show: true,
          progress: 0,
          fileName: processedFiles[0]?.name || '',
          message: t('account.portfolioManager.preparingVideos'),
          totalFiles,
          currentFile: 0,
          status: 'uploading'
        });
      }

      // 2. Subir archivos a Cloudinary
      
      setUploadProgress(prev => ({
        ...prev,
        progress: 20,
        message: hasVideos ? t('account.portfolioManager.uploadingFilesVideos') : t('account.portfolioManager.uploadingFiles'),
        status: 'uploading',
        fileName: processedFiles[0]?.name || ''
      }));

      const formData = new FormData();
      processedFiles.forEach(file => {
        formData.append('portfolio', file);
      });
      if (category) {
        formData.append('category', category);
      }
      formData.append('captions', JSON.stringify(new Array(processedFiles.length).fill('')));

      // Calcular tamaño total
      const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`📦 Uploading ${processedFiles.length} files, total: ${totalSizeMB}MB`);

      // Usar progreso real de axios
      const uploadRes = await api.post('/uploads/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutos
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          
          // Si hubo compresión: 20% compresión + 70% subida = 90% (deja 10% para procesamiento)
          // Si no hubo compresión: 0-90% subida (deja 10% para procesamiento)
          const baseProgress = imageFiles.length > 0 ? 20 : 0;
          const progressRange = imageFiles.length > 0 ? 70 : 90;
          const adjustedProgress = baseProgress + Math.round((percentCompleted * progressRange) / 100);
          
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.min(adjustedProgress, 90),
            message: hasVideos 
              ? t('account.portfolioManager.uploadingFiles')
              : t('account.portfolioManager.uploadingImages')
          }));
        }
      });

      // Mostrar progreso de procesamiento
      setUploadProgress(prev => ({
        ...prev,
        progress: 95,
        message: t('account.portfolioManager.processingCloudinary'),
        status: 'processing'
      }));

      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.message || t('account.portfolioManager.uploadError'));
      }

      const uploadedItems = uploadRes.data.data.portfolio;

      // 3. Guardar en el perfil del proveedor
      setUploadProgress(prev => ({
        ...prev,
        progress: 95,
        message: t('account.portfolioManager.savingProfile')
      }));

      const saveRes = await api.post('/auth/portfolio', {
        portfolio: uploadedItems
      });

      if (saveRes.data.success) {
        setUploadProgress({
          show: true,
          progress: 100,
          fileName: '',
          message: t('account.portfolioManager.portfolioUpdated'),
          totalFiles,
          currentFile: totalFiles,
          status: 'success'
        });

        // Ocultar progreso después de 2 segundos
        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, show: false }));
        }, 2000);

        toast.success(t('account.portfolioManager.filesAdded', { count: uploadedItems.length }));
        
        // Notificar al componente padre para refrescar datos
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || t('account.portfolioManager.uploadPortfolioError');
      setError(msg);
      toast.error(msg);
      
      setUploadProgress({
        show: true,
        progress: 0,
        fileName: '',
        message: t('account.portfolioManager.errorUploading'),
        totalFiles: filesToUpload.length,
        currentFile: 0,
        status: 'error'
      });

      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm(t('account.portfolioManager.confirmDelete'))) return;

    try {
      const res = await api.delete(`/auth/portfolio/${itemId}`);
      if (res.data.success) {
        toast.success(t('account.portfolioManager.itemDeleted'));
        
        // Notificar al componente padre para refrescar datos
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('account.portfolioManager.deleteError');
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de progreso */}
      <UploadProgress {...uploadProgress} />

      <div>
        <h3 className="text-lg font-semibold mb-2">{t('account.portfolioManager.title')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('account.portfolioManager.subtitle')}
        </p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {/* Upload form - Drag & Drop zones */}
        <div className="space-y-4">
          {/* Tip banner */}
          <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl p-3">
            <span className="text-brand-600 shrink-0 mt-0.5">✨</span>
            <div>
              <p className="text-sm font-medium text-brand-800">{t('account.portfolioManager.compressionTip')}</p>
              <p className="text-xs text-brand-600">{t('account.portfolioManager.autoCompress')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Photos drop zone */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-semibold text-gray-700">{t('provider.portfolio.photos')}</span>
              </div>
              
              <label
                className={`
                  flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                  ${uploading ? 'opacity-50 cursor-not-allowed' 
                    : dragOverImages ? 'border-brand-500 bg-brand-50' 
                    : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/50'}
                `}
                onDrop={(e) => handleDrop(e, 'images')}
                onDragOver={(e) => handleDragOver(e, 'images')}
                onDragLeave={(e) => handleDragLeave(e, 'images')}
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm text-gray-600 text-center">
                  {uploading ? t('account.portfolioManager.uploading') : t('ui.requestWizard.clickOrDragImages')}
                </span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => { handleFileSelect(e.target.files, 'images'); e.target.value = ''; }}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

            </div>

            {/* Videos drop zone */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="text-sm font-semibold text-gray-700">{t('provider.portfolio.videos')}</span>
                <span className="text-xs text-gray-400">({t('account.portfolioManager.maxVideoSize')})</span>
              </div>
              
              <label
                className={`
                  flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                  ${uploading ? 'opacity-50 cursor-not-allowed' 
                    : dragOverVideos ? 'border-pink-500 bg-pink-50' 
                    : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50/50'}
                `}
                onDrop={(e) => handleDrop(e, 'videos')}
                onDragOver={(e) => handleDragOver(e, 'videos')}
                onDragLeave={(e) => handleDragLeave(e, 'videos')}
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm text-gray-600 text-center">
                  {uploading ? t('account.portfolioManager.uploading') : t('ui.requestWizard.clickOrDragVideos')}
                </span>
                <span className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, WebM</span>
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => { handleFileSelect(e.target.files, 'videos'); e.target.value = ''; }}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

            </div>
          </div>

          {/* Categoría — siempre visible para asignar antes de subir */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {t('account.portfolioManager.categoryOptional')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              disabled={uploading}
            >
              <option value="">{t('account.portfolioManager.noCategory')}</option>
              {SERVICE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{t(`home.categories.${cat}`, cat)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Portfolio actual */}
      <div>
        <h4 className="font-medium mb-3">{t('account.portfolioManager.currentPortfolio', { count: portfolio.length })}</h4>
        {portfolio.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            {t('account.portfolioManager.emptyPortfolio')}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {portfolio
              .filter(item => activeFilter === 'all' || item.type === activeFilter)
              .map((item) => (
              <div key={item._id} className="group relative">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 border flex items-center justify-center">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || 'Portfolio'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Video play indicator */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Delete button overlay */}
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-xs"
                    title={t('account.portfolioManager.delete')}
                  >
                    ✕
                  </button>

                  {/* Category badge */}
                  {item.category && (
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {t(`home.categories.${item.category}`, item.category)}
                    </div>
                  )}
                </div>
                
                {item.caption && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

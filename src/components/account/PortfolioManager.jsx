import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient.js';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';
import { compressImages, validateFiles, formatFileSize } from '@/utils/fileCompression.js';
import UploadProgress from '@/components/ui/UploadProgress.jsx';

export default function PortfolioManager({ initialPortfolio = [], onUpdate }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [category, setCategory] = useState('');
  const [captions, setCaptions] = useState([]);
  const [error, setError] = useState('');
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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
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

    setSelectedFiles(validation.validFiles);
    setCaptions(new Array(validation.validFiles.length).fill(''));

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
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error(t('account.portfolioManager.selectAtLeastOne'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      const totalFiles = selectedFiles.length;
      let processedFiles = [...selectedFiles];
      const hasVideos = selectedFiles.some(f => f.type.startsWith('video/'));

      // 1. Comprimir imágenes antes de subir
      const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
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
          processedFiles = selectedFiles.map(file => {
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
      formData.append('captions', JSON.stringify(captions));

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
        
        // Limpiar formulario
        setSelectedFiles([]);
        setPreviews([]);
        setCaptions([]);
        setCategory('');
        
        // Limpiar input file
        const fileInput = document.getElementById('portfolio-file-input');
        if (fileInput) fileInput.value = '';
        
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
        totalFiles: selectedFiles.length,
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

  const handleCaptionChange = (index, value) => {
    const newCaptions = [...captions];
    newCaptions[index] = value;
    setCaptions(newCaptions);
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

        {/* Upload form */}
        <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('account.portfolioManager.selectFiles')}
              <span className="text-xs text-gray-500 ml-2">{t('account.portfolioManager.autoCompress')}</span>
            </label>
            <input
              id="portfolio-file-input"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {previews.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('account.portfolioManager.categoryOptional')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                disabled={uploading}
              >
                <option value="">{t('account.portfolioManager.noCategory')}</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{t(`categories.${cat}`, cat)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Previews */}
          {previews.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{t('account.portfolioManager.preview', { count: previews.length })}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                      {preview.type === 'video' ? (
                        <video
                          src={preview.url}
                          className="w-full h-full object-contain"
                          controls
                        />
                      ) : (
                        <img
                          src={preview.url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={t('account.portfolioManager.captionPlaceholder')}
                      value={captions[idx] || ''}
                      onChange={(e) => handleCaptionChange(idx, e.target.value)}
                      disabled={uploading}
                      className="w-full text-xs border rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {t('account.portfolioManager.uploading')}
                  </>
                ) : (
                  t('account.portfolioManager.uploadBtn', { count: previews.length })
                )}
              </Button>
            </div>
          )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {portfolio.map((item) => (
              <div key={item._id} className="group relative">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 border flex items-center justify-center">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || 'Portfolio'}
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Delete button overlay */}
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('account.portfolioManager.delete')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Category badge */}
                  {item.category && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {item.category}
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

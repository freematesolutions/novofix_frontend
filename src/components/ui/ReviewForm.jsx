import { useState, useCallback, useRef, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating.jsx';
import Button from './Button.jsx';
import Spinner from './Spinner.jsx';
import { useToast } from './Toast.jsx';
import api from '@/state/apiClient.js';

/**
 * ReviewForm Component - Modal premium para crear reviews
 * Incluye:
 * - Rating general con estrellas interactivas
 * - Ratings por categoría (profesionalismo, calidad, puntualidad, comunicación, valor)
 * - Título y comentario con contador de caracteres
 * - Upload de fotos con preview
 * - Validaciones y feedback visual
 */

const CATEGORIES = [
  { key: 'professionalism', label: 'Profesionalismo', icon: '👔', description: 'Presentación y comportamiento profesional' },
  { key: 'quality', label: 'Calidad del trabajo', icon: '⭐', description: 'Calidad del resultado final' },
  { key: 'punctuality', label: 'Puntualidad', icon: '⏰', description: 'Llegó y completó a tiempo' },
  { key: 'communication', label: 'Comunicación', icon: '💬', description: 'Claridad y disponibilidad' },
  { key: 'value', label: 'Relación calidad-precio', icon: '💰', description: 'Valor por el dinero pagado' }
];

const MAX_TITLE_LENGTH = 100;
const MAX_COMMENT_LENGTH = 1000;
const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

// Icons
const Icons = {
  Close: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Camera: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Trash: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Check: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Sparkles: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
};

function ReviewForm({ 
  isOpen, 
  onClose, 
  booking,
  providerName = 'el proveedor',
  onSuccess 
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Form state
  const [overall, setOverall] = useState(5);
  const [categories, setCategories] = useState({
    professionalism: 5,
    quality: 5,
    punctuality: 5,
    communication: 5,
    value: 5
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]); // { file, preview, uploading }
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setOverall(5);
      setCategories({
        professionalism: 5,
        quality: 5,
        punctuality: 5,
        communication: 5,
        value: 5
      });
      setTitle('');
      setComment('');
      setPhotos([]);
      setShowCategories(false);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Cleanup photo previews on unmount
  useEffect(() => {
    return () => {
      photos.forEach(p => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
    };
  }, [photos]);

  const handleCategoryChange = useCallback((key, value) => {
    setCategories(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePhotoSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      toast.warning(`Máximo ${MAX_PHOTOS} fotos permitidas`);
      return;
    }

    const validFiles = files.slice(0, remainingSlots).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.warning('Solo se permiten imágenes');
        return false;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        toast.warning(`${file.name} excede el límite de 5MB`);
        return false;
      }
      return true;
    });

    const newPhotos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  }, [photos.length, toast]);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => {
      const updated = [...prev];
      if (updated[index]?.preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const handleSubmit = async () => {
    // Validaciones
    if (overall < 1) {
      toast.warning('Selecciona una calificación general');
      return;
    }
    if (!comment.trim()) {
      toast.warning('Por favor escribe un comentario');
      return;
    }
    if (comment.trim().length < 10) {
      toast.warning('El comentario debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 1. Subir fotos si hay
      let uploadedPhotos = [];
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(p => formData.append('files', p.file));
        
        try {
          const uploadRes = await api.post('/uploads/files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const files = uploadRes?.data?.data?.files || uploadRes?.data?.files || [];
          uploadedPhotos = files.map(f => ({
            url: f.secureUrl || f.url,
            cloudinaryId: f.cloudinaryId || f.public_id
          })).filter(p => p.url);
        } catch (uploadErr) {
          console.warn('Photo upload failed:', uploadErr);
          // Continuar sin fotos
        }
      }

      // 2. Crear review
      const payload = {
        overall: Number(overall),
        categories: {
          professionalism: Number(categories.professionalism),
          quality: Number(categories.quality),
          punctuality: Number(categories.punctuality),
          communication: Number(categories.communication),
          value: Number(categories.value)
        },
        title: title.trim(),
        comment: comment.trim(),
        photos: uploadedPhotos
      };

      // Intentar con la ruta correcta (puede variar según el backend)
      let response;
      try {
        response = await api.post(`/reviews/booking/${booking._id}`, payload);
      } catch {
        // Fallback a ruta alternativa
        response = await api.post(`/bookings/${booking._id}/reviews`, payload);
      }

      if (response?.data?.success) {
        toast.success('¡Gracias por tu reseña!');
        onSuccess?.(response.data.data?.review);
        onClose();
      } else {
        throw new Error(response?.data?.message || 'Error desconocido');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'No se pudo crear la reseña';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const averageCategory = Object.values(categories).reduce((a, b) => a + b, 0) / Object.values(categories).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-modal-enter"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-linear-to-br from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMjBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <Icons.Close className="w-5 h-5" />
            </button>

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Icons.Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Deja tu reseña</h2>
                <p className="text-amber-100 text-sm">Comparte tu experiencia con {providerName}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Overall Rating */}
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">¿Cómo fue tu experiencia?</h3>
              <div className="flex justify-center">
                <StarRating
                  value={overall}
                  onChange={setOverall}
                  size="2xl"
                  gap="md"
                  animated
                />
              </div>
              <p className="text-sm text-gray-500">
                {overall === 5 ? '¡Excelente! 🌟' : 
                 overall === 4 ? 'Muy bien 👍' :
                 overall === 3 ? 'Regular 😐' :
                 overall === 2 ? 'Podría mejorar 😕' :
                 overall === 1 ? 'Malo 😞' : 'Selecciona una calificación'}
              </p>
            </div>

            {/* Category Ratings Toggle */}
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCategories(!showCategories)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <span className="font-medium text-gray-900">Calificar por categoría</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Opcional</span>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${showCategories ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCategories && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  {CATEGORIES.map(cat => (
                    <div 
                      key={cat.key}
                      className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{cat.label}</span>
                          <p className="text-xs text-gray-500">{cat.description}</p>
                        </div>
                      </div>
                      <StarRating
                        value={categories[cat.key]}
                        onChange={(val) => handleCategoryChange(cat.key, val)}
                        size="sm"
                        gap="xs"
                        animated
                      />
                    </div>
                  ))}
                  
                  {/* Average category score */}
                  <div className="flex items-center justify-end gap-2 pt-2 text-sm text-gray-500">
                    <span>Promedio de categorías:</span>
                    <span className="font-semibold text-amber-600">{averageCategory.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Título (opcional)</span>
                <span className="text-xs text-gray-400">{title.length}/{MAX_TITLE_LENGTH}</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="Ej: Excelente servicio, muy profesional"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white transition-all"
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tu comentario *</span>
                <span className={`text-xs ${comment.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                placeholder="Cuéntanos tu experiencia con el servicio..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white transition-all resize-none"
              />
              {comment.length < 10 && comment.length > 0 && (
                <p className="text-xs text-amber-600">Mínimo 10 caracteres</p>
              )}
            </div>

            {/* Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Fotos (opcional)</label>
                <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Photo previews */}
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`Foto ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add photo button */}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-500 transition-all"
                  >
                    <Icons.Camera className="w-6 h-6" />
                    <span className="text-[10px]">Agregar</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-400">Máximo 5 fotos de hasta 5MB cada una</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !comment.trim() || overall < 1}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Enviando...
                </>
              ) : (
                <>
                  <Icons.Check className="w-5 h-5" />
                  Publicar reseña
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

ReviewForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  booking: PropTypes.object,
  providerName: PropTypes.string,
  onSuccess: PropTypes.func
};

export default memo(ReviewForm);

import { useState, useCallback, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import Button from './Button.jsx';
import Spinner from './Spinner.jsx';
import { useToast } from './Toast.jsx';
import api from '@/state/apiClient.js';
import StarRating from './StarRating.jsx';

/**
 * ReviewResponseModal - Modal premium para que proveedores respondan a reviews
 * Features:
 * - Vista previa de la review original
 * - Editor de respuesta con contador de caracteres
 * - Edición y eliminación de respuestas existentes
 * - Validaciones y feedback visual
 */

const MAX_RESPONSE_LENGTH = 800;
const MIN_RESPONSE_LENGTH = 10;

// Icons
const Icons = {
  Close: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Reply: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Edit: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
  Star: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  Warning: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

// Formato de fecha relativa
const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

function ReviewResponseModal({
  isOpen,
  onClose,
  review,
  onSuccess
}) {
  const toast = useToast();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasExistingResponse = !!review?.providerResponse?.comment;
  const existingResponse = review?.providerResponse?.comment || '';

  // Initialize/reset form when review changes or modal opens
  useEffect(() => {
    if (isOpen && review) {
      if (hasExistingResponse) {
        setResponse(existingResponse);
        setIsEditing(false);
      } else {
        setResponse('');
        setIsEditing(true);
      }
      setShowDeleteConfirm(false);
    }
  }, [isOpen, review, hasExistingResponse, existingResponse]);

  const handleClose = useCallback(() => {
    setResponse('');
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (response.length < MIN_RESPONSE_LENGTH) {
      toast.error(`La respuesta debe tener al menos ${MIN_RESPONSE_LENGTH} caracteres`);
      return;
    }

    if (response.length > MAX_RESPONSE_LENGTH) {
      toast.error(`La respuesta no puede exceder ${MAX_RESPONSE_LENGTH} caracteres`);
      return;
    }

    setLoading(true);
    try {
      const endpoint = hasExistingResponse
        ? `/reviews/${review._id}/response`
        : `/reviews/${review._id}/response`;
      
      const method = hasExistingResponse ? 'patch' : 'put';
      
      await api[method](endpoint, { comment: response });
      
      toast.success(hasExistingResponse ? 'Respuesta actualizada' : 'Respuesta enviada');
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al enviar respuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review._id}/response`);
      toast.success('Respuesta eliminada');
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al eliminar respuesta');
    } finally {
      setDeleting(false);
    }
  };

  const charactersLeft = MAX_RESPONSE_LENGTH - response.length;
  const isValidLength = response.length >= MIN_RESPONSE_LENGTH && response.length <= MAX_RESPONSE_LENGTH;

  if (!isOpen || !review) return null;

  const clientName = review?.client?.profile?.firstName || 'Cliente';
  const clientInitial = clientName.charAt(0).toUpperCase();
  const overall = review?.rating?.overall || 0;
  const title = review?.review?.title;
  const comment = review?.review?.comment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-brand-500 via-brand-600 to-cyan-600 p-6 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icons.Reply className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {hasExistingResponse ? 'Tu respuesta' : 'Responder reseña'}
                </h2>
                <p className="text-brand-100 text-sm">
                  {hasExistingResponse 
                    ? 'Gestiona tu respuesta a esta reseña'
                    : 'Responde de forma profesional a esta reseña'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icons.Close />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Original Review Preview */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-brand-500/20">
                {clientInitial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{clientName}</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-full">
                    <Icons.Star className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">{overall}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatRelativeDate(review.createdAt)}</span>
              </div>
            </div>
            
            {title && (
              <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
            )}
            <p className="text-gray-600 text-sm">{comment}</p>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Icons.Warning className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">¿Eliminar tu respuesta?</h4>
                  <p className="text-sm text-red-700">Esta acción no se puede deshacer. El cliente será notificado.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={deleting}
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          ) : hasExistingResponse && !isEditing ? (
            /* View existing response */
            <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Icons.Reply className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">Tu respuesta</span>
                    {review.providerResponse.respondedAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatRelativeDate(review.providerResponse.respondedAt)}
                        {review.providerResponse.editedAt && ' (editada)'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-brand-100 rounded-lg text-brand-600 transition-colors"
                    title="Editar respuesta"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                    title="Eliminar respuesta"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{existingResponse}</p>
            </div>
          ) : (
            /* Response Editor */
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 block">
                  {hasExistingResponse ? 'Editar respuesta' : 'Escribe tu respuesta'}
                </span>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Agradece el feedback, aborda los puntos mencionados y muestra tu profesionalismo..."
                  rows={5}
                  maxLength={MAX_RESPONSE_LENGTH}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-shadow text-sm"
                />
              </label>
              
              {/* Character counter */}
              <div className="flex items-center justify-between text-xs">
                <span className={`${charactersLeft < 50 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {charactersLeft} caracteres restantes
                </span>
                {response.length > 0 && response.length < MIN_RESPONSE_LENGTH && (
                  <span className="text-red-500">
                    Mínimo {MIN_RESPONSE_LENGTH} caracteres
                  </span>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h5 className="font-medium text-blue-900 text-sm mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Consejos para una buena respuesta
                </h5>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Agradece siempre el tiempo del cliente</li>
                  <li>• Sé profesional incluso ante críticas</li>
                  <li>• Ofrece soluciones si hubo algún problema</li>
                  <li>• Mantén un tono cordial y constructivo</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(isEditing || !hasExistingResponse) && !showDeleteConfirm && (
          <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!isValidLength}
              className="bg-linear-to-r from-brand-500 to-cyan-500 text-white"
            >
              <Icons.Check className="w-4 h-4 mr-2" />
              {hasExistingResponse ? 'Guardar cambios' : 'Enviar respuesta'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

ReviewResponseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  review: PropTypes.object,
  onSuccess: PropTypes.func
};

export default memo(ReviewResponseModal);

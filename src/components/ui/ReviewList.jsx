import { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating.jsx';
import Spinner from './Spinner.jsx';
import api from '@/state/apiClient.js';

/**
 * ReviewList Component - Lista de reseñas con diseño premium
 * Features:
 * - Paginación
 * - Filtros por rating
 * - Estadísticas visuales
 * - Respuestas del proveedor
 * - Lightbox para fotos
 */

const Icons = {
  ThumbUp: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  ),
  Verified: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  ),
  ChevronLeft: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Close: ({ className = 'w-6 h-6' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Reply: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Empty: ({ className = 'w-16 h-16' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Rating Bar Component
const RatingBar = memo(({ stars, count, total, onClick, isActive }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-all hover:bg-gray-100 ${isActive ? 'bg-amber-50 ring-1 ring-amber-200' : ''}`}
    >
      <span className="text-sm font-medium text-gray-600 w-3">{stars}</span>
      <StarRating value={1} max={1} size="sm" readonly />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
    </button>
  );
});

RatingBar.displayName = 'RatingBar';

RatingBar.propTypes = {
  stars: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onClick: PropTypes.func,
  isActive: PropTypes.bool
};

// Single Review Card
const ReviewCard = memo(({ review, onPhotoClick }) => {
  const clientName = review?.client?.profile?.firstName || 'Cliente';
  const clientInitial = clientName.charAt(0).toUpperCase();
  const overall = review?.rating?.overall || 0;
  const title = review?.review?.title;
  const comment = review?.review?.comment;
  const photos = review?.review?.photos || [];
  const providerResponse = review?.providerResponse;
  const createdAt = review?.createdAt;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-brand-500/20">
              {clientInitial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{clientName}</span>
                <Icons.Verified className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating value={overall} size="sm" readonly />
                <span className="text-xs text-gray-500">{formatRelativeDate(createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        {title && (
          <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        )}

        {/* Comment */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{comment}</p>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {photos.slice(0, 4).map((photo, idx) => (
              <button
                key={idx}
                onClick={() => onPhotoClick?.(photos, idx)}
                className="relative w-16 h-16 rounded-lg overflow-hidden group"
              >
                <img
                  src={photo.url}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                {idx === 3 && photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">
                    +{photos.length - 4}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Helpful button */}
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
          <Icons.ThumbUp />
          <span>Útil</span>
        </button>
      </div>

      {/* Provider Response */}
      {providerResponse?.comment && (
        <div className="bg-gray-50 border-t border-gray-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
              <Icons.Reply className="w-4 h-4 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 text-sm">Respuesta del profesional</span>
                {providerResponse.respondedAt && (
                  <span className="text-xs text-gray-400">
                    {formatRelativeDate(providerResponse.respondedAt)}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm">{providerResponse.comment}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ReviewCard.displayName = 'ReviewCard';

ReviewCard.propTypes = {
  review: PropTypes.object.isRequired,
  onPhotoClick: PropTypes.func
};

// Photo Lightbox
const PhotoLightbox = memo(({ isOpen, photos, currentIndex, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !photos?.length) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
      >
        <Icons.Close />
      </button>

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <Icons.ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <Icons.ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={photos[currentIndex]?.url}
        alt={`Foto ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      {/* Counter */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/10 rounded-full text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
});

PhotoLightbox.displayName = 'PhotoLightbox';

PhotoLightbox.propTypes = {
  isOpen: PropTypes.bool,
  photos: PropTypes.array,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func,
  onPrev: PropTypes.func,
  onNext: PropTypes.func
};

// Main Component
function ReviewList({ providerId, initialStats, compact = false, className = '' }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(initialStats || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState(null);
  
  // Lightbox state
  const [lightbox, setLightbox] = useState({ open: false, photos: [], index: 0 });

  const loadReviews = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', compact ? 3 : 10);
      if (filterRating) params.set('rating', filterRating);

      const { data } = await api.get(`/reviews/provider/${providerId}?${params.toString()}`);
      
      setReviews(data?.data?.reviews || []);
      setTotalPages(data?.data?.pagination?.pages || 1);
      
      if (data?.data?.ratingStats) {
        setStats(data.data.ratingStats);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [providerId, page, filterRating, compact]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleRatingFilter = (rating) => {
    setFilterRating(filterRating === rating ? null : rating);
    setPage(1);
  };

  const openLightbox = (photos, startIndex) => {
    setLightbox({ open: true, photos, index: startIndex });
  };

  const closeLightbox = () => {
    setLightbox({ open: false, photos: [], index: 0 });
  };

  const prevPhoto = () => {
    setLightbox(prev => ({
      ...prev,
      index: (prev.index - 1 + prev.photos.length) % prev.photos.length
    }));
  };

  const nextPhoto = () => {
    setLightbox(prev => ({
      ...prev,
      index: (prev.index + 1) % prev.photos.length
    }));
  };

  const averageRating = stats?.averageRating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const breakdown = stats?.breakdown || {};

  if (!providerId) return null;

  return (
    <div className={className}>
      {/* Stats Section */}
      {!compact && stats && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Overall Score */}
          <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-600 mb-1">
                  {averageRating.toFixed(1)}
                </div>
                <StarRating value={averageRating} size="md" readonly />
                <div className="text-sm text-gray-500 mt-2">
                  {totalReviews.toLocaleString()} reseña{totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(stars => (
                  <RatingBar
                    key={stars}
                    stars={stars}
                    count={breakdown[stars] || 0}
                    total={totalReviews}
                    onClick={() => handleRatingFilter(stars)}
                    isActive={filterRating === stars}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {stats?.categories && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4">Por categoría</h4>
              <div className="space-y-3">
                {[
                  { key: 'professionalism', label: 'Profesionalismo', icon: '👔' },
                  { key: 'quality', label: 'Calidad', icon: '⭐' },
                  { key: 'punctuality', label: 'Puntualidad', icon: '⏰' },
                  { key: 'communication', label: 'Comunicación', icon: '💬' },
                  { key: 'value', label: 'Valor', icon: '💰' }
                ].map(cat => {
                  const value = stats.categories[cat.key] || 0;
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className="text-lg w-6">{cat.icon}</span>
                      <span className="text-sm text-gray-600 flex-1">{cat.label}</span>
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-linear-to-r from-brand-400 to-cyan-400 rounded-full"
                          style={{ width: `${(value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8">{value.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter indicator */}
      {filterRating && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Filtrando por:</span>
          <button
            onClick={() => handleRatingFilter(null)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors"
          >
            {filterRating} estrellas
            <Icons.Close className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Icons.Empty className="w-10 h-10 text-gray-300" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Sin reseñas aún</h4>
          <p className="text-sm text-gray-500 max-w-xs">
            {filterRating 
              ? `No hay reseñas de ${filterRating} estrellas`
              : 'Este profesional aún no ha recibido reseñas'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard 
              key={review._id} 
              review={review}
              onPhotoClick={openLightbox}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!compact && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icons.ChevronLeft />
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icons.ChevronRight />
          </button>
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        isOpen={lightbox.open}
        photos={lightbox.photos}
        currentIndex={lightbox.index}
        onClose={closeLightbox}
        onPrev={prevPhoto}
        onNext={nextPhoto}
      />
    </div>
  );
}

ReviewList.propTypes = {
  providerId: PropTypes.string.isRequired,
  initialStats: PropTypes.object,
  compact: PropTypes.bool,
  className: PropTypes.string
};

export default memo(ReviewList);

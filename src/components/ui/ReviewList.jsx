import { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import StarRating from './StarRating.jsx';
import Spinner from './Spinner.jsx';
import api from '@/state/apiClient.js';
import { useToast } from './Toast.jsx';
import ReviewResponseModal from './ReviewResponseModal.jsx';
import { getTranslatedReviewInfo, useCurrentLanguage } from '@/utils/translations.js';

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
  ThumbDown: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
  ),
  Flag: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  Calendar: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Filter: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  SortDesc: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  ),
  Empty: ({ className = 'w-16 h-16' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
};

// Formato de fecha relativa - will be replaced by function using t
const formatRelativeDate = (dateStr, t) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t('ui.reviewList.today');
  if (diffDays === 1) return t('ui.reviewList.yesterday');
  if (diffDays < 7) return t('ui.reviewList.daysAgo', { count: diffDays });
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return t('ui.reviewList.weeksAgo', { count: weeks });
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return t('ui.reviewList.monthsAgo', { count: months });
  }
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
const ReviewCard = memo(({ 
  review, 
  onPhotoClick, 
  onHelpful, 
  onNotHelpful, 
  onReport, 
  onRespond,
  isProvider = false,
  helpfulLoading = false,
  userVote = null, // 'helpful' | 'notHelpful' | null
  t, // Translation function passed from parent
  currentLang // Current language for translations
}) => {
  const clientName = review?.client?.profile?.firstName || t('ui.reviewList.client');
  const clientInitial = clientName.charAt(0).toUpperCase();
  const overall = review?.rating?.overall || 0;
  // Obtener campos traducidos
  const translatedReview = getTranslatedReviewInfo(review, currentLang);
  const title = translatedReview.title;
  const comment = translatedReview.comment;
  const photos = review?.review?.photos || [];
  const providerResponse = review?.providerResponse;
  // Usar respuesta traducida si existe
  const translatedProviderComment = translatedReview.providerResponseComment;
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
                <span className="text-xs text-gray-500">{formatRelativeDate(createdAt, t)}</span>
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
                  alt={t('ui.reviewList.photo', { number: idx + 1 })}
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

        {/* Helpful/Not Helpful & Actions */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {/* Helpful */}
            <button 
              onClick={() => onHelpful?.(review._id)}
              disabled={helpfulLoading}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                userVote === 'helpful'
                  ? 'text-emerald-600 font-medium'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              <Icons.ThumbUp className={userVote === 'helpful' ? 'fill-current' : ''} />
              <span>{t('ui.reviewList.helpful')}</span>
              {(review?.helpfulness?.helpful > 0) && (
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {review.helpfulness.helpful}
                </span>
              )}
            </button>
            
            {/* Not Helpful */}
            <button 
              onClick={() => onNotHelpful?.(review._id)}
              disabled={helpfulLoading}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                userVote === 'notHelpful'
                  ? 'text-red-500 font-medium'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Icons.ThumbDown className={userVote === 'notHelpful' ? 'fill-current' : ''} />
            </button>

            {/* Report */}
            <button 
              onClick={() => onReport?.(review)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors ml-2"
              title={t('ui.reviewList.reportAsInappropriate')}
            >
              <Icons.Flag />
            </button>
          </div>

          {/* Provider respond button */}
          {isProvider && !review?.providerResponse?.comment && (
            <button 
              onClick={() => onRespond?.(review)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              <Icons.Reply />
              <span>{t('ui.reviewList.respond')}</span>
            </button>
          )}
        </div>
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
                <span className="font-semibold text-gray-900 text-sm">{t('ui.reviewList.providerResponse')}</span>
                {providerResponse.respondedAt && (
                  <span className="text-xs text-gray-400">
                    {formatRelativeDate(providerResponse.respondedAt, t)}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm">{translatedProviderComment}</p>
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
  onPhotoClick: PropTypes.func,
  onHelpful: PropTypes.func,
  onNotHelpful: PropTypes.func,
  onReport: PropTypes.func,
  onRespond: PropTypes.func,
  isProvider: PropTypes.bool,
  helpfulLoading: PropTypes.bool,
  userVote: PropTypes.string,
  t: PropTypes.func.isRequired
};

// Photo Lightbox
const PhotoLightbox = memo(({ isOpen, photos, currentIndex, onClose, onPrev, onNext }) => {
  const { t } = useTranslation();
  
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
        alt={t('ui.reviewList.photo', { number: currentIndex + 1 })}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      {/* Counter */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/10 rounded-full text-white text-sm">
          {t('ui.reviewList.photoCounter', { current: currentIndex + 1, total: photos.length })}
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

// Sort options - labels will be translated in component
const SORT_OPTIONS = [
  { value: 'recent', labelKey: 'recent' },
  { value: 'oldest', labelKey: 'oldest' },
  { value: 'highest', labelKey: 'highest' },
  { value: 'lowest', labelKey: 'lowest' },
  { value: 'helpful', labelKey: 'helpful' }
];

// Date filter options - labels will be translated in component
const DATE_FILTER_OPTIONS = [
  { value: '', labelKey: 'allDates' },
  { value: 'week', labelKey: 'lastWeek' },
  { value: 'month', labelKey: 'lastMonth' },
  { value: 'quarter', labelKey: 'lastQuarter' },
  { value: 'year', labelKey: 'lastYear' }
];

// Main Component
function ReviewList({ 
  providerId, 
  initialStats, 
  compact = false, 
  className = '',
  isProvider = false,
  onReviewUpdate
}) {
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage(); // Hook reactivo al cambio de idioma
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(initialStats || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState(null);
  
  // Advanced filters
  const [sortBy, setSortBy] = useState('recent');
  const [dateFilter, setDateFilter] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Helpful/Not Helpful state
  const [userVotes, setUserVotes] = useState({}); // { reviewId: 'helpful' | 'notHelpful' }
  const [helpfulLoading, setHelpfulLoading] = useState(null);
  
  // Response modal state
  const [responseModal, setResponseModal] = useState({ open: false, review: null });
  
  // Report modal state
  const [reportModal, setReportModal] = useState({ open: false, review: null });
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  
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
      if (sortBy) params.set('sort', sortBy);
      if (dateFilter) params.set('dateFilter', dateFilter);
      if (onlyVerified) params.set('verified', 'true');
      if (onlyWithPhotos) params.set('withPhotos', 'true');

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
  }, [providerId, page, filterRating, sortBy, dateFilter, onlyVerified, onlyWithPhotos, compact]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleRatingFilter = (rating) => {
    setFilterRating(filterRating === rating ? null : rating);
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterRating(null);
    setSortBy('recent');
    setDateFilter('');
    setOnlyVerified(false);
    setOnlyWithPhotos(false);
    setPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = filterRating || sortBy !== 'recent' || dateFilter || onlyVerified || onlyWithPhotos;

  // Helpful/Not Helpful handlers
  const handleHelpful = async (reviewId) => {
    if (helpfulLoading) return;
    setHelpfulLoading(reviewId);
    
    try {
      const currentVote = userVotes[reviewId];
      const newVote = currentVote === 'helpful' ? null : 'helpful';
      
      // Optimistic update
      setUserVotes(prev => ({ ...prev, [reviewId]: newVote }));
      
      await api.post(`/reviews/${reviewId}/helpful`, { action: newVote ? 'helpful' : 'remove' });
      
      // Update review helpfulness count locally
      setReviews(prev => prev.map(r => {
        if (r._id === reviewId) {
          const delta = newVote ? 1 : -1;
          return {
            ...r,
            helpfulness: {
              ...r.helpfulness,
              helpful: Math.max(0, (r.helpfulness?.helpful || 0) + delta)
            }
          };
        }
        return r;
      }));
    } catch (err) {
      toast.error(t('ui.reviewList.voteError'));
      // Revert on error
      setUserVotes(prev => ({ ...prev, [reviewId]: userVotes[reviewId] }));
    } finally {
      setHelpfulLoading(null);
    }
  };

  const handleNotHelpful = async (reviewId) => {
    if (helpfulLoading) return;
    setHelpfulLoading(reviewId);
    
    try {
      const currentVote = userVotes[reviewId];
      const newVote = currentVote === 'notHelpful' ? null : 'notHelpful';
      
      // Optimistic update
      setUserVotes(prev => ({ ...prev, [reviewId]: newVote }));
      
      await api.post(`/reviews/${reviewId}/helpful`, { action: newVote ? 'notHelpful' : 'remove' });
      
      // Update review helpfulness count locally
      setReviews(prev => prev.map(r => {
        if (r._id === reviewId) {
          const delta = newVote ? 1 : -1;
          return {
            ...r,
            helpfulness: {
              ...r.helpfulness,
              notHelpful: Math.max(0, (r.helpfulness?.notHelpful || 0) + delta)
            }
          };
        }
        return r;
      }));
    } catch (err) {
      toast.error(t('ui.reviewList.voteError'));
      // Revert on error
      setUserVotes(prev => ({ ...prev, [reviewId]: userVotes[reviewId] }));
    } finally {
      setHelpfulLoading(null);
    }
  };

  // Report handler
  const handleReport = (review) => {
    setReportModal({ open: true, review });
    setReportReason('');
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.error(t('ui.reviewList.reportReasonRequired'));
      return;
    }
    
    setReportLoading(true);
    try {
      await api.put(`/reviews/${reportModal.review._id}/report`, { reason: reportReason });
      toast.success(t('ui.reviewList.reportSent'));
      setReportModal({ open: false, review: null });
    } catch (err) {
      toast.error(err?.response?.data?.message || t('ui.reviewList.reportError'));
    } finally {
      setReportLoading(false);
    }
  };

  // Response handler
  const handleRespond = (review) => {
    setResponseModal({ open: true, review });
  };

  const handleResponseSuccess = () => {
    loadReviews();
    onReviewUpdate?.();
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
                  {t('ui.reviewList.reviewCount', { count: totalReviews })}
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
              <h4 className="font-semibold text-gray-900 mb-4">{t('ui.reviewList.byCategory')}</h4>
              <div className="space-y-3">
                {[
                  { key: 'professionalism', labelKey: 'professionalism', icon: '👔' },
                  { key: 'quality', labelKey: 'quality', icon: '⭐' },
                  { key: 'punctuality', labelKey: 'punctuality', icon: '⏰' },
                  { key: 'communication', labelKey: 'communication', icon: '💬' },
                  { key: 'value', labelKey: 'value', icon: '💰' }
                ].map(cat => {
                  const value = stats.categories[cat.key] || 0;
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className="text-lg w-6">{cat.icon}</span>
                      <span className="text-sm text-gray-600 flex-1">{t(`ui.reviewList.categories.${cat.labelKey}`)}</span>
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

      {/* Advanced Filters Bar */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icons.Filter />
            {t('ui.reviewList.filters')}
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            )}
          </button>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{t(`ui.reviewList.sortOptions.${opt.labelKey}`)}</option>
            ))}
          </select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {t('ui.reviewList.clearFilters')}
            </button>
          )}
        </div>
      )}

      {/* Expanded filters panel */}
      {!compact && showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 animate-fade-in">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Date filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('ui.reviewList.period')}</label>
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {DATE_FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(`ui.reviewList.dateOptions.${opt.labelKey}`)}</option>
                ))}
              </select>
            </div>

            {/* Rating filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('ui.reviewList.rating')}</label>
              <select
                value={filterRating || ''}
                onChange={(e) => { setFilterRating(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">{t('ui.reviewList.allRatings')}</option>
                <option value="5">{t('ui.reviewList.stars', { count: 5 })}</option>
                <option value="4">{t('ui.reviewList.stars', { count: 4 })}</option>
                <option value="3">{t('ui.reviewList.stars', { count: 3 })}</option>
                <option value="2">{t('ui.reviewList.stars', { count: 2 })}</option>
                <option value="1">{t('ui.reviewList.star')}</option>
              </select>
            </div>

            {/* Verified only */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => { setOnlyVerified(e.target.checked); setPage(1); }}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">{t('ui.reviewList.onlyVerified')}</span>
              </label>
            </div>

            {/* With photos only */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyWithPhotos}
                  onChange={(e) => { setOnlyWithPhotos(e.target.checked); setPage(1); }}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">{t('ui.reviewList.withPhotos')}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active filters chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">{t('ui.reviewList.activeFilters')}:</span>
          
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors"
            >
              {filterRating === 1 ? t('ui.reviewList.star') : t('ui.reviewList.stars', { count: filterRating })}
              <Icons.Close className="w-3 h-3" />
            </button>
          )}
          
          {sortBy !== 'recent' && (
            <button
              onClick={() => setSortBy('recent')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              {t(`ui.reviewList.sortOptions.${SORT_OPTIONS.find(o => o.value === sortBy)?.labelKey}`)}
              <Icons.Close className="w-3 h-3" />
            </button>
          )}
          
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              {t(`ui.reviewList.dateOptions.${DATE_FILTER_OPTIONS.find(o => o.value === dateFilter)?.labelKey}`)}
              <Icons.Close className="w-3 h-3" />
            </button>
          )}
          
          {onlyVerified && (
            <button
              onClick={() => setOnlyVerified(false)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium hover:bg-emerald-200 transition-colors"
            >
              {t('ui.reviewList.verified')}
              <Icons.Close className="w-3 h-3" />
            </button>
          )}
          
          {onlyWithPhotos && (
            <button
              onClick={() => setOnlyWithPhotos(false)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium hover:bg-pink-200 transition-colors"
            >
              {t('ui.reviewList.withPhotos')}
              <Icons.Close className="w-3 h-3" />
            </button>
          )}
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
          <h4 className="text-lg font-semibold text-gray-900 mb-1">{t('ui.reviewList.noReviewsYet')}</h4>
          <p className="text-sm text-gray-500 max-w-xs">
            {hasActiveFilters
              ? t('ui.reviewList.noMatchingReviews')
              : t('ui.reviewList.providerNoReviews')}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {t('ui.reviewList.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard 
              key={review._id} 
              review={review}
              onPhotoClick={openLightbox}
              onHelpful={handleHelpful}
              onNotHelpful={handleNotHelpful}
              onReport={handleReport}
              onRespond={handleRespond}
              isProvider={isProvider}
              helpfulLoading={helpfulLoading === review._id}
              userVote={userVotes[review._id]}
              t={t}
              currentLang={currentLang}
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
            {t('ui.reviewList.pagination', { page, totalPages })}
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

      {/* Response Modal (for providers) */}
      <ReviewResponseModal
        isOpen={responseModal.open}
        onClose={() => setResponseModal({ open: false, review: null })}
        review={responseModal.review}
        onSuccess={handleResponseSuccess}
      />

      {/* Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReportModal({ open: false, review: null })}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Icons.Flag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{t('ui.reviewList.reportReview')}</h3>
                  <p className="text-sm text-gray-500">{t('ui.reviewList.indicateReason')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ui.reviewList.reportReason')}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="">{t('ui.reviewList.selectReason')}</option>
                  <option value="spam">{t('ui.reviewList.reportReasons.spam')}</option>
                  <option value="fake">{t('ui.reviewList.reportReasons.fake')}</option>
                  <option value="offensive">{t('ui.reviewList.reportReasons.offensive')}</option>
                  <option value="irrelevant">{t('ui.reviewList.reportReasons.irrelevant')}</option>
                  <option value="personal">{t('ui.reviewList.reportReasons.personal')}</option>
                  <option value="other">{t('ui.reviewList.reportReasons.other')}</option>
                </select>
              </div>
              
              {reportReason === 'other' && (
                <textarea
                  placeholder={t('ui.reviewList.describeReason')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                  rows={3}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setReportModal({ open: false, review: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('ui.reviewList.cancel')}
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {reportLoading ? t('ui.reviewList.sending') : t('ui.reviewList.sendReport')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReviewList.propTypes = {
  providerId: PropTypes.string.isRequired,
  initialStats: PropTypes.object,
  compact: PropTypes.bool,
  className: PropTypes.string,
  isProvider: PropTypes.bool,
  onReviewUpdate: PropTypes.func
};

export default memo(ReviewList);

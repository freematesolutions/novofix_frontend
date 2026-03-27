// components/ui/ReviewNudgeBanner.jsx
// Banner animado que sugiere al cliente calificar servicios completados sin reseña.
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';

/**
 * Props:
 *  - onReviewClick(bookingId): abre el formulario de reseña para ese booking
 */
export default function ReviewNudgeBanner({ onReviewClick }) {
  const { t } = useTranslation();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const until = localStorage.getItem('reviewNudgeDismissedUntil');
      return until && Date.now() < Number(until);
    } catch { return false; }
  });
  const [loading, setLoading] = useState(true);

  const dismiss = () => {
    setDismissed(true);
    try {
      // Dismiss for 24 hours
      localStorage.setItem('reviewNudgeDismissedUntil', String(Date.now() + 24 * 60 * 60 * 1000));
    } catch { /* ignore */ }
  };

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await api.get('/reviews/pending');
      setPendingReviews(data?.data?.pendingReviews || []);
    } catch {
      // silently ignore — banner is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  if (loading || dismissed || pendingReviews.length === 0) return null;

  const first = pendingReviews[0];
  const count = pendingReviews.length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-yellow-50 via-amber-50 to-yellow-50 border border-amber-200/60 p-4 sm:p-5 shadow-sm">
      {/* Decorative star sparkles */}
      <div className="absolute top-2 right-4 text-amber-300/40 text-2xl pointer-events-none select-none animate-pulse">✦</div>
      <div className="absolute bottom-1 right-12 text-amber-200/30 text-lg pointer-events-none select-none animate-pulse delay-300">✧</div>

      <div className="relative flex items-start gap-3">
        {/* Star icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            {count === 1
              ? t('shared.bookings.reviewNudge.titleSingle', { provider: first.providerName })
              : t('shared.bookings.reviewNudge.titleMultiple', { count })}
          </p>
          <p className="text-xs text-amber-700/80 mt-0.5">
            {t('shared.bookings.reviewNudge.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { if (onReviewClick) onReviewClick(first.bookingId); }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
          >
            {t('shared.bookings.reviewNudge.cta')}
          </button>
          <button
            onClick={dismiss}
            className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

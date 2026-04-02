// pages/client/MyReviews.jsx
// Página "Mis Reseñas" — muestra todas las reseñas que el cliente ha enviado.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import { ReviewSkeleton } from '@/components/ui/SkeletonLoader.jsx';
import { useAuth } from '@/state/AuthContext.jsx';

const StarIcon = ({ filled }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= rating} />)}
  </div>
);

const fmtDate = (d, lang) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export default function MyReviews() {
  const { t, i18n } = useTranslation();
  const { viewRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/reviews/my-reviews?page=${page}&limit=20`);
      setReviews(data?.data?.reviews || []);
      setPagination(data?.data?.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || t('client.myReviews.errorLoading'));
    } finally { setLoading(false); }
  }, [page, t]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/', { replace: true }); return; }
    load();
  }, [isAuthenticated, load, navigate]);

  if (viewRole !== 'client') {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Alert type="warning">{t('client.myReviews.clientOnly')}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/30">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 p-6 sm:p-8 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t('client.myReviews.title')}</h1>
              <p className="text-sm text-gray-300 mt-0.5">
                {t('client.myReviews.subtitle', { count: pagination.total })}
              </p>
            </div>
          </div>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* Loading */}
        {loading && (
          <ReviewSkeleton count={3} />
        )}

        {/* Empty state */}
        {!loading && reviews.length === 0 && (
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-brand-200 shadow-lg p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-brand-50/50 via-transparent to-brand-50/50"></div>
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('client.myReviews.empty.title')}</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">{t('client.myReviews.empty.description')}</p>
              <button
                onClick={() => navigate('/reservas')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                {t('client.myReviews.empty.goToBookings')}
              </button>
            </div>
          </div>
        )}

        {/* Reviews list */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="p-5 sm:p-6">
                  {/* Provider + date row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {r.providerAvatar ? (
                          <img src={r.providerAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{r.providerName}</p>
                        <p className="text-xs text-gray-400">{fmtDate(r.scheduledDate, i18n.language)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-gray-400">{fmtDate(r.createdAt, i18n.language)}</span>
                    </div>
                  </div>

                  {/* Title + comment */}
                  {r.title && <p className="font-medium text-gray-800 text-sm mb-1">{r.title}</p>}
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}

                  {/* Photos */}
                  {r.photos?.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {r.photos.map((p, i) => (
                        <img key={i} src={p.url || p} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-100" />
                      ))}
                    </div>
                  )}

                  {/* Provider response */}
                  {r.providerResponse && (
                    <div className="mt-4 p-3 bg-brand-50/50 rounded-xl border border-brand-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-xs font-semibold text-brand-700">{t('client.myReviews.providerResponse')}</span>
                        {r.providerRespondedAt && (
                          <span className="text-xs text-brand-400 ml-auto">{fmtDate(r.providerRespondedAt, i18n.language)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{r.providerResponse}</p>
                    </div>
                  )}

                  {/* Helpfulness */}
                  {(r.helpfulness?.helpful > 0 || r.helpfulness?.notHelpful > 0) && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-.95-.242l-3.296-1.882A2 2 0 016 17.118V13a2 2 0 01.59-1.422l4.83-4.828a1 1 0 011.414 0z" />
                        </svg>
                        {r.helpfulness.helpful}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('client.myReviews.prev')}
                </button>
                <span className="text-sm text-gray-500">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('client.myReviews.next')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

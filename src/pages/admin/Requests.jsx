import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Button from '@/components/ui/Button.jsx';
import { HiClipboardList, HiFilter, HiClock, HiCheck, HiX, HiUser, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function AdminRequests() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    if (!isAuthenticated || role !== 'admin') return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 20);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/service-requests?${params.toString()}`);
      const requests = data?.data?.requests || [];
      const pg = data?.data?.pagination;
      setItems(requests);
      setPages(pg?.pages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.requests.loadError'));
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); /* eslint-disable-line */ }, [isAuthenticated, role, page, statusFilter]);

  const getStatusInfo = (status) => {
    const info = {
      open: { label: t('admin.requests.status.open'), color: 'bg-brand-100 text-brand-700', icon: <HiClock className="w-4 h-4" /> },
      assigned: { label: t('admin.requests.status.assigned'), color: 'bg-accent-100 text-accent-700', icon: <HiUser className="w-4 h-4" /> },
      closed: { label: t('admin.requests.status.closed'), color: 'bg-brand-100 text-brand-700', icon: <HiCheck className="w-4 h-4" /> },
      cancelled: { label: t('admin.requests.status.cancelled'), color: 'bg-red-100 text-red-700', icon: <HiX className="w-4 h-4" /> },
    };
    return info[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: null };
  };

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (role !== 'admin') return <Alert type="warning">{t('admin.requests.adminOnly')}</Alert>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <HiClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">Solicitudes de Servicio</h1>
            <p className="text-gray-300 text-sm">Visualiza todas las solicitudes del sistema</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <HiFilter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{t('admin.requests.filters.status')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: t('admin.requests.filters.all') },
              { value: 'open', label: t('admin.requests.filters.open') },
              { value: 'assigned', label: t('admin.requests.filters.assigned') },
              { value: 'closed', label: t('admin.requests.filters.closed') },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  statusFilter === opt.value
                    ? 'bg-linear-to-r from-dark-600 to-dark-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12">
          <Spinner size="sm" />
          <span className="text-gray-600">{t('admin.requests.loading')}</span>
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {items.map(r => {
              const statusInfo = getStatusInfo(r.status);
              return (
                <div key={r._id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        r.status === 'open' ? 'bg-brand-100' : 
                        r.status === 'assigned' ? 'bg-accent-100' : 
                        r.status === 'closed' ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        <HiClipboardList className={`w-6 h-6 ${
                          r.status === 'open' ? 'text-brand-600' : 
                          r.status === 'assigned' ? 'text-accent-600' : 
                          r.status === 'closed' ? 'text-brand-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900">{r?.basicInfo?.title || t('admin.requests.noTitle')}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <HiUser className="w-4 h-4" />
                          <span>{t('admin.requests.client')}: {r?.client?.profile?.firstName || '—'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {t('admin.requests.created')}: {new Date(r.createdAt).toLocaleString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full shrink-0 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {!items.length && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <HiClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">{t('admin.requests.empty.title')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('admin.requests.empty.subtitle')}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiChevronLeft className="w-4 h-4" />
                  {t('admin.requests.pagination.previous')}
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  {t('admin.requests.pagination.page')} {page} {t('admin.requests.pagination.of')} {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('admin.requests.pagination.next')}
                  <HiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

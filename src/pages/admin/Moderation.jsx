import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Button from '@/components/ui/Button.jsx';
import { HiShieldCheck, HiFilter, HiCheck, HiX, HiExclamation, HiStar, HiUser, HiBriefcase, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function AdminModeration() {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('flagged');
  const [acting, setActing] = useState('');

  const load = async () => {
    if (!isAuthenticated || role !== 'admin') return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 20);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/reviews/moderation?${params.toString()}`);
      const reviews = data?.data?.reviews || [];
      const pg = data?.data?.pagination;
      setItems(reviews);
      setPages(pg?.pages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudieron cargar las reviews');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); /* eslint-disable-line */ }, [isAuthenticated, role, page, statusFilter]);

  const moderate = async (r, action) => {
    setActing(r._id);
    try {
      await api.put(`/admin/reviews/${r._id}/moderate`, { action, reason: action });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo moderar');
    } finally { setActing(''); }
  };

  const getStatusInfo = (status) => {
    const info = {
      flagged: { label: 'En Moderación', color: 'bg-amber-100 text-amber-700', icon: <HiExclamation className="w-4 h-4" /> },
      active: { label: 'Activa', color: 'bg-emerald-100 text-emerald-700', icon: <HiCheck className="w-4 h-4" /> },
      removed: { label: 'Removida', color: 'bg-red-100 text-red-700', icon: <HiX className="w-4 h-4" /> },
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

  if (role !== 'admin') return <Alert type="warning">Solo administradores.</Alert>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="overflow-hidden bg-linear-to-br from-purple-600 via-fuchsia-600 to-indigo-600 rounded-2xl p-8 text-white relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Moderación de Reseñas</h1>
              <p className="text-indigo-200 text-sm">Revisa y modera el contenido generado por usuarios</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
            <span className="text-indigo-200 text-sm">Pendientes:</span>
            <span className="text-xl font-bold">{items.filter(i => i.status === 'flagged').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <HiFilter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'Todos' },
              { value: 'flagged', label: 'En Moderación' },
              { value: 'active', label: 'Activas' },
              { value: 'removed', label: 'Removidas' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  statusFilter === opt.value
                    ? 'bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-md'
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
          <span className="text-gray-600">Cargando reseñas...</span>
        </div>
      )}

      {/* Reviews List */}
      {!loading && (
        <div className="space-y-4">
          {items.map(r => {
            const statusInfo = getStatusInfo(r.status);
            return (
              <div 
                key={r._id} 
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                  r.status === 'flagged' ? 'border-amber-200' : 'border-gray-200'
                }`}
              >
                {/* Review Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        r.status === 'flagged' ? 'bg-amber-100' : r.status === 'active' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        <HiStar className={`w-6 h-6 ${
                          r.status === 'flagged' ? 'text-amber-600' : r.status === 'active' ? 'text-emerald-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{r?.review?.title || 'Reseña sin título'}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <HiStar 
                              key={i} 
                              className={`w-4 h-4 ${i < (r?.review?.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`} 
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-1">({r?.review?.rating || 0}/5)</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-5 bg-gray-50/50">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "{r?.review?.comment || 'Sin comentario'}"
                  </p>
                </div>

                {/* Review Footer */}
                <div className="p-5 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <HiUser className="w-4 h-4" />
                        <span>Cliente: <strong className="text-gray-900">{r?.client?.profile?.firstName || '—'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <HiBriefcase className="w-4 h-4" />
                        <span>Proveedor: <strong className="text-gray-900">{r?.provider?.providerProfile?.businessName || '—'}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status !== 'active' && (
                        <button 
                          onClick={() => moderate(r, 'approve')} 
                          disabled={acting === r._id}
                          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 shadow-sm"
                        >
                          {acting === r._id ? <Spinner size="xs" /> : <HiCheck className="w-4 h-4" />}
                          Aprobar
                        </button>
                      )}
                      {r.status !== 'removed' && (
                        <button 
                          onClick={() => moderate(r, 'remove')} 
                          disabled={acting === r._id}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                        >
                          {acting === r._id ? <Spinner size="xs" /> : <HiX className="w-4 h-4" />}
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {!items.length && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <HiShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sin reseñas pendientes</h3>
              <p className="text-gray-500 text-sm">No hay contenido que requiera moderación</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <HiChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <div className="px-4 py-2 text-sm font-medium text-gray-600">
            Página {page} de {pages}
          </div>
          <button
            disabled={page >= pages}
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

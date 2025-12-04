import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { HiDocumentReport, HiRefresh, HiUserAdd, HiClipboardList, HiCheckCircle, HiCurrencyDollar, HiStar, HiBriefcase } from 'react-icons/hi';

export default function AdminReports() {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');

  const load = async () => {
    if (!isAuthenticated || role !== 'admin') return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/admin/reports?period=${period}`);
      setData(data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudieron cargar los reportes');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); /* eslint-disable-line */ }, [isAuthenticated, role, period]);

  const periodLabels = {
    week: 'Esta Semana',
    month: 'Este Mes',
    quarter: 'Este Trimestre',
    year: 'Este Año'
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
      <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiDocumentReport className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Reportes y Métricas</h1>
              <p className="text-indigo-200 text-sm">Análisis de rendimiento del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)} 
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-0 rounded-xl text-sm font-medium text-white cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="week" className="text-gray-900">Semana</option>
              <option value="month" className="text-gray-900">Mes</option>
              <option value="quarter" className="text-gray-900">Trimestre</option>
              <option value="year" className="text-gray-900">Año</option>
            </select>
            <button 
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center animate-pulse">
            <Spinner size="sm" className="text-white" />
          </div>
          <span className="text-gray-600 font-medium">Cargando reportes...</span>
        </div>
      )}

      {/* Error State */}
      {error && <Alert type="error">{error}</Alert>}

      {/* Report Content */}
      {!loading && data && (
        <>
          {/* Period Badge */}
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl">
              📊 {periodLabels[period]}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<HiUserAdd className="w-6 h-6" />}
              label="Nuevos Usuarios"
              value={data.metrics?.newUsers || 0}
              gradient="from-blue-500 to-indigo-500"
            />
            <MetricCard
              icon={<HiClipboardList className="w-6 h-6" />}
              label="Nuevas Solicitudes"
              value={data.metrics?.newServiceRequests || 0}
              gradient="from-amber-500 to-orange-500"
            />
            <MetricCard
              icon={<HiCheckCircle className="w-6 h-6" />}
              label="Reservas Completadas"
              value={data.metrics?.completedBookings || 0}
              gradient="from-emerald-500 to-teal-500"
            />
            <MetricCard
              icon={<HiCurrencyDollar className="w-6 h-6" />}
              label="Ingresos"
              value={fmtCurrency(data.metrics?.revenue)}
              gradient="from-purple-500 to-pink-500"
              isText
            />
          </div>

          {/* Provider Metrics */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                  <HiBriefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Métricas por Proveedores</h2>
                  <p className="text-sm text-gray-500">Rendimiento por plan de suscripción</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {(data.metrics?.providerMetrics || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data.metrics?.providerMetrics || []).map((m, i) => (
                    <div 
                      key={i} 
                      className="p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full capitalize">
                          {m._id || 'Sin plan'}
                        </span>
                        <span className="text-xs text-gray-500">{m.count} proveedores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <HiStar className="w-5 h-5 text-amber-400" />
                          <span className="text-xl font-bold text-gray-900">
                            {Math.round((m.avgRating || 0) * 10) / 10}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">rating promedio</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                    <HiBriefcase className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Sin datos de proveedores</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* No Data State */}
      {!loading && !error && !data && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <HiDocumentReport className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin datos disponibles</h3>
          <p className="text-gray-500 text-sm">No hay reportes para el período seleccionado</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, gradient, isText }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className={`${isText ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function fmtCurrency(v) {
  if (!v && v !== 0) return '—';
  try { return Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(v); } catch { return String(v); }
}

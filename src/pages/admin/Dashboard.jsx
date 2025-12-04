import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { HiChartBar, HiUsers, HiUserGroup, HiBriefcase, HiClipboardList, HiCalendar, HiShieldCheck, HiCurrencyDollar, HiTrendingUp, HiClock, HiCheckCircle, HiRefresh } from 'react-icons/hi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const load = async () => {
    if (!isAuthenticated || role !== 'admin') return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/dashboard');
      setData(data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo cargar el dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') return;
    load();
  }, [isAuthenticated, role]);

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="overflow-hidden bg-linear-to-br from-purple-600 via-fuchsia-600 to-indigo-600 rounded-2xl p-8 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiChartBar className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Panel de Administración</h1>
              <p className="text-indigo-200 text-sm">Vista general del sistema y métricas clave</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center animate-pulse">
            <Spinner size="sm" className="text-white" />
          </div>
          <span className="text-gray-600 font-medium">Cargando dashboard...</span>
        </div>
      )}

      {/* Error State */}
      {error && <Alert type="error">{error}</Alert>}

      {/* Dashboard Content */}
      {!loading && data && (
        <>
          {/* Overview Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={<HiUsers className="w-6 h-6" />}
              label="Total Usuarios"
              value={data.overview?.totalUsers}
              gradient="from-blue-500 to-indigo-500"
            />
            <StatCard
              icon={<HiBriefcase className="w-6 h-6" />}
              label="Proveedores"
              value={data.overview?.totalProviders}
              gradient="from-brand-500 to-cyan-500"
            />
            <StatCard
              icon={<HiUserGroup className="w-6 h-6" />}
              label="Clientes"
              value={data.overview?.totalClients}
              gradient="from-emerald-500 to-teal-500"
            />
            <StatCard
              icon={<HiClipboardList className="w-6 h-6" />}
              label="Solicitudes"
              value={data.overview?.totalServiceRequests}
              gradient="from-amber-500 to-orange-500"
            />
            <StatCard
              icon={<HiCalendar className="w-6 h-6" />}
              label="Reservas"
              value={data.overview?.totalBookings}
              gradient="from-pink-500 to-rose-500"
            />
            <StatCard
              icon={<HiShieldCheck className="w-6 h-6" />}
              label="En Moderación"
              value={data.overview?.pendingModeration}
              gradient="from-red-500 to-pink-500"
              highlight={data.overview?.pendingModeration > 0}
            />
          </div>

          {/* Revenue Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <HiCurrencyDollar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ingresos</h2>
                  <p className="text-sm text-gray-500">Resumen financiero del sistema</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <RevenueCard
                title="Mes Actual"
                total={data.revenue?.currentMonth?.total}
                commission={data.revenue?.currentMonth?.commission}
                icon={<HiTrendingUp className="w-5 h-5" />}
                gradient="from-emerald-500 to-teal-500"
              />
              <RevenueCard
                title="Mes Anterior"
                total={data.revenue?.lastMonth?.total}
                commission={data.revenue?.lastMonth?.commission}
                icon={<HiClock className="w-5 h-5" />}
                gradient="from-blue-500 to-indigo-500"
              />
              <RevenueCard
                title="Histórico Total"
                total={data.revenue?.allTime?.total}
                commission={data.revenue?.allTime?.commission}
                icon={<HiCheckCircle className="w-5 h-5" />}
                gradient="from-purple-500 to-pink-500"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <HiClock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
                    <p className="text-sm text-gray-500">Últimas reservas del sistema</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                  {data.recentActivity?.length || 0} registros
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {(data.recentActivity || []).map((b) => (
                <div key={b._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusStyle(b.status).bg}`}>
                        <HiCalendar className={`w-5 h-5 ${getStatusStyle(b.status).text}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {b?.serviceRequest?.basicInfo?.title || 'Reserva'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(b.createdAt).toLocaleString('es-AR', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${getStatusStyle(b.status).badge}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </div>
                </div>
              ))}
              {!data.recentActivity?.length && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <HiClock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Sin actividad reciente</p>
                  <p className="text-sm text-gray-400 mt-1">Las nuevas reservas aparecerán aquí</p>
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
            <HiChartBar className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin datos disponibles</h3>
          <p className="text-gray-500 text-sm">No se pudieron cargar las estadísticas del dashboard.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, gradient, highlight }) {
  return (
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'} p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function RevenueCard({ title, total, commission, icon, gradient }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-8 h-8 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center text-white`}>
          {icon}
        </span>
        <span className="font-semibold text-gray-900">{title}</span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Ingresos totales</p>
          <p className="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {fmtCurrency(total)}
          </p>
        </div>
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Comisión plataforma</p>
          <p className="text-lg font-semibold text-emerald-600">{fmtCurrency(commission)}</p>
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status) {
  const styles = {
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  };
  return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' };
}

function getStatusLabel(status) {
  const labels = {
    completed: 'Completado',
    confirmed: 'Confirmado',
    in_progress: 'En progreso',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

function fmtCurrency(v) {
  if (!v && v !== 0) return '—';
  try { return Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(v); } catch { return String(v); }
}

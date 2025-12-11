import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { HiDocumentReport, HiRefresh, HiUserAdd, HiClipboardList, HiCheckCircle, HiCurrencyDollar, HiStar, HiBriefcase, HiTrendingUp, HiChartBar, HiDownload } from 'react-icons/hi';

// ========== Simple Chart Components (No Dependencies) ==========

// Bar Chart Component
function BarChart({ data, height = 200, className = '' }) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  
  return (
    <div className={`flex items-end justify-between gap-2 ${className}`} style={{ height }}>
      {data.map((item, idx) => {
        const barHeight = (item.value / maxValue) * 100;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-linear-to-t from-brand-500 to-cyan-400 rounded-t-lg transition-all duration-500 hover:from-brand-600 hover:to-cyan-500 group relative"
              style={{ height: `${Math.max(barHeight, 5)}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.value.toLocaleString()}
              </div>
            </div>
            <span className="text-xs text-gray-500 text-center truncate w-full">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Line Chart Component (SVG based)
function LineChart({ data, height = 200, className = '' }) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const width = 100;
  
  const points = useMemo(() => {
    return data.map((item, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * width;
      const y = height - (item.value / maxValue) * (height - 20);
      return { x, y, ...item };
    });
  }, [data, maxValue, height]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    return `${pathD} L ${width} ${height} L 0 ${height} Z`;
  }, [pathD, height]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaD} fill="url(#lineGradient)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#7c3aed" className="hover:r-4 transition-all" />
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.map((item, idx) => (
          <span key={idx} className="text-[10px] text-gray-400">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

// Pie/Donut Chart Component
function DonutChart({ data, size = 120, className = '' }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  
  const segments = useMemo(() => {
    let cumulative = 0;
    return data.map((item, idx) => {
      const start = cumulative;
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      cumulative += percentage;
      return { ...item, start, percentage };
    });
  }, [data, total]);

  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {segments.map((seg, idx) => (
          <circle
            key={idx}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[idx % colors.length]}
            strokeWidth="16"
            strokeDasharray={`${(seg.percentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={`-${(seg.start / 100) * circumference}`}
            className="transition-all duration-500"
          />
        ))}
        <circle cx={size / 2} cy={size / 2} r={radius - 20} fill="white" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{total}</span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  );
}

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
          <div className="flex items-center justify-between">
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl">
              📊 {periodLabels[period]}
            </span>
            <button
              onClick={() => {
                const report = JSON.stringify(data, null, 2);
                const blob = new Blob([report], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte_${period}_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HiDownload className="w-4 h-4" />
              Exportar Datos
            </button>
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <HiTrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Tendencia de Actividad</h3>
                    <p className="text-xs text-gray-500">Evolución de métricas clave</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {data.trends?.daily?.length > 0 ? (
                  <LineChart 
                    data={data.trends.daily.map(d => ({ 
                      label: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }), 
                      value: d.count || d.bookings || d.users || 0 
                    }))}
                    height={180}
                    className="mb-4"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <HiTrendingUp className="w-12 h-12 mb-2 opacity-30" />
                    <p className="text-sm">Sin datos de tendencia</p>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                    <HiChartBar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Distribución por Estado</h3>
                    <p className="text-xs text-gray-500">Reservas por estado actual</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {data.metrics?.bookingsByStatus?.length > 0 ? (
                  <div className="flex items-center justify-center gap-8">
                    <DonutChart 
                      data={data.metrics.bookingsByStatus.map(s => ({ 
                        label: s._id || 'Otros', 
                        value: s.count || 0 
                      }))}
                      size={140}
                    />
                    <div className="space-y-2">
                      {data.metrics.bookingsByStatus.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className={`w-3 h-3 rounded-full ${['bg-purple-500','bg-cyan-500','bg-emerald-500','bg-amber-500','bg-red-500'][idx % 5]}`}></span>
                          <span className="text-gray-600 capitalize">{s._id || 'Otros'}</span>
                          <span className="font-semibold text-gray-900">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <HiChartBar className="w-12 h-12 mb-2 opacity-30" />
                    <p className="text-sm">Sin datos de distribución</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly/Monthly Comparison Bar Chart */}
          {data.metrics?.weeklyComparison?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <HiChartBar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Comparación Semanal</h3>
                    <p className="text-xs text-gray-500">Actividad por día de la semana</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <BarChart 
                  data={data.metrics.weeklyComparison.map(w => ({ 
                    label: w.day || w._id, 
                    value: w.count || 0 
                  }))}
                  height={180}
                />
              </div>
            </div>
          )}

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

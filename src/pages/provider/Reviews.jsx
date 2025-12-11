import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import ReviewList from '@/components/ui/ReviewList.jsx';
import StarRating from '@/components/ui/StarRating.jsx';
import { HiStar, HiTrendingUp, HiTrendingDown, HiChat, HiClock, HiCheckCircle, HiExclamation, HiRefresh, HiChartBar } from 'react-icons/hi';

/**
 * Provider Reviews Page - Dashboard de reseñas para proveedores
 * Features:
 * - Analytics visuales de reviews
 * - Métricas de rendimiento por categoría
 * - Lista de reviews con capacidad de respuesta
 * - Tendencias y comparativas
 */

// Category labels with icons
const CATEGORY_CONFIG = {
  professionalism: { label: 'Profesionalismo', icon: '👔', color: 'from-blue-500 to-indigo-500' },
  quality: { label: 'Calidad del trabajo', icon: '⭐', color: 'from-amber-500 to-orange-500' },
  punctuality: { label: 'Puntualidad', icon: '⏰', color: 'from-emerald-500 to-teal-500' },
  communication: { label: 'Comunicación', icon: '💬', color: 'from-purple-500 to-pink-500' },
  value: { label: 'Relación calidad-precio', icon: '💰', color: 'from-cyan-500 to-blue-500' }
};

// Stat Card Component
const StatCard = ({ icon, label, value, subvalue, trend, gradient, className = '' }) => (
  <div className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
    <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${gradient} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
    <div className="relative">
      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-lg`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {(trend !== undefined && trend !== null) && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <HiTrendingUp className="w-3.5 h-3.5" /> : <HiTrendingDown className="w-3.5 h-3.5" />}
          <span>{trend >= 0 ? '+' : ''}{trend}% vs mes anterior</span>
        </div>
      )}
      {subvalue && <div className="text-xs text-gray-400 mt-1">{subvalue}</div>}
    </div>
  </div>
);

// Category Score Bar
const CategoryScoreBar = ({ category, score, average }) => {
  const config = CATEGORY_CONFIG[category];
  const percentage = (score / 5) * 100;
  const diff = score - average;
  
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="text-2xl w-8">{config?.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-900">{config?.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{score?.toFixed(1) || '0.0'}</span>
            {diff !== 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-linear-to-r ${config?.color} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Review Insights Component
const ReviewInsights = ({ stats, reviewsWithoutResponse }) => {
  const insights = useMemo(() => {
    const list = [];
    
    // Check response rate
    if (reviewsWithoutResponse > 0) {
      list.push({
        type: 'warning',
        icon: <HiChat className="w-5 h-5" />,
        title: `${reviewsWithoutResponse} reseña${reviewsWithoutResponse > 1 ? 's' : ''} sin responder`,
        description: 'Responder reseñas mejora tu visibilidad y confianza'
      });
    }
    
    // Check low categories
    const categories = stats?.categories || {};
    Object.entries(categories).forEach(([key, value]) => {
      if (value < 4.0 && value > 0) {
        list.push({
          type: 'improvement',
          icon: <HiTrendingUp className="w-5 h-5" />,
          title: `Mejora tu ${CATEGORY_CONFIG[key]?.label.toLowerCase()}`,
          description: `Tu puntuación de ${value.toFixed(1)} está por debajo del promedio`
        });
      }
    });
    
    // Positive insights
    if (stats?.averageRating >= 4.5) {
      list.push({
        type: 'success',
        icon: <HiStar className="w-5 h-5" />,
        title: '¡Excelente reputación!',
        description: 'Tu calificación te posiciona entre los mejores proveedores'
      });
    }
    
    return list.slice(0, 3); // Max 3 insights
  }, [stats, reviewsWithoutResponse]);
  
  if (insights.length === 0) return null;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <HiChartBar className="w-5 h-5 text-brand-500" />
        Insights y recomendaciones
      </h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div 
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-xl ${
              insight.type === 'warning' ? 'bg-amber-50 border border-amber-100' :
              insight.type === 'improvement' ? 'bg-blue-50 border border-blue-100' :
              'bg-emerald-50 border border-emerald-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              insight.type === 'warning' ? 'bg-amber-100 text-amber-600' :
              insight.type === 'improvement' ? 'bg-blue-100 text-blue-600' :
              'bg-emerald-100 text-emerald-600'
            }`}>
              {insight.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
              <p className="text-xs text-gray-600">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ProviderReviews() {
  const navigate = useNavigate();
  const { user, viewRole, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [reviewsWithoutResponse, setReviewsWithoutResponse] = useState(0);

  const providerId = user?._id;

  const loadStats = useCallback(async () => {
    if (!isAuthenticated || !providerId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Load provider reviews stats
      const { data } = await api.get(`/reviews/provider/${providerId}?limit=1`);
      const reviewStats = data?.data?.ratingStats;
      setStats(reviewStats);
      
      // Count reviews without response
      const allReviews = await api.get(`/reviews/provider/${providerId}?limit=100`);
      const reviews = allReviews?.data?.data?.reviews || [];
      const withoutResponse = reviews.filter(r => !r.providerResponse?.comment).length;
      setReviewsWithoutResponse(withoutResponse);
    } catch (err) {
      console.error('Error loading review stats:', err);
      setError(err?.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, providerId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  
  if (viewRole !== 'provider') {
    return <Alert type="warning">Esta sección es solo para proveedores.</Alert>;
  }

  const averageRating = stats?.averageRating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const categories = stats?.categories || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-8 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiStar className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Mis Reseñas</h1>
              <p className="text-amber-100 text-sm">Gestiona y responde las reseñas de tus clientes</p>
            </div>
          </div>
          
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <Alert type="error">{error}</Alert>}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="lg" className="text-amber-500 mx-auto mb-3" />
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<HiStar className="w-5 h-5" />}
              label="Calificación promedio"
              value={averageRating.toFixed(1)}
              subvalue="de 5.0 estrellas"
              gradient="from-amber-500 to-orange-500"
            />
            <StatCard
              icon={<HiChat className="w-5 h-5" />}
              label="Total reseñas"
              value={totalReviews}
              subvalue={totalReviews === 1 ? 'reseña recibida' : 'reseñas recibidas'}
              gradient="from-blue-500 to-indigo-500"
            />
            <StatCard
              icon={<HiCheckCircle className="w-5 h-5" />}
              label="Respondidas"
              value={totalReviews - reviewsWithoutResponse}
              subvalue={`${totalReviews > 0 ? Math.round(((totalReviews - reviewsWithoutResponse) / totalReviews) * 100) : 0}% de respuesta`}
              gradient="from-emerald-500 to-teal-500"
            />
            <StatCard
              icon={<HiExclamation className="w-5 h-5" />}
              label="Sin responder"
              value={reviewsWithoutResponse}
              subvalue="esperando tu respuesta"
              gradient="from-rose-500 to-pink-500"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Categories & Insights */}
            <div className="lg:col-span-1 space-y-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                    <HiChartBar className="w-4 h-4" />
                  </div>
                  Puntuación por categoría
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(CATEGORY_CONFIG).map(([key]) => (
                    <CategoryScoreBar
                      key={key}
                      category={key}
                      score={categories[key] || 0}
                      average={averageRating}
                    />
                  ))}
                </div>
              </div>

              {/* Insights */}
              <ReviewInsights 
                stats={stats} 
                reviewsWithoutResponse={reviewsWithoutResponse} 
              />

              {/* Rating Distribution Mini */}
              {stats?.breakdown && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Distribución de calificaciones</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = stats.breakdown[stars] || 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-sm font-medium text-gray-700">{stars}</span>
                            <HiStar className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${count}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{count}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Reviews List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <HiChat className="w-5 h-5 text-brand-500" />
                  Todas las reseñas
                </h3>
                
                {providerId ? (
                  <ReviewList
                    providerId={providerId}
                    initialStats={stats}
                    isProvider={true}
                    onReviewUpdate={loadStats}
                    className="mt-4"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No se pudo cargar el ID del proveedor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

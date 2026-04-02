import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PortfolioManager from '@/components/account/PortfolioManager.jsx';
import { PageSkeleton } from '@/components/ui/SkeletonLoader.jsx';
import api from '@/state/apiClient.js';
import { useAuth } from '@/state/AuthContext.jsx';

export default function Portfolio() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const { setAuthState } = useAuth();
  const fetchPortfolio = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      // Actualizar usuario global para sincronizar portafolio en todas las vistas
      if (data?.success && data?.data?.user && setAuthState) {
        setAuthState(data.data.user);
      }
      const userPortfolio = data?.data?.user?.providerProfile?.portfolio || [];
      setPortfolio(userPortfolio);
    } catch (err) {
      console.error('Error al cargar portafolio:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setAuthState]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('provider.portfolio.title')}</h1>
            <p className="text-sm sm:text-base text-brand-100">{t('provider.portfolio.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Compact Stats Indicators */}
      {portfolio.length > 0 && (() => {
        const photoCount = portfolio.filter(item => item.type === 'image').length;
        const videoCount = portfolio.filter(item => item.type === 'video').length;
        const categoryCount = new Set(portfolio.map(item => item.category).filter(Boolean)).size;
        const stats = [
          { key: 'all', count: portfolio.length, label: t('provider.portfolio.totalItems'), icon: '📁' },
          { key: 'image', count: photoCount, label: t('provider.portfolio.photos'), icon: '📸' },
          { key: 'video', count: videoCount, label: t('provider.portfolio.videos'), icon: '🎬' },
          { key: 'categories', count: categoryCount, label: t('provider.portfolio.categories'), icon: '🏷️' },
        ];
        return (
          <div className="flex flex-wrap gap-2">
            {stats.map(({ key, count, label, icon }) => {
              const isDisabled = count === 0;
              return (
              <button
                key={key}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  setActiveFilter(key === 'categories' ? 'all' : key);
                  document.getElementById('portfolio-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`
                  inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all
                  ${isDisabled
                    ? 'bg-gray-100 text-gray-400 border border-gray-100 cursor-default'
                    : activeFilter === key
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                  }
                `}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="font-bold">{count}</span>
                <span className="hidden sm:inline text-xs opacity-80">{label}</span>
              </button>
              );
            })}
          </div>
        );
      })()}

      {/* Portfolio Manager */}
      <div id="portfolio-gallery" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <PortfolioManager initialPortfolio={portfolio} onUpdate={fetchPortfolio} activeFilter={activeFilter} />
      </div>

      {/* Tips Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-brand-50/80 via-brand-100/50 to-brand-50/30 rounded-2xl border border-brand-100/50 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-brand-400/10 to-brand-500/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t('provider.portfolio.tipsTitle')}</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '✨', title: t('provider.portfolio.tip1Title'), desc: t('provider.portfolio.tip1Desc') },
              { icon: '🎯', title: t('provider.portfolio.tip2Title'), desc: t('provider.portfolio.tip2Desc') },
              { icon: '📝', title: t('provider.portfolio.tip3Title'), desc: t('provider.portfolio.tip3Desc') },
              { icon: '🎬', title: t('provider.portfolio.tip4Title'), desc: t('provider.portfolio.tip4Desc') },
              { icon: '🔄', title: t('provider.portfolio.tip5Title'), desc: t('provider.portfolio.tip5Desc') },
              { icon: '🏆', title: t('provider.portfolio.tip6Title'), desc: t('provider.portfolio.tip6Desc') },
            ].map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/80 border border-brand-100/50 hover:border-brand-200 transition-all">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-100 to-brand-200 text-lg shrink-0">
                  {tip.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{tip.title}</h4>
                  <p className="text-xs text-gray-600">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

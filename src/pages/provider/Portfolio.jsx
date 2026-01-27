import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PortfolioManager from '@/components/account/PortfolioManager.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import api from '@/state/apiClient.js';
import { useAuth } from '@/state/AuthContext.jsx';

export default function Portfolio() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-xl shadow-brand-500/25">
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

      {/* Stats Cards */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-brand-100 shadow-sm p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-brand-500/10 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-50 mb-3">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="text-3xl font-bold bg-linear-to-r from-brand-600 to-cyan-600 bg-clip-text text-transparent mb-1">{portfolio.length}</div>
              <div className="text-sm text-gray-600">{t('provider.portfolio.totalItems')}</div>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-blue-500/10 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-100 to-blue-50 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="text-3xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">{portfolio.filter(item => item.type === 'image').length}</div>
              <div className="text-sm text-gray-600">{t('provider.portfolio.photos')}</div>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-purple-500/10 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-purple-100 to-purple-50 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <div className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{portfolio.filter(item => item.type === 'video').length}</div>
              <div className="text-sm text-gray-600">{t('provider.portfolio.videos')}</div>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-emerald-100 to-emerald-50 mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </div>
              <div className="text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">{new Set(portfolio.map(item => item.category).filter(Boolean)).size}</div>
              <div className="text-sm text-gray-600">{t('provider.portfolio.categories')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Manager */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <PortfolioManager initialPortfolio={portfolio} onUpdate={fetchPortfolio} />
      </div>

      {/* Tips Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-50/80 via-cyan-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/50 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
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
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/80 border border-blue-100/50 hover:border-blue-200 transition-all">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-blue-100 to-cyan-100 text-lg shrink-0">
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

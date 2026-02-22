import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { SERVICE_CATEGORIES } from '@/utils/categories.js';

export default function Services() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mainService, setMainService] = useState({ category: '', name: '', experience: 0, subcategories: '' });
  const [additionalServices, setAdditionalServices] = useState([]);
  const [customAdditional, setCustomAdditional] = useState('');

  useEffect(()=>{ clearError?.(); }, [clearError]);

  // Convertir las 26 categorías a formato { value, label } con traducción
  const categoryOptions = useMemo(() => 
    SERVICE_CATEGORIES.map(cat => ({ value: cat, label: t(`home.categories.${cat}`, cat) })),
    [t]
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/auth/profile');
      const profile = data?.data?.user?.providerProfile || {};
      const list = profile?.services || [];
      const main = list[0] || {};
      setMainService({
        category: main.category || '',
        name: main.name || '',
        experience: Number(main.experience) || 0,
        subcategories: Array.isArray(main.subcategories) ? main.subcategories.join(', ') : ''
      });
      const additional = (profile?.additionalServices && profile.additionalServices.length > 0)
        ? profile.additionalServices
        : list.slice(1).map(s => s.category).filter(Boolean);
      setAdditionalServices(Array.from(new Set(additional)));
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.services.errorLoading'));
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(()=>{ if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const saveMainService = async (e) => {
    e.preventDefault(); setError('');
    if (!mainService.category) {
      setError(t('provider.services.selectMainCategory'));
      return;
    }
    const payloadServices = [
      {
        category: mainService.category,
        name: mainService.name,
        experience: Number(mainService.experience) || 0,
        subcategories: mainService.subcategories
          ? mainService.subcategories.split(',').map(s => s.trim()).filter(Boolean)
          : []
      }
    ];
    try {
      setLoading(true);
      await api.put('/auth/profile', { services: payloadServices, additionalServices });
      toast.success(t('toast.mainServiceUpdated'));
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.services.errorSavingMain'));
    } finally { setLoading(false); }
  };

  const toggleAdditional = (category) => {
    if (!category || category === mainService.category) return;
    setAdditionalServices(prev => prev.includes(category)
      ? prev.filter(c => c !== category)
      : [...prev, category]
    );
  };

  const addCustomAdditional = () => {
    const value = customAdditional.trim();
    if (!value || value === mainService.category) {
      setCustomAdditional('');
      return;
    }
    if (!additionalServices.includes(value)) {
      setAdditionalServices(prev => [...prev, value]);
    }
    setCustomAdditional('');
  };

  const saveAdditionalServices = async () => {
    setError('');
    if (!mainService.category) {
      setError(t('provider.services.selectMainCategory'));
      return;
    }
    try {
      setLoading(true);
      await api.put('/auth/profile', { services: [{
        category: mainService.category,
        name: mainService.name,
        experience: Number(mainService.experience) || 0,
        subcategories: mainService.subcategories
          ? mainService.subcategories.split(',').map(s => s.trim()).filter(Boolean)
          : []
      }], additionalServices });
      toast.success(t('toast.additionalServicesUpdated'));
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.services.errorSavingAdditional'));
    } finally { setLoading(false); }
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

  // Durante transición de rol, no mostrar mensaje de advertencia
  if (isRoleSwitching) {
    return null;
  }

  if (viewRole !== 'provider') {
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="warning">{t('provider.services.providerOnly')}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('provider.services.title')}</h1>
            <p className="text-sm sm:text-base text-brand-100">{t('provider.services.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Main Service Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-cyan-100 text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t('provider.services.mainServiceTitle')}</h3>
        </div>
        
        <form className="space-y-5" onSubmit={saveMainService}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {t('provider.services.mainCategory')}
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                value={mainService.category}
                onChange={(e)=>setMainService((s)=>({ ...s, category: e.target.value }))}
              >
                <option value="">{t('provider.services.selectMainCategory')}</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Service name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z" />
                </svg>
                {t('provider.services.mainServiceName')}
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                value={mainService.name}
                onChange={(e)=>setMainService((s)=>({ ...s, name: e.target.value }))}
                placeholder={t('provider.services.mainServicePlaceholder')}
              />
            </div>
            
            {/* Experience */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {t('provider.services.experienceYears')}
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                value={mainService.experience}
                onChange={(e)=>setMainService((s)=>({ ...s, experience: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          
          {/* Subcategories */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {t('provider.services.subcategories')}
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
              placeholder={t('provider.services.subcategoriesPlaceholder')}
              value={mainService.subcategories}
              onChange={(e)=>setMainService((s)=>({ ...s, subcategories: e.target.value }))}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                {t('provider.services.saving')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                {t('provider.services.saveMainService')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Additional Services */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-cyan-100 to-blue-100 text-cyan-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{t('provider.services.additionalServicesTitle')}</h3>
            <p className="text-sm text-gray-500">{t('provider.services.additionalServicesHint')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {categoryOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleAdditional(opt.value)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${additionalServices.includes(opt.value)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customAdditional}
            onChange={(e) => setCustomAdditional(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAdditional())}
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder={t('provider.services.additionalServicePlaceholder')}
          />
          <Button type="button" variant="secondary" onClick={addCustomAdditional}>
            {t('provider.services.addAdditional')}
          </Button>
        </div>

        {additionalServices.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-5">
            {additionalServices.map(svc => (
              <span key={svc} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs border border-emerald-100">
                {t(`home.categories.${svc}`, svc)}
                <button type="button" onClick={() => toggleAdditional(svc)} className="hover:text-emerald-900">×</button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 mb-5">{t('provider.services.noAdditionalServices')}</p>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={saveAdditionalServices} loading={loading}>
            {loading ? t('provider.services.saving') : t('provider.services.saveAdditional')}
          </Button>
        </div>
      </div>
    </div>
  );
}

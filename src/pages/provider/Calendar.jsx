import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/state/AuthContext.jsx';

export default function Calendar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState([]);

  useEffect(()=>{ clearError?.(); }, [clearError]);

  const load = useCallback(async (d) => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
  const { data } = await api.get('/provider/services/availability/slots', { params: { date: d } });
      setSlots(data?.data?.slots || []);
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.calendar.errorLoading'));
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(()=>{ if (isAuthenticated && viewRole === 'provider') load(date); }, [date, isAuthenticated, viewRole, load]);

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
    return <Alert type="warning">{t('provider.calendar.providerOnly')}</Alert>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('provider.calendar.title')}</h1>
            <p className="text-sm sm:text-base text-brand-100">{t('provider.calendar.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Date Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-200 text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t('provider.calendar.selectDate')}</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 w-full space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('provider.calendar.date')}
            </label>
            <input 
              type="date" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all" 
              value={date} 
              onChange={(e)=> setDate(e.target.value)} 
            />
          </div>
          
          <button
            onClick={() => load(date)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-medium shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                {t('provider.calendar.loading')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {t('provider.calendar.loadSlots')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-200 text-brand-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('provider.calendar.availableSlots')}</h3>
              {slots.length > 0 && (
                <p className="text-sm text-gray-500">{t('provider.calendar.slotsCount', { count: slots.length })}</p>
              )}
            </div>
          </div>
          
          {slots.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-r from-brand-50 to-brand-100 border border-brand-200">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs font-medium text-brand-700">{t('provider.calendar.available')}</span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
              <p className="text-sm text-gray-500">{t('provider.calendar.loadingSlots')}</p>
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">{t('provider.calendar.noSlots')}</h4>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {t('provider.calendar.noSlotsDescription')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {slots.map((s, idx) => (
              <div 
                key={idx} 
                className="group relative flex items-center justify-center px-4 py-3 rounded-xl bg-linear-to-br from-brand-50/50 to-brand-100/30 border border-brand-100 hover:border-brand-300 hover:shadow-md hover:shadow-brand-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-linear-to-br from-brand-500/0 to-brand-600/0 group-hover:from-brand-500/5 group-hover:to-brand-600/5 rounded-xl transition-all" />
                <div className="relative flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700 transition-colors">{s}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

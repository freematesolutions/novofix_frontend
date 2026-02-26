import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { getTranslatedRequestInfo, useCurrentLanguage } from '@/utils/translations.js';
import { useToast } from '@/components/ui/Toast.jsx';

export default function Jobs() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage(); // Hook reactivo al cambio de idioma
  const { viewRole, user, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [openingChat, setOpeningChat] = useState(null); // ID de la solicitud mientras se abre chat

  useEffect(()=>{ clearError?.(); }, [clearError]);

  // Abrir chat de negociación con el cliente
  const openNegotiationChat = async (request) => {
    const me = user?.id || user?._id;
    const myProposal = request.proposals?.find(p => String(p?.provider?._id || p?.provider) === String(me));
    if (!myProposal) {
      toast.error(t('provider.jobs.proposalNotFound') || 'Propuesta no encontrada');
      return;
    }
    
    setOpeningChat(request._id);
    try {
      const { data } = await api.post(`/chats/proposal/${myProposal._id}`);
      if (data?.success && data?.data?.chat) {
        // Navegar al chat
        navigate(`/mensajes?chat=${data.data.chat._id}`);
      } else {
        toast.error(data?.message || t('provider.jobs.chatOpenError') || 'Error al abrir chat');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('provider.jobs.chatOpenError') || 'Error al abrir chat';
      toast.error(msg);
    } finally {
      setOpeningChat(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/provider/proposals/requests');
      // API shape: { success, data: { requests: [], pagination: {...} } }
      const list = getArray(data, [['data','requests'], ['requests']]);
      setRequests(list);
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.jobs.errorLoading'));
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ if (isAuthenticated && viewRole === 'provider') load(); }, [isAuthenticated, viewRole, load]);

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
    return <Alert type="warning">{t('provider.jobs.providerOnly')}</Alert>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (no interaction) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/25">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('provider.jobs.title')}</h1>
              <p className="text-sm sm:text-base text-brand-100">{t('provider.jobs.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Jobs Grid */}
      <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
              <p className="text-sm text-gray-500">{t('provider.jobs.loading')}</p>
            </div>
          </div>
        )}
        
        {/* Filtrar solicitudes: solo mostrar donde NO hay propuesta aceptada/rechazada del proveedor */}
        {(() => {
          const me = user?.id || user?._id;
          const filteredRequests = (Array.isArray(requests) ? requests : []).filter((r) => {
            const myProposal = Array.isArray(r?.proposals) && r.proposals.find(p => String(p?.provider?._id || p?.provider) === String(me));
            // Si no hay propuesta del proveedor, mostrar (pendiente a enviar)
            if (!myProposal) return true;
            // Si la propuesta está aceptada o rechazada, NO mostrar
            const status = myProposal.status?.toLowerCase();
            if (status === 'accepted' || status === 'rejected') return false;
            // Propuestas pendientes (sent, viewed, draft, etc.) se muestran
            return true;
          });

          if (!loading && filteredRequests.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-brand-100 to-brand-200 mb-4">
                  <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('provider.jobs.noRequests')}</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  {t('provider.jobs.noRequestsDescription')}
                </p>
              </div>
            );
          }

          return filteredRequests.map((r) => {
          const isDirected = String(r?.visibility).toLowerCase() === 'directed';
          const me = user?.id || user?._id;
          const selectedForMe = isDirected && Array.isArray(r?.selectedProviders) && r.selectedProviders.some(pid => String(pid) === String(me));
          const notifiedForMe = Array.isArray(r?.eligibleProviders) && r.eligibleProviders.some(ep => String(ep?.provider?._id || ep?.provider) === String(me));

          // NUEVO: Detectar si el proveedor ya envió propuesta
          const hasProposal = Array.isArray(r?.proposals) && r.proposals.some(p => String(p?.provider?._id || p?.provider) === String(me));

          // Obtener título y descripción traducidos
          const translatedInfo = getTranslatedRequestInfo(r, currentLang);

          // Urgency configuration
          const urgencyConfig = {
            'baja': { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '⏱️' },
            'media': { color: 'from-brand-500 to-brand-600', bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', icon: '⚡' },
            'alta': { color: 'from-accent-500 to-accent-600', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: '🔥' },
            'urgente': { color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🚨' },
          };
          const currentUrgency = urgencyConfig[r.basicInfo?.urgency?.toLowerCase()] || urgencyConfig.media;
          
          return (
            <div key={r._id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 overflow-hidden">
              {/* Left accent bar */}
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-linear-to-b ${currentUrgency.color} rounded-l-2xl`} />
              
              {/* Premium corner accent (visual only, non-interactive) */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-brand-500/5 via-brand-600/3 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="p-5 pl-6 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Cliente que solicita */}
                  {r.client?.profile?.firstName && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {r.client.profile.firstName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-800">{r.client.profile.firstName} {r.client.profile.lastName || ''}</span> {t('provider.jobs.requestsService')}
                      </span>
                    </div>
                  )}
                  
                  {/* Title and badges */}
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-brand-700 transition-colors">
                      {translatedInfo.title || t('provider.jobs.serviceRequest')}
                    </h3>
                    {(selectedForMe || notifiedForMe) && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${selectedForMe ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-brand-50 text-brand-700 border border-brand-200'}`}>
                        {selectedForMe ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {t('provider.jobs.directed')}
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {t('provider.jobs.notified')}
                          </>
                        )}
                      </span>
                    )}
                    {/* NUEVO: Badge de propuesta enviada */}
                    {hasProposal && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700 border border-brand-300 animate-pulse">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {t('provider.jobs.proposalSent')}
                      </span>
                    )}
                  </div>
                  
                  {/* Category and urgency */}
                  <div className="flex flex-wrap items-center gap-2">
                    {r.basicInfo?.category && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-brand-50 to-brand-100 border border-brand-100 text-sm font-medium text-gray-700">
                        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        {t(`home.categories.${r.basicInfo.category}`, r.basicInfo.category)}
                      </span>
                    )}
                    {r.basicInfo?.urgency && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${currentUrgency.bg} ${currentUrgency.text} ${currentUrgency.border} border text-sm font-medium`}>
                        <span>{currentUrgency.icon}</span>
                        {t(`urgency.${r.basicInfo.urgency.toLowerCase()}`, r.basicInfo.urgency)}
                      </span>
                    )}
                  </div>
                  
                  {/* Location */}
                  {r.location?.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-brand-50 to-brand-100 text-brand-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="truncate">{r.location.address}</span>
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="shrink-0 w-full sm:w-auto flex flex-col xs:flex-row sm:flex-col gap-2 mt-3 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/empleos/${r._id}`)}
                    className="w-full xs:w-auto sm:w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 text-sm font-medium text-gray-700 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {t('provider.jobs.view')}
                  </button>
                  <button
                    type="button"
                    onClick={() => hasProposal ? openNegotiationChat(r) : navigate(`/empleos/${r._id}?proponer=1`)}
                    disabled={openingChat === r._id}
                    className={`w-full xs:w-auto sm:w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait ${
                      hasProposal 
                        ? 'bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-brand-500/25' 
                        : 'bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-brand-500/25'
                    }`}
                  >
                    {openingChat === r._id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : hasProposal ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {t('provider.jobs.negotiate')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        {t('provider.jobs.propose')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
}

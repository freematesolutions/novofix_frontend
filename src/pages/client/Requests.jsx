import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { useToast } from '@/components/ui/Toast.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { getSocket } from '@/state/socketClient.js';
import { getTranslatedRequestInfo, useCurrentLanguage } from '@/utils/translations.js';

export default function ClientRequests() {
  const { t, i18n } = useTranslation();
  const currentLang = useCurrentLanguage(); // Hook reactivo al cambio de idioma
  const { role, roles, viewRole, clearError, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [showArchived, setShowArchived] = useState(false); // Ocultar archivadas por defecto
  const [busyId, setBusyId] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null); // request object
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState({}); // providerId: true
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // request object to delete
  const [deleting, setDeleting] = useState(false);

  // Filtrar solicitudes archivadas y completadas por defecto
  const visibleRequests = useMemo(() => {
    if (showArchived) return requests;
    // Ocultar tanto archivadas como completadas cuando no se muestra el toggle
    return requests.filter(r => r.status !== 'archived' && r.status !== 'completed');
  }, [requests, showArchived]);

  useEffect(() => { clearError?.(); }, [clearError]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/client/requests');
      const list = getArray(data, [['data','requests'], ['requests']]);
      setRequests(list);
    } catch (err) {
      setError(err?.response?.data?.message || t('client.requests.loadError'));
    } finally { setLoading(false); }
  }, []);

  const isClientCapable = useMemo(() => (
    viewRole === 'client' || role === 'client' || roles?.includes('client') || roles?.includes('provider')
  ), [viewRole, role, roles]);

  useEffect(() => { if (isAuthenticated && isClientCapable) load(); }, [isAuthenticated, isClientCapable, load]);

  // WebSocket: actualizar cuando llegan nuevas propuestas
  useEffect(() => {
    if (!isClientCapable) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewProposal = (data) => {
      // Actualizar el contador de la solicitud específica
      if (data?.requestId) {
        setRequests(prev => prev.map(r => 
          r._id === data.requestId 
            ? { ...r, metadata: { ...r.metadata, proposalCount: (r.metadata?.proposalCount || 0) + 1 } }
            : r
        ));
        toast.info(t('client.requests.newProposalReceived', { title: data.requestTitle || t('client.requests.yourRequest') }));
      }
    };

    socket.on('NEW_PROPOSAL_RECEIVED', handleNewProposal);
    return () => socket.off('NEW_PROPOSAL_RECEIVED', handleNewProposal);
  }, [isClientCapable, toast]);

  const doAction = async (id, action) => {
    setBusyId(id);
    try {
      let url = '';
      if (action === 'publish') url = `/client/requests/${id}/publish`;
      if (action === 'archive') url = `/client/requests/${id}/archive`;
      if (action === 'republish') url = `/client/requests/${id}/republish`;
      if (!url) return;
      const { data } = await api.put(url, {});
      if (data?.success) {
        toast.success(t('client.requests.actionSuccess', { action }));
        await load();
      } else {
        toast.warning(data?.message || t('client.requests.actionNotCompleted'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.requests.actionError');
      toast.error(msg);
    } finally {
      setBusyId('');
    }
  };

  const openInvite = (reqItem) => {
    setInviteTarget(reqItem);
    setInviteOpen(true);
    setSearchQ('');
    setSearchRes([]);
    setSelected({});
  };

  const runSearch = async () => {
    if (!inviteTarget) return;
    setSearching(true);
    try {
      const params = {
        q: searchQ || undefined,
        category: inviteTarget?.basicInfo?.category,
        limit: 10
      };
      const coords = inviteTarget?.location?.coordinates;
      if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
        params.lat = coords.lat; params.lng = coords.lng;
      }
      const { data } = await api.get('/client/providers/search', { params });
      const list = Array.isArray(data?.data?.providers) ? data.data.providers : [];
      setSearchRes(list);
    } catch {
      setSearchRes([]);
    } finally { setSearching(false); }
  };

  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  // Funciones para eliminar solicitud
  const openDeleteConfirm = (reqItem) => {
    setDeleteTarget(reqItem);
    setDeleteConfirmOpen(true);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data } = await api.put(`/client/requests/${deleteTarget._id}/cancel`, { 
        reason: 'Eliminada por el usuario' 
      });
      if (data?.success) {
        toast.success(t('client.requests.deleteSuccess'));
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
        await load(); // Recargar lista
      } else {
        toast.warning(data?.message || t('client.requests.deleteError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.requests.deleteError');
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const sendInvites = async () => {
    if (!inviteTarget) return;
    const ids = Object.entries(selected).filter(([,v])=>v).map(([k])=>k);
    if (ids.length === 0) { toast.info(t('client.requests.selectProviderFirst')); return; }
    setBusyId(inviteTarget._id);
    try {
      const { data } = await api.post(`/client/requests/${inviteTarget._id}/notify-providers`, { providerIds: ids });
      if (data?.success) {
        toast.success(t('client.requests.providersInvited'));
        setInviteOpen(false);
        setInviteTarget(null);
      } else {
        toast.warning(data?.message || t('client.requests.inviteError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.requests.inviteError');
      toast.error(msg);
    } finally { setBusyId(''); }
  };

  // Mapeo de estados con estilos premium
  const statusConfig = {
    published: { 
      label: t('client.requests.status.published'), 
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      className: 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
    },
    draft: { 
      label: t('client.requests.status.draft'), 
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      className: 'bg-linear-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/25' 
    },
    active: { 
      label: t('client.requests.status.active'), 
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      className: 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
    },
    archived: { 
      label: t('client.requests.status.archived'), 
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      className: 'bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
    }
  };

  const getStatusConfig = (status) => statusConfig[status] || { label: status, icon: null, className: 'bg-gray-200 text-gray-700' };

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isClientCapable) {
    return <Alert type="warning">{t('client.requests.clientOnlySection')}</Alert>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Premium */}
        <div className="overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 sm:p-8 text-white relative">
          {/* Decoración del header */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{t('client.requests.title')}</h1>
                  <p className="text-sm text-brand-100 mt-0.5">
                    {t('client.requests.subtitle')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats mini */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{visibleRequests.length}</div>
                <div className="text-xs text-white/80 font-medium">{t('client.requests.total')}</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{requests.filter(r => r.status === 'published').length}</div>
                <div className="text-xs text-white/80 font-medium">{t('client.requests.active')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {requests.some(r => r.status === 'archived' || r.status === 'completed') && (
          <div className="flex items-center justify-end gap-2 px-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              {t('client.requests.showArchivedAndCompleted', 'Mostrar finalizadas y archivadas')}
              {requests.filter(r => r.status === 'archived' || r.status === 'completed').length > 0 && (
                <span className="text-xs text-gray-400">
                  ({requests.filter(r => r.status === 'archived' || r.status === 'completed').length})
                </span>
              )}
            </label>
          </div>
        )}

        {error && <Alert type="error">{error}</Alert>}

        {/* Loading state premium */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-emerald-100/40 shadow-lg">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">{t('client.requests.loading')}</p>
          </div>
        )}

        {/* Empty state premium */}
        {!loading && (!Array.isArray(visibleRequests) || visibleRequests.length === 0) && (
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-emerald-200 shadow-lg p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-50/50 via-transparent to-teal-50/50"></div>
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('client.requests.noRequests')}</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {t('client.requests.noRequestsDescription')}
              </p>
              <button 
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('client.requests.searchProfessionals')}
              </button>
            </div>
          </div>
        )}

        {/* Lista de solicitudes premium */}
        {!loading && Array.isArray(visibleRequests) && visibleRequests.length > 0 && (
          <div className="space-y-4">
            {visibleRequests.map((r, index) => {
              const statusInfo = getStatusConfig(r.status);
              return (
                <div 
                  key={r._id} 
                  className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-100/60 shadow-lg shadow-emerald-900/5 hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Barra lateral de color según estado */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    r.status === 'published' ? 'bg-linear-to-b from-emerald-500 to-teal-500' :
                    r.status === 'draft' ? 'bg-linear-to-b from-gray-400 to-gray-500' :
                    r.status === 'active' ? 'bg-linear-to-b from-blue-500 to-cyan-500' :
                    r.status === 'archived' ? 'bg-linear-to-b from-amber-500 to-orange-500' :
                    'bg-gray-300'
                  }`}></div>

                  <div className="p-5 sm:p-6 pl-6 sm:pl-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Información principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {getTranslatedRequestInfo(r, currentLang).title || t('client.requests.untitledRequest')}
                          </h3>
                          {/* Badge de estado premium */}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                          {/* Badge de tipo de solicitud */}
                          {r.visibility === 'directed' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {t('client.requests.directed')}
                            </span>
                          )}
                        </div>
                        
                        {/* Información de proveedores - Para solicitudes DIRIGIDAS muestra selectedProviders */}
                        {r.visibility === 'directed' && Array.isArray(r.selectedProviders) && r.selectedProviders.length > 0 && (
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <div className="flex -space-x-2">
                              {r.selectedProviders.slice(0, 3).map((prov, idx) => (
                                <div key={prov._id || idx} className="w-7 h-7 rounded-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                                  {(prov.providerProfile?.businessName || prov.providerProfile?.firstName || 'P').charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {r.selectedProviders.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                                  +{r.selectedProviders.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-gray-600">
                              {t('client.requests.sentTo')}{' '}
                              <span className="font-medium text-gray-800">
                                {r.selectedProviders.map(p => p.providerProfile?.businessName || `${p.providerProfile?.firstName || ''} ${p.providerProfile?.lastName || ''}`.trim() || t('client.proposals.professional')).slice(0, 2).join(', ')}
                                {r.selectedProviders.length > 2 && ` y ${r.selectedProviders.length - 2} más`}
                              </span>
                            </span>
                          </div>
                        )}
                        
                        {/* Para solicitudes AUTO muestra eligibleProviders notificados */}
                        {r.visibility !== 'directed' && Array.isArray(r.eligibleProviders) && r.eligibleProviders.filter(ep => ep.notified && ep.provider).length > 0 && (
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <div className="flex -space-x-2">
                              {r.eligibleProviders.filter(ep => ep.notified && ep.provider).slice(0, 3).map((ep, idx) => {
                                const prov = ep.provider;
                                return (
                                  <div key={prov._id || idx} className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                                    {(prov.providerProfile?.businessName || prov.providerProfile?.firstName || 'P').charAt(0).toUpperCase()}
                                  </div>
                                );
                              })}
                              {r.eligibleProviders.filter(ep => ep.notified && ep.provider).length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                                  +{r.eligibleProviders.filter(ep => ep.notified && ep.provider).length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-gray-600">
                              {t('client.requests.visibleFor')}{' '}
                              <span className="font-medium text-gray-800">
                                {r.eligibleProviders.filter(ep => ep.notified && ep.provider).map(ep => ep.provider.providerProfile?.businessName || `${ep.provider.providerProfile?.firstName || ''} ${ep.provider.providerProfile?.lastName || ''}`.trim() || t('client.proposals.professional')).slice(0, 2).join(', ')}
                                {r.eligibleProviders.filter(ep => ep.notified && ep.provider).length > 2 && ` y ${r.eligibleProviders.filter(ep => ep.notified && ep.provider).length - 2} más`}
                              </span>
                            </span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          {r.basicInfo?.category && (
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {r.basicInfo.category ? t(`home.categories.${r.basicInfo.category}`) : r.basicInfo.category}
                            </span>
                          )}
                          {r.basicInfo?.urgency && (
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {r.basicInfo.urgency ? t(`urgency.${r.basicInfo.urgency}`) : r.basicInfo.urgency}
                            </span>
                          )}
                          {r.createdAt && (
                            <span className="inline-flex items-center gap-1.5 text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(r.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Botón Ver propuestas - siempre visible */}
                        <button
                          onClick={() => navigate(`/mis-solicitudes/${r._id}/propuestas`)}
                          className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('client.requests.viewProposals')}
                          {/* No mostrar contador si ya hay una propuesta aceptada (reserva creada) */}
                          {(r.metadata?.proposalCount > 0 && !r.acceptedProposal) && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold leading-none text-emerald-700 bg-white rounded-full min-w-5 animate-pulse">
                              {r.metadata.proposalCount}
                            </span>
                          )}
                        </button>

                        {/* Botón Ver elegibles - Muestra cuántos profesionales cumplen los criterios para responder */}
                        <button
                          onClick={async () => {
                            setBusyId(r._id);
                            try {
                              const { data } = await api.get(`/client/requests/${r._id}/eligibility`);
                              const c = data?.data?.totalEligible ?? 0;
                              setRequests(prev => prev.map(req => 
                                req._id === r._id ? { ...req, _eligibleCount: c } : req
                              ));
                              if (c === 0) toast.warning(t('client.requests.noEligibleProviders'));
                              else toast.info(t('client.requests.eligibleProvidersCount', { count: c }));
                            } catch {
                              toast.error(t('client.requests.eligibilityError'));
                            } finally {
                              setBusyId('');
                            }
                          }}
                          disabled={busyId === r._id}
                          title="Ver cuántos profesionales cumplen los criterios de tu solicitud (categoría, ubicación) y pueden enviar propuestas"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {t('client.requests.eligible')}
                          {r._eligibleCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold leading-none text-white bg-teal-500 rounded-full min-w-5">
                              {r._eligibleCount}
                            </span>
                          )}
                        </button>

                        {/* Acciones específicas por estado */}
                        {r.status === 'draft' && (
                          <button
                            onClick={() => doAction(r._id, 'publish')}
                            disabled={busyId === r._id}
                            title="Publicar solicitud para que los profesionales la vean y envíen propuestas"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-linear-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busyId === r._id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            )}
                            {t('client.requests.publish')}
                          </button>
                        )}
                        
                        {r.status === 'published' && (
                          <>
                            <button
                              onClick={() => doAction(r._id, 'archive')}
                              disabled={busyId === r._id}
                              title="Archivar la solicitud temporalmente. Dejará de recibir propuestas pero podrás republicarla después"
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all duration-300 disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                              {t('client.requests.archive')}
                            </button>
                            <button
                              onClick={() => openInvite(r)}
                              title="Buscar y enviar invitaciones directas a profesionales específicos para que vean tu solicitud"
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              {t('client.requests.invite')}
                            </button>
                          </>
                        )}
                        
                        {r.status === 'archived' && (
                          <button
                            onClick={() => doAction(r._id, 'republish')}
                            disabled={busyId === r._id}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busyId === r._id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                            {t('client.requests.republish')}
                          </button>
                        )}
                        
                        {/* Botón eliminar - disponible para draft, published y archived */}
                        {['draft', 'published', 'archived'].includes(r.status) && (
                          <button
                            onClick={() => openDeleteConfirm(r)}
                            disabled={busyId === r._id}
                            title="Eliminar esta solicitud permanentemente"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-300 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {t('common.delete')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de invitación premium */}
        <Modal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('client.requests.inviteModal.title')}</span>
                <p className="text-sm text-gray-500 font-normal">{t('client.requests.inviteModal.subtitle')}</p>
              </div>
            </div>
          }
          actions={
            <div className="flex gap-3">
              <button 
                onClick={() => setInviteOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={sendInvites}
                disabled={busyId === inviteTarget?._id}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyId === inviteTarget?._id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {t('client.requests.inviteModal.sendInvitations')}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Info de la solicitud */}
            <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{getTranslatedRequestInfo(inviteTarget, currentLang).title}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-emerald-600 font-medium">{inviteTarget?.basicInfo?.category}</span>
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  placeholder={t('client.requests.inviteModal.searchPlaceholder')}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
                />
              </div>
              <button 
                type="button" 
                onClick={runSearch} 
                disabled={searching}
                className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                {t('common.search')}
              </button>
            </div>

            {/* Lista de resultados */}
            <div className="max-h-72 overflow-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
              {(!Array.isArray(searchRes) || searchRes.length === 0) && (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">{t('client.requests.inviteModal.searchHint')}</p>
                </div>
              )}
              {(Array.isArray(searchRes) ? searchRes : []).map((p) => {
                const id = p._id;
                const name = p.providerProfile?.businessName || p.profile?.firstName || p.email;
                const plan = p.subscription?.plan;
                const rating = p.providerProfile?.rating?.average;
                return (
                  <label 
                    key={id} 
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 ${
                      selected[id] ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        selected[id] ? 'bg-linear-to-br from-blue-500 to-cyan-500' : 'bg-linear-to-br from-gray-400 to-gray-500'
                      }`}>
                        {(name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {plan && <span className="px-1.5 py-0.5 bg-gray-100 rounded">{plan}</span>}
                          {rating != null && (
                            <span className="flex items-center gap-0.5">
                              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {Number(rating).toFixed(1)}
                            </span>
                          )}
                          {rating == null && <span className="text-gray-400">{t('client.requests.noRating')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={!!selected[id]} 
                        onChange={() => toggleSelect(id)} 
                      />
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                        selected[id] 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}>
                        {selected[id] && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </Modal>

        {/* Modal de confirmación de eliminación */}
        <Modal
          open={deleteConfirmOpen}
          onClose={cancelDelete}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('client.requests.deleteModal.title')}</span>
                <p className="text-sm text-gray-500 font-normal">{t('client.requests.deleteModal.subtitle')}</p>
              </div>
            </div>
          }
          actions={
            <div className="flex gap-3">
              <button 
                onClick={cancelDelete}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                {deleting ? t('client.requests.deleteModal.deleting') : t('client.requests.deleteModal.confirmDelete')}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Info de la solicitud a eliminar */}
            <div className="p-4 bg-linear-to-r from-red-50 to-rose-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{getTranslatedRequestInfo(deleteTarget, currentLang).title || 'Solicitud'}</span>
                  {deleteTarget?.basicInfo?.category && (
                    <>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="text-red-600 font-medium">{deleteTarget.basicInfo.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>{t('client.requests.deleteModal.confirmQuestion')}</p>
              <ul className="list-disc list-inside text-gray-500 space-y-1">
                <li>{t('client.requests.deleteModal.warning1')}</li>
                <li>{t('client.requests.deleteModal.warning2')}</li>
                <li>{t('client.requests.deleteModal.warning3')}</li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

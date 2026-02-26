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
import RequestWizardModal from '@/components/ui/RequestWizardModal.jsx';
import ProviderProfileModal from '@/components/ui/ProviderProfileModal.jsx';

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
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState({}); // providerId: true
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // request object to delete
  const [deleting, setDeleting] = useState(false);
  const [eligibleData, setEligibleData] = useState({}); // { [requestId]: { count, providers } }
  const [showEligibleFor, setShowEligibleFor] = useState(null); // requestId or null
  const [editTarget, setEditTarget] = useState(null); // request object to edit via wizard modal
  const [profileTarget, setProfileTarget] = useState(null); // provider object to show profile modal
  const [openMenuId, setOpenMenuId] = useState(null); // overflow menu for request actions

  // Filtrar solicitudes: excluir archivadas, completadas, y aquellas con propuesta ya aceptada
  // Solo mostrar solicitudes pendientes a propuestas o con propuestas sin aceptar/rechazar
  const visibleRequests = useMemo(() => {
    if (showArchived) return requests;
    // Ocultar archivadas, completadas, activas (ya tienen propuesta aceptada), y las que tienen acceptedProposal
    return requests.filter(r => {
      // Si tiene propuesta aceptada, no mostrar
      if (r.acceptedProposal) return false;
      // Si el status es completed, active, archived o cancelled, no mostrar
      if (['archived', 'completed', 'active', 'cancelled'].includes(r.status)) return false;
      return true;
    });
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

  const openInvite = async (reqItem) => {
    setInviteTarget(reqItem);
    setInviteOpen(true);
    setSearchRes([]);
    setSelected({});
    // Auto-load providers by the request's category, excluding already-attending
    const excludeIds = getAttendingProviderIds(reqItem);
    try {
      setSearching(true);
      const params = {
        category: reqItem?.basicInfo?.category,
        limit: 30
      };
      const coords = reqItem?.location?.coordinates;
      if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
        params.lat = coords.lat; params.lng = coords.lng;
      }
      const { data } = await api.get('/client/providers/search', { params });
      const list = Array.isArray(data?.data?.providers) ? data.data.providers : [];
      // Excluir proveedores que ya están atendiendo y ordenar por rating descendente
      const filtered = list.filter(p => !excludeIds.has(String(p._id)));
      filtered.sort((a, b) => {
        const ra = a.providerProfile?.rating?.average || 0;
        const rb = b.providerProfile?.rating?.average || 0;
        if (rb !== ra) return rb - ra;
        return (b.providerProfile?.rating?.count || 0) - (a.providerProfile?.rating?.count || 0);
      });
      setSearchRes(filtered);
    } catch {
      setSearchRes([]);
    } finally { setSearching(false); }
  };

  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  // Helper: obtener IDs de proveedores que ya están atendiendo una solicitud
  // (notificados vía eligibleProviders + los que enviaron propuesta)
  const getAttendingProviderIds = (reqItem) => {
    const ids = new Set();
    // Proveedores notificados
    if (Array.isArray(reqItem?.eligibleProviders)) {
      reqItem.eligibleProviders.forEach(ep => {
        const pid = ep?.provider?._id || ep?.provider;
        if (pid) ids.add(String(pid));
      });
    }
    // Proveedores dirigidos
    if (Array.isArray(reqItem?.selectedProviders)) {
      reqItem.selectedProviders.forEach(sp => {
        const pid = sp?._id || sp;
        if (pid) ids.add(String(pid));
      });
    }
    // Proveedores que enviaron propuesta
    if (Array.isArray(reqItem?.proposals)) {
      reqItem.proposals.forEach(prop => {
        const pid = prop?.provider?._id || prop?.provider;
        if (pid) ids.add(String(pid));
      });
    }
    return ids;
  };

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
        // Optimistically remove from local state
        setRequests(prev => prev.filter(r => r._id !== deleteTarget._id));
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
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
        // Recargar solicitudes para actualizar contadores de "Atendiendo"
        await load();
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      className: 'bg-linear-to-r from-accent-500 to-accent-400 text-white shadow-lg shadow-accent-500/25' 
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
      className: 'bg-linear-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25' 
    },
    archived: { 
      label: t('client.requests.status.archived'), 
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      className: 'bg-linear-to-r from-dark-500 to-dark-600 text-white shadow-lg shadow-dark-500/25' 
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/30">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-brand-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Premium */}
        <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 p-6 sm:p-8 text-white relative">
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
        {requests.some(r => ['archived', 'completed', 'active', 'cancelled'].includes(r.status) || r.acceptedProposal) && (
          <div className="flex items-center justify-end gap-2 px-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {t('client.requests.showArchivedAndCompleted')}
              {requests.filter(r => ['archived', 'completed', 'active', 'cancelled'].includes(r.status) || r.acceptedProposal).length > 0 && (
                <span className="text-xs text-gray-400">
                  ({requests.filter(r => ['archived', 'completed', 'active', 'cancelled'].includes(r.status) || r.acceptedProposal).length})
                </span>
              )}
            </label>
          </div>
        )}

        {error && <Alert type="error">{error}</Alert>}

        {/* Loading state premium */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-brand-100/40 shadow-lg">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-brand-500/20"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">{t('client.requests.loading')}</p>
          </div>
        )}

        {/* Empty state premium */}
        {!loading && (!Array.isArray(visibleRequests) || visibleRequests.length === 0) && (
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-brand-200 shadow-lg p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-brand-50/50 via-transparent to-brand-50/50"></div>
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-brand-100 to-brand-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('client.requests.noRequests')}</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {t('client.requests.noRequestsDescription')}
              </p>
              <button 
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-brand-600 to-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-300 hover:scale-[1.02]"
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
                  className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-brand-100/60 shadow-lg shadow-brand-900/5 hover:shadow-xl hover:shadow-brand-900/10 transition-all duration-500 hover:-translate-y-1 ${openMenuId === r._id ? 'z-30' : 'z-0'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Barra lateral de color según estado */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    r.status === 'published' ? 'bg-linear-to-b from-accent-500 to-accent-400' :
                    r.status === 'draft' ? 'bg-linear-to-b from-gray-400 to-gray-500' :
                    r.status === 'active' ? 'bg-linear-to-b from-brand-500 to-brand-600' :
                    r.status === 'archived' ? 'bg-linear-to-b from-dark-500 to-dark-600' :
                    'bg-gray-300'
                  }`}></div>

                  <div className="p-5 sm:p-6 pl-6 sm:pl-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Información principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {(() => {
                              const cat = r.basicInfo?.category;
                              const catLabel = cat ? t(`home.categories.${cat}`, cat) : '';
                              return catLabel
                                ? t('client.requests.estimateRequestTitle', { category: catLabel })
                                : getTranslatedRequestInfo(r, currentLang).title || t('client.requests.untitledRequest');
                            })()}
                          </h3>
                          {/* Badge de estado — dinámico: si published y tiene propuestas, mostrar "Propuesta recibida" en vez de "Esperando propuesta" */}
                          {(() => {
                            const hasProposals = (r.metadata?.proposalCount > 0 || (Array.isArray(r.proposals) && r.proposals.length > 0)) && !r.acceptedProposal;
                            if (r.status === 'published' && hasProposals) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {t('client.requests.proposalReceived')}
                                </span>
                              );
                            }
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                          {/* Badge de tipo de solicitud */}
                          {r.visibility === 'directed' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 border border-accent-200">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {t('client.requests.directed')}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          {r.basicInfo?.category && (
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {r.basicInfo.category ? t(`home.categories.${r.basicInfo.category}`) : r.basicInfo.category}
                            </span>
                          )}
                          {r.basicInfo?.urgency && (
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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

                      {/* Acciones — Layout: fila primaria + menú overflow */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Botón Ver propuestas - CTA primario */}
                        {(r.metadata?.proposalCount > 0 || (Array.isArray(r.proposals) && r.proposals.length > 0)) && (
                          <button
                            onClick={() => navigate(`/mis-solicitudes/${r._id}/propuestas`)}
                            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="hidden sm:inline">{t('client.requests.viewProposals')}</span>
                            <span className="sm:hidden">{t('client.requests.proposals', 'Propuestas')}</span>
                            {(r.metadata?.proposalCount > 0 && !r.acceptedProposal) && (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold leading-none text-brand-700 bg-white rounded-full min-w-5 animate-pulse">
                                {r.metadata.proposalCount}
                              </span>
                            )}
                          </button>
                        )}

                        {/* Botón Atendiendo — compacto */}
                        {(() => {
                          const attendingMap = new Map();
                          if (Array.isArray(r.eligibleProviders)) {
                            r.eligibleProviders.forEach(ep => {
                              const prov = ep?.provider;
                              if (prov && (prov._id || prov)) {
                                const pid = String(prov._id || prov);
                                if (!attendingMap.has(pid)) {
                                  attendingMap.set(pid, {
                                    id: pid,
                                    name: prov.providerProfile?.businessName || '',
                                    avatar: prov.providerProfile?.avatar || prov.profile?.profileImage || prov.profile?.avatar || '',
                                    rating: prov.providerProfile?.rating,
                                    plan: prov.subscription?.plan,
                                    category: prov.providerProfile?.services?.[0]?.category,
                                    notified: !!ep.notified,
                                    hasProposal: false
                                  });
                                }
                              }
                            });
                          }
                          if (Array.isArray(r.selectedProviders)) {
                            r.selectedProviders.forEach(sp => {
                              const pid = String(sp?._id || sp);
                              if (pid && !attendingMap.has(pid)) {
                                attendingMap.set(pid, {
                                  id: pid,
                                  name: sp?.providerProfile?.businessName || '',
                                  avatar: sp?.providerProfile?.avatar || sp?.profile?.profileImage || '',
                                  rating: sp?.providerProfile?.rating,
                                  plan: sp?.subscription?.plan,
                                  category: sp?.providerProfile?.services?.[0]?.category,
                                  notified: true,
                                  hasProposal: false
                                });
                              }
                            });
                          }
                          if (Array.isArray(r.proposals)) {
                            r.proposals.forEach(prop => {
                              const prov = prop?.provider;
                              if (prov) {
                                const pid = String(prov._id || prov);
                                if (attendingMap.has(pid)) {
                                  attendingMap.get(pid).hasProposal = true;
                                } else {
                                  attendingMap.set(pid, {
                                    id: pid,
                                    name: prov.providerProfile?.businessName || '',
                                    avatar: prov.providerProfile?.avatar || prov.profile?.profileImage || prov.profile?.avatar || '',
                                    rating: prov.providerProfile?.rating,
                                    plan: prov.subscription?.plan || '',
                                    category: prov.providerProfile?.services?.[0]?.category,
                                    notified: false,
                                    hasProposal: true
                                  });
                                }
                              }
                            });
                          }
                          const attendingList = Array.from(attendingMap.values());
                          const attendingCount = attendingList.length;

                          return (
                            <button
                              onClick={() => {
                                if (showEligibleFor === r._id) {
                                  setShowEligibleFor(null);
                                  return;
                                }
                                setEligibleData(prev => ({ ...prev, [r._id]: { count: attendingCount, providers: attendingList } }));
                                setShowEligibleFor(r._id);
                                if (attendingCount === 0) toast.info(t('client.requests.noAttendingProviders', 'Aún no hay profesionales atendiendo esta solicitud'));
                              }}
                              title={t('client.requests.attendingTooltip', 'Ver profesionales que están atendiendo esta solicitud')}
                              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all duration-300 ${
                                showEligibleFor === r._id 
                                  ? 'bg-brand-50 border border-brand-300 text-brand-700 shadow-md' 
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                              }`}
                            >
                              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="hidden sm:inline">{t('client.requests.attending', 'Atendiendo')}</span>
                              {attendingCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold leading-none text-white bg-brand-500 rounded-full min-w-5">
                                  {attendingCount}
                                </span>
                              )}
                            </button>
                          );
                        })()}

                        {/* Menú overflow "⋯" para acciones secundarias */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === r._id ? null : r._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 shadow-sm text-sm font-medium"
                            title={t('client.requests.moreActions', 'Más acciones')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                            <span>{t('client.requests.actions', 'Acciones')}</span>
                          </button>

                          {/* Dropdown menu */}
                          {openMenuId === r._id && (
                            <>
                              {/* Backdrop invisible para cerrar */}
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* Invitar — solo published */}
                                {r.status === 'published' && (
                                  <button
                                    onClick={() => { setOpenMenuId(null); openInvite(r); }}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    {t('client.requests.invite')}
                                  </button>
                                )}
                                {/* Editar — draft y published */}
                                {['draft', 'published'].includes(r.status) && (
                                  <button
                                    onClick={() => { setOpenMenuId(null); setEditTarget(r); }}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('client.requests.edit', 'Editar')}
                                  </button>
                                )}
                                {/* Publicar — solo draft */}
                                {r.status === 'draft' && (
                                  <button
                                    onClick={() => { setOpenMenuId(null); doAction(r._id, 'publish'); }}
                                    disabled={busyId === r._id}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors disabled:opacity-50"
                                  >
                                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {t('client.requests.publish')}
                                  </button>
                                )}
                                {/* Archivar — solo published */}
                                {r.status === 'published' && (
                                  <button
                                    onClick={() => { setOpenMenuId(null); doAction(r._id, 'archive'); }}
                                    disabled={busyId === r._id}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 hover:bg-accent-50 hover:text-accent-700 transition-colors disabled:opacity-50"
                                  >
                                    <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    {t('client.requests.archive')}
                                  </button>
                                )}
                                {/* Republicar — solo archived */}
                                {r.status === 'archived' && (
                                  <button
                                    onClick={() => { setOpenMenuId(null); doAction(r._id, 'republish'); }}
                                    disabled={busyId === r._id}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors disabled:opacity-50"
                                  >
                                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {t('client.requests.republish')}
                                  </button>
                                )}
                                {/* Separador antes de eliminar */}
                                {['draft', 'published', 'archived'].includes(r.status) && (
                                  <div className="border-t border-gray-100 my-1"></div>
                                )}
                                {/* Eliminar */}
                                {['draft', 'published', 'archived'].includes(r.status) && (
                                  <button
                                    onClick={() => { setOpenMenuId(null); openDeleteConfirm(r); }}
                                    disabled={busyId === r._id}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('common.delete')}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Panel de proveedores atendiendo */}
                    {showEligibleFor === r._id && eligibleData[r._id] && (
                      <div className="mt-4 pt-4 border-t border-brand-100/60">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {t('client.requests.attendingProvidersCount', { count: eligibleData[r._id].count })}
                          </h4>
                          <button 
                            onClick={() => setShowEligibleFor(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {eligibleData[r._id].providers.length > 0 ? (
                          <div className="grid gap-2">
                            {eligibleData[r._id].providers.map((ep, idx) => (
                              <div key={ep.id || idx} className="flex items-center gap-3 p-3 bg-linear-to-r from-brand-50/80 to-brand-50/80 rounded-xl border border-brand-100/60">
                                {ep.avatar ? (
                                  <img src={ep.avatar} alt={ep.name} className="w-10 h-10 rounded-full object-cover border-2 border-brand-200 shadow-sm shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                                    {(ep.name || 'P').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm truncate">
                                    {ep.name || t('client.requests.professional')}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    {ep.plan && (
                                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                                        ep.plan === 'pro' ? 'bg-brand-100 text-brand-700' :
                                        ep.plan === 'basic' ? 'bg-gray-100 text-gray-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {ep.plan.toUpperCase()}
                                      </span>
                                    )}
                                    {ep.rating?.average != null && (
                                      <span className="flex items-center gap-0.5">
                                        <svg className="w-3 h-3 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {Number(ep.rating.average).toFixed(1)}
                                        {ep.rating.count != null && (
                                          <span className="text-gray-400">({ep.rating.count})</span>
                                        )}
                                      </span>
                                    )}
                                    {ep.category && (
                                      <span className="text-brand-600">
                                        {t(`home.categories.${ep.category}`, ep.category)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Status badges */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {ep.hasProposal && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-brand-700 bg-brand-100 rounded-full">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      {t('client.requests.proposalSent', 'Propuesta')}
                                    </span>
                                  )}
                                  {ep.notified && !ep.hasProposal && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-brand-700 bg-brand-100 rounded-full">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                                      </svg>
                                      {t('client.requests.notifiedStatus', 'Notificado')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-2">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">{t('client.requests.noAttendingProviders', 'Aún no hay profesionales atendiendo esta solicitud')}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('client.requests.noAttendingHint', 'Usa el botón "Invitar" para buscar y enviar tu solicitud a profesionales')}</p>
                          </div>
                        )}
                      </div>
                    )}
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
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('client.requests.inviteModal.title')}</span>
                <p className="text-sm text-gray-500 font-normal">{t('client.requests.inviteModal.autoSubtitle', 'Selecciona los profesionales a quienes deseas enviar tu solicitud')}</p>
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
                disabled={busyId === inviteTarget?._id || !Object.values(selected).some(Boolean)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="p-4 bg-linear-to-r from-brand-50 to-brand-50 rounded-xl border border-brand-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{getTranslatedRequestInfo(inviteTarget, currentLang).title}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-brand-600 font-medium">{inviteTarget?.basicInfo?.category}</span>
                </div>
              </div>
            </div>

            {/* Contador de profesionales encontrados */}
            {!searching && searchRes.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {t('client.requests.inviteModal.foundCount', { count: searchRes.length })}
                </span>
                <span className="text-xs text-gray-400">
                  {t('client.requests.inviteModal.sortedByRating', 'Ordenados por calificación')}
                </span>
              </div>
            )}

            {/* Loading state */}
            {searching && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 rounded-full border-3 border-brand-100 border-t-brand-500 animate-spin"></div>
                <p className="mt-3 text-sm text-gray-500">{t('client.requests.inviteModal.loading', 'Buscando profesionales...')}</p>
              </div>
            )}

            {/* Lista de profesionales */}
            <div className="max-h-112 overflow-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
              {!searching && (!Array.isArray(searchRes) || searchRes.length === 0) && (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('client.requests.inviteModal.noResults')}</p>
                  <p className="text-xs text-gray-400">{t('client.requests.inviteModal.noResultsHint', 'No hay profesionales disponibles en esta categoría por el momento')}</p>
                </div>
              )}
              {!searching && (Array.isArray(searchRes) ? searchRes : []).map((p) => {
                const id = p._id;
                const name = p.providerProfile?.businessName || p.profile?.firstName || p.email;
                const plan = p.subscription?.plan;
                const rating = p.providerProfile?.rating?.average;
                const ratingCount = p.providerProfile?.rating?.count;
                const description = p.providerProfile?.businessDescription || p.providerProfile?.description || '';
                const profileImg = p.profile?.profileImage || p.profile?.avatar;
                const address = p.providerProfile?.serviceArea?.address;
                const category = p.providerProfile?.services?.[0]?.category;
                const completedJobs = p.providerProfile?.stats?.completedJobs;
                const portfolio = Array.isArray(p.providerProfile?.portfolio) ? p.providerProfile.portfolio.filter(item => item.type === 'image') : [];
                return (
                  <div 
                    key={id} 
                    className={`block p-4 cursor-pointer transition-all duration-300 ${
                      selected[id] ? 'bg-brand-50/80 ring-1 ring-inset ring-brand-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSelect(id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {profileImg ? (
                        <img 
                          src={profileImg} 
                          alt={name} 
                          className={`w-12 h-12 rounded-xl object-cover border-2 shadow-sm shrink-0 ${
                            selected[id] ? 'border-brand-400' : 'border-gray-200'
                          }`}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-base shrink-0 ${
                          selected[id] ? 'bg-linear-to-br from-brand-500 to-brand-600' : 'bg-linear-to-br from-gray-400 to-gray-500'
                        }`}>
                          {(name || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 truncate">{name}</span>
                          {plan && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              plan === 'pro' ? 'bg-brand-100 text-brand-700' :
                              plan === 'basic' ? 'bg-gray-100 text-gray-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {plan.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-1">
                          {rating != null ? (
                            <span className="flex items-center gap-0.5">
                              <svg className="w-3.5 h-3.5 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-semibold text-accent-600">{Number(rating).toFixed(1)}</span>
                              {ratingCount != null && <span className="text-gray-400">({ratingCount})</span>}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">{t('client.requests.inviteModal.newProfessional', 'Nuevo')}</span>
                          )}
                          {category && (
                            <span className="text-brand-600">
                              {t(`home.categories.${category}`, category)}
                            </span>
                          )}
                          {completedJobs > 0 && (
                            <span className="text-gray-500">
                              {completedJobs} {t('client.requests.inviteModal.jobs', 'trabajos')}
                            </span>
                          )}
                          {address && (
                            <span className="flex items-center gap-0.5 text-gray-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span className="truncate max-w-[140px]">{address}</span>
                            </span>
                          )}
                        </div>
                        {description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
                        )}
                        {/* Ver Perfil button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setProfileTarget(p); }}
                          className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {t('client.requests.inviteModal.viewProfile', 'Ver perfil')}
                        </button>
                      </div>

                      {/* Checkbox */}
                      <div
                        className="relative shrink-0 mt-1 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={!!selected[id]} 
                          onChange={() => toggleSelect(id)} 
                        />
                        <div
                          onClick={() => toggleSelect(id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                          selected[id] 
                            ? 'bg-brand-500 border-brand-500' 
                            : 'border-gray-300 hover:border-brand-300'
                        }`}>
                          {selected[id] && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Portfolio thumbnails */}
                    {portfolio.length > 0 && (
                      <div className="mt-3 ml-15" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[11px] text-gray-400 font-medium">{t('client.requests.inviteModal.portfolio', 'Trabajos realizados')}</span>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {portfolio.slice(0, 5).map((item, idx) => (
                            <img
                              key={item._id || idx}
                              src={item.url}
                              alt={item.caption || `${name} - ${idx + 1}`}
                              title={item.caption || ''}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all duration-200 shrink-0"
                              loading="lazy"
                            />
                          ))}
                          {portfolio.length > 5 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                              +{portfolio.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>

        {/* Modal de perfil de proveedor (desde invitar) */}
        <ProviderProfileModal
          isOpen={!!profileTarget}
          onClose={() => setProfileTarget(null)}
          provider={profileTarget}
          initialTab="about"
          readOnly
        />

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

        {/* Modal de edición de solicitud (wizard) */}
        <RequestWizardModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          editRequest={editTarget}
          onEditSuccess={(updatedRequest) => {
            setRequests(prev => prev.map(r => r._id === updatedRequest._id ? { ...r, ...updatedRequest } : r));
            setEditTarget(null);
          }}
        />
      </div>
    </div>
  );
}

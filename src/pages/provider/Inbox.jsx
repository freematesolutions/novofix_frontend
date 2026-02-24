import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ChatRoom from '@/components/ui/ChatRoom.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { getSocket, on as socketOn, emit as socketEmit } from '@/state/socketClient.js';

export default function Inbox() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { viewRole, clearError, user, isAuthenticated, isRoleSwitching } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState([]);

  // Chat state - simplified, ChatRoom handles internal messaging
  const [chats, setChats] = useState([]);
  const [chatError, setChatError] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);
  
  // Estado para chat de negociación con cliente
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [negotiationChat, setNegotiationChat] = useState(null);
  const [negotiationProposal, setNegotiationProposal] = useState(null);
  const [loadingNegotiationChat, setLoadingNegotiationChat] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');


  useEffect(()=>{ clearError?.(); }, [clearError]);

  // Leer chatId de query params y seleccionarlo automáticamente cuando los chats estén cargados
  useEffect(() => {
    const chatFromUrl = searchParams.get('chat');
    if (chatFromUrl && chats.length > 0) {
      const chatToSelect = chats.find(c => (c._id || c.id) === chatFromUrl);
      if (chatToSelect && (!selectedChat || (selectedChat._id || selectedChat.id) !== chatFromUrl)) {
        setSelectedChat(chatToSelect);
        // Limpiar el param de la URL
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, chats, selectedChat, setSearchParams]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
  const { data } = await api.get('/provider/proposals');
      // API shape esperado: { success, data: { proposals: [], pagination: {...} } }
      const list = getArray(data, [['data','proposals'], ['proposals']]);
      setProposals(list);
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.inbox.errorLoading'));
    } finally { setLoading(false); }
  }, [isAuthenticated]);

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
    return <Alert type="warning">{t('provider.inbox.providerOnly')}</Alert>;
  }

  // Load user chats (provider side)
  const loadChats = useCallback(async () => {
    setChatError('');
    try {
      const { data } = await api.get('/chats');
      const list = getArray(data, [['data','chats'], ['chats']]);
      setChats(Array.isArray(list) ? list : []);
    } catch (err) {
      setChatError(err?.response?.data?.message || t('provider.inbox.errorLoadingChats'));
    }
  }, []);

  // Socket bindings for chat list updates (ChatRoom handles its own socket events)
  useEffect(() => {
    if (viewRole !== 'provider') return;
    const s = getSocket();
    socketRef.current = s;
    if (!s) return;

    // Update chat list when new messages arrive
    const offNew = socketOn('new_message', (payload) => {
      const cid = payload?.chatId || payload?.chat?._id;
      const msg = payload?.message || payload;
      if (!cid || !msg) return;
      setChats((prev) => {
        // bump chat to top by last activity if present
        const copy = Array.from(prev || []);
        const idx = copy.findIndex(c => (c._id || c.id) === cid);
        if (idx >= 0) {
          const updated = { ...copy[idx], lastMessage: msg, metadata: { ...(copy[idx]?.metadata || {}), lastActivity: new Date().toISOString() } };
          copy.splice(idx, 1);
          copy.unshift(updated);
        }
        return copy;
      });
    });
    
    const offTyping = socketOn('user_typing', ({ userId, chatId }) => {
      if (!chatId) return;
      setTypingUsers((prev) => ({ ...prev, [chatId]: { userId, ts: Date.now() } }));
    });
    const offStopped = socketOn('user_stopped_typing', ({ chatId }) => {
      if (!chatId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
    });
    return () => {
      try { offNew(); offTyping(); offStopped(); } catch { /* ignore */ }
    };
  }, [viewRole]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // On unmount, leave any joined chat
      try { if (selectedChat?._id) socketEmit('leave_chat', { chatId: selectedChat._id }); } catch { /* ignore */ }
    };
  }, [selectedChat]);

  const selectChat = (chat) => {
    if (!chat) return;
    setSelectedChat(chat);
  };

  // Abrir chat de negociación con el cliente (para propuestas enviadas)
  const openNegotiationChat = async (proposal) => {
    setLoadingNegotiationChat(true);
    setNegotiationProposal(proposal);
    try {
      const { data } = await api.post(`/chats/proposal/${proposal._id}`);
      if (data?.success && data?.data?.chat) {
        setNegotiationChat(data.data.chat);
        setNegotiationModalOpen(true);
      } else {
        toast.error(data?.message || t('toast.errorOpeningChat'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('toast.errorOpeningChat');
      toast.error(msg);
    } finally {
      setLoadingNegotiationChat(false);
    }
  };

  const closeNegotiationModal = () => {
    setNegotiationModalOpen(false);
    setNegotiationChat(null);
    setNegotiationProposal(null);
  };

  // Handler for new messages from ChatRoom - update chat list
  const handleNewMessage = useCallback((msg) => {
    if (!selectedChat?._id || !msg) return;
    setChats((prev) => {
      const copy = Array.from(prev || []);
      const idx = copy.findIndex(c => (c._id || c.id) === selectedChat._id);
      if (idx >= 0) {
        const updated = { ...copy[idx], lastMessage: msg, metadata: { ...(copy[idx]?.metadata || {}), lastActivity: new Date().toISOString() } };
        copy.splice(idx, 1);
        copy.unshift(updated);
      }
      return copy;
    });
  }, [selectedChat]);

  useEffect(() => { if (viewRole === 'provider') loadChats(); }, [viewRole, loadChats]);

  // Chat type configuration (same types as client Messages)
  const chatTypeConfig = useMemo(() => ({
    booking: {
      label: t('provider.inbox.typeBooking', 'Reservas'),
      icon: '📅',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    proposal_negotiation: {
      label: t('provider.inbox.typeEstimate', 'Estimados'),
      icon: '💰',
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      dot: 'bg-brand-500'
    },
    info_request: {
      label: t('provider.inbox.typeInquiry', 'Consultas'),
      icon: '💬',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      dot: 'bg-amber-500'
    },
    inquiry: {
      label: t('provider.inbox.typeInquiry', 'Consultas'),
      icon: '💬',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      dot: 'bg-amber-500'
    }
  }), [t]);

  // Filter tabs with counts
  const filterTabs = useMemo(() => {
    const counts = { all: chats.length, booking: 0, estimate: 0, inquiry: 0 };
    chats.forEach(c => {
      const type = c.chatType;
      if (type === 'booking') counts.booking++;
      else if (type === 'proposal_negotiation') counts.estimate++;
      else if (type === 'info_request' || type === 'inquiry') counts.inquiry++;
    });
    return [
      { key: 'all', label: t('provider.inbox.filterAll', 'Todos'), count: counts.all },
      { key: 'booking', label: t('provider.inbox.filterBookings', 'Reservas'), count: counts.booking, icon: '📅' },
      { key: 'estimate', label: t('provider.inbox.filterEstimates', 'Estimados'), count: counts.estimate, icon: '💰' },
      { key: 'inquiry', label: t('provider.inbox.filterInquiries', 'Consultas'), count: counts.inquiry, icon: '💬' }
    ];
  }, [chats, t]);

  // Filtered chats based on active filter
  const filteredChats = useMemo(() => {
    if (activeFilter === 'all') return chats;
    if (activeFilter === 'booking') return chats.filter(c => c.chatType === 'booking');
    if (activeFilter === 'estimate') return chats.filter(c => c.chatType === 'proposal_negotiation');
    if (activeFilter === 'inquiry') return chats.filter(c => c.chatType === 'info_request' || c.chatType === 'inquiry');
    return chats;
  }, [chats, activeFilter]);

  // Get other participant name (for provider, the other participant is the client)
  const getParticipantName = (chat) => {
    if (!chat) return t('provider.inbox.chat');
    const client = chat.participants?.client;
    return client?.profile?.firstName
      ? `${client.profile.firstName} ${client.profile.lastName || ''}`.trim()
      : chat.booking?.basicInfo?.title || t('provider.inbox.chat');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('provider.inbox.title')}</h1>
            <p className="text-sm sm:text-base text-brand-100">{t('provider.inbox.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Propuestas resumidas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-cyan-100 text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('provider.inbox.myProposals')}</h3>
            <p className="text-sm text-gray-500">{t('provider.inbox.proposalsCount', { count: proposals.length })}</p>
          </div>
        </div>
        
        <div className={`divide-y divide-gray-100 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          {(!Array.isArray(proposals) || proposals.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-1">{t('provider.inbox.noProposals')}</h4>
              <p className="text-sm text-gray-500 text-center">{t('provider.inbox.noProposalsDescription')}</p>
            </div>
          )}
          {(Array.isArray(proposals) ? proposals : []).map((p) => {
            const category = p?.serviceRequest?.basicInfo?.category || '';
            const subcategory = p?.serviceRequest?.basicInfo?.subcategory || '';
            const title = category
              ? (subcategory ? `${category} · ${subcategory}` : category)
              : t('provider.inbox.estimate');
            const amount = p?.pricing?.amount;
            const amountMin = p?.pricing?.minAmount;
            const amountMax = p?.pricing?.maxAmount;
            const currency = p?.pricing?.currency || 'USD';
            const requestId = p?.serviceRequest?._id || p?.serviceRequest;
            const clientProfile = p?.serviceRequest?.client?.profile;
            const clientName = clientProfile ? `${clientProfile.firstName || ''} ${clientProfile.lastName || ''}`.trim() : '';
            
            const statusConfig = {
              sent: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⏳', label: t('provider.inbox.status.sent', 'Enviado') },
              pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⏳', label: t('provider.inbox.status.pending', 'Pendiente') },
              viewed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '👁️', label: t('provider.inbox.status.viewed', 'Visto por el cliente') },
              accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓', label: t('provider.inbox.status.accepted', 'Aceptado') },
              rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '✗', label: t('provider.inbox.status.rejected', 'Rechazado') },
              withdrawn: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '↩', label: t('provider.inbox.status.withdrawn', 'Retirado') },
              draft: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', icon: '📝', label: t('provider.inbox.status.draft', 'Borrador') },
            };
            const currentStatus = statusConfig[p.status] || statusConfig.pending;
            
            return (
              <div key={p._id} className="group p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{title}</h4>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border`}>
                        <span>{currentStatus.icon}</span>
                        {currentStatus.label}
                      </span>
                    </div>
                    {/* Client name */}
                    {clientName && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-800">{clientName}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {(amount || (amountMin && amountMax)) && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {amountMin && amountMax
                            ? `${Intl.NumberFormat('es-AR',{style:'currency',currency}).format(amountMin)} - ${Intl.NumberFormat('es-AR',{style:'currency',currency}).format(amountMax)}`
                            : Intl.NumberFormat('es-AR',{style:'currency',currency}).format(amount)
                          }
                        </span>
                      )}
                      {p.createdAt && (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {new Date(p.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Botón Negociar - solo para propuestas enviadas o vistas */}
                    {['sent', 'viewed'].includes(p.status) && (
                      <button
                        type="button"
                        onClick={() => openNegotiationChat(p)}
                        disabled={loadingNegotiationChat && negotiationProposal?._id === p._id}
                        title={t('provider.inbox.negotiateTooltip')}
                        className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-sm font-medium text-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingNegotiationChat && negotiationProposal?._id === p._id ? (
                          <Spinner size="sm" className="text-blue-600" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        )}
                        {t('provider.inbox.negotiate')}
                      </button>
                    )}
                    {requestId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/empleos/${requestId}`)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 text-sm font-medium text-gray-700 transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {t('provider.inbox.viewRequest')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chats List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header with filter tabs */}
          <div className="p-4 border-b border-gray-100 bg-linear-to-r from-brand-50/50 to-cyan-50/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              </div>
              <span className="font-semibold text-gray-900">{t('provider.inbox.conversations')}</span>
              <span className="text-sm text-gray-500 ml-auto">{chats.length}</span>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === tab.key
                      ? 'bg-linear-to-r from-brand-500 to-cyan-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {tab.icon && <span>{tab.icon}</span>}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${
                      activeFilter === tab.key
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {chatError && <div className="p-3 text-sm text-red-600 bg-red-50">{chatError}</div>}
          <div className="max-h-100 overflow-auto">
            {filteredChats.length > 0 ? filteredChats.map((c) => {
              const id = c._id || c.id;
              const contentObj = c.lastMessage?.content;
              const last = typeof contentObj === 'string' 
                ? contentObj 
                : (contentObj?.text || (contentObj?.attachments?.length ? `📎 ${t('provider.inbox.attachment')}` : ''));
              const isActive = selectedChat && (selectedChat._id || selectedChat.id) === id;
              const name = getParticipantName(c);
              const initial = name[0]?.toUpperCase() || 'C';
              const unread = c?.unreadCount?.provider || 0;
              const lastTime = c.metadata?.lastActivity || c.updatedAt;
              const typeConf = chatTypeConfig[c.chatType] || chatTypeConfig.booking;
              return (
                <button 
                  key={id} 
                  onClick={() => selectChat(c)} 
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-all ${isActive ? 'bg-brand-50/50 border-l-3 border-l-brand-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with type dot */}
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-white ${
                        isActive 
                          ? 'bg-linear-to-br from-brand-500 to-cyan-500' 
                          : 'bg-linear-to-br from-gray-400 to-gray-500'
                      }`}>
                        {initial}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${typeConf.dot}`}
                        title={typeConf.label}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-medium truncate ${unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                          {name}
                        </h4>
                        {unread > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-linear-to-r from-brand-500 to-cyan-500 text-white shadow-md">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      {/* Chat type badge */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border mt-0.5 ${typeConf.color}`}>
                        <span>{typeConf.icon}</span>
                        {typeConf.label}
                      </span>
                      <p className={`text-sm truncate mt-0.5 ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {last || t('provider.inbox.noMessages')}
                      </p>
                      {lastTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(lastTime).toLocaleDateString('es', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            }) : chats.length > 0 && filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">{t('provider.inbox.noChatsInFilter', 'Sin conversaciones en esta categoría')}</h4>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1"
                >
                  {t('provider.inbox.showAll', 'Ver todas')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-sm text-gray-500">{t('provider.inbox.noChats')}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Area - Using ChatRoom component */}
        <div className="lg:col-span-2">
          {!selectedChat ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-125 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-brand-100 to-cyan-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('provider.inbox.selectConversation')}</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">{t('provider.inbox.selectConversationDesc')}</p>
            </div>
          ) : (
            <ChatRoom
              chatId={selectedChat._id}
              chat={selectedChat}
              currentUserId={user?.id || user?._id}
              onNewMessage={handleNewMessage}
              placeholder={t('provider.inbox.writeMessage')}
              className="min-h-125"
              maxHeight="400px"
              showHeader={true}
              userRole="provider"
              onClose={() => setSelectedChat(null)}
            />
          )}
        </div>
      </div>

      {/* Modal de Chat de Negociación con Cliente */}
      <Modal
        open={negotiationModalOpen}
        onClose={closeNegotiationModal}
        size="xl"
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900">
                {t('provider.inbox.negotiateProposal')}
              </span>
              <p className="text-sm text-gray-500 font-normal">
                {t('provider.inbox.proposalLabel')}: {negotiationProposal?.pricing?.amount 
                  ? Intl.NumberFormat('es-AR', { style: 'currency', currency: negotiationProposal?.pricing?.currency || 'USD' }).format(negotiationProposal.pricing.amount)
                  : t('provider.inbox.noPrice')}
              </p>
            </div>
          </div>
        }
      >
        <div className="h-[60vh] flex flex-col">
          {negotiationChat && (
            <ChatRoom 
              chatId={negotiationChat._id || negotiationChat.id}
              chat={negotiationChat}
              currentUserId={user?.id || user?._id}
              showHeader={false}
              maxHeight="100%"
              userRole="provider"
            />
          )}
        </div>
        
        {/* Información del modal */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            💬 {t('provider.inbox.negotiateInfo')}
          </p>
          <button
            onClick={closeNegotiationModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            {t('provider.inbox.close')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

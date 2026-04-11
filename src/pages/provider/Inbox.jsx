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
  // Now works with consolidated conversations (grouped by participant pair)
  const [chats, setChats] = useState([]);
  const [chatError, setChatError] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);
  
  // Estado para chat de negociación con cliente
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [negotiationChat, setNegotiationChat] = useState(null);
  const [negotiationProposal, setNegotiationProposal] = useState(null);
  const [loadingNegotiationChat, setLoadingNegotiationChat] = useState(false);

  useEffect(()=>{ clearError?.(); }, [clearError]);

  // Leer chatId de query params y seleccionarlo automáticamente cuando los chats estén cargados
  // Soporta ?chat=<conversationId> y también ?chat=<chatId> (legacy: busca la conversación que lo contiene)
  useEffect(() => {
    const chatFromUrl = searchParams.get('chat');
    if (!chatFromUrl || chatFromUrl === selectedConversationId) return;

    // Intentar como conversationId directo
    const directMatch = chats.find(c => (c._id || c.conversationId) === chatFromUrl);
    if (directMatch) {
      setSelectedConversationId(chatFromUrl);
      setSearchParams({}, { replace: true });
      return;
    }

    // Buscar la conversación que contiene este chatId en relatedChats
    const parentConv = chats.find(c =>
      c.relatedChats?.some(rc => rc._id === chatFromUrl)
    );
    if (parentConv) {
      setSelectedConversationId(parentConv._id || parentConv.conversationId);
      setSearchParams({}, { replace: true });
      return;
    }

    // Si los chats ya cargaron y no hay match, establecer como selected directamente
    if (chats.length > 0) {
      setSelectedConversationId(chatFromUrl);
      setSearchParams({}, { replace: true });
    }
    // Si chats.length === 0, mantener el param en URL para reintentar cuando carguen
  }, [searchParams, selectedConversationId, setSearchParams, chats]);

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

    // Update chat list when new messages arrive (consolidated)
    const offNew = socketOn('new_message', (payload) => {
      const cid = payload?.chatId || payload?.chat?._id;
      const msg = payload?.message || payload;
      if (!cid || !msg) return;
      setChats((prev) => {
        const copy = Array.from(prev || []);
        // Buscar la conversación que contiene este chatId
        const idx = copy.findIndex(c =>
          c.relatedChats?.some(rc => rc._id === cid) ||
          c.primaryChatId === cid ||
          (c._id || c.conversationId) === cid
        );
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
      try {
        const conv = chats.find(c => (c._id || c.conversationId) === selectedConversationId);
        if (conv?.relatedChats) {
          conv.relatedChats.forEach(rc => socketEmit('leave_chat', { chatId: rc._id }));
        } else if (conv?.primaryChatId) {
          socketEmit('leave_chat', { chatId: conv.primaryChatId });
        }
      } catch { /* ignore */ }
    };
  }, [selectedConversationId, chats]);

  // Handler for new messages from ChatRoom - update chat list
  const handleNewMessage = useCallback((msg) => {
    if (!selectedConversationId || !msg) return;
    setChats((prev) => {
      const copy = Array.from(prev || []);
      const idx = copy.findIndex(c => (c._id || c.conversationId) === selectedConversationId);
      if (idx >= 0) {
        const updated = { ...copy[idx], lastMessage: msg, metadata: { ...(copy[idx]?.metadata || {}), lastActivity: new Date().toISOString() } };
        copy.splice(idx, 1);
        copy.unshift(updated);
      }
      return copy;
    });
  }, [selectedConversationId]);

  useEffect(() => { if (viewRole === 'provider') loadChats(); }, [viewRole, loadChats]);

  // ── Computed values from selectedConversationId ──
  const selectedChat = useMemo(() => {
    return chats.find(c => (c._id || c.conversationId) === selectedConversationId);
  }, [chats, selectedConversationId]);

  // Determinar el participantId (el otro usuario) para cargar mensajes consolidados
  const participantId = useMemo(() => {
    if (!selectedChat) return null;
    const myId = user?.id || user?._id;
    const clientId = String(selectedChat.participants?.client?._id || selectedChat.participants?.client || '');
    const providerId = String(selectedChat.participants?.provider?._id || selectedChat.participants?.provider || '');
    // Para el proveedor, el participante es el cliente
    return String(myId) === providerId ? clientId : providerId;
  }, [selectedChat, user]);

  // El chatId primario para enviar mensajes
  const primaryChatId = useMemo(() => {
    if (!selectedChat) return null;
    return selectedChat.primaryChatId || selectedChat.relatedChats?.[0]?._id;
  }, [selectedChat]);

  // ── Early returns (AFTER all hooks) ──
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

  // Non-hook helpers (these are plain functions, safe after early returns)
  const handleSelectChat = (conversationId) => {
    if (!conversationId) return;
    setSelectedConversationId(conversationId);
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

  // Get other participant name (for provider, the other participant is the client)
  const getParticipantName = (chat) => {
    if (!chat) return t('provider.inbox.chat');
    const client = chat.participants?.client;
    return client?.profile?.firstName
      ? `${client.profile.firstName} ${client.profile.lastName || ''}`.trim()
      : chat.booking?.basicInfo?.title || t('provider.inbox.chat');
  };

  return (
    <main className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-brand-800 p-6 sm:p-8 text-white relative">
        {/* Decorative elements (non-interactive) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
        
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-200 text-brand-600">
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
            const rawCategory = p?.serviceRequest?.basicInfo?.category || '';
            const translatedCategory = rawCategory ? t(`home.categories.${rawCategory}`, rawCategory) : '';
            const subcategory = p?.serviceRequest?.basicInfo?.subcategory || '';
            const title = translatedCategory
              ? (subcategory ? `${translatedCategory} · ${subcategory}` : translatedCategory)
              : t('provider.inbox.estimate');
            const amount = p?.pricing?.amount;
            const amountMin = p?.pricing?.minAmount;
            const amountMax = p?.pricing?.maxAmount;
            const currency = p?.pricing?.currency || 'USD';
            const requestId = p?.serviceRequest?._id || p?.serviceRequest;
            const clientProfile = p?.serviceRequest?.client?.profile;
            const clientName = clientProfile ? `${clientProfile.firstName || ''} ${clientProfile.lastName || ''}`.trim() : '';
            
            const statusConfig = {
              sent: { bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: '⏳', label: t('provider.inbox.status.sent', 'Enviado') },
              pending: { bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: '⏳', label: t('provider.inbox.status.pending', 'Pendiente') },
              viewed: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', icon: '👁️', label: t('provider.inbox.status.viewed', 'Visto por el cliente') },
              accepted: { bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: '✓', label: t('provider.inbox.status.accepted', 'Aceptado') },
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
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-800">{clientName}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {(amount || (amountMin && amountMax)) && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-accent-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {amountMin && amountMax
                            ? `${Intl.NumberFormat('en-US',{style:'currency',currency}).format(amountMin)} - ${Intl.NumberFormat('en-US',{style:'currency',currency}).format(amountMax)}`
                            : Intl.NumberFormat('en-US',{style:'currency',currency}).format(amount)
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
                        className="px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 hover:border-brand-300 hover:bg-brand-100 text-sm font-medium text-brand-600 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingNegotiationChat && negotiationProposal?._id === p._id ? (
                          <Spinner size="sm" className="text-brand-600" />
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
          <div className="p-4 border-b border-gray-100 bg-linear-to-r from-brand-50/50 to-brand-100/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-brand-700 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              </div>
              <span className="font-semibold text-gray-900">{t('provider.inbox.conversations')}</span>
              <span className="text-sm text-gray-500 ml-auto">{chats.length}</span>
            </div>
          </div>
          {chatError && <div className="p-3 text-sm text-red-600 bg-red-50">{chatError}</div>}
          <div className="max-h-100 overflow-auto">
            {chats.length > 0 ? chats.map((c) => {
              const id = c._id || c.conversationId || c.id;
              const contentObj = c.lastMessage?.content;
              const last = typeof contentObj === 'string' 
                ? contentObj 
                : (contentObj?.text || (contentObj?.attachments?.length ? `📎 ${t('provider.inbox.attachment')}` : ''));
              const isActive = selectedConversationId === id;
              const name = getParticipantName(c);
              const initial = name[0]?.toUpperCase() || 'C';
              const unread = c?.unreadCount?.provider || 0;
              const lastTime = c.metadata?.lastActivity || c.updatedAt;
              return (
                <button 
                  key={id} 
                  onClick={() => handleSelectChat(id)} 
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-all ${isActive ? 'bg-brand-50/50 border-l-3 border-l-brand-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-white ${
                        isActive 
                          ? 'bg-linear-to-br from-brand-500 to-brand-700' 
                          : 'bg-linear-to-br from-gray-400 to-gray-500'
                      }`}>
                        {initial}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-medium truncate ${unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                          {name}
                        </h4>
                        {unread > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-linear-to-r from-brand-500 to-brand-700 text-white shadow-md">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
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
            }) : (
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
          {!selectedConversationId || !selectedChat ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-125 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('provider.inbox.selectConversation')}</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">{t('provider.inbox.selectConversationDesc')}</p>
            </div>
          ) : (
            <ChatRoom
              chatId={primaryChatId}
              chat={selectedChat}
              currentUserId={user?.id || user?._id}
              onNewMessage={handleNewMessage}
              placeholder={t('provider.inbox.writeMessage')}
              className="min-h-125"
              maxHeight="400px"
              showHeader={true}
              userRole="provider"
              participantId={participantId}
              relatedChats={selectedChat?.relatedChats}
              onClose={() => setSelectedConversationId(null)}
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
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900">
                {t('provider.inbox.negotiateProposal')}
              </span>
              <p className="text-sm text-gray-500 font-normal">
                {t('provider.inbox.proposalLabel')}: {negotiationProposal?.pricing?.amount 
                  ? Intl.NumberFormat('en-US', { style: 'currency', currency: negotiationProposal?.pricing?.currency || 'USD' }).format(negotiationProposal.pricing.amount)
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
    </main>
  );
}

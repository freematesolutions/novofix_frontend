import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import ChatRoom from '@/components/ui/ChatRoom.jsx';
import RequestWizardModal from '@/components/ui/RequestWizardModal.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { getSocket, on as socketOn, emit as socketEmit } from '@/state/socketClient.js';

/**
 * Página de Mensajes para Clientes
 * Permite a los clientes ver y gestionar sus conversaciones con proveedores
 * Usa el componente ChatRoom modular para chat en tiempo real
 */
export default function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewRole, clearError, user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chat state
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Estado para aceptar/rechazar propuesta desde el chat
  const [isAcceptingProposal, setIsAcceptingProposal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // request object to edit via wizard modal
  const [editLoading, setEditLoading] = useState(false);
  
  // Limpiar errores al montar
  useEffect(() => { clearError?.(); }, [clearError]);

  // Leer chatId de query params y seleccionarlo automáticamente
  useEffect(() => {
    const chatFromUrl = searchParams.get('chat');
    if (chatFromUrl && chatFromUrl !== selectedChatId) {
      setSelectedChatId(chatFromUrl);
      // Limpiar el param de la URL para evitar reseleccionar
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, selectedChatId, setSearchParams]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Cargar lista de chats del cliente
  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/chats');
      const list = getArray(data, [['data', 'chats'], ['chats']]);
      setChats(Array.isArray(list) ? list : []);
      
      // Extraer unread counts
      const counts = {};
      (list || []).forEach(chat => {
        const id = chat._id || chat.id;
        counts[id] = chat.unreadCount?.client || 0;
      });
      setUnreadCounts(counts);
    } catch (err) {
      setError(err?.response?.data?.message || t('client.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar chats al montar
  useEffect(() => {
    if (isAuthenticated && viewRole === 'client') {
      loadChats();
    }
  }, [isAuthenticated, viewRole, loadChats]);

  // Escuchar eventos de socket para actualizar lista de chats
  useEffect(() => {
    if (viewRole !== 'client') return;
    const socket = getSocket();
    if (!socket) return;

    // Nuevo mensaje - actualizar chat en la lista
    const offNewMessage = socketOn('new_message', (payload) => {
      const chatId = payload?.chatId || payload?.chat?._id;
      const msg = payload?.message || payload;
      if (!chatId || !msg) return;

      setChats(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => (c._id || c.id) === chatId);
        if (idx >= 0) {
          const updated = {
            ...copy[idx],
            lastMessage: msg,
            metadata: {
              ...copy[idx]?.metadata,
              lastActivity: new Date().toISOString()
            }
          };
          copy.splice(idx, 1);
          copy.unshift(updated);
        }
        return copy;
      });

      // Incrementar unread si no es el chat seleccionado
      if (selectedChatId !== chatId) {
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1
        }));
      }
    });

    // Chat creado
    const offChatCreated = socketOn('chat_created', (chat) => {
      if (chat) {
        setChats(prev => [chat, ...prev]);
      }
    });

    return () => {
      try {
        offNewMessage?.();
        offChatCreated?.();
      } catch { /* ignore */ }
    };
  }, [viewRole, selectedChatId]);

  // Seleccionar chat
  const handleSelectChat = useCallback((chatId) => {
    setSelectedChatId(chatId);
    // Resetear unread count
    setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
    
    // Emitir al socket que entramos al chat
    socketEmit('join_chat', { chatId });
  }, []);

  // Volver a la lista de chats (mobile)
  const handleBackToList = useCallback(() => {
    if (selectedChatId) {
      socketEmit('leave_chat', { chatId: selectedChatId });
    }
    setSelectedChatId(null);
  }, [selectedChatId]);

  // Chat info para el componente ChatRoom
  const selectedChat = useMemo(() => {
    return chats.find(c => (c._id || c.id) === selectedChatId);
  }, [chats, selectedChatId]);

  // Extraer información de propuesta del chat seleccionado (si tiene una asociada)
  const proposalInfo = useMemo(() => {
    if (!selectedChat?.proposal) return null;
    const proposal = selectedChat.proposal;
    const provider = selectedChat.participants?.provider;
    const providerName = provider?.providerProfile?.businessName || 
                         provider?.profile?.firstName || 
                         t('client.messages.provider');
    
    return {
      proposalId: proposal._id || proposal.id || proposal,
      amount: proposal.pricing?.amount,
      amountMin: proposal.pricing?.amountMin,
      amountMax: proposal.pricing?.amountMax,
      isRange: proposal.pricing?.isRange || false,
      currency: proposal.pricing?.currency || 'US$',
      providerName,
      status: proposal.status || 'pending'
    };
  }, [selectedChat, t]);

  // Aceptar propuesta desde el chat
  const handleAcceptProposal = useCallback(async (proposalId) => {
    if (!proposalId || isAcceptingProposal) return;
    
    setIsAcceptingProposal(true);
    setError('');
    try {
      await api.patch(`/proposals/${proposalId}/accept`);
      
      // Actualizar el chat local para reflejar el cambio
      setChats(prev => prev.map(chat => {
        const id = chat._id || chat.id;
        if (id === selectedChatId && chat.proposal) {
          return {
            ...chat,
            proposal: {
              ...chat.proposal,
              status: 'accepted'
            }
          };
        }
        return chat;
      }));
      
      // Recargar chats para obtener datos actualizados
      await loadChats();
      
    } catch (err) {
      setError(err?.response?.data?.message || t('client.messages.acceptError', 'Error al aceptar propuesta'));
    } finally {
      setIsAcceptingProposal(false);
    }
  }, [selectedChatId, isAcceptingProposal, loadChats, t]);

  // Rechazar propuesta desde el chat
  const handleRejectProposal = useCallback(async (proposalId) => {
    if (!proposalId || isAcceptingProposal) return;
    
    setIsAcceptingProposal(true);
    setError('');
    try {
      await api.patch(`/proposals/${proposalId}/reject`);
      
      // Actualizar el chat local
      setChats(prev => prev.map(chat => {
        const id = chat._id || chat.id;
        if (id === selectedChatId && chat.proposal) {
          return {
            ...chat,
            proposal: {
              ...chat.proposal,
              status: 'rejected'
            }
          };
        }
        return chat;
      }));
      
      // Recargar chats
      await loadChats();
      
    } catch (err) {
      setError(err?.response?.data?.message || t('client.messages.rejectError', 'Error al rechazar propuesta'));
    } finally {
      setIsAcceptingProposal(false);
    }
  }, [selectedChatId, isAcceptingProposal, loadChats, t]);

  // Chat type configuration
  const chatTypeConfig = useMemo(() => ({
    booking: {
      label: t('client.messages.typeBooking', 'Reservas'),
      icon: '📅',
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      dot: 'bg-brand-500'
    },
    proposal_negotiation: {
      label: t('client.messages.typeEstimate', 'Estimados'),
      icon: '💰',
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      dot: 'bg-brand-500'
    },
    info_request: {
      label: t('client.messages.typeInquiry', 'Consultas'),
      icon: '💬',
      color: 'text-accent-600 bg-accent-50 border-accent-200',
      dot: 'bg-accent-500'
    },
    inquiry: {
      label: t('client.messages.typeInquiry', 'Consultas'),
      icon: '💬',
      color: 'text-accent-600 bg-accent-50 border-accent-200',
      dot: 'bg-accent-500'
    }
  }), [t]);

  // Filter tabs
  const filterTabs = useMemo(() => {
    const counts = { all: chats.length, booking: 0, estimate: 0, inquiry: 0 };
    chats.forEach(c => {
      const type = c.chatType;
      if (type === 'booking') counts.booking++;
      else if (type === 'proposal_negotiation') counts.estimate++;
      else if (type === 'info_request' || type === 'inquiry') counts.inquiry++;
    });
    return [
      { key: 'all', label: t('client.messages.filterAll', 'Todos'), count: counts.all },
      { key: 'booking', label: t('client.messages.filterBookings', 'Reservas'), count: counts.booking, icon: '📅' },
      { key: 'estimate', label: t('client.messages.filterEstimates', 'Estimados'), count: counts.estimate, icon: '💰' },
      { key: 'inquiry', label: t('client.messages.filterInquiries', 'Consultas'), count: counts.inquiry, icon: '💬' }
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

  // Nombre del otro participante
  const getParticipantName = (chat) => {
    if (!chat) return t('client.messages.chat');
    // Para cliente, mostrar el nombre del proveedor
    // participants es un objeto { client, provider }, no un array
    const provider = chat.participants?.provider;
    return provider?.providerProfile?.businessName || 
           provider?.profile?.firstName ||
           chat.booking?.basicInfo?.title || 
           t('client.messages.provider');
  };

  if (!isAuthenticated) return null;

  if (viewRole !== 'client') {
    return <Alert type="warning">{t('client.requests.clientOnlySection')}</Alert>;
  }

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return (
  <main>
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-brand-800 p-6 sm:p-8 text-white relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{t('client.messages.title')}</h1>
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full bg-white text-brand-600 shadow-lg">
                  {totalUnread > 99 ? '99+' : totalUnread} {t('client.messages.new', { count: totalUnread })}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-brand-100 mt-1">
              {t('client.messages.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Chat Layout - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List - Hidden on mobile when chat is selected */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
          selectedChatId ? 'hidden lg:block' : 'block'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-linear-to-r from-brand-50/50 to-brand-100/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-brand-700 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">{t('client.messages.conversations')}</span>
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
                      ? 'bg-linear-to-r from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20'
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

          {/* Chat Items */}
          <div className="max-h-125 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-3 border-brand-100 border-t-brand-500 animate-spin" />
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const id = chat._id || chat.id;
                const isActive = selectedChatId === id;
                const unread = unreadCounts[id] || 0;
                // Extraer texto del mensaje - content puede ser string u objeto {text, attachments}
                const contentObj = chat.lastMessage?.content;
                const lastMsg = typeof contentObj === 'string' 
                  ? contentObj 
                  : (contentObj?.text || (contentObj?.attachments?.length ? '📎 Archivo adjunto' : ''));
                const name = getParticipantName(chat);
                const initial = name[0]?.toUpperCase() || 'P';
                const lastTime = chat.metadata?.lastActivity || chat.updatedAt;
                const typeConf = chatTypeConfig[chat.chatType] || chatTypeConfig.booking;

                return (
                  <button
                    key={id}
                    onClick={() => handleSelectChat(id)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-all ${
                      isActive ? 'bg-brand-50/50 border-l-3 border-l-brand-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-white ${
                          isActive 
                            ? 'bg-linear-to-br from-brand-500 to-brand-700' 
                            : 'bg-linear-to-br from-gray-400 to-gray-500'
                        }`}>
                          {initial}
                        </div>
                        {/* Chat type dot indicator */}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${typeConf.dot}`}
                          title={typeConf.label}
                        >
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-medium truncate ${
                            unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {name}
                          </h4>
                          {unread > 0 && (
                            <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-linear-to-r from-brand-500 to-brand-700 text-white shadow-md">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                        {/* Chat type badge */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border mt-0.5 ${typeConf.color}`}>
                          <span>{typeConf.icon}</span>
                          {typeConf.label}
                        </span>
                        <p className={`text-sm truncate mt-0.5 ${
                          unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                        }`}>
                          {lastMsg || t('client.messages.noMessages')}
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
              })
            ) : chats.length > 0 && filteredChats.length === 0 ? (
              /* No results for active filter but chats exist */
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">{t('client.messages.noChatsInFilter', 'Sin conversaciones en esta categoría')}</h4>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1"
                >
                  {t('client.messages.showAll', 'Ver todas')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">{t('client.messages.noConversations')}</h4>
                <p className="text-sm text-gray-500 text-center">
                  {t('client.messages.noConversationsDescription')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`lg:col-span-2 ${
          selectedChatId ? 'block' : 'hidden lg:block'
        }`}>
          {selectedChatId ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Mobile back button */}
              <div className="lg:hidden flex items-center gap-3 p-3 border-b border-gray-100 bg-gray-50">
                <button
                  onClick={handleBackToList}
                  className="p-2 -m-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-medium text-gray-900">
                  {getParticipantName(selectedChat)}
                </span>
              </div>

              {/* ChatRoom Component */}
              <ChatRoom
                chatId={selectedChatId}
                chat={selectedChat}
                currentUserId={user?.id || user?._id}
                className="h-125 lg:h-150"
                showHeader={true}
                onChatError={(err) => setError(err)}
                // Props para aceptar/rechazar propuesta desde el chat
                proposalInfo={proposalInfo}
                onAcceptProposal={handleAcceptProposal}
                onRejectProposal={handleRejectProposal}
                isAcceptingProposal={isAcceptingProposal}
                userRole="client"
                onEditRequest={async (serviceRequestId) => {
                  try {
                    setEditLoading(true);
                    const { data } = await api.get(`/client/requests/${serviceRequestId}`);
                    const req = data?.data?.request || data?.request || data;
                    setEditTarget(req);
                  } catch {
                    // fallback: navigate to requests page
                    navigate('/mis-solicitudes');
                  } finally {
                    setEditLoading(false);
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-125 lg:h-150 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {t('client.messages.selectConversation')}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                {t('client.messages.selectConversationDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Loading overlay para edición */}
    {editLoading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-700">{t('common.loading', 'Cargando...')}</span>
        </div>
      </div>
    )}

    {/* Modal de edición de solicitud (wizard) */}
    <RequestWizardModal
      isOpen={!!editTarget}
      onClose={() => setEditTarget(null)}
      editRequest={editTarget}
      onEditSuccess={() => {
        setEditTarget(null);
      }}
    />
  </main>
  );
}

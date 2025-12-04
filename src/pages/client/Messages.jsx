import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import ChatRoom from '@/components/ui/ChatRoom.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { getSocket, on as socketOn, emit as socketEmit } from '@/state/socketClient.js';

/**
 * Página de Mensajes para Clientes
 * Permite a los clientes ver y gestionar sus conversaciones con proveedores
 * Usa el componente ChatRoom modular para chat en tiempo real
 */
export default function Messages() {
  const navigate = useNavigate();
  const { viewRole, clearError, user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chat state
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Limpiar errores al montar
  useEffect(() => { clearError?.(); }, [clearError]);

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
      setError(err?.response?.data?.message || 'No se pudieron cargar las conversaciones');
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

  // Nombre del otro participante
  const getParticipantName = (chat) => {
    if (!chat) return 'Chat';
    // Para cliente, mostrar el nombre del proveedor
    const provider = chat.participants?.find(p => p?.role === 'provider' || p?.user?.role === 'provider');
    return provider?.name || provider?.user?.name || 
           chat.booking?.basicInfo?.title || 
           'Proveedor';
  };

  if (!isAuthenticated) return null;

  if (viewRole !== 'client') {
    return <Alert type="warning">Esta sección es para clientes.</Alert>;
  }

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 p-6 sm:p-8 text-white relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-xl shadow-brand-500/25">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">Mis Mensajes</h1>
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full bg-white text-brand-600 shadow-lg">
                  {totalUnread > 99 ? '99+' : totalUnread} nuevo{totalUnread !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-brand-100 mt-1">
              Conversa con los proveedores sobre tus servicios
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
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-linear-to-r from-brand-50/50 to-cyan-50/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">Conversaciones</span>
            <span className="text-sm text-gray-500 ml-auto">{chats.length}</span>
          </div>

          {/* Chat Items */}
          <div className="max-h-[500px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-3 border-brand-100 border-t-brand-500 animate-spin" />
              </div>
            ) : chats.length > 0 ? (
              chats.map((chat) => {
                const id = chat._id || chat.id;
                const isActive = selectedChatId === id;
                const unread = unreadCounts[id] || 0;
                const lastMsg = chat.lastMessage?.content?.text || 
                               (typeof chat.lastMessage?.content === 'string' ? chat.lastMessage.content : '');
                const name = getParticipantName(chat);
                const initial = name[0]?.toUpperCase() || 'P';
                const lastTime = chat.metadata?.lastActivity || chat.updatedAt;

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
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-white ${
                        isActive 
                          ? 'bg-linear-to-br from-brand-500 to-cyan-500' 
                          : 'bg-linear-to-br from-gray-400 to-gray-500'
                      }`}>
                        {initial}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-medium truncate ${
                            unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {name}
                          </h4>
                          {unread > 0 && (
                            <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-linear-to-r from-brand-500 to-cyan-500 text-white shadow-md">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate mt-0.5 ${
                          unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                        }`}>
                          {lastMsg || 'Sin mensajes'}
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
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">Sin conversaciones</h4>
                <p className="text-sm text-gray-500 text-center">
                  Las conversaciones con proveedores aparecerán aquí
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
                currentUserId={user?._id}
                className="h-[500px] lg:h-[600px]"
                showHeader={true}
                participantName={getParticipantName(selectedChat)}
                onChatError={(err) => setError(err)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[500px] lg:h-[600px] flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-brand-100 to-cyan-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Selecciona una conversación
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                Elige una conversación de la lista para comenzar a chatear con el proveedor
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

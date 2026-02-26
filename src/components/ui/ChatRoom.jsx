import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Spinner from './Spinner.jsx';
import api from '@/state/apiClient.js';
import { getSocket, on as socketOn, emit as socketEmit } from '@/state/socketClient.js';
import { compressImage } from '@/utils/fileCompression.js';
import { useTranslation } from 'react-i18next';

/**
 * ChatRoom Component - Componente de chat en tiempo real reutilizable
 * Features:
 * - Mensajes en tiempo real con WebSocket
 * - Indicador de escritura
 * - Auto-scroll inteligente
 * - Soporte para multimedia (imágenes, archivos)
 * - Estados de mensaje (enviado, entregado, leído)
 * - Diseño premium y responsivo
 */

const Icons = {
  Send: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Attachment: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  Image: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Emoji: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: ({ className = 'w-3 h-3' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  DoubleCheck: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  EmptyChat: ({ className = 'w-24 h-24' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Reply: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Close: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

// Emojis rápidos para reacciones
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Typing Indicator Component
const TypingIndicator = memo(({ userName }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl rounded-bl-md max-w-fit animate-fade-in">
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <span 
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
    <span className="text-xs text-gray-500">{userName || 'Escribiendo'}...</span>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

TypingIndicator.propTypes = {
  userName: PropTypes.string
};

// Message Bubble Component with Reactions and Reply support
const MessageBubble = memo(({ 
  message, 
  isMine, 
  showAvatar, 
  userName,
  onReply,
  onReact,
  allMessages = []
}) => {
  const { t, i18n } = useTranslation();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef(null);
  const bubbleRef = useRef(null);
  
  // Obtener texto del mensaje, con soporte para traducción de mensajes de sistema
  const rawText = message?.content?.text ?? (typeof message?.content === 'string' ? message.content : '');
  const translationKey = message?.content?.translationKey;
  const translationParams = message?.content?.translationParams || {};
  const isSystemMessage = message?.type === 'system' || message?.senderModel === 'System';
  
  // Si hay clave de traducción y existe, usar traducción; sino intentar detectar patrón en mensajes de sistema antiguos
  const text = useMemo(() => {
    // Si tiene clave de traducción explícita, usarla
    if (translationKey && i18n?.exists?.(translationKey)) {
      return t(translationKey, translationParams);
    }
    
    // Para mensajes de sistema sin translationKey, intentar detectar el patrón y traducir
    if (isSystemMessage && rawText) {
      // Detectar patrón: "💬 Conversación iniciada sobre la propuesta de US$ X..."
      const proposalMatch = rawText.match(/💬\s*Conversación iniciada sobre la propuesta de ([^.]+)\./);
      if (proposalMatch && i18n?.exists?.('chat.system.proposalStarted')) {
        return t('chat.system.proposalStarted', { formattedAmount: proposalMatch[1] });
      }
      
      // Detectar patrón: "💬 Conversación iniciada sobre la propuesta."
      if (rawText.includes('💬') && rawText.includes('propuesta') && i18n?.exists?.('chat.system.proposalStartedNoAmount')) {
        // Si no tiene monto específico
        if (!proposalMatch) {
          return t('chat.system.proposalStartedNoAmount');
        }
      }
      
      // Detectar patrón: "📅 Conversación iniciada sobre la reserva..."
      if (rawText.includes('📅') && rawText.includes('reserva') && i18n?.exists?.('chat.system.bookingStarted')) {
        return t('chat.system.bookingStarted');
      }
    }
    
    return rawText;
  }, [translationKey, translationParams, rawText, t, i18n, isSystemMessage]);
  
  const attachments = message?.content?.attachments || [];
  const timestamp = message?.createdAt || message?.metadata?.timestamp;
  const status = message?.status || 'sent';
  const reactions = message?.reactions || [];
  const replyTo = message?.replyTo;
  
  // Encontrar el mensaje original si es una respuesta
  const replyToMessage = useMemo(() => {
    if (!replyTo) return null;
    const replyId = typeof replyTo === 'object' ? replyTo._id : replyTo;
    return allMessages.find(m => m._id === replyId) || (typeof replyTo === 'object' ? replyTo : null);
  }, [replyTo, allMessages]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Agrupar reacciones por emoji
  const groupedReactions = useMemo(() => {
    const groups = {};
    reactions.forEach(r => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      groups[r.emoji].count++;
      groups[r.emoji].users.push(r.user);
    });
    return Object.values(groups);
  }, [reactions]);

  // Long press para mostrar acciones en móvil
  const handleTouchStart = useCallback((e) => {
    // Solo permitir long press con un dedo
    if (e.touches && e.touches.length > 1) return;
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancelar long press al hacer swipe/scroll
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cerrar picker al hacer clic/toque fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        setShowReactionPicker(false);
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const reactionProcessingRef = useRef(false);
  const handleReaction = useCallback((emoji) => {
    // Guard against double-fire from touch + click on mobile
    if (reactionProcessingRef.current) return;
    reactionProcessingRef.current = true;
    setTimeout(() => { reactionProcessingRef.current = false; }, 300);
    
    onReact?.(message._id, emoji);
    setShowReactionPicker(false);
    setShowActions(false);
  }, [message._id, onReact]);

  const handleReply = useCallback(() => {
    onReply?.(message);
    setShowActions(false);
  }, [message, onReply]);

  // Mensajes de sistema se renderizan centrados y con estilo diferente
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2" id={`msg-${message._id}`}>
        <div className="max-w-[85%] px-4 py-2.5 bg-gray-100/80 text-gray-600 text-sm text-center rounded-xl border border-gray-200/50 shadow-sm">
          <p className="whitespace-pre-wrap">{text}</p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={bubbleRef}
      className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} group relative`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Avatar (for received messages) */}
      {!isMine && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-lg shadow-brand-500/20">
          {(userName || 'U').charAt(0).toUpperCase()}
        </div>
      )}
      {!isMine && !showAvatar && <div className="w-8" />}

      {/* Message content */}
      <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        
        {/* Reply preview - Si este mensaje es respuesta a otro */}
        {replyToMessage && (
          <div 
            className={`
              mb-1 px-3 py-1.5 rounded-lg text-xs max-w-full cursor-pointer 
              hover:opacity-80 transition-opacity border-l-[3px]
              ${isMine 
                ? 'bg-brand-400/30 border-white/50 text-white/90' 
                : 'bg-gray-100 border-brand-400 text-gray-600'
              }
            `}
            onClick={() => {
              // Scroll al mensaje original
              const el = document.getElementById(`msg-${replyToMessage._id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el?.classList.add('ring-2', 'ring-brand-400');
              setTimeout(() => el?.classList.remove('ring-2', 'ring-brand-400'), 1500);
            }}
          >
            <p className="font-medium text-[10px] opacity-70 mb-0.5">
              {replyToMessage.sender?.profile?.firstName || 'Usuario'}
            </p>
            <p className="truncate">
              {replyToMessage.content?.text || replyToMessage.text || '📎 Archivo adjunto'}
            </p>
          </div>
        )}
        
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {attachments.map((att, idx) => {
              // Imágenes
              if (att.type === 'image' || att.type?.startsWith('image') || att.mimeType?.startsWith('image')) {
                return (
                  <img 
                    key={idx}
                    src={att.url}
                    alt="Attachment"
                    className="max-w-50 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(att.url, '_blank')}
                  />);
              }
              // Videos
              if (att.type === 'video' || att.type?.startsWith('video') || att.mimeType?.startsWith('video')) {
                return (
                  <video 
                    key={idx}
                    src={att.url}
                    controls
                    preload="metadata"
                    className="max-w-80 rounded-xl"
                    style={{ maxHeight: '300px' }}
                  >
                    Tu navegador no soporta videos.
                  </video>
                );
              }
              // Documentos y otros
              return (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Icons.Attachment className="w-4 h-4" />
                  {att.name || 'Archivo'}
                </a>
              );
            })}
          </div>
        )}

        {/* Text bubble with reactions */}
        <div className="relative" id={`msg-${message._id}`}>
          {text && (
            <div 
              className={`
                relative px-4 py-2.5 rounded-2xl text-sm transition-all
                ${isMine 
                  ? 'bg-linear-to-r from-brand-500 to-brand-700 text-white rounded-br-md shadow-lg shadow-brand-500/20' 
                  : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                }
              `}
            >
              <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
              
              {/* Time & Status */}
              <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                  {formatTime(timestamp)}
                </span>
                {isMine && (
                  <span className={`${status === 'read' ? 'text-accent-300' : 'text-white/50'}`}>
                    {status === 'read' ? <Icons.DoubleCheck className="w-3 h-3" /> : <Icons.Check />}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Reactions display */}
          {groupedReactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {groupedReactions.map(({ emoji, count }) => (
                <button
                  key={emoji}
                  onPointerUp={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs shadow-sm hover:bg-gray-50 transition-colors touch-manipulation select-none"
                  title="Clic para alternar reacción"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-gray-500 text-[10px]">{count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Quick action buttons - visible on hover (desktop) */}
          <div 
            className={`
              absolute top-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10
              flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-100 p-0.5
              ${isMine ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full ml-2'}
            `}
          >
            <button
              onClick={handleReply}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="Responder"
            >
              <Icons.Reply className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="Reaccionar"
            >
              <Icons.Emoji className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Reaction picker popup */}
          {(showReactionPicker || showActions) && (
            <div 
              className={`
                absolute z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2
                ${isMine ? 'right-0' : 'left-0'} 
                ${text ? '-top-14' : 'top-0'}
              `}
              style={{ animation: 'fadeInScale 0.15s ease-out' }}
            >
              <div className="flex items-center gap-1">
                {QUICK_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onPointerUp={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-125 text-xl select-none touch-manipulation"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {showActions && (
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onPointerUp={handleReply}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                  >
                    <Icons.Reply className="w-4 h-4" />
                    Responder
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  isMine: PropTypes.bool,
  showAvatar: PropTypes.bool,
  userName: PropTypes.string,
  onReply: PropTypes.func,
  onReact: PropTypes.func,
  allMessages: PropTypes.array
};

// Date Separator
const DateSeparator = memo(({ date }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
        {formatDate(date)}
      </span>
    </div>
  );
});

DateSeparator.displayName = 'DateSeparator';

DateSeparator.propTypes = {
  date: PropTypes.string.isRequired
};

// Main Component
function ChatRoom({
  chatId,
  chat,
  currentUserId,
  onNewMessage,
  placeholder = 'Escribe un mensaje...',
  className = '',
  showHeader = true,
  maxHeight = '500px',
  // Nuevas props para aceptar propuesta desde el chat
  proposalInfo = null, // { proposalId, amount, amountMin, amountMax, isRange, currency, providerName, status }
  onAcceptProposal = null, // Callback para aceptar propuesta
  onRejectProposal = null, // Callback para rechazar propuesta
  isAcceptingProposal = false, // Estado de carga
  userRole = null, // 'client' o 'provider'
  onClose = null, // Callback para cerrar el chat (usado en panel de provider)
  onEditRequest = null // Callback para editar solicitud (abre modal wizard)
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composer, setComposer] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ show: false, progress: 0, message: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); // Mensaje al que se está respondiendo
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Estado para el picker de emojis
  
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  // Get chat title and partner info
  const chatTitle = useMemo(() => {
    if (!chat) return 'Chat';
    return chat?.booking?.basicInfo?.title || 
           chat?.participants?.client?.profile?.firstName ||
           chat?.participants?.provider?.providerProfile?.businessName ||
           'Chat';
  }, [chat]);

  const partnerName = useMemo(() => {
    if (!chat || !currentUserId) return '';
    const isClient = chat?.participants?.client?._id === currentUserId;
    if (isClient) {
      return chat?.participants?.provider?.providerProfile?.businessName || 
             chat?.participants?.provider?.profile?.firstName || 
             'Proveedor';
    }
    return chat?.participants?.client?.profile?.firstName || 'Cliente';
  }, [chat, currentUserId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    
    setLoading(true);
    isInitialLoadRef.current = true; // Reset para nuevo chat
    lastMessageCountRef.current = 0;
    console.log(`📥 Loading messages for chat: ${chatId}`);
    try {
      const { data } = await api.get(`/chats/${chatId}/messages?limit=100`);
      const msgs = data?.data?.messages || data?.messages || [];
      console.log(`📬 Loaded ${msgs.length} messages for chat: ${chatId}`, msgs);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // WebSocket setup
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket || !chatId) {
      console.log('🔌 ChatRoom: Cannot setup WebSocket:', { hasSocket: !!socket, chatId });
      return;
    }

    console.log('🔌 ChatRoom WebSocket status:', { 
      connected: socket.connected, 
      socketId: socket.id,
      chatId,
      currentUserId
    });

    // Normalizar chatId a string para comparaciones consistentes
    const normalizedChatId = String(chatId);
    
    console.log(`🔌 Joining chat room: ${normalizedChatId}`);
    // Join chat room
    socketEmit('join_chat', { chatId: normalizedChatId });
    
    // Si el socket no está conectado aún, unirse cuando se conecte
    const onReconnect = () => {
      console.log('🔌 Socket reconnected, rejoining chat room:', normalizedChatId);
      socketEmit('join_chat', { chatId: normalizedChatId });
    };
    const offReconnect = socketOn('connect', onReconnect);

    // Listen for new messages
    const offNewMessage = socketOn('new_message', (payload) => {
      console.log('📨 Received new_message event:', payload);
      // El chatId puede venir como ObjectId o string, normalizar a string
      const msgChatId = String(payload?.chatId || payload?.chat?._id || payload?.chat || '');
      
      console.log('📨 Comparing chatIds:', { msgChatId, normalizedChatId, match: msgChatId === normalizedChatId });
      
      if (!msgChatId || msgChatId !== normalizedChatId) {
        console.log(`📨 Message for different chat (${msgChatId}), ignoring`);
        return;
      }
      
      const msg = payload?.message || payload;
      // Asegurar que el mensaje tenga createdAt para mostrar fecha correctamente
      const msgWithDate = {
        ...msg,
        createdAt: msg.createdAt || msg.metadata?.timestamp || new Date().toISOString()
      };
      console.log('📨 Adding message to chat:', msgWithDate);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === msgWithDate._id)) return prev;
        return [...prev, msgWithDate];
      });
      onNewMessage?.(msgWithDate);
    });

    // Listen for message sent confirmation
    const offSent = socketOn('message_sent', (payload) => {
      if (String(payload?.chatId || '') !== normalizedChatId) return;
      // Update local message status
      setMessages(prev => prev.map(m => 
        m.localId === payload.localId ? { ...m, ...payload, status: 'sent' } : m
      ));
    });

    // Typing indicators
    const offTyping = socketOn('user_typing', ({ userId, userName, chatId: typingChatId }) => {
      if (String(typingChatId || '') !== normalizedChatId || userId === currentUserId) return;
      setTypingUsers(prev => ({ ...prev, [userId]: { userName, ts: Date.now() } }));
    });

    const offStoppedTyping = socketOn('user_stopped_typing', ({ userId, chatId: typingChatId }) => {
      if (String(typingChatId || '') !== normalizedChatId) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    // Listen for reaction updates from other users
    const offReaction = socketOn('message_reaction', ({ chatId: reactionChatId, messageId, reactions }) => {
      if (String(reactionChatId || '') !== normalizedChatId) return;
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, reactions } : m
      ));
    });

    return () => {
      try {
        socketEmit('leave_chat', { chatId });
        offNewMessage?.();
        offSent?.();
        offTyping?.();
        offStoppedTyping?.();
        offReaction?.();
        offReconnect?.();
      } catch { /* ignore */ }
    };
  }, [chatId, currentUserId, onNewMessage]);

  // Auto-scroll to bottom - solo cuando corresponde
  useEffect(() => {
    if (loading) return;
    
    const container = containerRef.current;
    if (!container || !messagesEndRef.current) return;

    // Auto-scroll solo si:
    // 1. Es la carga inicial
    // 2. El usuario estaba cerca del fondo (shouldAutoScrollRef)
    // 3. El usuario envió un nuevo mensaje (se detecta porque aumentó el count)
    const isNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (isInitialLoadRef.current || shouldAutoScrollRef.current || isNewMessage) {
      messagesEndRef.current.scrollIntoView({ behavior: isInitialLoadRef.current ? 'auto' : 'smooth' });
      isInitialLoadRef.current = false;
    }
  }, [messages, loading]);

  // Detectar si el usuario está cerca del fondo para auto-scroll inteligente
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Considerar "cerca del fondo" si está a menos de 100px del final
      shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Clear stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (now - next[key].ts > 5000) delete next[key];
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle typing
  const handleTyping = useCallback((value) => {
    setComposer(value);
    
    if (!chatId) return;

    if (!isTyping) {
      setIsTyping(true);
      socketEmit('typing_start', { chatId });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketEmit('typing_stop', { chatId });
    }, 1500);
  }, [chatId, isTyping]);

  // Handle reply to a message
  const handleReply = useCallback((message) => {
    setReplyingTo(message);
    // Focus en el input después de seleccionar responder
    document.querySelector('textarea')?.focus();
  }, []);

  // Cancel reply
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Handle reaction to a message (with debounce guard to prevent mobile double-fire)
  const reactionGuardRef = useRef(new Set());
  const handleReaction = useCallback(async (messageId, emoji) => {
    if (!messageId || !chatId) return;
    
    // Prevent duplicate rapid calls for the same message+emoji
    const key = `${messageId}:${emoji}`;
    if (reactionGuardRef.current.has(key)) return;
    reactionGuardRef.current.add(key);
    setTimeout(() => reactionGuardRef.current.delete(key), 400);
    
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => {
        if (m._id !== messageId) return m;
        
        const reactions = [...(m.reactions || [])];
        const existingIndex = reactions.findIndex(
          r => r.user === currentUserId && r.emoji === emoji
        );
        
        if (existingIndex >= 0) {
          // Remove reaction if exists
          reactions.splice(existingIndex, 1);
        } else {
          // Add new reaction
          reactions.push({ 
            emoji, 
            user: currentUserId, 
            userModel: 'User',
            createdAt: new Date().toISOString() 
          });
        }
        
        return { ...m, reactions };
      }));

      // Send to server
      await api.patch(`/chats/${chatId}/messages/${messageId}/reactions`, { emoji });
    } catch (err) {
      console.error('Error adding reaction:', err);
      // Could revert optimistic update here if needed
    }
  }, [chatId, currentUserId]);

  // Send message
  const sendMessage = useCallback(async () => {
    const text = composer.trim();
    if (!text || !chatId || sending) return;

    const localId = `local_${Date.now()}`;
    const optimisticMessage = {
      _id: localId,
      localId,
      chat: chatId,
      sender: currentUserId,
      content: { text },
      type: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      replyTo: replyingTo?._id || null
    };

    // Optimistic update
    setMessages(prev => [...prev, optimisticMessage]);
    setComposer('');
    setReplyingTo(null); // Clear reply state
    setSending(true);

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      socketEmit('typing_stop', { chatId });
    }

    try {
      // Try WebSocket first
      console.log('📤 Attempting to send message via WebSocket:', { chatId, text: text.substring(0, 50), localId });
      const socketOk = socketEmit('send_message', { 
        chatId, 
        content: { text }, 
        type: 'text',
        localId,
        replyTo: replyingTo?._id || null
      });
      console.log('📤 WebSocket send result:', socketOk ? 'SUCCESS' : 'FAILED - falling back to REST');

      if (!socketOk) {
        // Fallback to REST
        const { data } = await api.post(`/chats/${chatId}/messages`, { 
          text, 
          type: 'text',
          replyTo: replyingTo?._id || null
        });
        const serverMsg = data?.data?.message || data?.message;
        
        if (serverMsg) {
          setMessages(prev => prev.map(m => 
            m.localId === localId ? { ...serverMsg, status: 'sent' } : m
          ));
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Mark as failed
      setMessages(prev => prev.map(m => 
        m.localId === localId ? { ...m, status: 'failed' } : m
      ));
    } finally {
      setSending(false);
    }
  }, [composer, chatId, currentUserId, sending, isTyping, replyingTo]);

  // Handle file selection - soporta imágenes, videos y documentos
  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // Tipos permitidos: imágenes, videos, PDFs, documentos
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type === 'application/pdf' ||
                        file.type.includes('document') ||
                        file.type.includes('text');
      
      // Límites de tamaño: imágenes 10MB, videos 100MB, documentos 5MB
      let maxSize = 5 * 1024 * 1024; // 5MB default para documentos
      if (isImage) maxSize = 10 * 1024 * 1024; // 10MB para imágenes
      if (isVideo) maxSize = 100 * 1024 * 1024; // 100MB para videos
      
      const isValidType = isImage || isVideo || isDocument;
      const isValidSize = file.size <= maxSize;
      
      if (!isValidType) {
        console.warn(`Tipo de archivo no soportado: ${file.type}`);
      }
      if (!isValidSize) {
        console.warn(`Archivo muy grande: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Remove selected file
  const removeSelectedFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Upload single file to Cloudinary with compression for images
  const uploadSingleFile = useCallback(async (file, fileIndex, totalFiles) => {
    if (!chatId || !file) return null;
    
    try {
      let processedFile = file;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      // Comprimir imágenes antes de subir
      if (isImage && file.size > 500 * 1024) { // Solo comprimir si > 500KB
        setUploadProgress(prev => ({
          ...prev,
          message: `Comprimiendo ${file.name}...`
        }));
        
        try {
          processedFile = await compressImage(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85
          });
          console.log(`✅ Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(processedFile.size / 1024).toFixed(0)}KB`);
        } catch (compressErr) {
          console.warn('Compression failed, using original:', compressErr);
          processedFile = file;
        }
      }
      
      const formData = new FormData();
      formData.append('file', processedFile);
      
      // Determinar tipo para el servidor
      let fileType = 'document';
      if (isImage) fileType = 'image';
      if (isVideo) fileType = 'video';
      formData.append('type', fileType);
      
      setUploadProgress(prev => ({
        ...prev,
        message: isVideo 
          ? `Subiendo video ${fileIndex + 1}/${totalFiles} (puede tardar)...`
          : `Subiendo archivo ${fileIndex + 1}/${totalFiles}...`
      }));
      
      const { data } = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: isVideo ? 600000 : 120000, // 10min para videos, 2min para otros
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const overallProgress = Math.round(((fileIndex + fileProgress / 100) / totalFiles) * 100);
          setUploadProgress(prev => ({
            ...prev,
            progress: overallProgress
          }));
        }
      });
      
      return {
        url: data?.data?.url || data?.url,
        type: fileType,
        name: file.name,
        mimeType: file.type
      };
    } catch (err) {
      console.error(`Error uploading ${file.name}:`, err);
      return null;
    }
  }, [chatId]);

  // Send message with attachments - with compression and progress
  const sendMessageWithAttachments = useCallback(async () => {
    if (selectedFiles.length === 0 || !chatId || uploadingFile) return;
    
    setUploadingFile(true);
    setUploadProgress({ show: true, progress: 0, message: 'Preparando archivos...' });
    
    try {
      const attachments = [];
      
      // Subir archivos uno por uno con progreso
      for (let i = 0; i < selectedFiles.length; i++) {
        const result = await uploadSingleFile(selectedFiles[i], i, selectedFiles.length);
        if (result && result.url) {
          attachments.push({
            type: result.type,
            url: result.url,
            name: result.name
          });
        }
      }
      
      if (attachments.length === 0) {
        throw new Error('No se pudieron subir los archivos');
      }
      
      setUploadProgress(prev => ({ ...prev, progress: 100, message: 'Enviando mensaje...' }));
      
      const localId = `local_${Date.now()}`;
      const text = composer.trim();
      
      // Determinar tipo de mensaje (usa el primer attachment como referencia)
      const msgType = attachments[0].type === 'video' ? 'video' : attachments[0].type;
      
      const optimisticMessage = {
        _id: localId,
        localId,
        chat: chatId,
        sender: currentUserId,
        content: { text, attachments },
        type: msgType,
        status: 'sending',
        createdAt: new Date().toISOString(),
        replyTo: replyingTo?._id || null
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setComposer('');
      setSelectedFiles([]);
      setReplyingTo(null); // Clear reply state
      
      // Enviar mensaje vía REST
      const { data } = await api.post(`/chats/${chatId}/messages`, { 
        text, 
        attachments,
        type: msgType,
        replyTo: replyingTo?._id || null
      });
      
      const serverMsg = data?.data?.message || data?.message;
      if (serverMsg) {
        setMessages(prev => prev.map(m => 
          m.localId === localId ? { ...serverMsg, status: 'sent' } : m
        ));
      }
    } catch (err) {
      console.error('Error sending message with attachments:', err);
      // Mostrar error pero no bloquear
      setUploadProgress(prev => ({ ...prev, message: 'Error al enviar. Intente nuevamente.' }));
      await new Promise(r => setTimeout(r, 2000)); // Mostrar error por 2s
    } finally {
      setUploadingFile(false);
      setUploadProgress({ show: false, progress: 0, message: '' });
    }
  }, [selectedFiles, chatId, uploadingFile, composer, currentUserId, uploadSingleFile, replyingTo]);

  // Handle Enter key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.createdAt || msg.metadata?.timestamp).toDateString();
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msg.createdAt || msg.metadata?.timestamp });
      }
      
      groups.push({ type: 'message', ...msg });
    });

    return groups;
  }, [messages]);

  const typingList = Object.values(typingUsers);

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-100 bg-linear-to-r from-brand-50/50 to-brand-100/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold shadow-lg shadow-brand-500/20">
              {chatTitle.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{chatTitle}</h4>
              <p className="text-xs text-gray-500 truncate">
                {typingList.length > 0 
                  ? `${typingList[0].userName || t('chat.typing', 'Escribiendo')}...`
                  : t('chat.activeConversation', 'Conversación activa')
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Panel de propuesta aceptable - Solo para clientes con propuesta pendiente */}
      {proposalInfo && userRole === 'client' && proposalInfo.status === 'pending' && onAcceptProposal && (
        <div className="px-4 py-3 border-b border-gray-100 bg-linear-to-br from-accent-50 via-accent-50/50 to-accent-100/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Icono y información */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-accent-500/25">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('chat.proposalPending', 'Propuesta pendiente de {{provider}}', { provider: proposalInfo.providerName || t('chat.provider', 'proveedor') })}
                </p>
                <p className="text-lg font-bold text-accent-600">
                  {proposalInfo.isRange 
                    ? `${proposalInfo.currency || 'US$'} ${proposalInfo.amountMin?.toLocaleString()} - ${proposalInfo.amountMax?.toLocaleString()}`
                    : `${proposalInfo.currency || 'US$'} ${proposalInfo.amount?.toLocaleString()}`
                  }
                </p>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onRejectProposal && (
                <button
                  onClick={() => onRejectProposal(proposalInfo.proposalId)}
                  disabled={isAcceptingProposal}
                  className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('chat.reject', 'Rechazar')}
                </button>
              )}
              <button
                onClick={() => onAcceptProposal(proposalInfo.proposalId)}
                disabled={isAcceptingProposal}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-sm font-semibold text-dark-900 bg-linear-to-r from-accent-500 to-accent-600 rounded-xl shadow-lg shadow-accent-500/25 hover:from-accent-600 hover:to-accent-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAcceptingProposal ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    <span>{t('chat.accepting', 'Aceptando...')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('chat.acceptProposal', 'Aceptar propuesta')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30"
        style={{ maxHeight }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" className="text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.EmptyChat className="w-20 h-20 text-gray-200 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Sin mensajes aún</h4>
            <p className="text-sm text-gray-500 max-w-xs">
              Envía el primer mensaje para iniciar la conversación
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map((item, idx) => {
              if (item.type === 'date') {
                return <DateSeparator key={`date-${idx}`} date={item.date} />;
              }
              
              // Normalizar IDs a string para comparación consistente
              // El sender puede ser: string, ObjectId, o objeto con _id o id
              const senderId = String(
                item?.sender?._id || 
                item?.sender?.id || 
                (typeof item?.sender === 'string' ? item.sender : '') ||
                ''
              );
              const currentId = String(currentUserId || '');
              const isMine = senderId && currentId && senderId === currentId;
              
              // Debug desactivado para evitar logs infinitos
              // console.log('🔍 Message alignment check:', { messageId: item._id, senderId, currentId, isMine });
              
              const prevItem = groupedMessages[idx - 1];
              const prevSenderId = String(prevItem?.sender?._id || prevItem?.sender || '');
              const showAvatar = prevItem?.type === 'date' || prevSenderId !== senderId;
              
              return (
                <MessageBubble
                  key={item._id || idx}
                  message={item}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  userName={partnerName}
                  onReply={handleReply}
                  onReact={handleReaction}
                  allMessages={messages}
                />
              );
            })}

            {/* Typing indicator */}
            {typingList.length > 0 && (
              <div className="flex gap-2">
                <div className="w-8" />
                <TypingIndicator userName={typingList[0].userName} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Provider quick actions for info_request chats - Bottom panel */}
      {(() => {
        const serviceRequestId = chat?.serviceRequest?._id || chat?.serviceRequest;
        const showProviderActions = chat?.chatType === 'info_request' && userRole === 'provider' && serviceRequestId;
        
        if (!showProviderActions) return null;
        
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-linear-to-r from-brand-50/50 to-brand-100/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('chat.infoRequestProvider.title', 'Solicitud de información')}</p>
                  <p className="text-xs text-gray-500">{t('chat.infoRequestProvider.subtitle', 'Continúa la conversación o envía una propuesta')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onClose ? onClose() : navigate('/mensajes')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {t('chat.close', 'Cerrar')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/empleos/${serviceRequestId}`)}
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-linear-to-r from-brand-600 to-brand-700 rounded-xl shadow-sm hover:from-brand-700 hover:to-brand-800 transition-colors"
                >
                  {t('provider.requestDetail.sendProposal', 'Enviar estimado')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Client quick actions for info_request chats - Bottom panel */}
      {(() => {
        const serviceRequestId = chat?.serviceRequest?._id || chat?.serviceRequest;
        const showClientActions = chat?.chatType === 'info_request' && userRole === 'client' && serviceRequestId;
        
        if (!showClientActions) return null;
        
        return (
          <div className="px-4 py-3 border-t border-gray-100 bg-linear-to-r from-accent-50/50 to-accent-100/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('chat.infoRequestClient.title', 'Consulta del profesional')}</p>
                  <p className="text-xs text-gray-500">{t('chat.infoRequestClient.subtitle', 'El profesional necesita más detalles sobre tu solicitud')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onClose ? onClose() : navigate('/mensajes')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {t('chat.close', 'Cerrar')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onEditRequest) {
                      onEditRequest(serviceRequestId);
                    } else {
                      navigate(`/mis-solicitudes`);
                    }
                  }}
                  className="px-3 py-1.5 text-sm font-semibold text-dark-900 bg-linear-to-r from-accent-500 to-accent-600 rounded-xl shadow-sm hover:from-accent-600 hover:to-accent-700 transition-colors"
                >
                  {t('chat.infoRequestClient.updateRequest', 'Actualizar solicitud')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Composer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {/* Reply preview - shown when replying to a message */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-brand-50/50 rounded-lg border-l-[3px] border-brand-500 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-600 font-medium mb-0.5">
                Respondiendo a {replyingTo.sender?.profile?.firstName || 'Usuario'}
              </p>
              <p className="text-sm text-gray-700 truncate">
                {replyingTo.content?.text || replyingTo.text || '📎 Archivo adjunto'}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Cancelar respuesta"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Upload progress indicator */}
        {uploadProgress.show && (
          <div className="mb-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
            <div className="flex items-center gap-3">
              <Spinner size="sm" className="text-brand-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-700 font-medium truncate">{uploadProgress.message}</p>
                <div className="mt-1 w-full bg-brand-100 rounded-full h-1.5">
                  <div 
                    className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-brand-600 font-medium">{uploadProgress.progress}%</span>
            </div>
          </div>
        )}
        
        {/* Selected files preview */}
        {selectedFiles.length > 0 && !uploadProgress.show && (
          <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                ) : file.type.startsWith('video/') ? (
                  <div className="w-16 h-16 flex flex-col items-center justify-center bg-gray-800 rounded-lg border border-gray-200 p-1">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[8px] text-white truncate max-w-full mt-0.5">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200 p-1">
                    <Icons.Attachment className="w-5 h-5 text-gray-400" />
                    <span className="text-[9px] text-gray-500 truncate max-w-full mt-0.5">{file.name.slice(0, 10)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeSelectedFile(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-3">
          {/* Attachment buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg transition-colors ${selectedFiles.length > 0 ? 'text-brand-500 bg-brand-50' : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50'}`}
              title="Adjuntar archivo (imágenes, videos, documentos)"
              disabled={uploadingFile}
            >
              <Icons.Attachment />
            </button>
            {/* Botón de emoji con picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'text-brand-500 bg-brand-50' : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50'}`}
                title="Agregar emoji"
              >
                <span className="text-lg">😊</span>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-lg border border-gray-200 flex gap-1 z-50"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {QUICK_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onPointerUp={(e) => {
                        e.stopPropagation();
                        setComposer(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors touch-manipulation select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileSelect}
          />

          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              value={composer}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFiles.length > 0 ? 'Añade un mensaje (opcional)...' : placeholder}
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white resize-none transition-all text-sm"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={uploadingFile}
            />
          </div>

          {/* Send button */}
          <button
            onClick={selectedFiles.length > 0 ? sendMessageWithAttachments : sendMessage}
            disabled={(selectedFiles.length === 0 && !composer.trim()) || sending || uploadingFile}
            className="p-3 bg-linear-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {sending || uploadingFile ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <Icons.Send />
            )}
          </button>
        </div>
        
        {/* Character limit hint */}
        {composer.length > 900 && (
          <p className={`text-xs mt-1 text-right ${composer.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
            {composer.length}/1000
          </p>
        )}
      </div>
    </div>
  );
}

ChatRoom.propTypes = {
  chatId: PropTypes.string,
  chat: PropTypes.object,
  currentUserId: PropTypes.string,
  onNewMessage: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  showHeader: PropTypes.bool,
  maxHeight: PropTypes.string,
  proposalInfo: PropTypes.shape({
    proposalId: PropTypes.string,
    amount: PropTypes.number,
    amountMin: PropTypes.number,
    amountMax: PropTypes.number,
    isRange: PropTypes.bool,
    currency: PropTypes.string,
    providerName: PropTypes.string,
    status: PropTypes.string
  }),
  onAcceptProposal: PropTypes.func,
  onRejectProposal: PropTypes.func,
  isAcceptingProposal: PropTypes.bool,
  userRole: PropTypes.string,
  onClose: PropTypes.func,
  onEditRequest: PropTypes.func
};

export default memo(ChatRoom);

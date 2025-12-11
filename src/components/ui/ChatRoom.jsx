import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner.jsx';
import api from '@/state/apiClient.js';
import { getSocket, on as socketOn, emit as socketEmit } from '@/state/socketClient.js';

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
  )
};

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

// Message Bubble Component
const MessageBubble = memo(({ message, isMine, showAvatar, userName }) => {
  const text = message?.content?.text ?? (typeof message?.content === 'string' ? message.content : '');
  const timestamp = message?.createdAt || message?.metadata?.timestamp;
  const status = message?.status;
  const attachments = message?.content?.attachments || [];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar (for received messages) */}
      {!isMine && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-lg shadow-brand-500/20">
          {(userName || 'U').charAt(0).toUpperCase()}
        </div>
      )}
      {!isMine && !showAvatar && <div className="w-8" />}

      {/* Message content */}
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {attachments.map((att, idx) => {
              if (att.type?.startsWith('image')) {
                return (
                  <img 
                    key={idx}
                    src={att.url}
                    alt="Attachment"
                    className="max-w-[200px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(att.url, '_blank')}
                  />
                );
              }
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

        {/* Text bubble */}
        {text && (
          <div 
            className={`
              relative px-4 py-2.5 rounded-2xl text-sm
              ${isMine 
                ? 'bg-linear-to-r from-brand-500 to-cyan-500 text-white rounded-br-md shadow-lg shadow-brand-500/20' 
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
                <span className={`${status === 'read' ? 'text-cyan-300' : 'text-white/50'}`}>
                  {status === 'read' ? <Icons.DoubleCheck className="w-3 h-3" /> : <Icons.Check />}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  isMine: PropTypes.bool,
  showAvatar: PropTypes.bool,
  userName: PropTypes.string
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
  maxHeight = '500px'
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composer, setComposer] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

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
    try {
      const { data } = await api.get(`/chats/${chatId}/messages?limit=100`);
      const msgs = data?.data?.messages || data?.messages || [];
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
    if (!socket || !chatId) return;

    // Join chat room
    socketEmit('join_chat', { chatId });

    // Listen for new messages
    const offNewMessage = socketOn('new_message', (payload) => {
      const msgChatId = payload?.chatId || payload?.chat?._id;
      if (msgChatId !== chatId) return;
      
      const msg = payload?.message || payload;
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      onNewMessage?.(msg);
    });

    // Listen for message sent confirmation
    const offSent = socketOn('message_sent', (payload) => {
      if (payload?.chatId !== chatId) return;
      // Update local message status
      setMessages(prev => prev.map(m => 
        m.localId === payload.localId ? { ...m, ...payload, status: 'sent' } : m
      ));
    });

    // Typing indicators
    const offTyping = socketOn('user_typing', ({ userId, userName, chatId: typingChatId }) => {
      if (typingChatId !== chatId || userId === currentUserId) return;
      setTypingUsers(prev => ({ ...prev, [userId]: { userName, ts: Date.now() } }));
    });

    const offStoppedTyping = socketOn('user_stopped_typing', ({ userId, chatId: typingChatId }) => {
      if (typingChatId !== chatId) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      try {
        socketEmit('leave_chat', { chatId });
        offNewMessage?.();
        offSent?.();
        offTyping?.();
        offStoppedTyping?.();
      } catch { /* ignore */ }
    };
  }, [chatId, currentUserId, onNewMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!loading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, typingUsers]);

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
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, optimisticMessage]);
    setComposer('');
    setSending(true);

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      socketEmit('typing_stop', { chatId });
    }

    try {
      // Try WebSocket first
      const socketOk = socketEmit('send_message', { 
        chatId, 
        content: { text }, 
        type: 'text',
        localId 
      });

      if (!socketOk) {
        // Fallback to REST
        const { data } = await api.post(`/chats/${chatId}/messages`, { text, type: 'text' });
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
  }, [composer, chatId, currentUserId, sending, isTyping]);

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // Filter valid files (images, PDFs, docs - max 5MB each)
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.includes('document') ||
                         file.type.includes('text');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
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

  // Upload file and send as message
  const uploadAndSendFile = useCallback(async (file) => {
    if (!chatId || !file) return null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'document');
      
      const { data } = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return data?.data?.url || data?.url || null;
    } catch (err) {
      console.error('Error uploading file:', err);
      return null;
    }
  }, [chatId]);

  // Send message with attachments
  const sendMessageWithAttachments = useCallback(async () => {
    if (selectedFiles.length === 0 || !chatId || uploadingFile) return;
    
    setUploadingFile(true);
    
    try {
      // Upload all files
      const uploadPromises = selectedFiles.map(async (file) => {
        const url = await uploadAndSendFile(file);
        if (url) {
          return {
            type: file.type.startsWith('image/') ? 'image' : 'document',
            url,
            name: file.name
          };
        }
        return null;
      });
      
      const attachments = (await Promise.all(uploadPromises)).filter(Boolean);
      
      if (attachments.length > 0) {
        const localId = `local_${Date.now()}`;
        const text = composer.trim();
        
        const optimisticMessage = {
          _id: localId,
          localId,
          chat: chatId,
          sender: currentUserId,
          content: { text, attachments },
          type: attachments[0].type,
          status: 'sending',
          createdAt: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        setComposer('');
        setSelectedFiles([]);
        
        // Send via REST (attachments require REST)
        const { data } = await api.post(`/chats/${chatId}/messages`, { 
          text, 
          attachments,
          type: attachments[0].type 
        });
        
        const serverMsg = data?.data?.message || data?.message;
        if (serverMsg) {
          setMessages(prev => prev.map(m => 
            m.localId === localId ? { ...serverMsg, status: 'sent' } : m
          ));
        }
      }
    } catch (err) {
      console.error('Error sending message with attachments:', err);
    } finally {
      setUploadingFile(false);
    }
  }, [selectedFiles, chatId, uploadingFile, composer, currentUserId, uploadAndSendFile]);

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
        <div className="px-4 py-3 border-b border-gray-100 bg-linear-to-r from-brand-50/50 to-cyan-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-brand-500/20">
              {chatTitle.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{chatTitle}</h4>
              <p className="text-xs text-gray-500 truncate">
                {typingList.length > 0 
                  ? `${typingList[0].userName || 'Escribiendo'}...`
                  : 'Conversación activa'
                }
              </p>
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
              
              const isMine = (item?.sender?._id || item?.sender) === currentUserId;
              const prevItem = groupedMessages[idx - 1];
              const showAvatar = prevItem?.type === 'date' || 
                               (prevItem?.sender?._id || prevItem?.sender) !== (item?.sender?._id || item?.sender);
              
              return (
                <MessageBubble
                  key={item._id || idx}
                  message={item}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  userName={partnerName}
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

      {/* Composer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
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
              title="Adjuntar archivo (máx. 5MB)"
              disabled={uploadingFile}
            >
              <Icons.Attachment />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors hidden sm:block"
              title="Emoji"
            >
              <Icons.Emoji />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
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
  maxHeight: PropTypes.string
};

export default memo(ChatRoom);

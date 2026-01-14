import { io } from 'socket.io-client';

let socket = null;
let lastToken = null;
let listenersBound = false;

// Estado global para el userId (evita problemas de stale closures con refs de React)
let globalUserId = null;

export function setGlobalUserId(userId) {
  globalUserId = userId;
  console.log('🔑 Socket globalUserId set to:', userId);
}

export function getGlobalUserId() {
  return globalUserId;
}

function getToken() {
  try {
    return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  } catch {
    return null;
  }
}

export function getSocket() {
  const token = getToken();
  if (!token) return null;

  if (!socket) {
    // Conectar al servidor backend en puerto 5000
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('🔌 Creating new socket connection to:', serverUrl);
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    lastToken = token;
    
    // Debug: log all socket events
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Socket event received: ${eventName}`, args);
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket connected, id:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });
  } else if (lastToken !== token) {
    try {
      socket.auth = socket.auth || {};
      socket.auth.token = token;
      lastToken = token;
      // If disconnected, let it reconnect with the new token
      if (socket.disconnected) {
        socket.connect();
      }
    } catch {
      /* ignore */
    }
  }
  return socket;
}

export function disconnectSocket() {
  try { socket?.disconnect(); } catch { /* ignore */ }
  socket = null;
  listenersBound = false;
}

export function on(event, handler) {
  const s = getSocket();
  if (!s) {
    console.log(`⚠️ socketOn(${event}): socket not available`);
    return () => {};
  }
  // Crear wrapper para debugging
  const wrappedHandler = (...args) => {
    console.log(`📥 Handler called for ${event}, globalUserId:`, globalUserId);
    handler(...args);
  };
  console.log(`📌 socketOn(${event}): registering handler`);
  s.on(event, wrappedHandler);
  return () => { 
    console.log(`📌 socketOff(${event}): removing handler`);
    try { s.off(event, wrappedHandler); } catch { /* ignore */ } 
  };
}

export function emit(event, payload) {
  const s = getSocket();
  if (!s) return false;
  try { s.emit(event, payload); return true; } catch { return false; }
}

// Utility to run a setup callback once per app lifetime
export function setupOnce(cb) {
  if (listenersBound) return;
  const s = getSocket();
  if (!s) return;
  try { cb(s); listenersBound = true; } catch { /* ignore */ }
}

// Export socket instance (use with caution, prefer getSocket())
export { socket };

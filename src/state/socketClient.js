import { io } from 'socket.io-client';

let socket = null;
let lastToken = null;
let listenersBound = false;

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
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    lastToken = token;
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
  if (!s) return () => {};
  s.on(event, handler);
  return () => { try { s.off(event, handler); } catch { /* ignore */ } };
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

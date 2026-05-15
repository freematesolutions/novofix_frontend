import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './i18n';
import App from './App.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';

// Safety net: unregister any stale Service Worker left over from earlier
// experiments / deployments and clear its caches. Without this, devices that
// once registered a SW will keep serving an outdated bundle even after we
// deploy a fresh one, causing translation mismatches and "no provider" cards.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if (window.caches && typeof window.caches.keys === 'function') {
    window.caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => window.caches.delete(k))))
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

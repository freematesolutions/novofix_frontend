import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { HiCheckCircle, HiExclamation, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

const ToastContext = createContext(null);

let idSeq = 0;

const toastVariants = {
  success: {
    bg: 'bg-white border-green-200',
    icon: HiCheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    text: 'text-green-800',
    progressBar: 'bg-green-500'
  },
  error: {
    bg: 'bg-white border-red-200',
    icon: HiExclamationCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    text: 'text-red-800',
    progressBar: 'bg-red-500'
  },
  warning: {
    bg: 'bg-white border-amber-200',
    icon: HiExclamation,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    text: 'text-amber-800',
    progressBar: 'bg-amber-500'
  },
  info: {
    bg: 'bg-white border-blue-200',
    icon: HiInformationCircle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    text: 'text-blue-800',
    progressBar: 'bg-blue-500'
  }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++idSeq;
    const t = { id, type: 'info', duration: 4000, ...toast };
    setToasts((prev) => [...prev, t]);
    if (t.duration) {
      setTimeout(() => remove(id), t.duration);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    push,
    success: (msg, opts={}) => push({ type: 'success', message: msg, ...opts }),
    error: (msg, opts={}) => push({ type: 'error', message: msg, ...opts }),
    info: (msg, opts={}) => push({ type: 'info', message: msg, ...opts }),
    warning: (msg, opts={}) => push({ type: 'warning', message: msg, ...opts }),
    remove
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-9999 space-y-3 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map((t, index) => {
          const variant = toastVariants[t.type] || toastVariants.info;
          const IconComponent = variant.icon;
          
          return (
            <div
              key={t.id}
              role="status"
              className={`
                relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm
                ${variant.bg}
                animate-in slide-in-from-right-full fade-in duration-300
              `}
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: 'slideInFromRight 0.3s ease-out forwards'
              }}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Icono */}
                <div className={`shrink-0 p-1.5 rounded-lg ${variant.iconBg}`}>
                  <IconComponent className={`w-5 h-5 ${variant.iconColor}`} />
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {t.title && (
                    <div className={`font-semibold text-sm mb-0.5 ${variant.text}`}>
                      {t.title}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">{t.message}</div>
                </div>
                
                {/* Botón cerrar */}
                <button 
                  onClick={() => remove(t.id)}
                  className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Cerrar notificación"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
              
              {/* Barra de progreso */}
              {t.duration && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                  <div 
                    className={`h-full ${variant.progressBar} transition-all ease-linear`}
                    style={{ 
                      animation: `shrinkWidth ${t.duration}ms linear forwards`
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Estilos de animación */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

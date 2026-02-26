import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { HiCheckCircle, HiExclamation, HiExclamationCircle, HiInformationCircle, HiX, HiChat, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

const ToastContext = createContext(null);

let idSeq = 0;

// Longitud máxima del mensaje antes de truncar
const MESSAGE_TRUNCATE_LENGTH = 80;

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
    bg: 'bg-white border-brand-200',
    icon: HiInformationCircle,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    text: 'text-brand-800',
    progressBar: 'bg-brand-500'
  },
  chat: {
    bg: 'bg-linear-to-r from-dark-50 to-dark-100 border-dark-200',
    icon: HiChat,
    iconBg: 'bg-dark-100',
    iconColor: 'text-dark-500',
    text: 'text-dark-700',
    progressBar: 'bg-dark-500'
  }
};

// Componente individual de Toast con capacidad de expandir mensajes largos
function ToastItem({ toast: t, index, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const { t: tr } = useTranslation();
  const variant = toastVariants[t.type] || toastVariants.info;
  const IconComponent = variant.icon;
  
  // Determinar si el mensaje es largo y necesita truncarse
  const message = t.message || '';
  const isLongMessage = message.length > MESSAGE_TRUNCATE_LENGTH;
  const displayMessage = isLongMessage && !expanded 
    ? message.substring(0, MESSAGE_TRUNCATE_LENGTH) + '...'
    : message;

  return (
    <div
      role="status"
      className={`
        relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm
        ${variant.bg}
      `}
      style={{ 
        animationName: 'slideInFromRight',
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'forwards',
        animationDelay: `${index * 50}ms`
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
          <div className="text-sm text-gray-600">
            {displayMessage}
            {/* Botón para expandir/colapsar mensaje largo */}
            {isLongMessage && (
              <button
                onClick={() => setExpanded(!expanded)}
                className={`ml-1 inline-flex items-center gap-0.5 text-xs font-medium transition-colors duration-200 ${
                  t.type === 'chat' 
                    ? 'text-dark-500 hover:text-dark-600' 
                    : 'text-brand-600 hover:text-brand-700'
                }`}
              >
                {expanded ? (
                  <>
                    {tr('common.viewLess')}
                    <HiChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    {tr('common.viewMore')}
                    <HiChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Botón de acción opcional */}
          {t.action && (
            <button
              onClick={() => {
                t.action.onClick?.();
                onRemove(t.id);
              }}
              className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200
                ${t.type === 'chat' 
                  ? 'bg-dark-100 text-dark-600 hover:bg-dark-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t.action.label}
            </button>
          )}
        </div>
        
        {/* Botón cerrar */}
        <button 
          onClick={() => onRemove(t.id)}
          className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          aria-label={tr('common.close')}
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
              animation: `growWidth ${t.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

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
    chat: (title, msg, opts={}) => push({ type: 'chat', title, message: msg, duration: 6000, ...opts }),
    remove
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-99999 space-y-3 w-96 max-w-[calc(100vw-2rem)]" aria-live="polite" aria-atomic="false">
        {toasts.map((t, index) => (
          <ToastItem 
            key={t.id} 
            toast={t} 
            index={index} 
            onRemove={remove}
          />
        ))}
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
        @keyframes growWidth {
          from {
            width: 0%;
          }
          to {
            width: 100%;
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

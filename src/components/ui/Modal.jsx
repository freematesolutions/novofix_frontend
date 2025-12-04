import { useEffect, useId, useRef } from 'react';
import { HiX } from 'react-icons/hi';

// Accessible modal dialog with focus management
// - Unmounts when closed to avoid aria-hidden warnings on focused descendants
// - Traps focus within the dialog while open
// - Restores focus to the previously focused element on close
function Modal({ open, title, children, onClose, actions, size = 'md', icon: IconComponent }) {
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const titleId = useId();
  
  // Map size to max-width classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };
  
  const maxWidthClass = sizeClasses[size] || sizeClasses.md;

  useEffect(() => {
    if (!open) return;
    // Save the previously focused element to restore on close
    lastFocusedRef.current = document.activeElement;

    const el = dialogRef.current;
    if (!el) return;

    // Focus the first focusable element or the dialog container
    const focusables = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    (first || el).focus({ preventScroll: true });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      } else if (e.key === 'Tab') {
        // Trap focus inside the dialog
        const nodes = Array.from(
          el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter((n) => !n.hasAttribute('disabled'));
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const firstNode = nodes[0];
        const lastNode = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstNode) {
            e.preventDefault();
            lastNode.focus();
          }
        } else {
          if (document.activeElement === lastNode) {
            e.preventDefault();
            firstNode.focus();
          }
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    // Restore focus back to the element that had it before opening
    const prev = lastFocusedRef.current;
    if (prev && typeof prev.focus === 'function') {
      try { prev.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
  }, [open]);

  if (!open) return null; // Unmount when closed to prevent aria-hidden focus conflicts

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Backdrop con blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          className={`
            w-full ${maxWidthClass} 
            bg-white rounded-2xl shadow-2xl shadow-gray-900/20
            transform transition-all duration-300
            animate-in zoom-in-95 fade-in
          `}
          style={{ animation: 'modalEnter 0.2s ease-out forwards' }}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <div className="p-2 bg-brand-100 rounded-xl">
                    <IconComponent className="w-5 h-5 text-brand-600" />
                  </div>
                )}
                <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Cerrar"
                >
                  <HiX className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-5 text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
            {children}
          </div>
          
          {/* Footer con acciones */}
          {actions && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {/* Estilos de animación */}
      <style>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default Modal;

import { useEffect, useRef, useCallback } from 'react';

// ─── Stack global para rastrear modales abiertos en orden ───
// Solo el modal más alto en el stack responde al botón Atrás.
const openModalStack = [];

/**
 * Retrocede en el historial SIN disparar otros listeners de popstate.
 * Usa un listener capture-phase + once para absorber el evento.
 */
function silentHistoryBack() {
  const swallow = (e) => e.stopImmediatePropagation();
  window.addEventListener('popstate', swallow, { once: true, capture: true });
  window.history.back();
}

/**
 * Hook que sincroniza un modal con el historial del navegador
 * para que el botón Atrás del móvil cierre el modal en vez de navegar.
 *
 * Soporta modales apilados (ej: ProviderProfileModal + PortfolioModal):
 * solo el modal superior responde al botón Atrás.
 *
 * @param {boolean}  isOpen  – Si el modal está abierto
 * @param {Function} onClose – Callback que pone isOpen en false
 * @param {string}   id      – Identificador del tipo de modal
 * @returns {Function} closeModal – Usar en vez de onClose para dismiss de UI
 */
export default function useModalHistory(isOpen, onClose, id = 'modal') {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ¿Ya tenemos una entrada en el historial para ESTE modal?
  const hasEntry = useRef(false);

  // ID único estable por instancia del hook (sobrevive StrictMode re-mount)
  const uid = useRef(`${id}_${Math.random().toString(36).slice(2)}`);

  // ─── Sincronizar entrada de historial con isOpen ───
  useEffect(() => {
    const myId = uid.current;

    if (isOpen && !hasEntry.current) {
      // Modal acaba de abrirse → agregar entrada al historial + stack
      hasEntry.current = true;
      openModalStack.push(myId);
      window.history.pushState({ __modal: myId }, '');
    }

    if (!isOpen && hasEntry.current) {
      // Modal se cerró desde la UI → quitar la entrada silenciosamente
      hasEntry.current = false;
      const idx = openModalStack.indexOf(myId);
      if (idx !== -1) openModalStack.splice(idx, 1);
      silentHistoryBack();
    }
  }, [isOpen, id]);

  // ─── Escuchar el botón Atrás del navegador ───
  useEffect(() => {
    if (!isOpen) return;

    const myId = uid.current;

    const handlePopState = () => {
      // Solo el modal más alto en el stack debe responder
      if (openModalStack[openModalStack.length - 1] !== myId) return;
      if (!hasEntry.current) return;

      hasEntry.current = false;
      openModalStack.pop();
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen]);

  // closeModal: usar desde la UI (botón X, Escape, backdrop)
  const closeModal = useCallback(() => {
    onCloseRef.current();
  }, []);

  return closeModal;
}

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient.js';
import ChatRoom from './ChatRoom.jsx';
import RequestWizardModal from './RequestWizardModal.jsx';
import Spinner from './Spinner.jsx';
import useModalHistory from '@/utils/useModalHistory.js';

/**
 * InquiryChatModal — Modal de consulta directa cliente → proveedor
 * Permite al cliente enviar mensajes al profesional antes de solicitar estimado.
 * Incluye un botón "Solicitar Estimado" dentro del chat para abrir el RequestWizardModal
 * sin salir del flujo.
 */
function InquiryChatModal({ isOpen, onClose, provider, currentUserId, selectedCategory = null }) {
  const { t } = useTranslation();
  const closeModal = useModalHistory(isOpen, onClose, 'inquiry-chat');
  const [chatData, setChatData] = useState(null);
  const [relatedChats, setRelatedChats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRequestWizard, setShowRequestWizard] = useState(false);

  const providerId = provider?._id;
  const providerName = provider?.providerProfile?.businessName
    || provider?.profile?.firstName
    || t('ui.inquiryChat.professional');

  const providerAvatar = provider?.profile?.avatar || null;

  // Crear o obtener el chat de consulta al abrir el modal
  useEffect(() => {
    if (!isOpen || !providerId || !currentUserId) return;
    let cancelled = false;

    const initChat = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post(`/chats/inquiry/${providerId}`);
        if (!cancelled && data?.success) {
          setChatData(data.data.chat);
          setRelatedChats(data.data.relatedChats || null);
        }
      } catch (err) {
        console.error('InquiryChatModal - initChat error:', err);
        if (!cancelled) setError(t('ui.inquiryChat.errorCreating'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initChat();
    return () => { cancelled = true; };
  }, [isOpen, providerId, currentUserId, t]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.dataset.scrollY = scrollY;
    } else {
      const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
    return () => {
      const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showRequestWizard) closeModal();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal, showRequestWizard]);

  const handleRequestEstimate = useCallback(() => {
    setShowRequestWizard(true);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10000 transition-opacity duration-300"
        onClick={closeModal}
      />

      {/* Modal container */}
      <div className="fixed inset-2 sm:inset-4 md:left-[10%] md:right-[10%] lg:left-[15%] lg:right-[15%] md:top-6 md:bottom-6 bg-white rounded-2xl shadow-2xl z-10000 flex flex-col overflow-hidden animate-modal-enter">

        {/* Header */}
        <div className="relative bg-linear-to-r from-brand-500 to-brand-600 px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 shrink-0">
          {/* Back / Close */}
          <button
            onClick={closeModal}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors shrink-0"
            aria-label={t('ui.inquiryChat.close')}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Provider info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {providerAvatar ? (
              <img
                src={providerAvatar}
                alt={providerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {providerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-sm sm:text-base truncate">
                {providerName}
              </h2>
              <p className="text-white/70 text-xs truncate">
                {t('ui.inquiryChat.subtitle')}
              </p>
            </div>
          </div>

          {/* Request Estimate button — desktop */}
          <button
            onClick={handleRequestEstimate}
            className="hidden sm:inline-flex items-center gap-1.5 bg-white text-brand-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all shadow shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('ui.inquiryChat.requestEstimate')}
          </button>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Spinner className="w-8 h-8 text-brand-500 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('ui.inquiryChat.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium mb-1">{t('ui.inquiryChat.errorTitle')}</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            </div>
          ) : chatData ? (
            <ChatRoom
              chatId={chatData._id}
              chat={chatData}
              currentUserId={currentUserId}
              userRole="client"
              showHeader={false}
              maxHeight="100%"
              className="flex-1"
              onClose={closeModal}
              relatedChats={relatedChats}
            />
          ) : null}
        </div>

        {/* Mobile sticky "Solicitar Estimado" button */}
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 shrink-0">
          <button
            onClick={handleRequestEstimate}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-brand-500 to-brand-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:from-brand-600 hover:to-brand-700 transition-all shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('ui.inquiryChat.requestEstimate')}
          </button>
        </div>
      </div>

      {/* Request Wizard Modal — layered on top of inquiry chat */}
      {showRequestWizard && (
        <RequestWizardModal
          provider={provider}
          isOpen={showRequestWizard}
          onClose={() => setShowRequestWizard(false)}
          initialCategory={selectedCategory}
        />
      )}
    </>
  );
}

InquiryChatModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  provider: PropTypes.object,
  currentUserId: PropTypes.string,
  selectedCategory: PropTypes.string
};

export default InquiryChatModal;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ChatRoom from '@/components/ui/ChatRoom.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { getTranslatedField, getTranslatedProposalMessage, useCurrentLanguage } from '@/utils/translations.js';
import { 
  HiArrowLeft, HiCurrencyDollar, HiStar, HiBadgeCheck, HiCheckCircle,
  HiX, HiChat, HiClock, HiSparkles, HiShieldCheck, HiUserCircle,
  HiThumbUp, HiThumbDown, HiLightningBolt, HiTrendingUp
} from 'react-icons/hi';

export default function ClientRequestProposals() {
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage(); // Hook reactivo al cambio de idioma
  const { role, roles, viewRole, clearError, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState([]);
  const [requestMeta, setRequestMeta] = useState(null);
  const [accepting, setAccepting] = useState(''); // proposalId currently accepting
  const [rejecting, setRejecting] = useState(''); // proposalId currently rejecting
  
  // Estado para el chat/negociación
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => { clearError?.(); }, [clearError]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/client/requests/${id}/proposals`);
      const d = data?.data || {};
      const list = getArray(data, [['data','proposals'], ['proposals']]);
      setProposals(list);
      setRequestMeta(d.request || null);
    } catch (err) {
      setError(err?.response?.data?.message || t('client.proposals.loadError'));
    } finally { setLoading(false); }
  };

  const isClientCapable = useMemo(() => (
    viewRole === 'client' || role === 'client' || roles?.includes('client') || roles?.includes('provider')
  ), [viewRole, role, roles]);

  useEffect(() => { if (isAuthenticated && isClientCapable) load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [isAuthenticated, isClientCapable, id]);

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isClientCapable) {
    return <Alert type="warning">{t('client.requests.clientOnlySection')}</Alert>;
  }

  const accept = async (proposalId) => {
    setAccepting(proposalId);
    try {
      const { data } = await api.post(`/client/proposals/${proposalId}/accept`);
      if (data?.success) {
        toast.success(t('client.proposals.acceptedSuccess'));
        navigate('/reservas'); // Redirigir a la sección de reservas del cliente
      } else {
        toast.warning(data?.message || t('client.proposals.acceptError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.proposals.acceptError');
      toast.error(msg);
    } finally {
      setAccepting('');
    }
  };

  const reject = async (proposalId) => {
    setRejecting(proposalId);
    try {
      const { data } = await api.post(`/client/proposals/${proposalId}/reject`);
      if (data?.success) {
        toast.info(t('client.proposals.rejected'));
        await load();
      } else {
        toast.warning(data?.message || t('client.proposals.rejectError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.proposals.rejectError');
      toast.error(msg);
    } finally {
      setRejecting('');
    }
  };

  // Abrir chat de negociación con el proveedor
  const openNegotiationChat = async (proposal) => {
    setLoadingChat(true);
    setActiveProposal(proposal);
    try {
      const { data } = await api.post(`/chats/proposal/${proposal._id}`);
      if (data?.success && data?.data?.chat) {
        setActiveChat(data.data.chat);
        setChatModalOpen(true);
      } else {
        toast.error(data?.message || t('client.proposals.chatOpenError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('client.proposals.chatOpenError');
      toast.error(msg);
    } finally {
      setLoadingChat(false);
    }
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setActiveChat(null);
    setActiveProposal(null);
  };

  // Plan badge styles
  const getPlanStyle = (plan) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
      case 'pro':
        return 'bg-linear-to-r from-purple-500 to-pink-500 text-white';
      case 'business':
        return 'bg-linear-to-r from-amber-500 to-orange-500 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header con gradiente premium */}
      <div className="bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 overflow-hidden relative">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back button */}
          <button 
            onClick={() => navigate('/mis-solicitudes')}
            className="group inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <HiArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{t('client.proposals.backToRequests')}</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                  <HiSparkles className="w-4 h-4" />
                  {proposals.length} {t('client.proposals.proposalCount', { count: proposals.length })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                {t('client.proposals.title')}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {t('client.proposals.request')}: {getTranslatedField(requestMeta?.translations, 'title', requestMeta?.title || t('common.loading'), currentLang)}
              </p>
            </div>
            {/* Stats card */}
            {proposals.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
                  <HiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">
                    {t('client.proposals.professionalsCount', { count: proposals.length })}
                  </div>
                  <div className="text-white/70 text-sm">{t('client.proposals.professionalsInterested', { count: proposals.length })}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-4">
        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg animate-pulse">
                <Spinner size="lg" className="text-white" />
              </div>
              <p className="text-gray-600 font-medium">{t('client.proposals.loading')}</p>
            </div>
          </div>
        )}

        {!loading && (!Array.isArray(proposals) || proposals.length === 0) && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
              <HiClock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('client.proposals.noProposals')}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t('client.proposals.noProposalsDescription')}
            </p>
            <button
              onClick={() => navigate('/mis-solicitudes')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 font-medium rounded-xl hover:bg-emerald-200 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              {t('client.proposals.backToRequests')}
            </button>
          </div>
        )}

        {/* Proposals list */}
        <div className="space-y-4">
          {(Array.isArray(proposals) ? proposals : []).map((p) => {
            const amount = p?.pricing?.amount;
            const amountMin = p?.pricing?.amountMin;
            const amountMax = p?.pricing?.amountMax;
            const isRange = p?.pricing?.isRange || false;
            const currency = p?.pricing?.currency || 'USD';
            const providerName = p?.provider?.providerProfile?.businessName || t('client.proposals.provider');
            const score = p?.provider?.score?.total;
            const plan = p?.provider?.subscription?.plan;
            const avatar = p?.provider?.profile?.avatar;
            
            // Función para formatear precio (fijo o rango)
            const formatPrice = () => {
              const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency });
              if (isRange && amountMin && amountMax) {
                return `${formatter.format(amountMin)} - ${formatter.format(amountMax)}`;
              }
              return amount ? formatter.format(amount) : t('client.proposals.noPrice');
            };
            
            return (
              <div 
                key={p._id} 
                className="group bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Card header with provider info */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Provider avatar and info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 ring-2 ring-gray-200 shadow-md">
                          {avatar ? (
                            <img src={avatar} alt={providerName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-400 to-teal-500">
                              <HiUserCircle className="w-10 h-10 text-white/80" />
                            </div>
                          )}
                        </div>
                        {/* Verified badge */}
                        {plan && plan.toLowerCase() !== 'free' && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                            <HiBadgeCheck className="w-5 h-5 text-emerald-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{providerName}</h3>
                          {plan && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getPlanStyle(plan)}`}>
                              {plan.toLowerCase() === 'premium' || plan.toLowerCase() === 'pro' ? (
                                <HiLightningBolt className="w-3 h-3" />
                              ) : null}
                              {plan}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {typeof score === 'number' && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <HiStar className="w-4 h-4 fill-current" />
                              <span className="font-medium">{Math.round(score)}</span>
                              <span className="text-gray-400">score</span>
                            </div>
                          )}
                          {p.createdAt && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <HiClock className="w-4 h-4" />
                              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Price tag */}
                    <div className="sm:text-right">
                      <div className="inline-flex flex-col items-end gap-1">
                        {isRange && (
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            {t('client.proposals.priceRange')}
                          </span>
                        )}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl ${isRange ? 'bg-linear-to-r from-purple-50 to-violet-50 border-purple-100' : 'bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-100'}`}>
                          <HiCurrencyDollar className={`w-5 h-5 ${isRange ? 'text-purple-600' : 'text-emerald-600'}`} />
                          <span className={`text-lg sm:text-xl font-bold ${isRange ? 'text-purple-700' : 'text-emerald-700'}`}>
                            {formatPrice()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message */}
                  {p.message && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{getTranslatedProposalMessage(p, currentLang)}</p>
                    </div>
                  )}
                </div>
                
                {/* Card footer with actions */}
                <div className="px-5 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => accept(p._id)}
                      disabled={accepting === p._id}
                      className="group/btn relative flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></span>
                      <span className="relative flex items-center gap-2">
                        {accepting === p._id ? (
                          <Spinner size="sm" className="text-white" />
                        ) : (
                          <HiCheckCircle className="w-5 h-5" />
                        )}
                        {accepting === p._id ? t('client.proposals.accepting') : t('client.proposals.accept')}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => reject(p._id)}
                      disabled={rejecting === p._id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {rejecting === p._id ? (
                        <Spinner size="sm" className="text-red-600" />
                      ) : (
                        <HiX className="w-5 h-5" />
                      )}
                      {t('client.proposals.reject')}
                    </button>
                    
                    <button
                      onClick={() => openNegotiationChat(p)}
                      disabled={loadingChat && activeProposal?._id === p._id}
                      title="Conversar con el profesional para negociar términos o resolver dudas"
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {loadingChat && activeProposal?._id === p._id ? (
                        <Spinner size="sm" className="text-blue-600" />
                      ) : (
                        <HiChat className="w-5 h-5" />
                      )}
                      {t('client.proposals.negotiate')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick tips card */}
        {proposals.length > 0 && (
          <div className="mt-8 p-6 bg-linear-to-br from-emerald-50 via-white to-teal-50 border border-emerald-100 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shrink-0">
                <HiShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t('client.proposals.tip')}</h4>
                <p className="text-sm text-gray-600">
                  {t('client.proposals.tipDescription')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Chat de Negociación */}
        <Modal
          open={chatModalOpen}
          onClose={closeChatModal}
          size="xl"
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <HiChat className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">
                  {t('client.proposals.negotiateWith', { name: activeProposal?.provider?.providerProfile?.businessName || t('client.proposals.professional') })}
                </span>
                <p className="text-sm text-gray-500 font-normal">
                  {t('client.proposals.proposal')}: {(() => {
                    const pricing = activeProposal?.pricing;
                    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: pricing?.currency || 'USD' });
                    if (pricing?.isRange && pricing?.amountMin && pricing?.amountMax) {
                      return `${formatter.format(pricing.amountMin)} - ${formatter.format(pricing.amountMax)}`;
                    }
                    return pricing?.amount ? formatter.format(pricing.amount) : 'Sin precio';
                  })()}
                </p>
              </div>
            </div>
          }
        >
          <div className="h-[60vh] flex flex-col">
            {activeChat && (
              <ChatRoom 
                chatId={activeChat._id || activeChat.id}
                chat={activeChat}
                currentUserId={user?.id || user?._id}
                showHeader={false}
                maxHeight="100%"
              />
            )}
          </div>
          
          {/* Acciones rápidas del modal */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              💡 {t('client.proposals.chatModal.tip')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={closeChatModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  closeChatModal();
                  if (activeProposal) accept(activeProposal._id);
                }}
                disabled={accepting === activeProposal?._id}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <HiCheckCircle className="w-4 h-4" />
                {t('client.proposals.chatModal.acceptProposal')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

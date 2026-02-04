import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import PortfolioModal from '@/components/ui/PortfolioModal.jsx';
import { getTranslatedRequestInfo, useCurrentLanguage } from '@/utils/translations.js';
import { 
  HiArrowLeft, HiPhotograph, HiCurrencyDollar, HiClock, HiCalendar,
  HiLocationMarker, HiTag, HiExclamation, HiPaperAirplane, HiSave,
  HiX, HiRefresh, HiSparkles, HiCheckCircle, HiBadgeCheck, HiLightningBolt,
  HiTrendingUp, HiChartBar, HiShieldCheck, HiCube, HiQuestionMarkCircle,
  HiChat
} from 'react-icons/hi';

export default function RequestDetail() {
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage(); // Hook reactivo al cambio de idioma
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const toast = useToast();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [myProposal, setMyProposal] = useState(null); // Propuesta del proveedor actual si existe
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  // Proposal form state
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    amountMin: '',
    amountMax: '',
    isRange: false, // Toggle para monto fijo o rango
    estimatedHours: '',
    startDate: '',
    message: '',
    materialsIncluded: false,
    cleanupIncluded: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [upgrade, setUpgrade] = useState({ show: false, message: '' });
  const [draftId, setDraftId] = useState('');
  
  // Estado para solicitar más información
  const [showInfoRequestModal, setShowInfoRequestModal] = useState(false);
  const [infoRequestMessage, setInfoRequestMessage] = useState('');
  const [sendingInfoRequest, setSendingInfoRequest] = useState(false);

  const autoOpenForm = useMemo(() => new URLSearchParams(search).get('proponer') === '1', [search]);

  useEffect(() => { clearError?.(); }, [clearError]);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/provider/proposals/requests/${id}`);
      const req = data?.data?.request || data?.request || null;
      setRequest(req);
      
      // Detectar si el proveedor actual ya envió una propuesta para esta solicitud
      const me = user?.id || user?._id;
      if (req?.proposals && Array.isArray(req.proposals) && me) {
        const existingProposal = req.proposals.find(p => {
          const providerId = p?.provider?._id || p?.provider;
          return String(providerId) === String(me);
        });
        // Solo considerar propuestas que ya fueron enviadas (no drafts)
        if (existingProposal && existingProposal.status !== 'draft') {
          setMyProposal(existingProposal);
        } else {
          setMyProposal(null);
        }
      } else {
        setMyProposal(null);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('provider.requestDetail.errorLoading');
      setError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthenticated && viewRole === 'provider') load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id, isAuthenticated, viewRole]);

  useEffect(() => {
    if (!isAuthenticated || viewRole !== 'provider') return;
    const fetchContext = async () => {
      setContextLoading(true);
      try {
        const { data } = await api.get('/provider/proposals/context');
        if (data?.success) {
          setContext(data.data);
        } else {
          setContext(null);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) {
          setUpgrade({ show: true, message: t('provider.requestDetail.needSubscription') });
        }
      } finally {
        setContextLoading(false);
      }
    };
    fetchContext();
  }, [isAuthenticated, viewRole]);

  useEffect(() => {
    if (autoOpenForm) {
      // Scroll a formulario si viene con ?proponer=1
      const el = document.getElementById('proposal-form');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }
    }
  }, [autoOpenForm, request]);

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Durante transición de rol, no mostrar mensaje de advertencia
  if (isRoleSwitching) {
    return null;
  }

  if (viewRole !== 'provider') {
    return <Alert type="warning">{t('provider.requestDetail.providerOnly')}</Alert>;
  }

  const validate = () => {
    const errs = {};
    // Validar monto según si es rango o fijo
    if (form.isRange) {
      if (!form.amountMin || Number(form.amountMin) <= 0) errs.amountMin = t('provider.requestDetail.amountMinRequired');
      if (!form.amountMax || Number(form.amountMax) <= 0) errs.amountMax = t('provider.requestDetail.amountMaxRequired');
      if (form.amountMin && form.amountMax && Number(form.amountMin) >= Number(form.amountMax)) {
        errs.amountMax = t('provider.requestDetail.amountMaxMustBeGreater');
      }
    } else {
      if (!form.amount || Number(form.amount) <= 0) errs.amount = t('provider.requestDetail.amountRequired');
    }
    if (!form.message || form.message.trim().length < 10) errs.message = t('provider.requestDetail.messageRequired');
    // estimatedHours opcional pero si se provee debe ser > 0
    if (form.estimatedHours && Number(form.estimatedHours) <= 0) errs.estimatedHours = t('provider.requestDetail.hoursError');
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (context && !context.unlimited && context.remaining <= 0) {
      setUpgrade({ show: true, message: 'Has alcanzado tu límite mensual de leads.' });
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        startDate: form.startDate || undefined,
        materialsIncluded: !!form.materialsIncluded,
        cleanupIncluded: !!form.cleanupIncluded,
        message: form.message.trim(),
        isRange: form.isRange
      };
      
      // Agregar montos según si es rango o fijo
      if (form.isRange) {
        payload.amountMin = Number(form.amountMin);
        payload.amountMax = Number(form.amountMax);
        payload.amount = Math.round((Number(form.amountMin) + Number(form.amountMax)) / 2);
      } else {
        payload.amount = Number(form.amount);
      }
      
  const { data } = await api.post(`/provider/proposals/requests/${id}`, payload);
      if (data?.success) {
        toast.success(t('toast.proposalSent'));
        navigate('/mensajes');
      } else {
        toast.warning(data?.message || t('provider.requestDetail.proposalNotSent'));
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || t('provider.requestDetail.errorSending');
      if (status === 403) {
        toast.error(msg || t('provider.requestDetail.requiresSubscription'));
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || t('provider.requestDetail.planNotAllowed') });
      } else if (status === 429) {
        toast.error(msg || t('provider.requestDetail.leadLimitReached'));
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || t('provider.requestDetail.leadLimitReached') });
      } else if (status === 400) {
        toast.error(msg || t('provider.requestDetail.invalidValidation'));
      } else if (status === 404) {
        toast.error(t('provider.requestDetail.requestNotAvailable'));
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async () => {
    if (context && !context.unlimited && context.remaining <= 0) {
      setUpgrade({ show: true, message: t('provider.requestDetail.leadLimitReached') });
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        amount: Number(form.amount),
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        startDate: form.startDate || undefined,
        materialsIncluded: !!form.materialsIncluded,
        cleanupIncluded: !!form.cleanupIncluded,
        message: form.message.trim()
      };
      const { data } = await api.post(`/provider/proposals/requests/${id}/draft`, payload);
      const pid = data?.data?.proposal?._id || data?.proposal?._id || data?.proposalId;
      if (data?.success && pid) {
        setDraftId(pid);
        toast.success(t('toast.draftSaved'));
      } else {
        toast.warning(data?.message || t('provider.requestDetail.draftNotSaved'));
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || t('provider.requestDetail.errorSavingDraft');
      if (status === 403) {
        toast.error(msg || t('provider.requestDetail.requiresSubscription'));
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || t('provider.requestDetail.planNotAllowed') });
      } else if (status === 429) {
        toast.error(msg || t('provider.requestDetail.leadLimitReached'));
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || t('provider.requestDetail.leadLimitReached') });
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraft = async () => {
    if (!draftId) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        amount: Number(form.amount),
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        startDate: form.startDate || undefined,
        materialsIncluded: !!form.materialsIncluded,
        cleanupIncluded: !!form.cleanupIncluded,
        message: form.message.trim()
      };
      const { data } = await api.put(`/provider/proposals/${draftId}`, payload);
      if (data?.success) {
        toast.success(t('toast.draftUpdated'));
      } else {
        toast.warning(data?.message || t('provider.requestDetail.draftNotUpdated'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('provider.requestDetail.errorUpdatingDraft');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const sendDraft = async () => {
    if (!draftId) return;
    if (context && !context.unlimited && context.remaining <= 0) {
      setUpgrade({ show: true, message: t('provider.requestDetail.leadLimitReached') });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/provider/proposals/${draftId}/send`, {});
      if (data?.success) {
        toast.success(t('toast.proposalSent'));
        navigate('/mensajes');
      } else {
        toast.warning(data?.message || t('provider.requestDetail.draftNotSent'));
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || t('provider.requestDetail.errorSending');
      if (status === 403) {
        toast.error(msg || t('provider.requestDetail.requiresSubscription'));
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || t('provider.requestDetail.planNotAllowed') });
      } else if (status === 429) {
        toast.error(msg || t('provider.requestDetail.leadLimitReached'));
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || t('provider.requestDetail.leadLimitReached') });
      } else if (status === 404) {
        toast.error(t('provider.requestDetail.draftNotAvailable'));
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cancelProposal = async () => {
    if (!draftId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/provider/proposals/${draftId}/cancel`, {});
      if (data?.success) {
        toast.info(t('toast.proposalCancelled'));
        setDraftId('');
      } else {
        toast.warning(data?.message || t('provider.requestDetail.proposalNotCancelled'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('provider.requestDetail.errorCancelling');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Función para solicitar más información al cliente antes de enviar propuesta
  const requestMoreInfo = async () => {
    if (!infoRequestMessage.trim()) {
      toast.warning(t('provider.requestDetail.infoRequestMessageRequired'));
      return;
    }
    setSendingInfoRequest(true);
    try {
      // Crear un chat con el cliente para solicitar más información
      const { data } = await api.post(`/chats/request/${id}/info`, {
        message: infoRequestMessage.trim(),
        type: 'info_request'
      });
      if (data?.success) {
        toast.success(t('provider.requestDetail.infoRequestSent'));
        setShowInfoRequestModal(false);
        setInfoRequestMessage('');
        // Redirigir al chat
        if (data.data?.chat?._id) {
          navigate(`/mensajes?chat=${data.data.chat._id}`);
        }
      } else {
        toast.warning(data?.message || t('provider.requestDetail.infoRequestError'));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('provider.requestDetail.infoRequestError');
      toast.error(msg);
    } finally {
      setSendingInfoRequest(false);
    }
  };

  // Urgency styles
  const getUrgencyStyle = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'urgente':
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'alta':
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'media':
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header con gradiente premium */}
      <div className="bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 overflow-hidden relative">
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
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <HiArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{t('provider.requestDetail.backToJobs')}</span>
          </button>

          {request && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getUrgencyStyle(request.basicInfo?.urgency)}`}>
                    <HiExclamation className="w-3.5 h-3.5" />
                    {request.basicInfo?.urgency || t('provider.requestDetail.normal')}
                  </span>
                  {request.basicInfo?.category && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                      <HiTag className="w-3.5 h-3.5" />
                      {request.basicInfo.category}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {getTranslatedRequestInfo(request, currentLang).title || t('provider.requestDetail.requestDetail')}
                </h1>
                {/* Eliminar presupuesto del header, ya no es relevante */}
              </div>
              {/* Quick stats */}
              {request.media && ((request.media.photos?.length > 0) || (request.media.videos?.length > 0)) && (
                <button
                  onClick={() => setShowPhotosModal(true)}
                  className="group flex items-center gap-3 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/30 flex items-center justify-center">
                    <HiPhotograph className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {(request.media.photos?.length || 0) + (request.media.videos?.length || 0)} {t('provider.requestDetail.files')}
                    </div>
                    <div className="text-white/70 text-sm">{t('provider.requestDetail.viewMedia')}</div>
                  </div>
                </button>
              )}
            </div>
          )}
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
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
                <Spinner size="lg" className="text-white" />
              </div>
              <p className="text-gray-600 font-medium">{t('provider.requestDetail.loading')}</p>
            </div>
          </div>
        )}

        {request && (
          <div className="space-y-6">
            {/* Request Details Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <HiSparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{t('provider.requestDetail.detailsTitle')}</h2>
                    <p className="text-sm text-gray-500">{t('provider.requestDetail.detailsSubtitle')}</p>
                  </div>
                </div>
                
                {/* Description */}
                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{getTranslatedRequestInfo(request, currentLang).description}</p>
                </div>
                
                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {request.basicInfo?.subcategory && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                        <HiTag className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">{t('provider.requestDetail.subcategory')}</div>
                        <div className="font-semibold text-gray-900">{request.basicInfo.subcategory}</div>
                      </div>
                    </div>
                  )}
                  {request.location?.address && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <HiLocationMarker className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">{t('provider.requestDetail.location')}</div>
                        <div className="font-semibold text-gray-900 truncate">{request.location.address}</div>
                      </div>
                    </div>
                  )}
                  {request.scheduling?.preferredDate && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <HiCalendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">{t('provider.requestDetail.preferredDate')}</div>
                        <div className="font-semibold text-gray-900">{new Date(request.scheduling.preferredDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card de "Necesito más información" - Solo mostrar si NO hay propuesta enviada */}
            {!myProposal && (
            <div className="bg-linear-to-br from-amber-50 via-white to-orange-50 rounded-2xl border border-amber-200 shadow-lg shadow-amber-100/50 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                      <HiQuestionMarkCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{t('provider.requestDetail.needMoreInfo')}</h4>
                      <p className="text-sm text-gray-600">{t('provider.requestDetail.needMoreInfoDesc')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInfoRequestModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <HiChat className="w-5 h-5" />
                    {t('provider.requestDetail.askClient')}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* SI YA HAY PROPUESTA ENVIADA: Mostrar información de la propuesta */}
            {myProposal && (
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden">
                {/* Header de propuesta enviada */}
                <div className="bg-linear-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <HiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{t('provider.requestDetail.proposalSentTitle')}</h3>
                      <p className="text-sm text-gray-600">{t('provider.requestDetail.proposalSentSubtitle')}</p>
                    </div>
                  </div>
                  {/* Badge de estado */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      myProposal.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                      myProposal.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                      myProposal.status === 'viewed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {myProposal.status === 'accepted' && <HiCheckCircle className="w-4 h-4" />}
                      {myProposal.status === 'rejected' && <HiX className="w-4 h-4" />}
                      {myProposal.status === 'viewed' && <HiSparkles className="w-4 h-4" />}
                      {myProposal.status === 'sent' && <HiPaperAirplane className="w-4 h-4" />}
                      {t(`provider.requestDetail.proposalStatus.${myProposal.status}`) || myProposal.status}
                    </span>
                    {myProposal.createdAt && (
                      <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <HiClock className="w-4 h-4" />
                        {t('provider.requestDetail.sentOn')} {new Date(myProposal.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido de la propuesta */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Monto propuesto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <HiCurrencyDollar className="w-5 h-5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">{t('provider.requestDetail.proposedAmount')}</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {(() => {
                          const pricing = myProposal.pricing;
                          const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: pricing?.currency || 'USD' });
                          if (pricing?.isRange && pricing?.amountMin && pricing?.amountMax) {
                            return `${formatter.format(pricing.amountMin)} - ${formatter.format(pricing.amountMax)}`;
                          }
                          return pricing?.amount ? formatter.format(pricing.amount) : '-';
                        })()}
                      </div>
                    </div>

                    {myProposal.timing?.estimatedHours && (
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <HiClock className="w-5 h-5" />
                          <span className="text-xs font-semibold uppercase tracking-wide">{t('provider.requestDetail.estimatedHours')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {myProposal.timing.estimatedHours} {t('provider.requestDetail.hours')}
                        </div>
                      </div>
                    )}

                    {myProposal.timing?.startDate && (
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <HiCalendar className="w-5 h-5" />
                          <span className="text-xs font-semibold uppercase tracking-wide">{t('provider.requestDetail.startDate')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {new Date(myProposal.timing.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Términos incluidos */}
                  <div className="flex flex-wrap gap-3">
                    {myProposal.terms?.materialsIncluded && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl border border-brand-200">
                        <HiCube className="w-5 h-5" />
                        <span className="font-medium">{t('provider.requestDetail.includesMaterials')}</span>
                      </span>
                    )}
                    {myProposal.terms?.cleanupIncluded && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-200">
                        <HiSparkles className="w-5 h-5" />
                        <span className="font-medium">{t('provider.requestDetail.includesCleanup')}</span>
                      </span>
                    )}
                  </div>

                  {/* Mensaje de la propuesta */}
                  {myProposal.message && (
                    <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <HiBadgeCheck className="w-5 h-5" />
                        <span className="text-sm font-semibold">{t('provider.requestDetail.yourMessage')}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{myProposal.message}</p>
                    </div>
                  )}

                  {/* Información de comisión si existe */}
                  {myProposal.commission && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 text-amber-700">
                        <HiChartBar className="w-5 h-5" />
                        <span className="font-medium">
                          {t('provider.requestDetail.commission')}: {myProposal.commission.rate ? `${Math.round(myProposal.commission.rate * 100)}%` : '-'}
                          {myProposal.commission.amount && ` (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(myProposal.commission.amount)})`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => navigate('/mensajes')}
                      className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <HiChat className="w-5 h-5" />
                      {t('provider.requestDetail.goToMessages')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/empleos')}
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <HiArrowLeft className="w-5 h-5" />
                      {t('provider.requestDetail.backToJobs')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Proposal Form Card - Solo mostrar si NO hay propuesta enviada */}
            {!myProposal && (
            <div id="proposal-form" className={`bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden transition-opacity ${submitting ? 'opacity-70 pointer-events-none' : ''}`}>
              {/* Form Header */}
              <div className="bg-linear-to-r from-brand-50 to-cyan-50 border-b border-brand-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <HiPaperAirplane className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('provider.requestDetail.sendProposal')}</h3>
                    <p className="text-sm text-gray-600">{t('provider.requestDetail.sendProposalSubtitle')}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Context info - Plan status */}
                {contextLoading && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6 animate-pulse">
                    <Spinner size="sm" className="text-brand-600" />
                    <span className="text-sm text-gray-600">{t('provider.requestDetail.loadingPlan')}</span>
                  </div>
                )}
                
                {context && (
                  <div className="mb-6 p-5 bg-linear-to-br from-brand-50 via-white to-cyan-50 border border-brand-100 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                          <HiShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 capitalize">{context.plan}</span>
                            {context.subscriptionStatus === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <HiCheckCircle className="w-3.5 h-3.5" />
                                {t('provider.requestDetail.active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                <HiX className="w-3.5 h-3.5" />
                                {t('provider.requestDetail.inactive')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{t('provider.requestDetail.commission')}: {context.commissionRatePercent}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <HiLightningBolt className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {context.unlimited ? t('provider.requestDetail.unlimitedLeads') : `${Math.max(context.remaining, 0)} ${t('provider.requestDetail.remainingLeads')}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!context.unlimited && context.leadLimit > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{t('provider.requestDetail.leadsUsed')}</span>
                          <span>{context.leadsUsed} / {context.leadLimit}</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-brand-500 to-cyan-500 transition-all duration-500 rounded-full"
                            style={{ width: `${Math.min(100, (context.leadsUsed / context.leadLimit) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {!context.unlimited && context.remaining <= 0 && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <HiExclamation className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700">{t('provider.requestDetail.limitReachedUpgrade')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Amount field with toggle for range */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <HiCurrencyDollar className="w-4 h-4 text-gray-400" />
                        {t('provider.requestDetail.amountLabel')}
                      </label>
                      {/* Toggle para rango de precio */}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isRange: !f.isRange }))}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          form.isRange 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        {form.isRange ? t('provider.requestDetail.rangeEnabled') : t('provider.requestDetail.enableRange')}
                      </button>
                    </div>
                    
                    {!form.isRange ? (
                      /* Monto fijo */
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                        <input 
                          type="number" 
                          min="1" 
                          step="0.01" 
                          className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-lg font-semibold" 
                          value={form.amount} 
                          onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      /* Rango de monto */
                      <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs text-purple-700 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('provider.requestDetail.rangeHint')}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input 
                              type="number" 
                              min="1" 
                              step="0.01" 
                              className="w-full pl-7 pr-3 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all bg-white font-semibold" 
                              value={form.amountMin} 
                              onChange={(e) => setForm(f => ({ ...f, amountMin: e.target.value }))}
                              placeholder={t('provider.requestDetail.minAmount')}
                            />
                            <span className="absolute -bottom-5 left-0 text-[10px] text-gray-500">{t('provider.requestDetail.minimum')}</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input 
                              type="number" 
                              min="1" 
                              step="0.01" 
                              className="w-full pl-7 pr-3 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all bg-white font-semibold" 
                              value={form.amountMax} 
                              onChange={(e) => setForm(f => ({ ...f, amountMax: e.target.value }))}
                              placeholder={t('provider.requestDetail.maxAmount')}
                            />
                            <span className="absolute -bottom-5 left-0 text-[10px] text-gray-500">{t('provider.requestDetail.maximum')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formErrors.amount && (
                      <p className="flex items-center gap-1.5 text-sm text-red-600">
                        <HiExclamation className="w-4 h-4" />
                        {formErrors.amount}
                      </p>
                    )}
                    {formErrors.amountMin && (
                      <p className="flex items-center gap-1.5 text-sm text-red-600">
                        <HiExclamation className="w-4 h-4" />
                        {formErrors.amountMin}
                      </p>
                    )}
                    {formErrors.amountMax && (
                      <p className="flex items-center gap-1.5 text-sm text-red-600">
                        <HiExclamation className="w-4 h-4" />
                        {formErrors.amountMax}
                      </p>
                    )}
                    {/* Commission preview */}
                    {context && ((form.isRange && form.amountMin && form.amountMax) || (!form.isRange && form.amount && Number(form.amount) > 0)) && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {(() => {
                          const displayAmount = form.isRange 
                            ? Math.round((Number(form.amountMin) + Number(form.amountMax)) / 2) 
                            : Number(form.amount);
                          const minAmount = form.isRange ? Number(form.amountMin) : displayAmount;
                          const maxAmount = form.isRange ? Number(form.amountMax) : displayAmount;
                          
                          return (
                            <>
                              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <HiChartBar className="w-4 h-4 text-amber-600" />
                                <span className="text-sm text-amber-800">
                                  {t('provider.requestDetail.commission')}: {form.isRange 
                                    ? `${Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(minAmount * context.commissionRateDecimal)} - ${Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(maxAmount * context.commissionRateDecimal)}`
                                    : Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(displayAmount * context.commissionRateDecimal)
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <HiTrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800">
                                  {t('provider.requestDetail.yourIncome')}: {form.isRange
                                    ? `${Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(minAmount * (1 - context.commissionRateDecimal))} - ${Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(maxAmount * (1 - context.commissionRateDecimal))}`
                                    : Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(displayAmount * (1 - context.commissionRateDecimal))
                                  }
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Hours and Date grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <HiClock className="w-4 h-4 text-gray-400" />
                        {t('provider.requestDetail.estimatedHours')}
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        step="1" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white" 
                        value={form.estimatedHours} 
                        onChange={(e) => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                        placeholder={t('provider.requestDetail.hoursPlaceholder')}
                      />
                      {formErrors.estimatedHours && (
                        <p className="flex items-center gap-1.5 text-sm text-red-600">
                          <HiExclamation className="w-4 h-4" />
                          {formErrors.estimatedHours}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <HiCalendar className="w-4 h-4 text-gray-400" />
                        {t('provider.requestDetail.startDate')}
                      </label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white" 
                        value={form.startDate} 
                        onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Checkboxes with premium style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.materialsIncluded ? 'bg-brand-50 border-brand-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={form.materialsIncluded} 
                        onChange={(e) => setForm(f => ({ ...f, materialsIncluded: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${form.materialsIncluded ? 'bg-brand-500' : 'bg-gray-200'}`}>
                        <HiCube className={`w-5 h-5 ${form.materialsIncluded ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${form.materialsIncluded ? 'text-brand-700' : 'text-gray-700'}`}>{t('provider.requestDetail.includesMaterials')}</div>
                        <div className="text-xs text-gray-500">{t('provider.requestDetail.includesMaterialsDesc')}</div>
                      </div>
                      {form.materialsIncluded && <HiCheckCircle className="w-6 h-6 text-brand-500" />}
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.cleanupIncluded ? 'bg-cyan-50 border-cyan-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={form.cleanupIncluded} 
                        onChange={(e) => setForm(f => ({ ...f, cleanupIncluded: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${form.cleanupIncluded ? 'bg-cyan-500' : 'bg-gray-200'}`}>
                        <HiSparkles className={`w-5 h-5 ${form.cleanupIncluded ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${form.cleanupIncluded ? 'text-cyan-700' : 'text-gray-700'}`}>{t('provider.requestDetail.includesCleanup')}</div>
                        <div className="text-xs text-gray-500">{t('provider.requestDetail.includesCleanupDesc')}</div>
                      </div>
                      {form.cleanupIncluded && <HiCheckCircle className="w-6 h-6 text-cyan-500" />}
                    </label>
                  </div>

                  {/* Message field */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <HiBadgeCheck className="w-4 h-4 text-gray-400" />
                      {t('provider.requestDetail.messageLabel')}
                    </label>
                    <textarea 
                      rows={5} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white resize-none" 
                      placeholder={t('provider.requestDetail.messagePlaceholder')}
                      value={form.message} 
                      onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    ></textarea>
                    {formErrors.message && (
                      <p className="flex items-center gap-1.5 text-sm text-red-600">
                        <HiExclamation className="w-4 h-4" />
                        {formErrors.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {form.message.length}/10 {t('provider.requestDetail.minChars')}
                    </p>
                  </div>

                  {context && context.subscriptionStatus !== 'active' && (
                    <Alert type="warning">{t('provider.requestDetail.subscriptionInactive')}</Alert>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <button 
                      type="submit" 
                      disabled={submitting || (context && !context.unlimited && context.remaining <= 0)}
                      className="group relative flex items-center gap-2 px-6 py-3 bg-linear-to-r from-brand-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                      <span className="relative flex items-center gap-2">
                        {submitting ? (
                          <Spinner size="sm" className="text-white" />
                        ) : (
                          <HiPaperAirplane className="w-5 h-5" />
                        )}
                        {submitting ? t('provider.requestDetail.sending') : t('provider.requestDetail.sendProposalBtn')}
                      </span>
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={saveDraft}
                      disabled={submitting || (context && !context.unlimited && context.remaining <= 0)}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiSave className="w-5 h-5" />
                      {t('provider.requestDetail.saveDraft')}
                    </button>

                    {draftId && (
                      <>
                        <button 
                          type="button" 
                          onClick={updateDraft}
                          disabled={submitting || (context && !context.unlimited && context.remaining <= 0)}
                          className="flex items-center gap-2 px-4 py-3 bg-amber-100 text-amber-700 font-medium rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50"
                        >
                          <HiRefresh className="w-5 h-5" />
                          {t('provider.requestDetail.update')}
                        </button>
                        <button 
                          type="button" 
                          onClick={sendDraft}
                          disabled={submitting || (context && !context.unlimited && context.remaining <= 0)}
                          className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 font-medium rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          <HiPaperAirplane className="w-5 h-5" />
                          {t('provider.requestDetail.sendDraft')}
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelProposal}
                          disabled={submitting}
                          className="flex items-center gap-2 px-4 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <HiX className="w-5 h-5" />
                          {t('provider.requestDetail.discard')}
                        </button>
                      </>
                    )}
                    
                    <button 
                      type="button" 
                      onClick={() => navigate('/empleos')}
                      className="flex items-center gap-2 px-4 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {t('provider.requestDetail.cancel')}
                    </button>

                    {(context && (context.subscriptionStatus !== 'active' || (!context.unlimited && context.remaining <= 0))) && (
                      <button 
                        type="button" 
                        onClick={() => navigate('/plan')}
                        className="ml-auto flex items-center gap-2 px-5 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <HiSparkles className="w-5 h-5" />
                        {t('provider.requestDetail.upgradePlan')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Modal para ver fotos/videos del cliente */}
        {request && request.media && ((request.media.photos && request.media.photos.length > 0) || (request.media.videos && request.media.videos.length > 0)) && (
          <PortfolioModal
            isOpen={showPhotosModal}
            onClose={() => setShowPhotosModal(false)}
            portfolio={[
              ...(request.media.photos || []).map(photo => ({ ...photo, type: 'image' })),
              ...(request.media.videos || []).map(video => ({ ...video, type: 'video' }))
            ]}
            providerName={request.client?.profile?.firstName ? `${request.client.profile.firstName} ${request.client.profile.lastName || ''}`.trim() : t('provider.requestDetail.client')}
          />
        )}

        <Modal
          open={upgrade.show}
          title={t('provider.requestDetail.upgradeModalTitle')}
          onClose={() => setUpgrade({ show: false, message: '' })}
          actions={
            <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
              <Button variant="secondary" className="w-full xs:w-auto" onClick={() => { setUpgrade({ show: false, message: '' }); navigate('/mensajes?upgrade=1'); }}>{t('provider.requestDetail.viewInbox')}</Button>
              <Button className="w-full xs:w-auto" onClick={() => { setUpgrade({ show: false, message: '' }); navigate('/plan'); }}>{t('provider.requestDetail.viewPlans')}</Button>
            </div>
          }
        >
          <p className="text-sm text-gray-700 text-center xs:text-left px-1 xs:px-0">{upgrade.message || t('provider.requestDetail.upgradeMessage')}</p>
        </Modal>

        {/* Modal para solicitar más información al cliente */}
        <Modal
          open={showInfoRequestModal}
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <HiQuestionMarkCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('provider.requestDetail.infoRequestModalTitle')}</span>
                <p className="text-sm text-gray-500 font-normal">{t('provider.requestDetail.infoRequestModalSubtitle')}</p>
              </div>
            </div>
          }
          onClose={() => { setShowInfoRequestModal(false); setInfoRequestMessage(''); }}
          actions={
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowInfoRequestModal(false); setInfoRequestMessage(''); }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={requestMoreInfo}
                disabled={sendingInfoRequest || !infoRequestMessage.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInfoRequest ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <HiChat className="w-4 h-4" />
                )}
                {sendingInfoRequest ? t('common.loading') : t('provider.requestDetail.sendInfoRequest')}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Tips para qué tipo de información solicitar */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <HiLightningBolt className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t('provider.requestDetail.infoRequestTipsTitle')}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t('provider.requestDetail.infoRequestTip1')}</li>
                    <li>{t('provider.requestDetail.infoRequestTip2')}</li>
                    <li>{t('provider.requestDetail.infoRequestTip3')}</li>
                    <li>{t('provider.requestDetail.infoRequestTip4')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Textarea para el mensaje */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                {t('provider.requestDetail.infoRequestMessageLabel')}
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all bg-gray-50 focus:bg-white resize-none"
                placeholder={t('provider.requestDetail.infoRequestMessagePlaceholder')}
                value={infoRequestMessage}
                onChange={(e) => setInfoRequestMessage(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {infoRequestMessage.length}/10 {t('provider.requestDetail.minChars')}
              </p>
            </div>

            {/* Nota importante */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <HiShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                {t('provider.requestDetail.infoRequestNote')}
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

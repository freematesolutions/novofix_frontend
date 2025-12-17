import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import PortfolioModal from '@/components/ui/PortfolioModal.jsx';
import { 
  HiArrowLeft, HiPhotograph, HiCurrencyDollar, HiClock, HiCalendar,
  HiLocationMarker, HiTag, HiExclamation, HiPaperAirplane, HiSave,
  HiX, HiRefresh, HiSparkles, HiCheckCircle, HiBadgeCheck, HiLightningBolt,
  HiTrendingUp, HiChartBar, HiShieldCheck, HiCube
} from 'react-icons/hi';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const toast = useToast();
  const { viewRole, clearError, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  // Proposal form state
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    estimatedHours: '',
    startDate: '',
    message: '',
    materialsIncluded: false,
    cleanupIncluded: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [upgrade, setUpgrade] = useState({ show: false, message: '' });
  const [draftId, setDraftId] = useState('');

  const autoOpenForm = useMemo(() => new URLSearchParams(search).get('proponer') === '1', [search]);

  useEffect(() => { clearError?.(); }, [clearError]);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
  const { data } = await api.get(`/provider/proposals/requests/${id}`);
      const req = data?.data?.request || data?.request || null;
      setRequest(req);
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo cargar la solicitud';
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
          setUpgrade({ show: true, message: 'Necesitas una suscripción activa para enviar propuestas.' });
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

  if (viewRole !== 'provider') {
    return <Alert type="warning">Esta sección es para proveedores.</Alert>;
  }

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Monto requerido y debe ser mayor a 0';
    if (!form.message || form.message.trim().length < 10) errs.message = 'Mensaje requerido (mínimo 10 caracteres)';
    // estimatedHours opcional pero si se provee debe ser > 0
    if (form.estimatedHours && Number(form.estimatedHours) <= 0) errs.estimatedHours = 'Horas estimadas debe ser mayor a 0';
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
        amount: Number(form.amount),
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        startDate: form.startDate || undefined,
        materialsIncluded: !!form.materialsIncluded,
        cleanupIncluded: !!form.cleanupIncluded,
        message: form.message.trim()
      };
  const { data } = await api.post(`/provider/proposals/requests/${id}`, payload);
      if (data?.success) {
        toast.success('Propuesta enviada con éxito');
        navigate('/mensajes');
      } else {
        toast.warning(data?.message || 'No se pudo enviar la propuesta');
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Error al enviar la propuesta';
      if (status === 403) {
        toast.error(msg || 'Requiere suscripción activa');
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || 'Tu plan actual no permite enviar propuestas.' });
      } else if (status === 429) {
        toast.error(msg || 'Límite mensual de leads alcanzado');
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || 'Has alcanzado el límite mensual de leads.' });
      } else if (status === 400) {
        toast.error(msg || 'Validación inválida');
      } else if (status === 404) {
        toast.error('La solicitud ya no está disponible');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async () => {
    if (context && !context.unlimited && context.remaining <= 0) {
      setUpgrade({ show: true, message: 'Has alcanzado tu límite mensual de leads.' });
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
        toast.success('Borrador guardado');
      } else {
        toast.warning(data?.message || 'No se pudo guardar el borrador');
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Error al guardar borrador';
      if (status === 403) {
        toast.error(msg || 'Requiere suscripción activa');
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || 'Tu plan actual no permite enviar propuestas.' });
      } else if (status === 429) {
        toast.error(msg || 'Límite mensual de leads alcanzado');
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || 'Has alcanzado el límite mensual de leads.' });
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
        toast.success('Borrador actualizado');
      } else {
        toast.warning(data?.message || 'No se pudo actualizar el borrador');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al actualizar borrador';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const sendDraft = async () => {
    if (!draftId) return;
    if (context && !context.unlimited && context.remaining <= 0) {
      setUpgrade({ show: true, message: 'Has alcanzado tu límite mensual de leads.' });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/provider/proposals/${draftId}/send`, {});
      if (data?.success) {
        toast.success('Propuesta enviada');
        navigate('/mensajes');
      } else {
        toast.warning(data?.message || 'No se pudo enviar el borrador');
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Error al enviar';
      if (status === 403) {
        toast.error(msg || 'Requiere suscripción activa');
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || 'Tu plan actual no permite enviar propuestas.' });
      } else if (status === 429) {
        toast.error(msg || 'Límite mensual de leads alcanzado');
        localStorage.setItem('upgrade_hint', '1');
        setUpgrade({ show: true, message: msg || 'Has alcanzado el límite mensual de leads.' });
      } else if (status === 404) {
        toast.error('El borrador ya no está disponible');
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
        toast.info('Propuesta cancelada');
        setDraftId('');
      } else {
        toast.warning(data?.message || 'No se pudo cancelar la propuesta');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al cancelar';
      toast.error(msg);
    } finally {
      setSubmitting(false);
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
            <span className="text-sm font-medium">Volver a empleos</span>
          </button>

          {request && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getUrgencyStyle(request.basicInfo?.urgency)}`}>
                    <HiExclamation className="w-3.5 h-3.5" />
                    {request.basicInfo?.urgency || 'Normal'}
                  </span>
                  {request.basicInfo?.category && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                      <HiTag className="w-3.5 h-3.5" />
                      {request.basicInfo.category}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {request.basicInfo?.title || 'Detalle de solicitud'}
                </h1>
                {request.budget?.amount && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <HiCurrencyDollar className="w-5 h-5 text-white" />
                    <span className="text-xl font-bold text-white">
                      {Intl.NumberFormat('es-AR', { style: 'currency', currency: request.budget?.currency || 'USD' }).format(request.budget.amount)}
                    </span>
                    <span className="text-white/70 text-sm">presupuesto</span>
                  </div>
                )}
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
                      {(request.media.photos?.length || 0) + (request.media.videos?.length || 0)} archivos
                    </div>
                    <div className="text-white/70 text-sm">Ver multimedia</div>
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
              <p className="text-gray-600 font-medium">Cargando solicitud...</p>
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
                    <h2 className="text-lg font-bold text-gray-900">Detalles de la solicitud</h2>
                    <p className="text-sm text-gray-500">Información proporcionada por el cliente</p>
                  </div>
                </div>
                
                {/* Description */}
                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{request.basicInfo?.description}</p>
                </div>
                
                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {request.basicInfo?.subcategory && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                        <HiTag className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Subcategoría</div>
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
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</div>
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
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Fecha preferida</div>
                        <div className="font-semibold text-gray-900">{new Date(request.scheduling.preferredDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Proposal Form Card */}
            <div id="proposal-form" className={`bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden transition-opacity ${submitting ? 'opacity-70 pointer-events-none' : ''}`}>
              {/* Form Header */}
              <div className="bg-linear-to-r from-brand-50 to-cyan-50 border-b border-brand-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <HiPaperAirplane className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Enviar propuesta</h3>
                    <p className="text-sm text-gray-600">Destaca tu experiencia y gana este proyecto</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Context info - Plan status */}
                {contextLoading && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6 animate-pulse">
                    <Spinner size="sm" className="text-brand-600" />
                    <span className="text-sm text-gray-600">Cargando información de tu plan...</span>
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
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                <HiX className="w-3.5 h-3.5" />
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Comisión: {context.commissionRatePercent}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <HiLightningBolt className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {context.unlimited ? 'Leads ilimitados' : `${Math.max(context.remaining, 0)} leads restantes`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!context.unlimited && context.leadLimit > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Leads utilizados</span>
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
                        <p className="text-sm text-red-700">Has alcanzado tu límite mensual. Mejora tu plan para continuar.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Amount field with commission preview */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <HiCurrencyDollar className="w-4 h-4 text-gray-400" />
                      Monto ofrecido (USD)
                    </label>
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
                    {formErrors.amount && (
                      <p className="flex items-center gap-1.5 text-sm text-red-600">
                        <HiExclamation className="w-4 h-4" />
                        {formErrors.amount}
                      </p>
                    )}
                    {context && form.amount && Number(form.amount) > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <HiChartBar className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-800">
                            Comisión: {Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(Number(form.amount) * context.commissionRateDecimal)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <HiTrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Tu ingreso: {Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(Number(form.amount) * (1 - context.commissionRateDecimal))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hours and Date grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <HiClock className="w-4 h-4 text-gray-400" />
                        Horas estimadas
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        step="1" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white" 
                        value={form.estimatedHours} 
                        onChange={(e) => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                        placeholder="Ej: 4"
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
                        Fecha de inicio
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
                        <div className={`font-medium ${form.materialsIncluded ? 'text-brand-700' : 'text-gray-700'}`}>Incluye materiales</div>
                        <div className="text-xs text-gray-500">El precio incluye todos los materiales</div>
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
                        <div className={`font-medium ${form.cleanupIncluded ? 'text-cyan-700' : 'text-gray-700'}`}>Incluye limpieza</div>
                        <div className="text-xs text-gray-500">Dejaré el área limpia al terminar</div>
                      </div>
                      {form.cleanupIncluded && <HiCheckCircle className="w-6 h-6 text-cyan-500" />}
                    </label>
                  </div>

                  {/* Message field */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <HiBadgeCheck className="w-4 h-4 text-gray-400" />
                      Mensaje para el cliente
                    </label>
                    <textarea 
                      rows={5} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white resize-none" 
                      placeholder="Describe tu propuesta, alcance, condiciones y por qué eres la mejor opción para este trabajo..."
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
                      {form.message.length}/10 caracteres mínimos requeridos
                    </p>
                  </div>

                  {context && context.subscriptionStatus !== 'active' && (
                    <Alert type="warning">Tu suscripción está inactiva. Actívala para enviar propuestas.</Alert>
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
                        {submitting ? 'Enviando...' : 'Enviar propuesta'}
                      </span>
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={saveDraft}
                      disabled={submitting || (context && !context.unlimited && context.remaining <= 0)}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiSave className="w-5 h-5" />
                      Guardar borrador
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
                          Actualizar
                        </button>
                        <button 
                          type="button" 
                          onClick={sendDraft}
                          disabled={submitting || (context && !context.unlimited && context.remaining <= 0)}
                          className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 font-medium rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          <HiPaperAirplane className="w-5 h-5" />
                          Enviar borrador
                        </button>
                        <button 
                          type="button" 
                          onClick={cancelProposal}
                          disabled={submitting}
                          className="flex items-center gap-2 px-4 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <HiX className="w-5 h-5" />
                          Descartar
                        </button>
                      </>
                    )}
                    
                    <button 
                      type="button" 
                      onClick={() => navigate('/empleos')}
                      className="flex items-center gap-2 px-4 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>

                    {(context && (context.subscriptionStatus !== 'active' || (!context.unlimited && context.remaining <= 0))) && (
                      <button 
                        type="button" 
                        onClick={() => navigate('/plan')}
                        className="ml-auto flex items-center gap-2 px-5 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <HiSparkles className="w-5 h-5" />
                        Mejorar plan
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
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
            providerName={request.client?.profile?.firstName ? `${request.client.profile.firstName} ${request.client.profile.lastName || ''}`.trim() : 'Cliente'}
          />
        )}

        <Modal
          open={upgrade.show}
          title="Mejora tu plan para enviar propuestas"
          onClose={() => setUpgrade({ show: false, message: '' })}
          actions={
            <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
              <Button variant="secondary" className="w-full xs:w-auto" onClick={() => { setUpgrade({ show: false, message: '' }); navigate('/mensajes?upgrade=1'); }}>Ver bandeja</Button>
              <Button className="w-full xs:w-auto" onClick={() => { setUpgrade({ show: false, message: '' }); navigate('/plan'); }}>Ver planes</Button>
            </div>
          }
        >
          <p className="text-sm text-gray-700 text-center xs:text-left px-1 xs:px-0">{upgrade.message || 'Para continuar, activa una suscripción o mejora tu plan y aumenta tu límite de leads.'}</p>
        </Modal>
      </div>
    </div>
  );
}

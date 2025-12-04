import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { getArray } from '@/utils/data.js';
import { 
  HiArrowLeft, HiCurrencyDollar, HiStar, HiBadgeCheck, HiCheckCircle,
  HiX, HiChat, HiClock, HiSparkles, HiShieldCheck, HiUserCircle,
  HiThumbUp, HiThumbDown, HiLightningBolt, HiTrendingUp
} from 'react-icons/hi';

export default function ClientRequestProposals() {
  const { role, roles, viewRole, clearError, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState([]);
  const [requestMeta, setRequestMeta] = useState(null);
  const [accepting, setAccepting] = useState(''); // proposalId currently accepting
  const [rejecting, setRejecting] = useState(''); // proposalId currently rejecting

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
      setError(err?.response?.data?.message || 'No se pudieron cargar las propuestas');
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
    return <Alert type="warning">Esta sección es para clientes.</Alert>;
  }

  const accept = async (proposalId) => {
    setAccepting(proposalId);
    try {
      const { data } = await api.post(`/client/proposals/${proposalId}/accept`);
      if (data?.success) {
        toast.success('Propuesta aceptada. Hemos creado tu reserva.');
        navigate('/perfil'); // o a /bookings si está implementado
      } else {
        toast.warning(data?.message || 'No se pudo aceptar la propuesta');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al aceptar la propuesta';
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
        toast.info('Propuesta rechazada');
        await load();
      } else {
        toast.warning(data?.message || 'No se pudo rechazar la propuesta');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al rechazar la propuesta';
      toast.error(msg);
    } finally {
      setRejecting('');
    }
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
            <span className="text-sm font-medium">Volver a mis solicitudes</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                  <HiSparkles className="w-4 h-4" />
                  {proposals.length} propuesta{proposals.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                Propuestas recibidas
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Solicitud: {requestMeta?.title || 'Cargando...'}
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
                    {proposals.length} profesionale{proposals.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-white/70 text-sm">interesados en tu proyecto</div>
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
              <p className="text-gray-600 font-medium">Cargando propuestas...</p>
            </div>
          </div>
        )}

        {!loading && (!Array.isArray(proposals) || proposals.length === 0) && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
              <HiClock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aún no hay propuestas</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Los proveedores están revisando tu solicitud. Te notificaremos cuando recibas propuestas.
            </p>
            <button
              onClick={() => navigate('/mis-solicitudes')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 font-medium rounded-xl hover:bg-emerald-200 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              Volver a mis solicitudes
            </button>
          </div>
        )}

        {/* Proposals list */}
        <div className="space-y-4">
          {(Array.isArray(proposals) ? proposals : []).map((p) => {
            const amount = p?.pricing?.amount;
            const currency = p?.pricing?.currency || 'USD';
            const providerName = p?.provider?.providerProfile?.businessName || 'Proveedor';
            const score = p?.provider?.score?.total;
            const plan = p?.provider?.subscription?.plan;
            const avatar = p?.provider?.profile?.avatar;
            
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
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                        <HiCurrencyDollar className="w-5 h-5 text-emerald-600" />
                        <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                          {amount ? Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount) : 'Sin precio'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message */}
                  {p.message && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{p.message}</p>
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
                        {accepting === p._id ? 'Aceptando...' : 'Aceptar'}
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
                      Rechazar
                    </button>
                    
                    <button
                      onClick={() => toast.info('Chat próximamente')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <HiChat className="w-5 h-5" />
                      Mensajes
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
                <h4 className="font-bold text-gray-900 mb-1">Consejos para elegir</h4>
                <p className="text-sm text-gray-600">
                  Revisa las puntuaciones y planes de los proveedores. Los proveedores verificados suelen ofrecer mejor servicio. 
                  No dudes en contactar a varios antes de decidir.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import { HiSparkles, HiLightningBolt, HiStar, HiCheck, HiCreditCard, HiCalendar, HiChartBar, HiGift, HiTicket, HiBadgeCheck } from 'react-icons/hi';

export default function Plan() {
  const navigate = useNavigate();
  const { viewRole, clearError, isAuthenticated } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [changing, setChanging] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(()=>{ clearError?.(); }, [clearError]);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        api.get('/provider/subscription/plans'),
        api.get('/provider/subscription/status')
      ]);
      if (plansRes.data?.success) setPlans(plansRes.data.data.plans || []);
      if (statusRes.data?.success) setStatus(statusRes.data.data);
    } catch (err) {
      toast.error('No se pudo cargar información de planes');
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ if (isAuthenticated) load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [isAuthenticated]);

  const changePlan = async (name) => {
    if (!name || changing) return;
    setChanging(true);
    try {
      const { data } = await api.post('/provider/subscription/change', { planName: name });
      if (data?.success) {
        toast.success('Plan actualizado');
        await load();
      } else {
        toast.warning(data?.message || 'No se pudo cambiar el plan');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cambiar el plan');
    } finally {
      setChanging(false);
    }
  };

  const applyReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralLoading(true);
    try {
      const { data } = await api.post('/provider/subscription/apply-referral', { code: referralCode.trim() });
      if (data?.success) {
        toast.success('Código aplicado');
        setReferralCode('');
        await load();
      } else {
        toast.warning(data?.message || 'No se pudo aplicar el código');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al aplicar código');
    } finally {
      setReferralLoading(false);
    }
  };

  // Plan icon based on tier
  const getPlanIcon = (name) => {
    const n = name?.toLowerCase();
    if (n === 'premium' || n === 'professional') return <HiSparkles className="w-6 h-6" />;
    if (n === 'basic' || n === 'starter') return <HiLightningBolt className="w-6 h-6" />;
    return <HiStar className="w-6 h-6" />;
  };

  // Plan gradient based on tier
  const getPlanGradient = (name, isActive) => {
    const n = name?.toLowerCase();
    if (isActive) return 'from-brand-500 to-cyan-500';
    if (n === 'premium' || n === 'professional') return 'from-amber-400 to-orange-500';
    if (n === 'basic' || n === 'starter') return 'from-blue-400 to-indigo-500';
    return 'from-gray-400 to-gray-500';
  };

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
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="warning">Esta sección es para proveedores.</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="overflow-hidden bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 rounded-2xl p-8 text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HiCreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Planes y Suscripción</h1>
              <p className="text-brand-100 text-sm">Gestiona tu plan y maximiza tu potencial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <Spinner size="sm" className="text-white" />
          </div>
          <span className="text-gray-600 font-medium">Cargando información de planes...</span>
        </div>
      )}

      {/* Current Plan Status */}
      {!loading && status && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${getPlanGradient(status.plan.name, true)} flex items-center justify-center text-white shadow-lg`}>
                  {getPlanIcon(status.plan.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 capitalize">{status.plan.displayName || status.plan.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {status.subscription.status === 'active' ? 'Activo' : status.subscription.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Tu plan actual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-linear-to-r from-brand-600 to-cyan-600 bg-clip-text text-transparent">
                  {Intl.NumberFormat('es-AR', { style: 'currency', currency: status.monthlyCharge.currency }).format(status.monthlyCharge.total)}
                  <span className="text-sm font-normal text-gray-500">/mes</span>
                </p>
                {status.monthlyCharge.discount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <HiGift className="w-3.5 h-3.5" />
                    Descuento aplicado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {/* Leads Usage */}
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <HiChartBar className="w-4 h-4" />
                Leads Usados
              </div>
              <p className="text-lg font-bold text-gray-900">
                {status.subscription.leadsUsed}
                <span className="text-gray-400 font-normal text-sm">
                  {status.plan.features.leadLimit < 0 ? ' / ∞' : ` / ${status.plan.features.leadLimit}`}
                </span>
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-brand-500 to-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${status.plan.features.leadLimit < 0 ? 30 : Math.min(100, (status.subscription.leadsUsed / status.plan.features.leadLimit) * 100)}%` }}
                />
              </div>
            </div>

            {/* Commission Rate */}
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <HiTicket className="w-4 h-4" />
                Comisión
              </div>
              <p className="text-lg font-bold text-gray-900">{status.plan.features.commissionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Por transacción</p>
            </div>

            {/* Visibility */}
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <HiBadgeCheck className="w-4 h-4" />
                Visibilidad
              </div>
              <p className="text-lg font-bold text-gray-900">x{status.plan.features.visibilityMultiplier}</p>
              <p className="text-xs text-gray-500 mt-1">Multiplicador</p>
            </div>

            {/* Next Period */}
            <div className="p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <HiCalendar className="w-4 h-4" />
                Próximo Período
              </div>
              <p className="text-lg font-bold text-gray-900">
                {status.subscription.currentPeriodEnd 
                  ? new Date(status.subscription.currentPeriodEnd).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) 
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Renovación</p>
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="p-5 bg-linear-to-r from-gray-50 to-brand-50/30 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                  <HiGift className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">¿Tienes un código de referido?</span>
              </div>
              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Ingresa el código"
                  className="flex-1 sm:max-w-[200px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={referralLoading}
                />
                <Button 
                  size="sm" 
                  disabled={referralLoading || !referralCode.trim()} 
                  onClick={applyReferral}
                  className="px-5! py-2.5! bg-linear-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white rounded-xl font-medium shadow-sm"
                >
                  {referralLoading ? (
                    <span className="flex items-center gap-2"><Spinner size="xs" /> Aplicando</span>
                  ) : 'Aplicar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {!loading && plans.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Planes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => {
              const active = status?.plan?.name === p.name;
              const isPopular = p?.metadata?.mostPopular;
              return (
                <div 
                  key={p._id || p.name} 
                  className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                    active 
                      ? 'border-brand-500 shadow-lg shadow-brand-500/10' 
                      : isPopular 
                        ? 'border-amber-400 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && !active && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-linear-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        <HiSparkles className="w-3.5 h-3.5" />
                        Más Popular
                      </span>
                    </div>
                  )}

                  {/* Active Badge */}
                  {active && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-linear-to-r from-brand-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                        <HiCheck className="w-3.5 h-3.5" />
                        Plan Actual
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="p-6 pt-8 text-center border-b border-gray-100">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-linear-to-br ${getPlanGradient(p.name, active)} flex items-center justify-center text-white shadow-lg`}>
                      {getPlanIcon(p.name)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 capitalize mb-1">{p.displayName}</h3>
                    <p className="text-sm text-gray-500">{p.metadata?.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="p-6 text-center border-b border-gray-100">
                    <p className="text-4xl font-bold text-gray-900">
                      {p.price.monthly === 0 ? (
                        <span className="text-emerald-600">Gratis</span>
                      ) : (
                        <>
                          {Intl.NumberFormat('es-AR', { style: 'currency', currency: p.price.currency }).format(p.price.monthly)}
                        </>
                      )}
                    </p>
                    {p.price.monthly > 0 && (
                      <span className="text-sm text-gray-500">/mes</span>
                    )}
                  </div>

                  {/* Features */}
                  <div className="p-6 flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <HiCheck className="w-3 h-3 text-emerald-600" />
                        </span>
                        <span><strong>{p.features.leadLimit < 0 ? 'Ilimitados' : p.features.leadLimit}</strong> leads/mes</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <HiCheck className="w-3 h-3 text-emerald-600" />
                        </span>
                        <span>Comisión <strong>{p.features.commissionRate}%</strong></span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <HiCheck className="w-3 h-3 text-emerald-600" />
                        </span>
                        <span>Visibilidad <strong>x{p.features.visibilityMultiplier}</strong></span>
                      </li>
                      {Array.isArray(p.features.benefits) && p.features.benefits.slice(0, 3).map(b => (
                        <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <HiCheck className="w-3 h-3 text-brand-600" />
                          </span>
                          <span className="capitalize">{b.replace(/_/g, ' ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="p-6 pt-0">
                    {active ? (
                      <button 
                        disabled 
                        className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                      >
                        Tu plan actual
                      </button>
                    ) : (
                      <button 
                        disabled={changing} 
                        onClick={() => changePlan(p.name)}
                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                          isPopular 
                            ? 'bg-linear-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl' 
                            : 'bg-linear-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {changing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Spinner size="xs" />
                            Procesando...
                          </span>
                        ) : (
                          p.price.monthly === 0 ? 'Cambiar a Gratis' : `Cambiar a ${p.displayName}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <HiCreditCard className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No hay planes disponibles</h3>
          <p className="text-gray-500 text-sm">Los planes estarán disponibles pronto.</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Alert from '@/components/ui/Alert.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient.js';
import {
  HiSparkles, HiLightningBolt, HiStar, HiCheck, HiCreditCard,
  HiCalendar, HiChartBar, HiGift, HiBadgeCheck,
  HiEye, HiDocumentReport, HiSupport, HiFilm, HiArrowRight,
  HiClock, HiTrendingUp
} from 'react-icons/hi';

/* ────────────────────────────────────────────────────── */
/*  Helper: translate plan name                          */
/* ────────────────────────────────────────────────────── */
const PLAN_KEY_MAP = {
  gratis: 'free', free: 'free', basico: 'free', basic: 'free',
  experto: 'expert', expert: 'expert',
  elite: 'elite', 'elité': 'elite'
};

function usePlanHelpers(t) {
  const translateName = (displayName, planName) => {
    const raw = (displayName || planName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const key = PLAN_KEY_MAP[raw];
    return key ? t(`provider.plan.planNames.${key}`) : displayName || planName;
  };

  const icon = (name, cls = 'w-6 h-6') => {
    const n = name?.toLowerCase();
    if (n === 'elite') return <HiSparkles className={cls} />;
    if (n === 'expert') return <HiLightningBolt className={cls} />;
    return <HiStar className={cls} />;
  };

  const gradient = (name) => {
    const n = name?.toLowerCase();
    if (n === 'elite') return 'from-amber-500 to-amber-600';
    if (n === 'expert') return 'from-brand-500 to-brand-600';
    return 'from-gray-400 to-gray-500';
  };

  const ring = (name) => {
    const n = name?.toLowerCase();
    if (n === 'elite') return 'ring-amber-400/40';
    if (n === 'expert') return 'ring-brand-400/40';
    return 'ring-gray-300/40';
  };

  return { translateName, icon, gradient, ring };
}

/* ────────────────────────────────────────────────────── */
/*  Feature list builder                                 */
/* ────────────────────────────────────────────────────── */
function buildFeatures(plan, t) {
  const f = plan.features || {};
  const items = [];

  // Lead types
  const hasUrgent = (f.leadTypes || []).includes('urgent');
  items.push({
    icon: hasUrgent ? <HiLightningBolt className="w-3.5 h-3.5" /> : <HiClock className="w-3.5 h-3.5" />,
    text: hasUrgent
      ? t('provider.plan.urgentAndScheduled')
      : t('provider.plan.scheduledWithDelay'),
    highlight: hasUrgent
  });

  // Visibility
  items.push({
    icon: <HiTrendingUp className="w-3.5 h-3.5" />,
    text: `${t('provider.plan.visibility')} x${f.visibilityMultiplier}`,
    highlight: f.visibilityMultiplier > 1
  });

  // Verified badge
  if (f.verifiedBadge) {
    items.push({
      icon: <HiBadgeCheck className="w-3.5 h-3.5" />,
      text: t('provider.plan.verifiedBadge'),
      highlight: true
    });
  }

  // Profile views
  if (f.profileViewsVisible) {
    items.push({
      icon: <HiEye className="w-3.5 h-3.5" />,
      text: t('provider.plan.profileViews'),
      highlight: true
    });
  }

  // Performance reports
  if (f.performanceReports) {
    items.push({
      icon: <HiDocumentReport className="w-3.5 h-3.5" />,
      text: t('provider.plan.performanceReports'),
      highlight: true
    });
  }

  // VIP support
  if (f.vipSupport) {
    items.push({
      icon: <HiSupport className="w-3.5 h-3.5" />,
      text: t('provider.plan.vipSupport'),
      highlight: true
    });
  }

  // Portfolio
  const vids = f.maxPortfolioVideos;
  items.push({
    icon: <HiFilm className="w-3.5 h-3.5" />,
    text: `${t('provider.plan.portfolioVideos')}: ${vids < 0 ? t('provider.plan.unlimited') : t('provider.plan.maxVideos', { count: vids })}`,
    highlight: vids < 0 || vids > 1
  });

  return items;
}

/* ════════════════════════════════════════════════════ */
/*  PLAN PAGE                                         */
/* ════════════════════════════════════════════════════ */
export default function Plan() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const toast = useToast();
  const { translateName, icon, gradient, ring } = usePlanHelpers(t);

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [changing, setChanging] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(() => { clearError?.(); }, [clearError]);

  /* ── Checkout return handler ── */
  useEffect(() => {
    const result = searchParams.get('checkout');
    if (result === 'success') {
      toast.success(t('toast.subscriptionActivated', '¡Suscripción activada exitosamente!'));
      setSearchParams({}, { replace: true });
      // Reload plan data — the webhook may have already updated the DB
      load();
    } else if (result === 'canceled') {
      toast.info(t('toast.checkoutCanceled', 'Pago cancelado. Puedes intentarlo cuando desees.'));
      setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams, toast, t]);

  /* ── Load data ── */
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
    } catch {
      toast.error(t('toast.errorLoadingPlans'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isAuthenticated) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /* ── Change plan ── */
  const changePlan = async (name) => {
    if (!name || changing) return;
    setChanging(name);
    try {
      if (name === 'free') {
        const { data } = await api.post('/provider/subscription/downgrade');
        if (data?.success) { toast.success(t('toast.planUpdated')); await load(); }
        else toast.warning(data?.message || t('toast.couldNotChangePlan'));
      } else {
        const { data } = await api.post('/provider/subscription/checkout', { planName: name });
        if (data?.success && data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
          return;
        }
        toast.warning(data?.message || t('toast.couldNotChangePlan'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.errorChangingPlan'));
    } finally {
      setChanging(null);
    }
  };

  /* ── Referral ── */
  const applyReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralLoading(true);
    try {
      const { data } = await api.post('/provider/subscription/apply-referral', { code: referralCode.trim() });
      if (data?.success) { toast.success(t('toast.codeApplied')); setReferralCode(''); await load(); }
      else toast.warning(data?.message || t('toast.couldNotApplyCode'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.errorApplyingCode'));
    } finally {
      setReferralLoading(false);
    }
  };

  /* ── Sorted plans: free → expert → elite ── */
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0)),
    [plans]
  );

  /* ── Guards ── */
  useEffect(() => { if (!isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);
  if (!isAuthenticated || isRoleSwitching) return null;
  if (viewRole !== 'provider') {
    return <div className="max-w-xl mx-auto"><Alert type="warning">{t('provider.plan.providerOnly')}</Alert></div>;
  }

  const currentPlanName = status?.plan?.name || status?.subscription?.plan || 'free';
  const isPaid = currentPlanName !== 'free';

  /* ── Currency formatter ── */
  const fmtPrice = (amount, currency = 'USD') =>
    amount === 0
      ? t('provider.plan.free')
      : Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  /* ════════════════════════════════════════════ */
  /*  RENDER                                     */
  /* ════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* ─────────── HERO HEADER ─────────── */}
      <div className="relative overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl px-6 py-8 sm:px-8 sm:py-10 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiCreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{t('provider.plan.title')}</h1>
              <p className="text-brand-200 text-sm mt-0.5">{t('provider.plan.subtitle')}</p>
            </div>
          </div>

          {/* Quick current plan pill */}
          {!loading && status && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 self-start sm:self-auto">
              <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-brand-400' : 'bg-gray-400'} animate-pulse`} />
              <span className="text-sm font-medium">
                {translateName(status.plan.displayName, status.plan.name)}
              </span>
              {isPaid && (
                <span className="text-xs text-brand-200">
                  {fmtPrice(status.plan.price?.monthly, status.plan.price?.currency)}{t('provider.plan.perMonth')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────── LOADING ─────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center animate-pulse">
            <Spinner size="sm" className="text-white" />
          </div>
          <span className="text-gray-500 text-sm">{t('provider.plan.loading')}</span>
        </div>
      )}

      {/* ─────────── CURRENT PLAN STATUS BAR ─────────── */}
      {!loading && status && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {/* Plan name */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1.5">
                {icon(currentPlanName, 'w-4 h-4')}
                {t('provider.plan.currentPlan')}
              </div>
              <p className="text-base font-bold text-gray-900 capitalize">{translateName(status.plan.displayName, status.plan.name)}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                status.subscription.status === 'active' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {status.subscription.status === 'active' ? t('provider.plan.active') : status.subscription.status}
              </span>
            </div>

            {/* Leads */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1.5">
                <HiChartBar className="w-4 h-4" />
                {t('provider.plan.leadsUsed')}
              </div>
              <p className="text-base font-bold text-gray-900">
                {status.subscription.leadsUsed}<span className="text-gray-400 font-normal text-sm"> / ∞</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                {(status.plan.features?.leadTypes || []).includes('urgent')
                  ? t('provider.plan.urgentAndScheduled')
                  : t('provider.plan.scheduledOnly')}
              </p>
            </div>

            {/* Visibility */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1.5">
                <HiTrendingUp className="w-4 h-4" />
                {t('provider.plan.visibility')}
              </div>
              <p className="text-base font-bold text-gray-900">x{status.plan.features?.visibilityMultiplier || 1}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{t('provider.plan.multiplier')}</p>
            </div>

            {/* Next period */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1.5">
                <HiCalendar className="w-4 h-4" />
                {t('provider.plan.nextPeriod')}
              </div>
              <p className="text-base font-bold text-gray-900">
                {status.subscription.currentPeriodEnd
                  ? new Date(status.subscription.currentPeriodEnd).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                  : '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {status.subscription?.cancelAtPeriodEnd
                  ? <span className="text-amber-600 font-medium">{t('provider.plan.cancelsAtEnd')}</span>
                  : t('provider.plan.renewal')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── PLANS GRID ─────────── */}
      {!loading && sortedPlans.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t('provider.plan.availablePlans')}</h2>
          <p className="text-sm text-gray-500 mb-5">{t('provider.plan.choosePlan')}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sortedPlans.map((p) => {
              const isActive = currentPlanName === p.name;
              const isPopular = p.metadata?.mostPopular;
              const isElite = p.name?.toLowerCase() === 'elite';
              const features = buildFeatures(p, t);

              return (
                <div
                  key={p._id || p.name}
                  className={`relative bg-white rounded-2xl flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    isActive
                      ? `ring-2 ${ring(p.name)} shadow-md`
                      : isPopular
                        ? 'ring-2 ring-brand-400/50 shadow-md'
                        : isElite
                          ? 'ring-1 ring-amber-300/40 shadow-sm'
                          : 'ring-1 ring-gray-200 shadow-sm'
                  }`}
                >
                  {/* ── Top Badge ── */}
                  {(isActive || isPopular || isElite) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-linear-to-r from-brand-500 to-brand-600 text-white text-xs font-bold rounded-full shadow-lg">
                          <HiCheck className="w-3.5 h-3.5" />
                          {t('provider.plan.currentPlan')}
                        </span>
                      ) : isPopular ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-linear-to-r from-brand-400 to-brand-500 text-white text-xs font-bold rounded-full shadow-lg">
                          <HiLightningBolt className="w-3.5 h-3.5" />
                          {t('provider.plan.mostPopular')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-linear-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                          <HiSparkles className="w-3.5 h-3.5" />
                          {t('provider.plan.premiumBadge')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Plan Header ── */}
                  <div className="p-6 pt-8 text-center">
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-linear-to-br ${gradient(p.name)} flex items-center justify-center text-white shadow-lg`}>
                      {icon(p.name)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize">
                      {translateName(p.displayName, p.name)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 min-h-8 line-clamp-2">{p.metadata?.description}</p>
                  </div>

                  {/* ── Price ── */}
                  <div className="px-6 pb-4 text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-3xl font-extrabold ${
                        p.price.monthly === 0 ? 'text-gray-700' : isElite ? 'text-amber-600' : 'text-brand-600'
                      }`}>
                        {fmtPrice(p.price.monthly, p.price.currency)}
                      </span>
                      {p.price.monthly > 0 && (
                        <span className="text-sm text-gray-400 font-normal">{t('provider.plan.perMonth')}</span>
                      )}
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="mx-6 border-t border-gray-100" />

                  {/* ── Features ── */}
                  <div className="p-6 flex-1">
                    <ul className="space-y-2.5">
                      {features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            feat.highlight
                              ? 'bg-brand-100 text-brand-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {feat.icon || <HiCheck className="w-3 h-3" />}
                          </span>
                          <span className={feat.highlight ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ── Action ── */}
                  <div className="p-6 pt-2">
                    {isActive ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <HiCheck className="w-4 h-4" />
                        {t('provider.plan.yourCurrentPlan')}
                      </button>
                    ) : (
                      <button
                        disabled={!!changing}
                        onClick={() => changePlan(p.name)}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                          isPopular
                            ? 'bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md hover:shadow-lg'
                            : isElite
                              ? 'bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg'
                              : p.price.monthly === 0
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md hover:shadow-lg'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {changing === p.name ? (
                          <>
                            <Spinner size="xs" className="text-current" />
                            {t('provider.plan.processing')}
                          </>
                        ) : (
                          <>
                            {p.price.monthly === 0
                              ? t('provider.plan.changeToFree')
                              : t('provider.plan.changeTo', { plan: translateName(p.displayName, p.name) })
                            }
                            {p.price.monthly > 0 && <HiArrowRight className="w-4 h-4" />}
                          </>
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

      {/* ─────────── REFERRAL SECTION ─────────── */}
      {!loading && status && (
        <div className="bg-linear-to-r from-brand-50/60 to-accent-50/40 rounded-2xl border border-brand-100/60 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                <HiGift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t('provider.plan.haveReferralCode')}</p>
                <p className="text-xs text-gray-500">{t('provider.plan.referralHint')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder={t('provider.plan.enterCode')}
                className="flex-1 sm:max-w-[200px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-gray-400"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={referralLoading}
              />
              <button
                disabled={referralLoading || !referralCode.trim()}
                onClick={applyReferral}
                className="px-5 py-2.5 bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {referralLoading ? (
                  <span className="flex items-center gap-2"><Spinner size="xs" className="text-white" /> {t('provider.plan.applying')}</span>
                ) : t('provider.plan.apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── REVIEW MILESTONES ─────────── */}
      {!loading && status?.reviewMilestones && !status.reviewMilestones.threeReviewsRewarded && (
        <div className="bg-linear-to-r from-amber-50/70 to-yellow-50/50 rounded-2xl border border-amber-200/60 p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">{t('provider.plan.milestoneTitle')}</p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                {t('provider.plan.milestoneSubtitle', { days: status.reviewMilestones.daysAvailable || 3 })}
              </p>
            </div>
          </div>
          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(step => {
              const count = status.reviewMilestones.reviewCount || 0;
              const done = count >= step;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-100 text-amber-400 border-2 border-dashed border-amber-300'}`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : step}
                  </div>
                  <span className="text-[10px] font-medium text-amber-700">
                    {step === 1 ? t('provider.plan.milestone1st') : step === 2 ? t('provider.plan.milestone2nd') : t('provider.plan.milestone3rd')}
                  </span>
                </div>
              );
            })}
            {/* Arrow → reward */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <span className="text-[10px] font-bold text-amber-600">{t('provider.plan.milestoneDays', { days: status.reviewMilestones.daysAvailable || 3 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Milestone completed banner */}
      {!loading && status?.reviewMilestones?.threeReviewsRewarded && (
        <div className="bg-linear-to-r from-green-50/70 to-emerald-50/50 rounded-2xl border border-green-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">{t('provider.plan.milestoneComplete')}</p>
              <p className="text-xs text-green-600/80">{t('provider.plan.milestoneCompleteDesc', { days: status.reviewMilestones.daysAvailable || 3 })}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── EMPTY STATE ─────────── */}
      {!loading && plans.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <HiCreditCard className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('provider.plan.noPlansAvailable')}</h3>
          <p className="text-gray-500 text-sm">{t('provider.plan.plansComingSoon')}</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { HiGift, HiUsers, HiCalendar, HiShieldCheck, HiClipboardCopy, HiMail, HiShare, HiSparkles, HiTrendingUp, HiCheckCircle, HiClock, HiLightningBolt } from 'react-icons/hi';

export default function Referrals() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    code: '',
    referralsCount: 0,
    earnedDays: 0,
    bonusActive: false,
    bonusExpiresAt: null,
    maxDays: 30,
    daysPerSignup: 7,
    programActive: true,
    referredUsers: []
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => { clearError?.(); }, [clearError]);

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);
  const referralLink = data.code ? `${origin}/unete?ref=${encodeURIComponent(data.code)}` : '';

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
      const { data: res } = await api.get('/provider/subscription/referral-info');
      const info = res?.data || {};
      setData({
        code: info.code || '',
        referralsCount: info.referralsCount || 0,
        earnedDays: info.earnedDays || 0,
        bonusActive: info.bonusActive || false,
        bonusExpiresAt: info.bonusExpiresAt || null,
        maxDays: info.maxDays || 30,
        daysPerSignup: info.daysPerSignup || 7,
        programActive: info.programActive !== false,
        referredUsers: info.referredUsers || []
      });
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.referrals.errorLoading'));
    } finally { setLoading(false); }
  }, [isAuthenticated, t]);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('toast.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('provider.referrals.copyError'));
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      toast.success(t('toast.codeCopied'));
    } catch {
      setError(t('provider.referrals.copyCodeError'));
    }
  };

  // Email share — internacionalizado
  const sendEmail = () => {
    const subject = encodeURIComponent(t('provider.referrals.emailSubject'));
    const body = encodeURIComponent(t('provider.referrals.emailBody', { link: referralLink, days: data.daysPerSignup }));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Web Share API (WhatsApp, redes sociales, etc.)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('provider.referrals.shareTitle'),
          text: t('provider.referrals.shareText', { days: data.daysPerSignup }),
          url: referralLink
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(t('provider.referrals.shareError'));
        }
      }
    } else {
      // Fallback: WhatsApp directo
      const waText = encodeURIComponent(`${t('provider.referrals.shareText', { days: data.daysPerSignup })} ${referralLink}`);
      window.open(`https://wa.me/?text=${waText}`, '_blank');
    }
  };

  // Calcular días restantes del bono
  const bonusDaysRemaining = useMemo(() => {
    if (!data.bonusActive || !data.bonusExpiresAt) return 0;
    const diff = new Date(data.bonusExpiresAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [data.bonusActive, data.bonusExpiresAt]);

  // Redirigir al inicio si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  if (isRoleSwitching) return null;

  if (viewRole !== 'provider') {
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="warning">{t('provider.referrals.providerOnly')}</Alert>
      </div>
    );
  }

  const progressPercentage = Math.min(100, (data.earnedDays / data.maxDays) * 100);
  const canEarnMore = data.earnedDays < data.maxDays;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Urgency Banner — Programa Promocional */}
      {data.programActive && (
        <div className="bg-linear-to-r from-accent-500 via-accent-400 to-accent-500 rounded-2xl p-4 text-dark-900 flex items-center gap-3 shadow-lg shadow-accent-500/25 animate-pulse-subtle">
          <div className="w-10 h-10 rounded-xl bg-dark-900/20 flex items-center justify-center shrink-0">
            <HiLightningBolt className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{t('provider.referrals.urgencyTitle')}</p>
            <p className="text-xs opacity-90">{t('provider.referrals.urgencyDesc', { days: data.daysPerSignup })}</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="overflow-hidden bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 rounded-2xl p-8 text-white relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <HiGift className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{t('provider.referrals.title')}</h1>
              <p className="text-brand-100 text-sm max-w-md">
                {t('provider.referrals.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4">
              <p className="text-3xl font-bold">{data.referralsCount}</p>
              <p className="text-xs text-brand-200">{t('provider.referrals.referrals')}</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center px-4">
              <p className="text-3xl font-bold">{data.earnedDays}<span className="text-lg">/{data.maxDays}</span></p>
              <p className="text-xs text-brand-200">{t('provider.referrals.daysEarned')}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Active Bonus Banner */}
      {data.bonusActive && bonusDaysRemaining > 0 && (
        <div className="bg-linear-to-r from-brand-500/10 to-brand-600/10 border border-brand-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
            <HiCheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-800 text-sm">{t('provider.referrals.bonusActiveTitle')}</p>
            <p className="text-xs text-brand-600">{t('provider.referrals.bonusActiveDesc', { days: bonusDaysRemaining })}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-brand-700">{bonusDaysRemaining}</p>
            <p className="text-xs text-brand-500">{t('provider.referrals.daysLeft')}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`space-y-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        
        {/* Your Referral Code Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <HiShare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('provider.referrals.yourCode')}</h2>
                <p className="text-sm text-gray-500">{t('provider.referrals.shareCode')}</p>
              </div>
            </div>
            
            {/* Code Display */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <div className="px-5 py-4 bg-linear-to-r from-gray-50 to-brand-50/30 rounded-xl border-2 border-dashed border-brand-200">
                  <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider text-center">
                    {data.code || t('provider.referrals.loading')}
                  </p>
                </div>
              </div>
              <button
                onClick={copyCode}
                className="p-4 bg-linear-to-br from-brand-500 to-brand-600 text-white rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg hover:shadow-xl"
                title={t('provider.referrals.copyCode')}
              >
                <HiClipboardCopy className="w-6 h-6" />
              </button>
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('provider.referrals.yourLink')}</label>
              <div className="flex items-center gap-2">
                <input 
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" 
                  readOnly 
                  value={referralLink} 
                />
                <button
                  onClick={copyLink}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    copied 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-linear-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {copied ? (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      {t('provider.referrals.copied')}
                    </>
                  ) : (
                    <>
                      <HiClipboardCopy className="w-5 h-5" />
                      {t('provider.referrals.copy')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={shareNative}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-50 text-brand-700 rounded-xl font-medium hover:bg-brand-100 transition-all"
              >
                <HiShare className="w-5 h-5" />
                {t('provider.referrals.shareWhatsapp')}
              </button>
              <button
                onClick={sendEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <HiMail className="w-5 h-5" />
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Referrals Count */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <HiUsers className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.referralsCount}</p>
            <p className="text-sm text-gray-500">{t('provider.referrals.referredUsers')}</p>
          </div>

          {/* Days Earned */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <HiCalendar className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">
                {data.daysPerSignup} {t('provider.referrals.daysPerRef')}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.earnedDays} <span className="text-lg text-gray-400 font-normal">{t('provider.referrals.days')}</span></p>
            <p className="text-sm text-gray-500">{t('provider.referrals.expertPlanEarned')}</p>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('provider.referrals.maxDays', { current: data.earnedDays, max: data.maxDays })}</p>
          </div>

          {/* Bonus Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                data.bonusActive 
                  ? 'bg-linear-to-br from-brand-500 to-brand-600' 
                  : 'bg-linear-to-br from-gray-400 to-gray-500'
              }`}>
                <HiShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                data.bonusActive 
                  ? 'bg-brand-100 text-brand-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {data.bonusActive ? t('provider.referrals.active') : t('provider.referrals.inactive')}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {data.bonusActive ? bonusDaysRemaining : 0} <span className="text-lg text-gray-400 font-normal">{t('provider.referrals.days')}</span>
            </p>
            <p className="text-sm text-gray-500">
              {data.bonusActive ? t('provider.referrals.expertPlanRemaining') : t('provider.referrals.referToActivate')}
            </p>
          </div>
        </div>

        {/* Referral History */}
        {data.referredUsers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiTrendingUp className="w-5 h-5 text-brand-500" />
              {t('provider.referrals.historyTitle')}
            </h3>
            <div className="space-y-3">
              {data.referredUsers.map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                      <HiUsers className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t(`provider.referrals.role_${ref.userRole}`, ref.userRole)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ref.registeredAt ? new Date(ref.registeredAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">
                    +{ref.daysAwarded || data.daysPerSignup} {t('provider.referrals.days')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="bg-linear-to-r from-gray-50 to-brand-50/30 rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-brand-500" />
            {t('provider.referrals.howItWorks')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{t('provider.referrals.step1Title')}</p>
                <p className="text-xs text-gray-500">{t('provider.referrals.step1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{t('provider.referrals.step2Title')}</p>
                <p className="text-xs text-gray-500">{t('provider.referrals.step2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{t('provider.referrals.step3Title')}</p>
                <p className="text-xs text-gray-500">{t('provider.referrals.step3Desc')}</p>
              </div>
            </div>
          </div>

          {/* CTA for more referrals */}
          {canEarnMore && (
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-1">
                {t('provider.referrals.canEarnMore', { remaining: data.maxDays - data.earnedDays })}
              </p>
              <p className="text-xs text-gray-400">{t('provider.referrals.maxDaysNote', { max: data.maxDays })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

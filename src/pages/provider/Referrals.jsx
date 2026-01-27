import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext.jsx';
import api from '@/state/apiClient';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/ui/Alert.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { HiGift, HiUsers, HiCalendar, HiShieldCheck, HiClipboardCopy, HiMail, HiShare, HiSparkles, HiCurrencyDollar, HiTrendingUp, HiCheckCircle } from 'react-icons/hi';

export default function Referrals() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ code: '', referralsCount: 0, discountMonths: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(()=>{ clearError?.(); }, [clearError]);

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);
  const referralLink = data.code ? `${origin}/unete?ref=${encodeURIComponent(data.code)}` : '';

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError('');
    try {
      const { data: res } = await api.get('/auth/profile');
      const u = res?.data?.user;
      const code = u?.referral?.code || '';
      const count = u?.referral?.referralsCount || 0;
      const months = u?.referral?.discountMonths || 0;
      setData({ code, referralsCount: count, discountMonths: months });
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.referrals.errorLoading'));
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(()=>{ if (isAuthenticated) load(); }, [isAuthenticated, load]);

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

  const sendEmail = () => {
    const subject = encodeURIComponent('Únete a FixNow como profesional y obtén beneficios');
    const body = encodeURIComponent(`Hola,\n\nTe recomiendo registrarte como profesional en FixNow. Usa mi enlace para unirte:\n\n${referralLink}\n\nBeneficios: si te registras con mi enlace, yo recibo 50% de descuento en mi plan hasta por 3 meses.\n\n¡Gracias!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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

  // Durante transición de rol, no mostrar mensaje de advertencia
  if (isRoleSwitching) {
    return null;
  }

  if (viewRole !== 'provider') {
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="warning">{t('provider.referrals.providerOnly')}</Alert>
      </div>
    );
  }

  const progressPercentage = Math.min(100, (data.discountMonths / 3) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="overflow-hidden bg-linear-to-br from-brand-500 via-brand-600 to-cyan-600 rounded-2xl p-8 text-white relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
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
              <p className="text-3xl font-bold">{data.discountMonths}<span className="text-lg">/3</span></p>
              <p className="text-xs text-brand-200">{t('provider.referrals.monthsEarned')}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Main Content */}
      <div className={`space-y-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        
        {/* Your Referral Code Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
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
                className="p-4 bg-linear-to-br from-brand-500 to-cyan-500 text-white rounded-xl hover:from-brand-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
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
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-linear-to-r from-brand-500 to-cyan-500 text-white hover:from-brand-600 hover:to-cyan-600 shadow-md hover:shadow-lg'
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
                <button
                  onClick={sendEmail}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  <HiMail className="w-5 h-5" />
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Referrals Count */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <HiUsers className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.referralsCount}</p>
            <p className="text-sm text-gray-500">{t('provider.referrals.referredProfessionals')}</p>
          </div>

          {/* Discount Months */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <HiCalendar className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">50% OFF</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.discountMonths} <span className="text-lg text-gray-400 font-normal">{t('provider.referrals.months')}</span></p>
            <p className="text-sm text-gray-500">{t('provider.referrals.accumulatedDiscount')}</p>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('provider.referrals.maxMonths', { current: data.discountMonths })}</p>
          </div>

          {/* Limit Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <HiShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{t('provider.referrals.maximum')}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">3 <span className="text-lg text-gray-400 font-normal">{t('provider.referrals.months')}</span></p>
            <p className="text-sm text-gray-500">{t('provider.referrals.discountLimit')}</p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-linear-to-r from-gray-50 to-brand-50/30 rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-brand-500" />
            {t('provider.referrals.howItWorks')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{t('provider.referrals.step1Title')}</p>
                <p className="text-xs text-gray-500">{t('provider.referrals.step1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{t('provider.referrals.step2Title')}</p>
                <p className="text-xs text-gray-500">{t('provider.referrals.step2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{t('provider.referrals.step3Title')}</p>
                <p className="text-xs text-gray-500">{t('provider.referrals.step3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useElements, useStripe, PaymentElement } from '@stripe/react-stripe-js';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { 
  HiCreditCard, 
  HiShieldCheck, 
  HiLockClosed, 
  HiCheckCircle,
  HiArrowLeft,
  HiExclamation,
  HiCurrencyDollar,
  HiLightningBolt
} from 'react-icons/hi';

function PaymentInner({ amount, currency }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formattedAmount = amount 
    ? Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    : null;

  const onPay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true); setError('');
    try {
      const { error: err } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/reservas` }
      });
      if (err) {
        setError(err.message || t('payment.confirmError'));
      }
    } catch (e) {
      setError(e?.message || t('payment.processError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/30 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-brand-500 to-brand-600 rounded-2xl shadow-lg shadow-brand-500/30 mb-4">
            <HiCreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('payment.title')}</h1>
          <p className="text-gray-500 mt-2">{t('payment.subtitle')}</p>
        </div>

        {/* Card principal */}
        <div className="relative">
          <div className="absolute -inset-1 bg-linear-to-r from-brand-500 via-brand-500 to-brand-600 rounded-3xl blur-lg opacity-20"></div>
          
          <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Resumen del monto */}
            {formattedAmount && (
              <div className="bg-linear-to-r from-brand-500 to-brand-600 p-6 text-center">
                <p className="text-brand-100 text-sm mb-1">{t('payment.totalToPay')}</p>
                <p className="text-3xl font-bold text-white">{formattedAmount}</p>
              </div>
            )}

            {/* Formulario de pago */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">
                  <HiExclamation className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Stripe Payment Element */}
              <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50/50 transition-all duration-200 focus-within:border-brand-400 focus-within:bg-white">
                <PaymentElement 
                  options={{
                    layout: 'tabs'
                  }}
                />
              </div>

              {/* Indicadores de seguridad */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <HiLockClosed className="w-4 h-4 text-brand-500" />
                  <span>{t('payment.security.ssl')}</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <HiShieldCheck className="w-4 h-4 text-brand-500" />
                  <span>{t('payment.security.secure')}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={onPay}
                  disabled={!stripe || submitting}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                    !stripe || submitting
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-linear-to-r from-brand-500 to-brand-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>{t('payment.processing')}</span>
                    </>
                  ) : (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      <span>{t('payment.confirmPayment')}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/reservas')}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  <HiArrowLeft className="w-4 h-4" />
                  <span>{t('payment.cancel')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de confianza */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-xl border border-gray-100 shadow-sm">
            <HiShieldCheck className="w-6 h-6 text-brand-500 mb-2" />
            <span className="text-xs font-medium text-gray-700">{t('payment.badges.secure')}</span>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-xl border border-gray-100 shadow-sm">
            <HiLightningBolt className="w-6 h-6 text-brand-500 mb-2" />
            <span className="text-xs font-medium text-gray-700">{t('payment.badges.instant')}</span>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-white/70 rounded-xl border border-gray-100 shadow-sm">
            <HiCurrencyDollar className="w-6 h-6 text-brand-500 mb-2" />
            <span className="text-xs font-medium text-gray-700">{t('payment.badges.noExtra')}</span>
          </div>
        </div>

        {/* Powered by Stripe */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            {t('payment.poweredBy')}{' '}
            <span className="font-semibold text-gray-500">Stripe</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Payment() {
  const { t } = useTranslation();
  const { intentId } = useParams();
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // La clave publicable se lee desde variables de entorno (seguro para frontend)
  // El mensaje "This Stripe API Key is hardcoded" es informativo y aparece en desarrollo
  // cuando se usa una clave pk_test_*, no afecta la funcionalidad
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    // Stripe v8+ emite advertencia en desarrollo con claves test, es comportamiento esperado
    return loadStripe(publishableKey);
  }, [publishableKey]);

  useEffect(() => {
    let active = true;
    const fetchSecret = async () => {
      setLoading(true); setError('');
      try {
        const { data } = await api.get(`/payments/intent/${intentId}`);
        const secret = data?.data?.clientSecret || data?.clientSecret;
        if (!secret) throw new Error('client_secret no disponible');
        if (!active) return;
        setClientSecret(secret);
        if (data?.data?.amount) setAmount((data.data.amount || 0) / 100);
        if (data?.data?.currency) setCurrency((data.data.currency || 'USD').toUpperCase());
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'No se pudo iniciar el pago');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSecret();
    return () => { active = false; };
  }, [intentId]);

  // Estado: Falta configuración
  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-4">
              <HiExclamation className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('payment.configPending.title')}</h2>
            <p className="text-sm text-gray-600">
              {t('payment.configPending.message')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Spinner size="md" className="text-emerald-600" />
          </div>
          <p className="text-gray-600 font-medium">{t('payment.loading')}</p>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
              <HiExclamation className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('payment.error.title')}</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
            >
              {t('payment.error.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentInner amount={amount} currency={currency} />
    </Elements>
  );
}

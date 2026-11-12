// pages/shared/QuickDocPublic.jsx
//
// Flujo 2 — "Vía Rápida en Vivo" (QuickDoc). Página PÚBLICA del cliente invitado.
// Se accede por token (link/QR) sin registro previo. El cliente:
//   1. Abre el documento (el profesional es notificado de la apertura).
//   2. Ingresa su correo aceptando los términos → se crea una cuenta en 2º plano.
//   3. Acepta el estimado (habilita convertir a factura) o descarga la factura.
// Aislada del Flujo 1. No usa el layout autenticado.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineDocumentText,
  HiCheckCircle,
  HiDownload,
  HiShieldCheck,
  HiExclamationCircle,
  HiOutlineUserCircle,
  HiLockClosed
} from 'react-icons/hi';
import api from '@/state/apiClient.js';
import Button from '@/components/ui/Button.jsx';
import ProviderProfileModal from '@/components/ui/ProviderProfileModal.jsx';
import { useToast } from '@/components/ui/Toast.jsx';

const fmtCurrency = (val, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(val) || 0);

const fmtDate = (d, locale) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return '';
  }
};

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

// Recuerda la identidad del cliente en ESTE dispositivo para que, al recibir
// otro documento del profesional, no tenga que volver a escribir su correo.
const CLIENT_MEMORY_KEY = 'novofix_quickdoc_client';

const readRememberedClient = () => {
  try {
    const raw = localStorage.getItem(CLIENT_MEMORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && isValidEmail(parsed.email) ? parsed : null;
  } catch {
    return null;
  }
};

const saveRememberedClient = (email, name) => {
  try {
    localStorage.setItem(
      CLIENT_MEMORY_KEY,
      JSON.stringify({ email: String(email || '').trim(), name: String(name || '').trim() })
    );
  } catch {
    /* localStorage no disponible (modo privado) — ignorar */
  }
};

export default function QuickDocPublic() {
  const { token } = useParams();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const locale = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [state, setState] = useState('loading'); // loading | error | ready
  const [errorType, setErrorType] = useState('generic'); // notFound | expired | generic
  const [doc, setDoc] = useState(null);

  // Formulario de captura de correo
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [accepting, setAccepting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  // true cuando el correo se autocompletó desde la memoria del dispositivo
  const [rememberedPrefill, setRememberedPrefill] = useState(false);

  // Perfil del profesional (solo lectura) abierto desde el documento público
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerData, setProviderData] = useState(null);
  const [providerLoading, setProviderLoading] = useState(false);

  const loadDoc = useCallback(async () => {
    setState('loading');
    try {
      const { data } = await api.get(`/public/quick-docs/${token}`);
      setDoc(data?.data?.doc || null);
      setState('ready');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 410) setErrorType('expired');
      else if (status === 404) setErrorType('notFound');
      else setErrorType('generic');
      setState('error');
    }
  }, [token]);

  useEffect(() => { loadDoc(); }, [loadDoc]);

  // Autocompletar correo/nombre recordados en este dispositivo (si aún no reclamó)
  useEffect(() => {
    if (state !== 'ready' || doc?.hasClaimed) return;
    const remembered = readRememberedClient();
    if (!remembered) return;
    setEmail((prev) => prev || remembered.email);
    setName((prev) => prev || remembered.name || '');
    setRememberedPrefill(true);
  }, [state, doc?.hasClaimed]);

  const isEstimate = doc?.type === 'estimate';
  const hasClaimed = !!doc?.hasClaimed;
  const isAccepted = doc?.status === 'accepted' || doc?.status === 'converted';
  const canAccept = isEstimate
    && hasClaimed
    && !['accepted', 'rejected', 'cancelled', 'converted', 'expired'].includes(doc?.status);

  const fin = doc?.financials || {};

  const claim = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!isValidEmail(email)) {
      toast.error(t('quickDoc.public.errors.invalidEmail'));
      return;
    }
    if (!acceptTerms) {
      toast.error(t('quickDoc.public.errors.mustAccept'));
      return;
    }
    setClaiming(true);
    try {
      const { data } = await api.post(`/public/quick-docs/${token}/claim`, {
        email: email.trim(),
        name: name.trim() || undefined,
        acceptTerms: true,
        locale
      });
      setDoc(data?.data?.doc || doc);
      saveRememberedClient(email.trim(), name.trim());
      toast.success(t('quickDoc.public.claim.success'));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 410) { setErrorType('expired'); setState('error'); return; }
      toast.error(err?.response?.data?.message || t('quickDoc.public.errors.claimError'));
    } finally {
      setClaiming(false);
    }
  }, [email, name, acceptTerms, token, locale, doc, t, toast]);

  const acceptEstimate = useCallback(async () => {
    setAccepting(true);
    try {
      const { data } = await api.post(`/public/quick-docs/${token}/accept`, {});
      setDoc(data?.data?.doc || doc);
      toast.success(t('quickDoc.public.accept.success'));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 410) { setErrorType('expired'); setState('error'); return; }
      toast.error(err?.response?.data?.message || t('quickDoc.public.errors.acceptError'));
    } finally {
      setAccepting(false);
    }
  }, [token, doc, t, toast]);

  const viewPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const res = await api.get(`/public/quick-docs/${token}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error(t('quickDoc.public.errors.pdfError'));
    } finally {
      setPdfLoading(false);
    }
  }, [token, t, toast]);

  const openProviderProfile = useCallback(async () => {
    const providerId = doc?.providerId;
    if (!providerId) return;
    if (providerData) { setProviderModalOpen(true); return; }
    setProviderLoading(true);
    try {
      const { data } = await api.get(`/guest/providers/${providerId}`);
      const provider = data?.data?.provider;
      if (!provider?._id) throw new Error('missing provider');
      setProviderData(provider);
      setProviderModalOpen(true);
    } catch {
      toast.error(t('quickDoc.public.errors.providerError'));
    } finally {
      setProviderLoading(false);
    }
  }, [doc?.providerId, providerData, t, toast]);

  const businessName = doc?.businessInfo?.name || t('quickDoc.public.defaultBusiness');

  const docTitle = useMemo(() => (
    isEstimate ? t('quickDoc.public.estimateTitle') : t('quickDoc.public.invoiceTitle')
  ), [isEstimate, t]);

  /* ───────────── Estados: cargando / error ───────────── */
  if (state === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" />
          <p className="text-sm">{t('quickDoc.public.loading')}</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    const errTitle = errorType === 'expired'
      ? t('quickDoc.public.errors.expiredTitle')
      : errorType === 'notFound'
        ? t('quickDoc.public.errors.notFoundTitle')
        : t('quickDoc.public.errors.genericTitle');
    const errDesc = errorType === 'expired'
      ? t('quickDoc.public.errors.expiredDesc')
      : errorType === 'notFound'
        ? t('quickDoc.public.errors.notFoundDesc')
        : t('quickDoc.public.errors.genericDesc');
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <HiExclamationCircle className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{errTitle}</h1>
          <p className="text-sm text-gray-500 mb-6">{errDesc}</p>
          <Link to="/" className="text-sm font-semibold text-brand hover:underline">
            {t('quickDoc.public.goHome')}
          </Link>
        </div>
      </div>
    );
  }

  /* ───────────── Documento listo ───────────── */
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Encabezado del negocio */}
        <div className="rounded-t-3xl bg-brand px-6 py-6 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <HiOutlineDocumentText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/70">{docTitle}</p>
              <h1 className="truncate text-lg font-bold">{businessName}</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/85">
            {doc?.documentNumber && (
              <span>{t('quickDoc.pdf.docNo')}: <strong className="font-semibold">{doc.documentNumber}</strong></span>
            )}
            {doc?.issueDate && (
              <span>{t('quickDoc.pdf.issueDate')}: {fmtDate(doc.issueDate, locale)}</span>
            )}
            {isEstimate && doc?.validUntil && (
              <span>{t('quickDoc.pdf.validUntil')}: {fmtDate(doc.validUntil, locale)}</span>
            )}
          </div>

          {doc?.providerId && (
            <button
              type="button"
              onClick={openProviderProfile}
              disabled={providerLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 disabled:opacity-60"
            >
              <HiOutlineUserCircle className="h-5 w-5" />
              {providerLoading ? t('quickDoc.public.loading') : t('quickDoc.public.viewProviderProfile')}
            </button>
          )}
        </div>

        {/* Cuerpo */}
        <div className="rounded-b-3xl border border-t-0 border-gray-100 bg-white px-6 py-6 shadow-sm sm:px-8">
          {/* Estado aceptado */}
          {isAccepted && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
              <HiCheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{t('quickDoc.public.accept.acceptedBadge')}</span>
            </div>
          )}

          {/* Detalle de líneas */}
          {Array.isArray(fin.items) && fin.items.length > 0 && (
            <div className="relative mb-5">
              <div
                className={`overflow-x-auto rounded-2xl border border-gray-100 ${!hasClaimed ? 'pointer-events-none select-none blur-[2px]' : ''}`}
                aria-hidden={!hasClaimed}
              >
                <table className="w-full min-w-88 text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">{t('invoice.description')}</th>
                      <th className="px-3 py-2 text-center font-semibold">{t('invoice.qty')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-semibold">{t('invoice.unitPrice')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right font-semibold">{t('invoice.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fin.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-gray-800">{it.description || '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{it.qty ?? 0}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-gray-600">{fmtCurrency(it.unitPrice, fin.currency)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-900">{fmtCurrency(it.total, fin.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!hasClaimed && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/15">
                  <div className="mx-4 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-center text-xs font-semibold text-brand shadow-sm ring-1 ring-brand/15">
                    <HiLockClosed className="h-4 w-4 shrink-0" />
                    <span>{t('quickDoc.public.previewLocked')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totales */}
          <div className="mb-5 space-y-1.5 text-sm">
            {fin.isRange ? (
              <div className="flex flex-col gap-1 rounded-2xl bg-brand/5 px-4 py-3 xs:flex-row xs:items-center xs:justify-between">
                <span className="font-semibold text-gray-700">{t('quickDoc.pdf.estimatedTotal')}</span>
                <span className="text-lg font-bold text-brand">
                  {fmtCurrency(fin.amountMin, fin.currency)} – {fmtCurrency(fin.amountMax, fin.currency)}
                </span>
              </div>
            ) : (
              <>
                {(Number(fin.subtotal) > 0 || Number(fin.discount) > 0 || Number(fin.tax) > 0 || Number(fin.shipping) > 0) && (
                  <div className={!hasClaimed ? 'pointer-events-none select-none space-y-1.5 blur-[2px]' : 'space-y-1.5'} aria-hidden={!hasClaimed}>
                    {Number(fin.subtotal) > 0 && (
                      <Row label={t('invoice.subtotal')} value={fmtCurrency(fin.subtotal, fin.currency)} />
                    )}
                    {Number(fin.discount) > 0 && (
                      <Row label={t('invoice.discount')} value={`– ${fmtCurrency(fin.discount, fin.currency)}`} />
                    )}
                    {Number(fin.tax) > 0 && (
                      <Row label={t('invoice.tax')} value={fmtCurrency(fin.tax, fin.currency)} />
                    )}
                    {Number(fin.shipping) > 0 && (
                      <Row label={t('invoice.shipping')} value={fmtCurrency(fin.shipping, fin.currency)} />
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between rounded-2xl bg-brand/5 px-4 py-3">
                  <span className="font-semibold text-gray-700">{t('invoice.total')}</span>
                  <span className="text-lg font-bold text-brand">{fmtCurrency(fin.total, fin.currency)}</span>
                </div>
              </>
            )}
          </div>

          {/* Notas */}
          {doc?.notes && (
            <div className="mb-5 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {doc.notes}
            </div>
          )}

          {/* Ver / descargar PDF — solo disponible tras confirmar el correo */}
          {doc?.pdfUrl && hasClaimed && (
            <Button
              variant="outline"
              className="mb-6 w-full"
              onClick={viewPdf}
              loading={pdfLoading}
              disabled={pdfLoading}
            >
              <HiDownload className="h-5 w-5" />
              {t('quickDoc.public.viewPdf')}
            </Button>
          )}

          {/* Captura de correo (si no ha reclamado) */}
          {!hasClaimed ? (
            <form onSubmit={claim} className="rounded-3xl border border-brand/20 bg-brand/5 p-5">
              <div className="mb-3 flex items-center gap-2 text-brand">
                <HiShieldCheck className="h-5 w-5" />
                <h2 className="text-sm font-bold">{t('quickDoc.public.claim.title')}</h2>
              </div>
              <p className="mb-4 text-sm text-gray-600">{t('quickDoc.public.claim.desc')}</p>

              {rememberedPrefill && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-brand/10 px-3 py-2 text-xs text-brand-700">
                  <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{t('quickDoc.public.claim.rememberedHint')}</span>
                </div>
              )}

              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t('quickDoc.public.claim.emailLabel')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('quickDoc.public.claim.emailPh')}
                className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />

              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t('quickDoc.public.claim.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('quickDoc.public.claim.namePh')}
                className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />

              <label className="mb-4 flex items-start gap-2.5 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span>
                  {t('quickDoc.public.claim.termsPre')}{' '}
                  <Link to="/terminos" target="_blank" className="font-semibold text-brand hover:underline">
                    {t('quickDoc.public.claim.termsLink')}
                  </Link>{' '}
                  {t('quickDoc.public.claim.termsAnd')}{' '}
                  <Link to="/privacidad" target="_blank" className="font-semibold text-brand hover:underline">
                    {t('quickDoc.public.claim.privacyLink')}
                  </Link>.
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={claiming}
                disabled={claiming}
              >
                {t('quickDoc.public.claim.submit')}
              </Button>
            </form>
          ) : (
            /* Acciones tras reclamar */
            <div className="space-y-3">
              {isEstimate ? (
                canAccept ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={acceptEstimate}
                    loading={accepting}
                    disabled={accepting}
                  >
                    <HiCheckCircle className="h-5 w-5" />
                    {t('quickDoc.public.accept.button')}
                  </Button>
                ) : !isAccepted ? (
                  <p className="rounded-2xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
                    {t('quickDoc.public.accept.unavailable')}
                  </p>
                ) : null
              ) : (
                <p className="rounded-2xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
                  {t('quickDoc.public.invoiceClaimed')}
                </p>
              )}
            </div>
          )}

          {/* Pie de marca */}
          <p className="mt-6 text-center text-xs text-gray-400">
            {t('quickDoc.public.poweredBy')}
          </p>
        </div>
      </div>

      {providerData && (
        <ProviderProfileModal
          isOpen={providerModalOpen}
          onClose={() => setProviderModalOpen(false)}
          provider={providerData}
          readOnly
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-1 text-gray-600">
      <span>{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

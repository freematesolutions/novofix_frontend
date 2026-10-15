import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  HiPlus, HiArrowLeft, HiEye, HiCheckCircle, HiClock, HiBan,
  HiDocumentText, HiRefresh, HiDownload
} from 'react-icons/hi';
import api from '@/state/apiClient.js';
import { useAuth } from '@/state/AuthContext.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import QuickDocModal, { buildQuickDocPDF } from '@/components/ui/QuickDocModal.jsx';
import QuickDocShareCard from '@/components/ui/QuickDocShareCard.jsx';

const fmtCurrency = (val, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(val) || 0);

const fmtDateTime = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleString(); } catch { return ''; }
};

/* ── Mapea la respuesta del backend al shape que espera buildQuickDocPDF ── */
function docToPdfData(doc, type) {
  const f = doc.financials || {};
  const b = doc.businessInfo || {};
  const c = doc.clientInfo || {};
  return {
    type,
    documentNumber: doc.documentNumber || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    businessName: b.name || '',
    businessAddress: b.address || '',
    businessPhone: b.phone || '',
    businessEmail: b.email || '',
    clientName: c.name || '',
    clientAddress: c.address || '',
    clientCity: c.city || '',
    clientState: c.state || '',
    clientZip: c.zip || '',
    items: Array.isArray(f.items) ? f.items : [],
    discount: f.discount || 0,
    taxRate: f.taxRate || 0,
    shipping: f.shipping || 0,
    currency: f.currency || 'USD',
    notes: doc.notes || ''
  };
}

/* ── Badge de estado ── */
function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    draft: { cls: 'bg-gray-100 text-gray-600', icon: HiDocumentText },
    sent: { cls: 'bg-blue-50 text-blue-700', icon: HiClock },
    viewed: { cls: 'bg-amber-50 text-amber-700', icon: HiEye },
    accepted: { cls: 'bg-emerald-50 text-emerald-700', icon: HiCheckCircle },
    rejected: { cls: 'bg-red-50 text-red-700', icon: HiBan },
    expired: { cls: 'bg-gray-100 text-gray-500', icon: HiClock },
    cancelled: { cls: 'bg-gray-100 text-gray-500', icon: HiBan },
    converted: { cls: 'bg-brand-50 text-brand-700', icon: HiRefresh }
  };
  const { cls, icon: Icon } = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {t(`quickDoc.status.${status}`)}
    </span>
  );
}

/* ══════════════════════════ Detalle ══════════════════════════ */
function QuickDocDetail({ id }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  // El link público lo devuelve el backend mientras el documento siga activo;
  // como respaldo inmediato tras crear/convertir, también llega por router state.
  const [publicUrl, setPublicUrl] = useState(location.state?.publicUrl || null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/provider/quick-docs/${id}`);
      setDoc(data?.data?.doc || null);
      if (data?.data?.publicUrl) setPublicUrl(data.data.publicUrl);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('quickDoc.errors.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t, toast]);

  useEffect(() => { load(); }, [load]);

  // Descarga del PDF vía proxy autenticado (Cloudinary bloquea la entrega directa).
  const downloadPdf = useCallback(async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/provider/quick-docs/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('quickDoc.errors.pdfError'));
    } finally {
      setDownloadingPdf(false);
    }
  }, [downloadingPdf, id, t, toast]);

  // Genera (o regenera) el enlace público para compartir.
  const generateLink = useCallback(async () => {
    if (generatingLink) return;
    setGeneratingLink(true);
    try {
      const { data } = await api.post(`/provider/quick-docs/${id}/share-link`);
      const url = data?.data?.publicUrl;
      if (url) {
        setPublicUrl(url);
        toast.success(t('quickDoc.success.linkGenerated'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('quickDoc.errors.linkError'));
    } finally {
      setGeneratingLink(false);
    }
  }, [generatingLink, id, t, toast]);

  const convert = useCallback(async () => {
    if (!doc || converting) return;
    setConverting(true);
    try {
      // Genera el PDF de la factura a partir de los datos del estimado
      const { doc: pdfDoc, total, subtotal, tax } = buildQuickDocPDF(docToPdfData(doc, 'invoice'), t);
      const pdfBlob = pdfDoc.output('blob');
      const pdfFile = new File([pdfBlob], `Invoice_${doc.documentNumber || id}.pdf`, { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('type', 'document');
      const uploadRes = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      const uploadedUrl = uploadRes.data?.data?.url || uploadRes.data?.url;

      const f = doc.financials || {};
      const { data } = await api.post(`/provider/quick-docs/${id}/convert`, {
        pdfUrl: uploadedUrl,
        financials: {
          items: f.items || [],
          subtotal,
          discount: f.discount || 0,
          taxRate: f.taxRate || 0,
          tax,
          shipping: f.shipping || 0,
          total,
          currency: f.currency || 'USD'
        }
      });
      const result = data?.data || data;
      toast.success(t('quickDoc.success.converted'));
      navigate(`/documentos-rapidos/${result.doc.id}`, { state: { publicUrl: result.publicUrl } });
    } catch (err) {
      toast.error(err?.response?.data?.message || t('quickDoc.errors.convertError'));
    } finally {
      setConverting(false);
    }
  }, [doc, converting, id, t, toast, navigate]);

  const cancel = useCallback(async () => {
    if (!doc || cancelling) return;
    setCancelling(true);
    try {
      await api.post(`/provider/quick-docs/${id}/cancel`);
      toast.success(t('quickDoc.success.cancelled'));
      setPublicUrl(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('quickDoc.errors.cancelError'));
    } finally {
      setCancelling(false);
    }
  }, [doc, cancelling, id, t, toast, load]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>;
  }
  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('quickDoc.errors.notFound')}</p>
        <button onClick={() => navigate('/documentos-rapidos')} className="mt-4 text-brand-600 font-semibold">
          {t('quickDoc.detail.backToList')}
        </button>
      </div>
    );
  }

  const isEstimate = doc.type === 'estimate';
  const canConvert = isEstimate && doc.status === 'accepted' && !doc.convertedInvoice;
  const canCancel = !['accepted', 'converted', 'cancelled'].includes(doc.status);

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/documentos-rapidos')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <HiArrowLeft className="w-4 h-4" /> {t('quickDoc.detail.backToList')}
      </button>

      {/* Cabecera del documento */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {isEstimate ? t('quickDoc.form.typeEstimate') : t('quickDoc.form.typeInvoice')}
              </span>
              <StatusBadge status={doc.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{doc.documentNumber || t('quickDoc.detail.noNumber')}</h1>
            <p className="text-2xl font-bold text-brand-700 mt-1">
              {fmtCurrency(doc.financials?.total, doc.financials?.currency)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {doc.clientInfo?.name || doc.clientEmail
                ? t('quickDoc.list.sentTo', { client: doc.clientInfo?.name || doc.clientEmail })
                : t('quickDoc.list.noClientYet')}
            </p>
          </div>
          <div className="text-sm text-gray-500 space-y-1 sm:text-right">
            <p>{t('quickDoc.detail.views')}: <span className="font-semibold text-gray-700">{doc.viewCount || 0}</span></p>
            {doc.firstViewedAt && <p>{t('quickDoc.detail.firstViewed')}: {fmtDateTime(doc.firstViewedAt)}</p>}
            {doc.clientEmail && <p>{t('quickDoc.detail.clientEmail')}: <span className="font-semibold text-gray-700">{doc.clientEmail}</span></p>}
            {doc.acceptedAt && <p className="text-emerald-600 font-semibold">{t('quickDoc.detail.acceptedAt')}: {fmtDateTime(doc.acceptedAt)}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-gray-100">
          {doc.pdfUrl && (
            <Button variant="secondary" onClick={downloadPdf} loading={downloadingPdf} disabled={downloadingPdf}>
              <HiDownload className="w-4 h-4" /> {t('quickDoc.detail.downloadPdf')}
            </Button>
          )}
          {canConvert && (
            <Button variant="primary" onClick={convert} loading={converting} disabled={converting}>
              <HiRefresh className="w-4 h-4" /> {t('quickDoc.detail.convertBtn')}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={cancel} loading={cancelling} disabled={cancelling}>
              {t('quickDoc.detail.cancelBtn')}
            </Button>
          )}
        </div>
      </div>

      {/* Compartir: el backend devuelve el link mientras el documento siga activo */}
      {publicUrl ? (
        <QuickDocShareCard publicUrl={publicUrl} />
      ) : ['cancelled', 'expired', 'converted'].includes(doc.status) ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {t('quickDoc.detail.linkInactive')}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">{t('quickDoc.detail.noLinkYet')}</p>
          <Button variant="primary" onClick={generateLink} loading={generatingLink} disabled={generatingLink}>
            {t('quickDoc.detail.generateLinkBtn')}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════ Lista ══════════════════════════ */
function QuickDocList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/quick-docs');
      setDocs(data?.data?.docs || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('quickDoc.errors.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = useCallback((result) => {
    if (result?.doc?.id) {
      navigate(`/documentos-rapidos/${result.doc.id}`, { state: { publicUrl: result.publicUrl } });
    } else {
      load();
    }
  }, [navigate, load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quickDoc.list.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('quickDoc.list.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <HiPlus className="w-4 h-4" /> {t('quickDoc.list.createBtn')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <HiDocumentText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">{t('quickDoc.list.emptyTitle')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('quickDoc.list.emptyHint')}</p>
          <Button variant="primary" className="mt-4" onClick={() => setModalOpen(true)}>
            <HiPlus className="w-4 h-4" /> {t('quickDoc.list.createBtn')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/documentos-rapidos/${d.id}`)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      {d.type === 'estimate' ? t('quickDoc.form.typeEstimate') : t('quickDoc.form.typeInvoice')}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {d.documentNumber || t('quickDoc.detail.noNumber')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {d.clientName || d.clientEmail
                      ? t('quickDoc.list.sentTo', { client: d.clientName || d.clientEmail })
                      : t('quickDoc.list.noClientYet')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(d.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-gray-900">{fmtCurrency(d.total, d.currency)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 inline-flex items-center gap-1 justify-end">
                    <HiEye className="w-3.5 h-3.5" /> {d.viewCount || 0}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <QuickDocModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </div>
  );
}

/* ══════════════════════════ Página ══════════════════════════ */
export default function QuickDocs() {
  const { id } = useParams();
  const { viewRole } = useAuth();
  const { t } = useTranslation();

  const isProvider = viewRole === 'provider';

  if (!isProvider) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">{t('quickDoc.errors.providersOnly')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-brand-50/30">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {id ? <QuickDocDetail id={id} /> : <QuickDocList />}
      </div>
    </div>
  );
}

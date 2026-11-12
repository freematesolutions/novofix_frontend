import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { HiX, HiPlus, HiTrash } from 'react-icons/hi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/state/apiClient.js';
import { useAuth } from '@/state/AuthContext.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import Button from '@/components/ui/Button.jsx';
import PdfCanvasViewer from '@/components/ui/PdfCanvasViewer.jsx';

/* ───────────────────────────────────────
   Constantes de diseño (alineadas a la marca)
   ─────────────────────────────────────── */
const BRAND_TEAL = [0, 128, 128];
const BRAND_DARK = [47, 53, 59];
const BRAND_GOLD = [255, 191, 0];
const WHITE = [255, 255, 255];
const GRAY_100 = [243, 244, 246];
const GRAY_500 = [107, 114, 128];
const GRAY_700 = [55, 65, 81];
const GRAY_900 = [17, 24, 39];

/* ───────────────────────────────────────
   Helpers
   ─────────────────────────────────────── */
const fmtCurrency = (val, currency = 'USD') => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
};

const genDocNumber = (type) => {
  const prefix = type === 'invoice' ? 'INV' : 'EST';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const today = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

/* ───────────────────────────────────────
   PDF Generation Engine (estimado / factura)
   ─────────────────────────────────────── */
export function buildQuickDocPDF(data, t) {
  const isInvoice = data.type === 'invoice';
  const docLabel = isInvoice ? t('quickDoc.pdf.invoiceLabel') : t('quickDoc.pdf.estimateLabel');

  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;

  // ── Header bar (más alta para dar aire a tipografías legibles) ──
  const headerH = 48;
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageW, headerH, 'F');

  // Nombre del negocio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...WHITE);
  doc.text(data.businessName || 'Business Name', marginL, 20);

  // Dirección + contacto (apilados con separación cómoda)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(200, 210, 220);
  let hy = 30;
  if (data.businessAddress) { doc.text(data.businessAddress, marginL, hy); hy += 6.5; }
  const contactLine = [data.businessPhone, data.businessEmail].filter(Boolean).join('   •   ');
  if (contactLine) { doc.text(contactLine, marginL, hy); hy += 6.5; }

  // Etiqueta del documento (derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(25);
  doc.setTextColor(...BRAND_GOLD);
  doc.text(docLabel, pageW - marginR, 23, { align: 'right' });

  doc.setFillColor(...BRAND_TEAL);
  doc.rect(0, headerH, pageW, 2, 'F');

  let y = headerH + 16;

  // ── Bill To ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND_TEAL);
  doc.text(t('invoice.billTo').toUpperCase(), marginL, y);
  y += 7.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...GRAY_900);
  if (data.clientName) { doc.text(data.clientName, marginL, y); y += 7; }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GRAY_700);
  if (data.clientAddress) { doc.text(data.clientAddress, marginL, y); y += 6.5; }
  const clientCityState = [data.clientCity, data.clientState, data.clientZip].filter(Boolean).join(', ');
  if (clientCityState) { doc.text(clientCityState, marginL, y); y += 6.5; }

  // ── Meta (right) ──
  const rightX = pageW - marginR;
  let ry = headerH + 16;
  const metaRows = [
    [t('quickDoc.pdf.docNo'), data.documentNumber],
    [t('quickDoc.pdf.issueDate'), formatDate(data.issueDate)],
    [isInvoice ? t('invoice.dueDate') : t('quickDoc.pdf.validUntil'), formatDate(isInvoice ? data.dueDate : data.validUntil)]
  ];
  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_500);
    doc.text(label, rightX - 62, ry);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GRAY_900);
    doc.text(value || '', rightX, ry, { align: 'right' });
    ry += 7.5;
  });

  y = Math.max(y, ry) + 12;

  // ── Items table ──
  const tableHeaders = [[t('invoice.description'), t('invoice.qty'), t('invoice.unitPrice'), t('invoice.total')]];
  const tableBody = data.items.map((item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.unitPrice) || 0;
    return [
      item.description || '',
      qty > 0 ? String(qty) : '',
      price > 0 ? fmtCurrency(price, data.currency) : '',
      fmtCurrency(item.total || qty * price, data.currency)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableBody,
    margin: { left: marginL, right: marginR },
    theme: 'plain',
    headStyles: { fillColor: BRAND_DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 11, cellPadding: { top: 5, bottom: 5, left: 5, right: 5 }, halign: 'left' },
    columnStyles: {
      0: { cellWidth: contentW * 0.5 },
      1: { cellWidth: contentW * 0.1, halign: 'center' },
      2: { cellWidth: contentW * 0.2, halign: 'right' },
      3: { cellWidth: contentW * 0.2, halign: 'right' }
    },
    bodyStyles: { fontSize: 11, textColor: GRAY_700, cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (cell) => {
      if (cell.section === 'head') {
        if (cell.column.index === 1) cell.cell.styles.halign = 'center';
        if (cell.column.index >= 2) cell.cell.styles.halign = 'right';
      }
    }
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Totals ──
  const totalsX = pageW - marginR - 85;
  const totalsValX = pageW - marginR;

  const drawTotalRow = (label, value, bold = false, highlight = false) => {
    if (highlight) {
      doc.setFillColor(...BRAND_TEAL);
      doc.roundedRect(totalsX - 5, y - 6, 90, 14, 2, 2, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13.5);
    } else {
      doc.setTextColor(...(bold ? GRAY_900 : GRAY_700));
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(11);
    }
    doc.text(label, totalsX, y);
    doc.text(value, totalsValX, y, { align: 'right' });
    y += highlight ? 15 : 7.5;
  };

  const subtotal = data.items.reduce((s, it) => s + (Number(it.total) || (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)), 0);
  const discount = Number(data.discount) || 0;
  const subtotalAfterDiscount = subtotal - discount;
  const taxRate = Number(data.taxRate) || 0;
  const tax = subtotalAfterDiscount * (taxRate / 100);
  const shipping = Number(data.shipping) || 0;
  const total = subtotalAfterDiscount + tax + shipping;

  doc.setDrawColor(...GRAY_100);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, y - 2, totalsValX + 5, y - 2);
  y += 4;

  drawTotalRow(t('invoice.subtotal'), fmtCurrency(subtotal, data.currency));
  if (discount > 0) drawTotalRow(t('invoice.discount'), `- ${fmtCurrency(discount, data.currency)}`);
  if (taxRate > 0) drawTotalRow(`${t('invoice.tax')} (${taxRate}%)`, fmtCurrency(tax, data.currency));
  if (shipping > 0) drawTotalRow(t('invoice.shipping'), fmtCurrency(shipping, data.currency));

  y += 3;
  drawTotalRow(isInvoice ? t('invoice.balanceDue') : t('quickDoc.pdf.estimatedTotal'), fmtCurrency(total, data.currency), true, true);

  // ── Notes ──
  if (data.notes) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...BRAND_TEAL);
    doc.text(t('invoice.notes').toUpperCase(), marginL, y);
    y += 6.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...GRAY_500);
    const noteLines = doc.splitTextToSize(data.notes, contentW * 0.62);
    doc.text(noteLines, marginL, y);
    y += noteLines.length * 5.5;
  }

  // ── Footer ──
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, pageH - 13, pageW, 13, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 200);
  doc.text(`${data.businessName || 'NovoFix'}  •  ${t('invoice.generatedBy')}`, pageW / 2, pageH - 5, { align: 'center' });

  return { doc, total, subtotal, tax, discount, shipping };
}

/* ───────────────────────────────────────
   Main Component
   ─────────────────────────────────────── */
export default function QuickDocModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const [type, setType] = useState('estimate');
  const [documentNumber, setDocumentNumber] = useState(() => genDocNumber('estimate'));
  const [issueDate, setIssueDate] = useState(() => today());
  const [dueDate, setDueDate] = useState(() => addDays(today(), 30));
  const [validUntil, setValidUntil] = useState(() => addDays(today(), 30));
  const [expiresInDays, setExpiresInDays] = useState(30);

  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientZip, setClientZip] = useState('');

  const [items, setItems] = useState([{ description: '', qty: '', unitPrice: '', total: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('');
  const [currency] = useState('USD');

  const [step, setStep] = useState(1); // 1 = form, 2 = preview
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // ── Prefill on open ──
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSubmitting(false);
    setType('estimate');
    setDocumentNumber(genDocNumber('estimate'));
    setIssueDate(today());
    setDueDate(addDays(today(), 30));
    setValidUntil(addDays(today(), 30));
    setExpiresInDays(30);
    setItems([{ description: '', qty: '', unitPrice: '', total: 0 }]);
    setDiscount(0);
    setTaxRate(0);
    setShipping(0);
    setNotes(t('quickDoc.form.defaultNote'));
    setClientName('');
    setClientAddress('');
    setClientCity('');
    setClientState('');
    setClientZip('');

    setBusinessName(
      user?.providerProfile?.businessName ||
      `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() ||
      ''
    );
    setBusinessAddress(
      user?.contact?.address ||
      user?.providerProfile?.serviceArea?.address ||
      user?.providerProfile?.serviceArea?.zones?.[0] ||
      ''
    );
    setBusinessPhone(user?.profile?.phone || user?.contact?.phone || '');
    setBusinessEmail(user?.email || '');
  }, [open, user, t]);

  // Keep document number prefix in sync with type
  useEffect(() => {
    setDocumentNumber(genDocNumber(type));
  }, [type]);

  // ── Item management ──
  const updateItem = useCallback((index, field, value) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'qty' || field === 'unitPrice') {
        updated.total = (Number(updated.qty) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { description: '', qty: '', unitPrice: '', total: 0 }]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  // ── Totals ──
  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const discountVal = Number(discount) || 0;
    const subtotalAfterDiscount = subtotal - discountVal;
    const taxVal = subtotalAfterDiscount * ((Number(taxRate) || 0) / 100);
    const shippingVal = Number(shipping) || 0;
    const total = subtotalAfterDiscount + taxVal + shippingVal;
    return { subtotal, discount: discountVal, tax: taxVal, shipping: shippingVal, total };
  }, [items, discount, taxRate, shipping]);

  const docData = useMemo(() => ({
    type,
    documentNumber,
    issueDate,
    dueDate,
    validUntil,
    businessName,
    businessAddress,
    businessPhone,
    businessEmail,
    clientName,
    clientAddress,
    clientCity,
    clientState,
    clientZip,
    items,
    discount,
    taxRate,
    shipping,
    currency,
    notes
  }), [type, documentNumber, issueDate, dueDate, validUntil, businessName, businessAddress, businessPhone, businessEmail, clientName, clientAddress, clientCity, clientState, clientZip, items, discount, taxRate, shipping, currency, notes]);

  const validForm = useMemo(() => {
    return items.some((it) => (it.description || '').trim() && (Number(it.total) || 0) >= 0) && totals.total > 0;
  }, [items, totals]);

  // ── Preview ──
  const generatePreview = useCallback(() => {
    try {
      const { doc } = buildQuickDocPDF(docData, t);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setStep(2);
    } catch (err) {
      console.error('Error generating preview:', err);
      toast.error(t('quickDoc.errors.previewError'));
    }
  }, [docData, t, previewUrl, toast]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // ── Create QuickDoc ──
  const createDoc = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1. Build PDF
      const { doc, total, subtotal, tax } = buildQuickDocPDF(docData, t);
      const pdfBlob = doc.output('blob');
      const fileName = `${type === 'invoice' ? 'Invoice' : 'Estimate'}_${documentNumber}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('type', 'document');
      const uploadRes = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      const uploadedUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      if (!uploadedUrl) throw new Error('Upload failed');

      // 3. Create QuickDoc
      const payload = {
        type,
        documentNumber,
        issueDate,
        dueDate: type === 'invoice' ? dueDate : undefined,
        validUntil: type === 'estimate' ? validUntil : undefined,
        expiresInDays: Number(expiresInDays) || 30,
        notes,
        pdfUrl: uploadedUrl,
        clientInfo: {
          name: clientName || undefined,
          address: clientAddress || undefined,
          city: clientCity || undefined,
          state: clientState || undefined,
          zip: clientZip || undefined
        },
        businessInfo: {
          name: businessName || undefined,
          address: businessAddress || undefined,
          phone: businessPhone || undefined,
          email: businessEmail || undefined
        },
        financials: {
          items: items.map((it) => ({
            description: it.description,
            qty: Number(it.qty) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            total: Number(it.total) || 0
          })),
          subtotal,
          discount: Number(discount) || 0,
          taxRate: Number(taxRate) || 0,
          tax,
          shipping: Number(shipping) || 0,
          total,
          currency
        }
      };

      const { data } = await api.post('/provider/quick-docs', payload);
      const result = data?.data || data;
      toast.success(t('quickDoc.success.created'));
      onCreated?.(result);
      onClose();
    } catch (err) {
      console.error('Error creating quick doc:', err);
      toast.error(err?.response?.data?.message || t('quickDoc.errors.createError'));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, docData, t, type, documentNumber, issueDate, dueDate, validUntil, expiresInDays, notes, clientName, clientAddress, clientCity, clientState, clientZip, businessName, businessAddress, businessPhone, businessEmail, items, discount, taxRate, shipping, currency, onCreated, onClose, toast]);

  // ── Focus / Escape ──
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement;
    setTimeout(() => dialogRef.current?.focus({ preventScroll: true }), 50);
    return () => { try { lastFocusedRef.current?.focus({ preventScroll: true }); } catch { /* ignore */ } };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

  return createPortal(
    <div className="fixed inset-0 z-9999" role="presentation">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('quickDoc.modal.title')}
          tabIndex={-1}
          className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl shadow-gray-900/20 outline-none"
          style={{ animation: 'modalEnter 0.25s ease-out forwards' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-linear-to-r from-dark-700 via-dark-800 to-dark-900 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/30">
                <svg className="w-5 h-5 text-dark-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('quickDoc.modal.title')}</h2>
                <p className="text-xs text-gray-400">{step === 1 ? t('quickDoc.modal.stepForm') : t('quickDoc.modal.stepPreview')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label={t('common.close')}>
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            {step === 1 ? (
              <div className="px-5 sm:px-6 py-5 space-y-6">
                {/* Type toggle */}
                <div>
                  <label className={labelCls}>{t('quickDoc.form.docType')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('estimate')}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${type === 'estimate' ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {t('quickDoc.form.typeEstimate')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('invoice')}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${type === 'invoice' ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {t('quickDoc.form.typeInvoice')}
                    </button>
                  </div>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>{t('quickDoc.pdf.docNo')}</label>
                    <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('quickDoc.pdf.issueDate')}</label>
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{type === 'invoice' ? t('invoice.dueDate') : t('quickDoc.pdf.validUntil')}</label>
                    <input
                      type="date"
                      value={type === 'invoice' ? dueDate : validUntil}
                      onChange={(e) => (type === 'invoice' ? setDueDate(e.target.value) : setValidUntil(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Business info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">{t('quickDoc.form.businessSection')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t('quickDoc.form.businessName')}</label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('quickDoc.form.phone')}</label>
                      <input type="text" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>{t('quickDoc.form.address')}</label>
                      <input type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Client info (optional) */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">{t('quickDoc.form.clientSection')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{t('quickDoc.form.clientHint')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t('quickDoc.form.clientName')}</label>
                      <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('quickDoc.form.clientCity')}</label>
                      <input type="text" value={clientCity} onChange={(e) => setClientCity(e.target.value)} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>{t('quickDoc.form.address')}</label>
                      <input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('quickDoc.form.clientState')}</label>
                      <input type="text" value={clientState} onChange={(e) => setClientState(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('quickDoc.form.clientZip')}</label>
                      <input type="text" value={clientZip} onChange={(e) => setClientZip(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">{t('quickDoc.form.itemsSection')}</h3>
                    <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      <HiPlus className="w-4 h-4" /> {t('quickDoc.form.addItem')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder={t('quickDoc.form.itemDescription')}
                          className={`${inputCls} col-span-12 sm:col-span-6`}
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', e.target.value)}
                          placeholder={t('invoice.qty')}
                          className={`${inputCls} col-span-3 sm:col-span-2`}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          placeholder={t('invoice.unitPrice')}
                          className={`${inputCls} col-span-5 sm:col-span-2`}
                        />
                        <div className="col-span-3 sm:col-span-1 text-right text-sm font-semibold text-gray-700">
                          {fmtCurrency(item.total, currency)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30"
                          aria-label={t('quickDoc.form.removeItem')}
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>{t('invoice.discount')}</label>
                    <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('invoice.tax')} (%)</label>
                    <input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('invoice.shipping')}</label>
                    <input type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} className={inputCls} />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={labelCls}>{t('invoice.notes')}</label>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
                </div>

                {/* Link expiry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('quickDoc.form.expiresInDays')}</label>
                    <input type="number" min="1" max="90" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1">{t('quickDoc.form.expiresHint')}</p>
                  </div>
                </div>

                {/* Totals preview */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between text-base font-bold text-gray-900">
                    <span>{t('invoice.total')}</span>
                    <span className="text-brand-700">{fmtCurrency(totals.total, currency)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 sm:px-6 py-5">
                {previewUrl && (
                  <PdfCanvasViewer
                    title={t('quickDoc.modal.stepPreview')}
                    src={previewUrl}
                    accentColor={type === 'invoice' ? 'red' : 'teal'}
                    className="w-full h-[60vh] rounded-xl border border-gray-200 bg-gray-800 overflow-hidden"
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {step === 1 ? (
              <>
                <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
                <Button variant="primary" onClick={generatePreview} disabled={!validForm}>
                  {t('quickDoc.modal.previewBtn')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>{t('common.back')}</Button>
                <Button variant="primary" onClick={createDoc} loading={submitting} disabled={submitting}>
                  {t('quickDoc.modal.createBtn')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

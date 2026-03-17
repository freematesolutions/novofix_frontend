import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { HiX } from 'react-icons/hi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/state/apiClient.js';
import { useToast } from '@/components/ui/Toast.jsx';

/* ───────────────────────────────────────
   Constantes de diseño
   ─────────────────────────────────────── */
const BRAND_TEAL   = [0, 128, 128];
const BRAND_DARK   = [47, 53, 59];
const BRAND_GOLD   = [255, 191, 0];
const WHITE        = [255, 255, 255];
const GRAY_100     = [243, 244, 246];
const GRAY_500     = [107, 114, 128];
const GRAY_700     = [55, 65, 81];
const GRAY_900     = [17, 24, 39];

/* ───────────────────────────────────────
   Helpers
   ─────────────────────────────────────── */
const fmtCurrency = (val, currency = 'USD') => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
};

const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const today = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

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
   PDF Generation Engine
   ─────────────────────────────────────── */
function buildInvoicePDF(invoiceData, t) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 15;

  // ── Header bar ──
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageW, 38, 'F');

  // Business name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text(invoiceData.businessName || 'Business Name', marginL, 18);

  // Address & contact below business name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 220);
  if (invoiceData.businessAddress) {
    doc.text(invoiceData.businessAddress, marginL, 25);
  }
  const contactLine = [invoiceData.businessPhone, invoiceData.businessEmail].filter(Boolean).join('  •  ');
  if (contactLine) {
    doc.text(contactLine, marginL, 30);
  }

  // INVOICE label on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...BRAND_GOLD);
  doc.text('INVOICE', pageW - marginR, 22, { align: 'right' });

  // Teal accent line
  doc.setFillColor(...BRAND_TEAL);
  doc.rect(0, 38, pageW, 2, 'F');

  y = 48;

  // ── Invoice meta + Bill To ──
  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_TEAL);
  doc.text(t('invoice.billTo').toUpperCase(), marginL, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_900);
  const clientName = invoiceData.clientName || '';
  if (clientName) { doc.text(clientName, marginL, y); y += 5; }
  const clientAddr = invoiceData.clientAddress || '';
  if (clientAddr) { doc.text(clientAddr, marginL, y); y += 5; }
  const clientCityState = [invoiceData.clientCity, invoiceData.clientState, invoiceData.clientZip].filter(Boolean).join(', ');
  if (clientCityState) { doc.text(clientCityState, marginL, y); y += 5; }

  // Right: Invoice details
  const rightX = pageW - marginR;
  let ry = 48;
  const metaRows = [
    [t('invoice.invoiceNo'), invoiceData.invoiceNumber],
    [t('invoice.invoiceDate'), formatDate(invoiceData.invoiceDate)],
    [t('invoice.dueDate'), formatDate(invoiceData.dueDate)]
  ];

  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_500);
    doc.text(label, rightX - 60, ry);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_900);
    doc.text(value || '', rightX, ry, { align: 'right' });
    ry += 6;
  });

  y = Math.max(y, ry) + 8;

  // ── Items Table ──
  const tableHeaders = [
    [
      t('invoice.description'),
      t('invoice.qty'),
      t('invoice.unitPrice'),
      t('invoice.total')
    ]
  ];

  const tableBody = invoiceData.items.map(item => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.unitPrice) || 0;
    return [
      item.description || '',
      qty > 0 ? String(qty) : '',
      price > 0 ? fmtCurrency(price, invoiceData.currency) : '',
      fmtCurrency(item.total || qty * price, invoiceData.currency)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableBody,
    margin: { left: marginL, right: marginR },
    theme: 'plain',
    headStyles: {
      fillColor: BRAND_DARK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: contentW * 0.5 },
      1: { cellWidth: contentW * 0.1, halign: 'center' },
      2: { cellWidth: contentW * 0.2, halign: 'right' },
      3: { cellWidth: contentW * 0.2, halign: 'right' }
    },
    bodyStyles: {
      fontSize: 9,
      textColor: GRAY_700,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index === 1) data.cell.styles.halign = 'center';
        if (data.column.index >= 2) data.cell.styles.halign = 'right';
      }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Totals section ──
  const totalsX = pageW - marginR - 85;
  const totalsValX = pageW - marginR;

  const drawTotalRow = (label, value, bold = false, highlight = false) => {
    if (highlight) {
      doc.setFillColor(...BRAND_TEAL);
      doc.roundedRect(totalsX - 5, y - 4, 90, 10, 2, 2, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
    } else {
      doc.setTextColor(...(bold ? GRAY_900 : GRAY_700));
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(9);
    }
    doc.text(label, totalsX, y);
    doc.text(value, totalsValX, y, { align: 'right' });
    y += highlight ? 12 : 6;
  };

  const subtotal = invoiceData.items.reduce((s, it) => s + (Number(it.total) || (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)), 0);
  const discount = Number(invoiceData.discount) || 0;
  const subtotalAfterDiscount = subtotal - discount;
  const taxRate = Number(invoiceData.taxRate) || 0;
  const tax = subtotalAfterDiscount * (taxRate / 100);
  const shipping = Number(invoiceData.shipping) || 0;
  const total = subtotalAfterDiscount + tax + shipping;

  // Separator line
  doc.setDrawColor(...GRAY_100);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, y - 2, totalsValX + 5, y - 2);
  y += 3;

  drawTotalRow(t('invoice.subtotal'), fmtCurrency(subtotal, invoiceData.currency));
  if (discount > 0) {
    drawTotalRow(t('invoice.discount'), `- ${fmtCurrency(discount, invoiceData.currency)}`);
  }
  if (taxRate > 0) {
    drawTotalRow(`${t('invoice.tax')} (${taxRate}%)`, fmtCurrency(tax, invoiceData.currency));
  }
  if (shipping > 0) {
    drawTotalRow(t('invoice.shipping'), fmtCurrency(shipping, invoiceData.currency));
  }

  y += 2;
  drawTotalRow(t('invoice.balanceDue'), fmtCurrency(total, invoiceData.currency), true, true);

  // ── Notes section ──
  if (invoiceData.notes) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_TEAL);
    doc.text(t('invoice.notes').toUpperCase(), marginL, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_500);
    const noteLines = doc.splitTextToSize(invoiceData.notes, contentW * 0.6);
    doc.text(noteLines, marginL, y);
    y += noteLines.length * 4;
  }

  // ── Thank-you message ──
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_TEAL);
  doc.text(t('invoice.thankYou'), marginL, y);

  // ── Footer bar ──
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, pageH - 12, pageW, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 190, 200);
  doc.text(`${invoiceData.businessName || 'NovoFix'}  •  ${t('invoice.generatedBy')}`, pageW / 2, pageH - 5, { align: 'center' });

  return doc;
}

/* ───────────────────────────────────────
   Main Component
   ─────────────────────────────────────── */
export default function InvoiceGeneratorModal({
  open,
  onClose,
  booking,
  onInvoiceSent
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const itemsScrollRef = useRef(null);
  const newItemDescRef = useRef(null);
  const prevItemsLenRef = useRef(0);

  // ── Invoice state ──
  const [invoiceNumber] = useState(() => {
    return generateInvoiceNumber();
  });
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return today();
  });
  const [dueDate, setDueDate] = useState(() => {
    return addDays(today(), 30);
  });
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [currency] = useState(() => {
    return booking?.proposal?.pricing?.currency || 'USD';
  });

  // Business info from provider profile
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientZip, setClientZip] = useState('');

  // Line items
  const [items, setItems] = useState([]);

  // UI state
  const [step, setStep] = useState(1); // 1 = form, 2 = preview
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // ── Populate from booking on open ──
  useEffect(() => {
    if (!open || !booking) return;

    // Always reset to step 1 (form) when the modal opens
    setStep(1);
    setSending(false);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); }
    setPreviewUrl(null);

    // ── Populate from booking data ──
    // Provider info
    const prov = booking.provider;
    setBusinessName(
      prov?.providerProfile?.businessName ||
      `${prov?.profile?.firstName || ''} ${prov?.profile?.lastName || ''}`.trim() ||
      ''
    );
    setBusinessAddress(prov?.contact?.address || '');
    setBusinessPhone(prov?.profile?.phone || prov?.contact?.phone || '');
    setBusinessEmail(prov?.email || '');

    // Client info
    const cli = booking.client;
    setClientName(
      `${cli?.profile?.firstName || ''} ${cli?.profile?.lastName || ''}`.trim() ||
      ''
    );
    setClientAddress(cli?.contact?.address || '');
    setClientCity(cli?.contact?.city || '');
    setClientState(cli?.contact?.state || '');
    setClientZip(cli?.contact?.zipCode || '');

    // Line items from proposal
    const proposal = booking.proposal;
    const sr = booking.serviceRequest;

    const serviceTitle = sr?.basicInfo?.title || t('invoice.serviceItem');
    const amount = proposal?.pricing?.amount || booking.payment?.totalAmount || 0;
    const isRange = proposal?.pricing?.isRange;
    const amountMin = proposal?.pricing?.amountMin;
    const amountMax = proposal?.pricing?.amountMax;

    const initialItems = [{
      description: serviceTitle,
      qty: 1,
      unitPrice: isRange ? ((amountMin || 0) + (amountMax || 0)) / 2 : amount,
      total: isRange ? ((amountMin || 0) + (amountMax || 0)) / 2 : amount
    }];

    // If proposal has pricing breakdown, add sub-items
    const breakdown = proposal?.pricing?.breakdown;
    if (breakdown) {
      const bdItems = [];
      if (breakdown.labor > 0) bdItems.push({ description: `  → ${t('invoice.labor')}`, qty: 1, unitPrice: breakdown.labor, total: breakdown.labor });
      if (breakdown.materials > 0) bdItems.push({ description: `  → ${t('invoice.materials')}`, qty: 1, unitPrice: breakdown.materials, total: breakdown.materials });
      if (breakdown.transportation > 0) bdItems.push({ description: `  → ${t('invoice.transportation')}`, qty: 1, unitPrice: breakdown.transportation, total: breakdown.transportation });
      if (bdItems.length > 0) {
        // Replace the single item with breakdown items
        initialItems.length = 0;
        bdItems.forEach(it => initialItems.push(it));
      }
    }

    setItems(initialItems);
    setNotes(t('invoice.defaultNote'));
  }, [open, booking, t]);

  // ── Item management ──
  const updateItem = useCallback((index, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'qty' || field === 'unitPrice') {
        updated.total = (Number(updated.qty) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { description: '', qty: 1, unitPrice: 0, total: 0 }]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-scroll to bottom of items list and focus description input when a new item is added
  useEffect(() => {
    if (items.length > prevItemsLenRef.current && prevItemsLenRef.current > 0) {
      requestAnimationFrame(() => {
        // Scroll the items container to the bottom
        if (itemsScrollRef.current) {
          itemsScrollRef.current.scrollTo({ top: itemsScrollRef.current.scrollHeight, behavior: 'smooth' });
        }
        // Focus the description input of the new (last) item
        setTimeout(() => newItemDescRef.current?.focus(), 150);
      });
    }
    prevItemsLenRef.current = items.length;
  }, [items.length]);

  // ── Computed totals ──
  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const discountVal = Number(discount) || 0;
    const subtotalAfterDiscount = subtotal - discountVal;
    const taxVal = subtotalAfterDiscount * ((Number(taxRate) || 0) / 100);
    const shippingVal = Number(shipping) || 0;
    const total = subtotalAfterDiscount + taxVal + shippingVal;
    return { subtotal, discount: discountVal, tax: taxVal, shipping: shippingVal, total };
  }, [items, discount, taxRate, shipping]);

  // ── Build invoice data object ──
  const invoiceData = useMemo(() => ({
    invoiceNumber,
    invoiceDate,
    dueDate,
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
  }), [invoiceNumber, invoiceDate, dueDate, businessName, businessAddress, businessPhone, businessEmail, clientName, clientAddress, clientCity, clientState, clientZip, items, discount, taxRate, shipping, currency, notes]);

  // ── Preview PDF ──
  const generatePreview = useCallback(() => {
    try {
      const doc = buildInvoicePDF(invoiceData, t);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStep(2);
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  }, [invoiceData, t]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Download PDF ──
  const downloadPDF = useCallback(() => {
    try {
      const doc = buildInvoicePDF(invoiceData, t);
      doc.save(`Invoice_${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  }, [invoiceData, invoiceNumber, t]);

  // ── Send invoice via chat ──
  const sendInvoice = useCallback(async () => {
    if (sending) return;
    setSending(true);

    let chatSent = false;

    try {
      // 1. Generate PDF
      const doc = buildInvoicePDF(invoiceData, t);
      const pdfBlob = doc.output('blob');
      const fileName = `Invoice_${invoiceNumber}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // 2. Upload to Cloudinary via chat upload endpoint
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('type', 'document');

      const uploadRes = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      const uploadedUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      if (!uploadedUrl) throw new Error('Upload failed - no URL returned');

      // 3. Get or create booking chat
      const chatRes = await api.post(`/chats/booking/${booking._id}`);
      const chatId = chatRes.data?.data?.chat?._id;
      if (!chatId) throw new Error('Could not create/get booking chat');

      // 4. Send message with PDF attachment in the chat
      const messageText = `📄 ${t('invoice.sentMessage', { number: invoiceNumber, total: fmtCurrency(totals.total, currency) })}`;

      await api.post(`/chats/${chatId}/messages`, {
        text: messageText,
        attachments: [{
          type: 'document',
          url: uploadedUrl,
          name: fileName
        }],
        type: 'document'
      });

      chatSent = true;

      // 5. Persist invoice data to booking record & trigger notification
      await api.post(`/bookings/${booking._id}/invoice`, {
        invoiceNumber,
        invoiceDate,
        dueDate,
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxRate,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total,
        currency,
        notes,
        pdfUrl: uploadedUrl,
        businessInfo: {
          name: businessName,
          address: businessAddress,
          phone: businessPhone,
          email: businessEmail
        },
        clientInfo: {
          name: clientName,
          address: clientAddress,
          city: clientCity,
          state: clientState,
          zip: clientZip
        }
      });

      // 6. All succeeded — notify parent (include bookingId + pdfUrl for optimistic UI update)
      onInvoiceSent?.({ invoiceNumber, total: totals.total, currency, pdfUrl: uploadedUrl, chatId, bookingId: booking._id });
      onClose();
    } catch (err) {
      console.error('Error sending invoice:', err);
      if (chatSent) {
        // Chat message was sent but persist failed — warn the user
        toast.warning(t('invoice.sentChatOnlyWarning'));
        onClose();
      } else {
        toast.error(t('invoice.sendError'));
      }
    } finally {
      setSending(false);
    }
  }, [sending, invoiceData, invoiceNumber, t, booking, totals, currency, onInvoiceSent, onClose, toast, businessName, businessAddress, businessPhone, businessEmail, clientName, clientAddress, clientCity, clientState, clientZip, invoiceDate, dueDate, items, taxRate, notes]);

  // ── Focus management ──
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement;
    setTimeout(() => dialogRef.current?.focus({ preventScroll: true }), 50);
    return () => {
      try { lastFocusedRef.current?.focus({ preventScroll: true }); } catch { /* ignore */ }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  /* ── Render ── */
  return createPortal(
    <div className="fixed inset-0 z-9999" role="presentation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('invoice.title')}
          tabIndex={-1}
          className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl shadow-gray-900/20 outline-none"
          style={{ animation: 'modalEnter 0.25s ease-out forwards' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-linear-to-r from-dark-700 via-dark-800 to-dark-900 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/30">
                <svg className="w-5 h-5 text-dark-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('invoice.title')}</h2>
                <p className="text-xs text-gray-400">
                  {step === 1 ? t('invoice.stepForm') : t('invoice.stepPreview')}
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? 'bg-accent-400 text-dark-800 shadow-lg shadow-accent-500/40' : 'bg-white/20 text-white/60'}`}>1</div>
                  <div className={`w-6 h-0.5 ${step === 2 ? 'bg-accent-400' : 'bg-white/20'}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? 'bg-accent-400 text-dark-800 shadow-lg shadow-accent-500/40' : 'bg-white/20 text-white/60'}`}>2</div>
                </div>

              <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <HiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="max-h-[70vh] overflow-y-auto">
            {step === 1 ? (
              <div className="px-5 sm:px-6 py-5 space-y-6">
                {/* Invoice meta row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t('invoice.invoiceNo')}</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t('invoice.invoiceDate')}</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t('invoice.dueDate')}</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                    />
                  </div>
                </div>

                {/* Business & Client info in two columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* From (Provider) */}
                  <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100">
                    <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      {t('invoice.from')}
                    </h3>
                    <div className="space-y-2.5">
                      <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={t('invoice.businessNamePh')} className="w-full px-3 py-2 rounded-lg border border-brand-200/50 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                      <input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder={t('invoice.addressPh')} className="w-full px-3 py-2 rounded-lg border border-brand-200/50 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder={t('invoice.phonePh')} className="w-full px-3 py-2 rounded-lg border border-brand-200/50 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                        <input value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder={t('invoice.emailPh')} className="w-full px-3 py-2 rounded-lg border border-brand-200/50 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* To (Client) */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {t('invoice.billTo')}
                    </h3>
                    <div className="space-y-2.5">
                      <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder={t('invoice.clientNamePh')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                      <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder={t('invoice.addressPh')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder={t('invoice.cityPh')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                        <input value={clientState} onChange={e => setClientState(e.target.value)} placeholder={t('invoice.statePh')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                        <input value={clientZip} onChange={e => setClientZip(e.target.value)} placeholder={t('invoice.zipPh')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Line Items Table ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      {t('invoice.lineItems')}
                    </h3>
                  </div>

                  {/* Table header */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 bg-dark-700 rounded-t-xl text-xs font-bold text-white uppercase tracking-wider">
                    <div className="col-span-5">{t('invoice.description')}</div>
                    <div className="col-span-2 text-center">{t('invoice.qty')}</div>
                    <div className="col-span-2 text-right">{t('invoice.unitPrice')}</div>
                    <div className="col-span-2 text-right">{t('invoice.total')}</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Items rows — scrollable container */}
                  <div ref={itemsScrollRef} className="border border-gray-200 rounded-b-xl sm:rounded-t-none rounded-xl sm:border-t-0 divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-3 py-3 items-center group hover:bg-gray-50/80 transition-colors">
                        <div className="sm:col-span-5">
                          <label className="sm:hidden text-[10px] font-semibold text-gray-400 uppercase">{t('invoice.description')}</label>
                          <input
                            ref={idx === items.length - 1 ? newItemDescRef : undefined}
                            value={item.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                            placeholder={t('invoice.descriptionPh')}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="sm:hidden text-[10px] font-semibold text-gray-400 uppercase">{t('invoice.qty')}</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.qty}
                            onChange={e => updateItem(idx, 'qty', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-center focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="sm:hidden text-[10px] font-semibold text-gray-400 uppercase">{t('invoice.unitPrice')}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-right focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-end">
                          <span className="text-sm font-semibold text-gray-900">{fmtCurrency(item.total, currency)}</span>
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(idx)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              title={t('invoice.removeItem')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Line button — always visible below the scrollable items */}
                  <button
                    onClick={addItem}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold transition-colors border border-dashed border-brand-300 hover:border-brand-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    {t('invoice.addItem')}
                  </button>
                </div>

                {/* ── Totals & extras row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t('invoice.notes')}</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder={t('invoice.notesPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                    />
                  </div>

                  {/* Financial adjustments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{t('invoice.subtotal')}</span>
                      <span className="text-sm font-semibold text-gray-900">{fmtCurrency(totals.subtotal, currency)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 whitespace-nowrap">{t('invoice.discount')}</label>
                      <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 whitespace-nowrap">{t('invoice.taxRate')}</label>
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                        <span className="text-sm text-gray-400">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600 whitespace-nowrap">{t('invoice.shipping')}</label>
                      <input type="number" min="0" step="0.01" value={shipping} onChange={e => setShipping(e.target.value)} className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t-2 border-brand-200">
                      <span className="text-base font-bold text-gray-900">{t('invoice.balanceDue')}</span>
                      <span className="text-xl font-bold text-brand-700">{fmtCurrency(totals.total, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Step 2: Preview ── */
              <div className="px-5 sm:px-6 py-5">
                <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200" style={{ height: '60vh' }}>
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={t('invoice.previewTitle')}
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer actions ── */}
          <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex flex-col sm:flex-row gap-2 sm:gap-3 items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              {t('invoice.pdfGenerated')}
            </div>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button
                  onClick={() => { setStep(1); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                >
                  {t('invoice.backToEdit')}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                {t('common.cancel')}
              </button>
              {step === 1 ? (
                <button
                  onClick={generatePreview}
                  disabled={items.length === 0 || items.every(i => !i.description)}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-600 hover:to-brand-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {t('invoice.preview')}
                </button>
              ) : (
                <button
                  onClick={sendInvoice}
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-accent-400 to-accent-500 text-dark-800 text-sm font-bold shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {t('invoice.sending')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      {t('invoice.sendInvoice')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { HiClipboardCopy, HiCheck, HiExternalLink } from 'react-icons/hi';
import { useToast } from '@/components/ui/Toast.jsx';

/**
 * Tarjeta para compartir un documento rápido: muestra el enlace público,
 * un botón para copiar y un código QR (SVG, generado en el cliente).
 *
 * props:
 *  - publicUrl: ruta relativa devuelta por el backend (ej. "/d/<token>")
 *  - compact: variante reducida (sin QR grande)
 */
export default function QuickDocShareCard({ publicUrl, compact = false }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const fullUrl = useMemo(() => {
    if (!publicUrl) return '';
    if (/^https?:\/\//i.test(publicUrl)) return publicUrl;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${publicUrl.startsWith('/') ? '' : '/'}${publicUrl}`;
  }, [publicUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success(t('quickDoc.share.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('quickDoc.share.copyError'));
    }
  };

  if (!fullUrl) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-3">{t('quickDoc.share.title')}</h3>

      <div className={`flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 items-start`}>
        {!compact && (
          <div className="shrink-0 rounded-xl bg-white p-3 border border-gray-100">
            <QRCode value={fullUrl} size={140} style={{ height: 'auto', maxWidth: '140px', width: '140px' }} />
          </div>
        )}

        <div className="flex-1 min-w-0 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {t('quickDoc.share.linkLabel')}
          </label>
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={fullUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 font-mono truncate"
            />
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              {copied ? <HiCheck className="w-4 h-4" /> : <HiClipboardCopy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? t('quickDoc.share.copiedShort') : t('quickDoc.share.copyBtn')}</span>
            </button>
          </div>

          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <HiExternalLink className="w-4 h-4" />
            {t('quickDoc.share.openLink')}
          </a>

          <p className="mt-2 text-xs text-gray-400">{t('quickDoc.share.hint')}</p>
        </div>
      </div>
    </div>
  );
}

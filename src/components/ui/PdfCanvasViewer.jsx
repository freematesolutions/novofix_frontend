import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/* ─────────────────────────────────────────────────────
   Detect mobile / tablet (no native PDF iframe support)
   ───────────────────────────────────────────────────── */
const isMobileOrTablet = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Mobile / tablet UA heuristics
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  // iPad with desktop-class Safari (iPadOS 13+)
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  // Fallback: narrow viewport (768px matches typical tablet breakpoint)
  if (typeof window !== 'undefined' && window.innerWidth <= 768) return true;
  return false;
};

/* ─────────────────────────────────────────────────────
   Lazy-load PDF.js only when needed (keeps desktop bundle lean)
   ───────────────────────────────────────────────────── */
let pdfjsPromise = null;
const loadPdfJs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/build/pdf.min.mjs').then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;
      return pdfjs;
    });
  }
  return pdfjsPromise;
};

/* ─────────────────────────────────────────────────────
   PdfCanvasViewer

   Props:
     src         — blob: URL or https: URL of the PDF
     title       — accessible title for the viewer
     className   — extra classes for the outer wrapper
     style       — extra inline styles for the outer wrapper
     accentColor — 'teal' | 'red' | 'brand' — used for spinner & controls
   ───────────────────────────────────────────────────── */
export default function PdfCanvasViewer({
  src,
  title = 'PDF',
  className = '',
  style = {},
  accentColor = 'teal',
}) {
  const mobile = useMemo(isMobileOrTablet, []);

  /* ── Desktop: use native iframe ── */
  if (!mobile) {
    return (
      <iframe
        src={src}
        title={title}
        className={`w-full h-full border-0 ${className}`}
        style={{ minHeight: '400px', ...style }}
      />
    );
  }

  /* ── Mobile: render with PDF.js canvas ── */
  return (
    <MobilePdfRenderer
      src={src}
      title={title}
      className={className}
      style={style}
      accentColor={accentColor}
    />
  );
}

/* ─────────────────────────────────────────────────────
   MobilePdfRenderer — canvas-based renderer via PDF.js
   ───────────────────────────────────────────────────── */
function MobilePdfRenderer({ src, title, className, style, accentColor }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Accent-based colors
  const accentMap = {
    teal: { spinner: 'border-t-teal-500', btn: 'bg-teal-600 hover:bg-teal-700', text: 'text-teal-500' },
    red: { spinner: 'border-t-red-400', btn: 'bg-red-500 hover:bg-red-600', text: 'text-red-400' },
    brand: { spinner: 'border-t-teal-500', btn: 'bg-teal-600 hover:bg-teal-700', text: 'text-teal-500' },
  };
  const accent = accentMap[accentColor] || accentMap.teal;

  /* ── Load the PDF document ── */
  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setCurrentPage(1);
    setNumPages(0);

    (async () => {
      try {
        const pdfjs = await loadPdfJs();

        let loadSrc = src;
        // If it's a blob: URL, fetch it to an ArrayBuffer (more reliable with PDF.js)
        if (src.startsWith('blob:')) {
          const resp = await fetch(src);
          loadSrc = await resp.arrayBuffer();
        }

        const doc = await pdfjs.getDocument(
          typeof loadSrc === 'string' ? { url: loadSrc } : { data: loadSrc }
        ).promise;

        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF.js load error:', err);
          setError(err.message || 'Error loading PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [src]);

  /* ── Render a page to canvas ── */
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch { /* ok */ }
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Fit to container width
      const containerWidth = container.clientWidth - 16; // 8px padding each side
      const unscaledViewport = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / unscaledViewport.width;

      const viewport = page.getViewport({ scale: fitScale * (window.devicePixelRatio || 1) });
      const displayViewport = page.getViewport({ scale: fitScale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${displayViewport.width}px`;
      canvas.style.height = `${displayViewport.height}px`;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', err);
      }
    }
  }, [pdfDoc]);

  /* Re-render when page changes or document loads */
  useEffect(() => {
    if (pdfDoc && currentPage >= 1) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  /* Re-render on resize (keeps fit-to-width responsive) */
  useEffect(() => {
    if (!pdfDoc) return;
    const handleResize = () => renderPage(currentPage);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, currentPage, renderPage]);

  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(numPages, p + 1));

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-4 ${className}`} style={style}>
        <div className={`w-10 h-10 border-3 border-white/20 ${accent.spinner} rounded-full animate-spin`} />
        <p className="text-sm text-white/60">{t('invoice.loadingPdf', 'Loading document...')}</p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-4 text-white/60 ${className}`} style={style}>
        <svg className="w-14 h-14 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-center px-6">{t('invoice.pdfRenderError', 'Could not render the document')}</p>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm underline ${accent.text}`}
          >
            {t('invoice.pdfFallbackLink')}
          </a>
        )}
      </div>
    );
  }

  /* ── Rendered PDF ── */
  return (
    <div className={`flex flex-col h-full ${className}`} style={style} role="document" aria-label={title}>
      {/* Page navigation controls */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 bg-gray-900/60 border-b border-white/10 shrink-0">
          <button
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={t('invoice.prevPage', 'Previous page')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white/80 text-sm font-medium tabular-nums min-w-20 text-center">
            {t('invoice.pageOf', '{{current}} / {{total}}', { current: currentPage, total: numPages })}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={t('invoice.nextPage', 'Next page')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Canvas container — scrollable */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-2 bg-gray-800"
      >
        <canvas
          ref={canvasRef}
          className="block shadow-xl rounded"
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}

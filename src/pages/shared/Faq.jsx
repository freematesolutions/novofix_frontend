// pages/shared/Faq.jsx
//
// Página pública de Preguntas Frecuentes. Consume `/content/faq?locale=xx` con
// fallback graceful si no hay datos (mensaje educativo). Mantiene la paleta
// NovoFix (teal #008080 / gold #FFBF00) y es mobile-first.

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '@/components/seo/Breadcrumbs.jsx';
import useCmsFaq from '@/state/useCmsFaq.js';
import CmsRichContent from '@/components/cms/CmsRichContent.jsx';

const CATEGORIES = ['all', 'general', 'client', 'provider', 'payment', 'account'];

export default function Faq() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';
  const [activeCat, setActiveCat] = useState(initialCat);
  const [openId, setOpenId] = useState(null);

  const { items, loading } = useCmsFaq({ category: activeCat });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Agrupar por categoría para vista 'all'
  const grouped = useMemo(() => {
    if (activeCat !== 'all') return null;
    const map = new Map();
    items.forEach((it) => {
      const arr = map.get(it.category) || [];
      arr.push(it);
      map.set(it.category, arr);
    });
    return map;
  }, [items, activeCat]);

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <Breadcrumbs
        className="mb-6"
        items={[
          { labelKey: 'seo.breadcrumbs.home', path: '/' },
          { labelKey: 'faqPage.breadcrumb', path: '/faq' }
        ]}
      />

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
          <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('faqPage.title')}</h1>
        <p className="text-gray-600 max-w-xl mx-auto">{t('faqPage.intro')}</p>
      </div>

      {/* Tabs de categoría — scrollable horizontalmente en móvil */}
      <div className="mb-6 -mx-3 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto px-3 sm:px-0 pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCat(cat); setOpenId(null); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeCat === cat
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
              }`}
            >
              {t(`faqPage.categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="py-10 text-center text-gray-500 text-sm">{t('common.loading')}…</div>
      )}

      {/* Sin items */}
      {!loading && items.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          <p>{t('faqPage.empty')}</p>
        </div>
      )}

      {/* Vista por categoría única */}
      {!loading && items.length > 0 && activeCat !== 'all' && (
        <FaqList items={items} openId={openId} setOpenId={setOpenId} />
      )}

      {/* Vista 'all' agrupada */}
      {!loading && items.length > 0 && activeCat === 'all' && grouped && (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([cat, list]) => (
            <section key={cat}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600 mb-3">
                {t(`faqPage.categories.${cat}`)}
              </h2>
              <FaqList items={list} openId={openId} setOpenId={setOpenId} />
            </section>
          ))}
        </div>
      )}

      {/* CTA de soporte */}
      <div className="mt-12 bg-linear-to-br from-brand-50 to-accent-50 rounded-2xl p-6 border border-brand-100 text-center">
        <h3 className="text-lg font-semibold mb-2">{t('faqPage.support.title')}</h3>
        <p className="text-sm text-gray-600 mb-4">{t('faqPage.support.desc')}</p>
        <a
          href="mailto:soporte@novofixpro.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
        >
          {t('faqPage.support.cta')}
        </a>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.backToHome')}
        </Link>
      </div>
    </div>
  );
}

function FaqList({ items, openId, setOpenId }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const open = openId === it.id;
        return (
          <li key={it.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : it.id)}
              className="w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={open}
            >
              <span className="font-medium text-gray-900">{it.question}</span>
              <svg
                className={`w-5 h-5 text-brand-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && (
              <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 pt-3">
                <CmsRichContent html={it.answerHtml} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

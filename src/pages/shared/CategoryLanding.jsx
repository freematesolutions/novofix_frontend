import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Seo from '@/components/seo/Seo.jsx';
import Breadcrumbs from '@/components/seo/Breadcrumbs.jsx';
import { findCategoryBySlug, slugifyCategory } from '@/utils/categories';
import { getCategorySeoOverride } from '@/utils/categoryKeywords';
import { CATEGORY_IMAGES } from '@/utils/categoryImages';
import { buildCanonical, buildLocalBusinessSchema } from '@/components/seo/seoConfig.js';

/**
 * Public, indexable category landing page.
 *
 *  • URL pattern: /categorias/:slug   (slug produced by slugifyCategory)
 *  • Goal: capture organic traffic for queries like "plomeros cerca de mí",
 *    show top providers for the category, and link out to public profiles.
 *  • Strictly READ-ONLY: uses the same public guest endpoint that Home consumes
 *    (`/guest/providers/search?category=...`), so it adds zero new backend
 *    surface and zero risk of breaking existing flows.
 *  • SEO: emits CollectionPage + ItemList + BreadcrumbList JSON-LD plus a
 *    rich <Seo /> with localized title/description/og-image.
 *
 * If the slug doesn't match a known category, render a noindex page that
 * redirects clients back to the home (avoids leaking 404 chains).
 */
export default function CategoryLanding() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const category = useMemo(() => findCategoryBySlug(slug), [slug]);

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    let alive = true;
    setLoading(true);
    api
      .get('/guest/providers/search', { params: { category, limit: 12 } })
      .then((res) => {
        if (!alive) return;
        const list = res?.data?.data?.providers || res?.data?.providers || [];
        setProviders(Array.isArray(list) ? list : []);
      })
      .catch(() => alive && setProviders([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [category]);

  if (!slug) return <Navigate to="/" replace />;

  // Unknown category → render a noindex page; the catch-all rewrite already
  // handles direct hits, but we add an in-page link so users land softly.
  if (!category) {
    return (
      <>
        <Seo
          titleKey="seo.routes.categoryLanding.notFoundTitle"
          descriptionKey="seo.routes.categoryLanding.notFoundDescription"
          noindex
        />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">
            {t('seo.routes.categoryLanding.notFoundTitle')}
          </h1>
          <p className="text-gray-500 mb-6">
            {t('seo.routes.categoryLanding.notFoundDescription')}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            {t('common.backToHome')}
          </Link>
        </main>
      </>
    );
  }

  const slugified = slugifyCategory(category);
  const canonicalPath = `/categorias/${slugified}`;
  const lang = (i18n.language || 'es').toLowerCase().split('-')[0];
  const override = getCategorySeoOverride(category, lang);

  // Override-aware copy: prefer the per-category SEO bundle (Phase 8) and fall
  // back to the generic interpolation strings shipped in i18n. This keeps the
  // page useful for categories without a dedicated bundle.
  const title = override?.title || t('seo.routes.categoryLanding.title', { category });
  const description =
    override?.description || t('seo.routes.categoryLanding.description', { category });
  const heading =
    override?.heading || t('seo.routes.categoryLanding.heading', { category });
  const intro = override?.intro || description;
  const faqEntries = override?.faq || [];
  const ogImage = CATEGORY_IMAGES?.[category];

  // ─── Schema.org JSON-LD ────────────────────────────────────────────────
  // CollectionPage describes the landing as a curated list; ItemList wraps
  // the provider cards so Google can show them as rich results in SERP.
  // FAQPage (Phase 8) is included only when we ship FAQ entries; LocalBusiness
  // anchors the geographic market that NovoFix targets (Miami, FL).
  const breadcrumbs = [
    { labelKey: 'seo.breadcrumbs.home', path: '/' },
    { labelKey: 'seo.breadcrumbs.categories', path: '/' }, // virtual hub
    { label: category, path: canonicalPath },
  ];
  const jsonLd = [
    buildLocalBusinessSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: buildCanonical(canonicalPath),
      inLanguage: lang,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.label || t(b.labelKey),
        item: buildCanonical(b.path),
      })),
    },
    providers.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: providers.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: buildCanonical(`/profesional/${p._id}`),
            name:
              p?.providerProfile?.businessName ||
              p?.profile?.firstName ||
              t('seo.routes.providerProfile.fallbackName'),
          })),
        }
      : null,
    faqEntries.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqEntries.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <Seo
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        image={ogImage}
        type="website"
        jsonLd={jsonLd}
        keywords={override?.keywords}
      />
      <main className="container mx-auto px-4 py-8 sm:py-10">
        <Breadcrumbs
          items={breadcrumbs}
          className="mb-6"
        />

        <header className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {heading}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl">
            {intro}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/mis-solicitudes/nueva"
              state={{ presetCategory: category }}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-white font-medium shadow-sm hover:bg-brand-600 transition-colors"
            >
              {t('seo.routes.categoryLanding.ctaCreateRequest')}
            </Link>
            <Link
              to="/unete"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('seo.routes.categoryLanding.ctaJoinProvider')}
            </Link>
          </div>
        </header>

        <section aria-label={t('seo.routes.categoryLanding.providersHeading')}>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
            {t('seo.routes.categoryLanding.providersHeading')}
          </h2>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gray-100 animate-pulse h-44"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {!loading && providers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-600 mb-4">
                {t('seo.routes.categoryLanding.empty')}
              </p>
              <Link
                to="/mis-solicitudes/nueva"
                state={{ presetCategory: category }}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-white font-medium hover:bg-brand-600 transition-colors"
              >
                {t('seo.routes.categoryLanding.ctaCreateRequest')}
              </Link>
            </div>
          )}

          {!loading && providers.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => {
                const businessName =
                  p?.providerProfile?.businessName ||
                  p?.profile?.firstName ||
                  t('seo.routes.providerProfile.fallbackName');
                const avg = p?.providerProfile?.rating?.average || 0;
                const count = p?.providerProfile?.rating?.count || 0;
                const desc =
                  p?.providerProfile?.description ||
                  p?.providerProfile?.businessDescription ||
                  '';
                return (
                  <li key={p._id}>
                    <Link
                      to={`/profesional/${p._id}`}
                      className="group block rounded-2xl border border-gray-200 bg-white p-4 hover:border-brand-300 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        {p?.profile?.avatar ? (
                          <img
                            src={p.profile.avatar}
                            alt={businessName}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-semibold">
                            {businessName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600">
                            {businessName}
                          </h3>
                          {count > 0 && (
                            <p className="text-sm text-gray-500">
                              ★ {avg.toFixed(1)} · {count}{' '}
                              {t('seo.routes.categoryLanding.reviewsLabel')}
                            </p>
                          )}
                        </div>
                      </div>
                      {desc && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                          {desc}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* FAQ section (Phase 8) — visible body copy that mirrors the FAQPage
            JSON-LD above. Renders only when an override bundle defines FAQs.
            Pure semantic markup (<details> / <summary>) so it works without
            JS, is accessible by default and does not pull any extra deps. */}
        {faqEntries.length > 0 && (
          <section
            aria-label={t('seo.routes.categoryLanding.faqHeading')}
            className="mt-12 max-w-3xl"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              {t('seo.routes.categoryLanding.faqHeading')}
            </h2>
            <ul className="space-y-3">
              {faqEntries.map((f, i) => (
                <li key={i}>
                  <details className="group rounded-2xl border border-gray-200 bg-white open:border-brand-300 open:shadow-sm transition">
                    <summary className="cursor-pointer list-none p-4 sm:p-5 flex items-start justify-between gap-3">
                      <span className="font-medium text-gray-900">{f.q}</span>
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1 text-gray-700 leading-relaxed">
                      {f.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

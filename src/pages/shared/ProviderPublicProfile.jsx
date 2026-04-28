import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Seo from '@/components/seo/Seo.jsx';
import Breadcrumbs from '@/components/seo/Breadcrumbs.jsx';
import { slugifyCategory } from '@/utils/categories';
import { buildCanonical } from '@/components/seo/seoConfig.js';

/**
 * Public, indexable provider profile.
 *
 *  • URL pattern: /profesional/:id
 *  • Backed by the existing public guest endpoint (`/guest/providers/:id`)
 *    so this page is purely additive — it doesn't introduce new server-side
 *    surface, doesn't expose private data and doesn't change any existing
 *    flow. Logged-in users still see the modal-based view on Home; this
 *    page just adds a deep-linkable, crawler-friendly mirror.
 *  • SEO: emits ProfilePage + Person + LocalBusiness (with AggregateRating
 *    when reviews exist) JSON-LD, plus a localized <Seo /> with the provider
 *    name and biz description.
 */
export default function ProviderPublicProfile() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [provider, setProvider] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | not-found | error

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setStatus('loading');
    api
      .get(`/guest/providers/${id}`)
      .then((res) => {
        if (!alive) return;
        const p = res?.data?.data?.provider || null;
        if (!p) {
          setStatus('not-found');
        } else {
          setProvider(p);
          setStatus('ok');
        }
      })
      .catch((err) => {
        if (!alive) return;
        if (err?.response?.status === 404) setStatus('not-found');
        else setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const lang = (i18n.language || 'es').toLowerCase().split('-')[0];

  const businessName = useMemo(() => {
    if (!provider) return '';
    return (
      provider?.providerProfile?.businessName ||
      provider?.profile?.firstName ||
      t('seo.routes.providerProfile.fallbackName')
    );
  }, [provider, t]);

  const description = useMemo(() => {
    if (!provider) return '';
    const raw =
      provider?.providerProfile?.businessDescription ||
      provider?.providerProfile?.description ||
      '';
    return raw.length > 240 ? `${raw.slice(0, 237)}…` : raw;
  }, [provider]);

  // ─── Loading & error states ────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <Seo titleKey="seo.routes.providerProfile.loading" noindex />
        <main className="container mx-auto px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-44 w-full bg-gray-100 rounded-2xl" />
          </div>
        </main>
      </>
    );
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <>
        <Seo
          titleKey="seo.routes.providerProfile.notFoundTitle"
          descriptionKey="seo.routes.providerProfile.notFoundDescription"
          noindex
        />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">
            {t('seo.routes.providerProfile.notFoundTitle')}
          </h1>
          <p className="text-gray-500 mb-6">
            {t('seo.routes.providerProfile.notFoundDescription')}
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

  // ─── Successful render ────────────────────────────────────────────────
  const services = provider?.providerProfile?.services || [];
  const portfolio = (provider?.providerProfile?.portfolio || []).filter(
    (it) => it?.url && it?.type === 'image',
  );
  const ratingAvg = provider?.providerProfile?.rating?.average || 0;
  const ratingCount = provider?.providerProfile?.rating?.count || 0;
  const primaryCategory = services?.[0]?.category || null;
  const reviews = provider?.recentReviews || [];

  const canonicalPath = `/profesional/${id}`;
  const title = t('seo.routes.providerProfile.title', {
    name: businessName,
    category: primaryCategory || t('seo.routes.providerProfile.genericCategory'),
  });
  const metaDescription =
    description ||
    t('seo.routes.providerProfile.fallbackDescription', { name: businessName });

  const breadcrumbs = [
    { labelKey: 'seo.breadcrumbs.home', path: '/' },
    primaryCategory
      ? {
          label: primaryCategory,
          path: `/categorias/${slugifyCategory(primaryCategory)}`,
        }
      : null,
    { label: businessName, path: canonicalPath },
  ].filter(Boolean);

  // Schema.org: ProfilePage wraps a Person node; LocalBusiness conveys the
  // service area + ratings for rich-results eligibility. Avoid emitting
  // AggregateRating when there are zero reviews (Google flags it as spam).
  const aggregateRating =
    ratingCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(ratingAvg.toFixed(2)),
          reviewCount: ratingCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: buildCanonical(canonicalPath),
      inLanguage: lang,
      mainEntity: {
        '@type': 'LocalBusiness',
        name: businessName,
        description: metaDescription,
        url: buildCanonical(canonicalPath),
        image: provider?.profile?.avatar || undefined,
        ...(aggregateRating ? { aggregateRating } : {}),
        ...(primaryCategory
          ? { areaServed: provider?.providerProfile?.serviceArea?.zones || undefined }
          : {}),
        ...(services.length
          ? {
              makesOffer: services.map((s) => ({
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: s?.name || s?.category,
                  category: s?.category,
                },
              })),
            }
          : {}),
      },
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
  ];

  return (
    <>
      <Seo
        title={title}
        description={metaDescription}
        canonicalPath={canonicalPath}
        image={provider?.profile?.avatar}
        type="profile"
        jsonLd={jsonLd}
      />
      <main className="container mx-auto px-4 py-8 sm:py-10">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
          {provider?.profile?.avatar ? (
            <img
              src={provider.profile.avatar}
              alt={businessName}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-3xl font-bold">
              {businessName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {businessName}
            </h1>
            {primaryCategory && (
              <p className="mt-1 text-sm sm:text-base text-gray-500">
                {primaryCategory}
              </p>
            )}
            {ratingCount > 0 && (
              <p className="mt-2 text-sm text-gray-700">
                <span className="text-amber-500">★</span>{' '}
                <strong>{ratingAvg.toFixed(1)}</strong>{' '}
                <span className="text-gray-500">
                  · {ratingCount}{' '}
                  {t('seo.routes.categoryLanding.reviewsLabel')}
                </span>
              </p>
            )}
          </div>
        </header>

        {description && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('seo.routes.providerProfile.aboutHeading')}
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </section>
        )}

        {services.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t('seo.routes.providerProfile.servicesHeading')}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {services.map((s, i) => (
                <li key={i}>
                  <Link
                    to={`/categorias/${slugifyCategory(s.category)}`}
                    className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-sm hover:bg-brand-100 transition-colors"
                  >
                    {s.category}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {portfolio.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t('seo.routes.providerProfile.portfolioHeading')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {portfolio.slice(0, 8).map((item, i) => (
                <img
                  key={i}
                  src={item.url}
                  alt={item.caption || `${businessName} – ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover rounded-xl bg-gray-100"
                />
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t('seo.routes.providerProfile.reviewsHeading')}
            </h2>
            <ul className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <li
                  key={r._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <p className="text-sm text-amber-500">
                    {'★'.repeat(Math.round(r?.rating?.overall || 0))}
                  </p>
                  {r?.review?.title && (
                    <p className="font-medium text-gray-900 mt-1">
                      {r.review.title}
                    </p>
                  )}
                  {r?.review?.comment && (
                    <p className="text-gray-700 mt-1 line-clamp-4">
                      {r.review.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-2xl bg-linear-to-br from-brand-50 to-white border border-brand-100 p-5 sm:p-6 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {t('seo.routes.providerProfile.ctaHeading', { name: businessName })}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('seo.routes.providerProfile.ctaSubtitle')}
          </p>
          <Link
            to="/mis-solicitudes/nueva"
            state={{ presetCategory: primaryCategory }}
            className="inline-flex mt-4 items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            {t('seo.routes.categoryLanding.ctaCreateRequest')}
          </Link>
        </section>
      </main>
    </>
  );
}

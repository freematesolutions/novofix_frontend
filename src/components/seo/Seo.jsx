import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  SUPPORTED_LANGS,
  SITE_CITY,
  SITE_REGION,
  SITE_COUNTRY,
  normalizeLang,
  buildCanonical,
} from './seoConfig.js';
import JsonLd from './JsonLd.jsx';

/**
 * Reusable SEO component. Renders <title>, meta description,
 * Open Graph, Twitter Card, canonical, hreflang and (optionally) JSON-LD.
 *
 * All textual props can be passed either as a literal string OR as an i18n key
 * (when prefixed with `seo.` it will be auto-translated). For maximum control,
 * pass already-translated strings via `title` / `description`.
 *
 * Props:
 *  - title: string (final, already translated). Falls back to t(titleKey).
 *  - titleKey: i18n key for title.
 *  - description / descriptionKey: same pattern.
 *  - image: absolute or root-relative URL for OG/Twitter image.
 *  - canonicalPath: explicit path (defaults to current location.pathname).
 *  - noindex: boolean, sets robots to "noindex,nofollow".
 *  - type: OG type ("website" | "article" | "profile" | "product"). Default "website".
 *  - jsonLd: object | object[] to inject as Schema.org JSON-LD.
 *  - keywords: optional comma-separated string (use sparingly; low SEO value).
 *  - locale: override the locale (defaults to current i18n language).
 */
export default function Seo({
  title,
  titleKey,
  description,
  descriptionKey,
  image,
  canonicalPath,
  noindex = false,
  type = 'website',
  jsonLd,
  keywords,
  locale,
}) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  const lang = normalizeLang(locale || i18n.language);
  const ogLocale = lang === 'es' ? 'es_ES' : 'en_US';

  const resolvedTitle = title || (titleKey ? t(titleKey) : SITE_NAME);
  const fullTitle = resolvedTitle.includes(SITE_NAME)
    ? resolvedTitle
    : `${resolvedTitle} | ${SITE_NAME}`;

  const resolvedDescription =
    description || (descriptionKey ? t(descriptionKey) : '');

  const resolvedImage = useMemo(() => {
    if (!image) return DEFAULT_OG_IMAGE;
    if (/^https?:\/\//i.test(image)) return image;
    return `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
  }, [image]);

  const path = canonicalPath || pathname || '/';
  const canonical = buildCanonical(path);

  return (
    <>
      <Helmet>
        {/* Sync <html lang> so screen readers and crawlers see the active locale */}
        <html lang={lang} />
        <title>{fullTitle}</title>
        {resolvedDescription && (
          <meta name="description" content={resolvedDescription} />
        )}
        {keywords && <meta name="keywords" content={keywords} />}
        <meta
          name="robots"
          content={noindex ? 'noindex,nofollow' : 'index,follow'}
        />

        {/* Geo signals (Phase 8) — help search engines associate the site with
            its primary service market (Miami, FL by default). Configurable via
            VITE_SITE_CITY / VITE_SITE_REGION / VITE_SITE_COUNTRY at build. */}
        {SITE_CITY && SITE_REGION && (
          <meta name="geo.region" content={`${SITE_COUNTRY}-${SITE_REGION}`} />
        )}
        {SITE_CITY && <meta name="geo.placename" content={SITE_CITY} />}

        {/* Canonical */}
        <link rel="canonical" href={canonical} />

        {/* hreflang for ES/EN + x-default */}
        {SUPPORTED_LANGS.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`${buildCanonical(path)}?lng=${l}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={canonical} />

        {/* Open Graph */}
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content={type} />
        <meta property="og:title" content={resolvedTitle} />
        {resolvedDescription && (
          <meta property="og:description" content={resolvedDescription} />
        )}
        <meta property="og:url" content={canonical} />
        <meta property="og:locale" content={ogLocale} />
        {SUPPORTED_LANGS.filter((l) => l !== lang).map((l) => (
          <meta
            key={l}
            property="og:locale:alternate"
            content={l === 'es' ? 'es_ES' : 'en_US'}
          />
        ))}
        <meta property="og:image" content={resolvedImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={resolvedTitle} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={resolvedTitle} />
        {resolvedDescription && (
          <meta name="twitter:description" content={resolvedDescription} />
        )}
        <meta name="twitter:image" content={resolvedImage} />
        {TWITTER_HANDLE && (
          <meta name="twitter:site" content={TWITTER_HANDLE} />
        )}
      </Helmet>
      {jsonLd && <JsonLd data={jsonLd} />}
    </>
  );
}

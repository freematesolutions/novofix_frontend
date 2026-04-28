import { useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from './Seo.jsx';
import { ROUTE_SEO_CONFIG, ROUTE_SEO_FALLBACK } from './routeSeoConfig.js';
import { buildCanonical } from './seoConfig.js';

/**
 * Find the first config entry whose `pattern` matches the current path.
 * Order in `ROUTE_SEO_CONFIG` matters (more specific first).
 */
function findRouteConfig(pathname) {
  for (const entry of ROUTE_SEO_CONFIG) {
    // matchPath supports dynamic segments like ":id"
    if (matchPath({ path: entry.pattern, end: true }, pathname)) {
      return entry;
    }
  }
  return null;
}

/**
 * Build a Schema.org BreadcrumbList JSON-LD from a breadcrumbs config array.
 */
function buildBreadcrumbList(breadcrumbs, t) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: t(b.labelKey),
      item: buildCanonical(b.path),
    })),
  };
}

/**
 * Auto-applies SEO metadata for the current route based on ROUTE_SEO_CONFIG.
 * Mount once in the App tree (after <Routes> mount). Pages that need page-
 * specific SEO (with dynamic data) can render their own <Seo /> which will
 * override these defaults.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const config = useMemo(() => findRouteConfig(pathname) || ROUTE_SEO_FALLBACK, [pathname]);

  if (config.skip) return null;

  const jsonLd = buildBreadcrumbList(config.breadcrumbs, t);

  return (
    <Seo
      titleKey={config.titleKey}
      descriptionKey={config.descriptionKey}
      noindex={!!config.noindex}
      type={config.type || 'website'}
      jsonLd={jsonLd || undefined}
    />
  );
}

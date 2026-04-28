/**
 * Central SEO configuration for NovoFix.
 * All values can be overridden via environment variables (VITE_*).
 *
 * IMPORTANT: VITE_SITE_URL must be the canonical PUBLIC origin where the SPA
 * is served (e.g. https://novofix.com). Do NOT include a trailing slash.
 */

const rawSite = (import.meta.env.VITE_SITE_URL || 'https://novofix.com').trim();
export const SITE_URL = rawSite.replace(/\/$/, '');

export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'NovoFix';

/** Default Open Graph / Twitter image (1200x630). Lives under /public. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

/** Twitter handle (with @). Optional. */
export const TWITTER_HANDLE = import.meta.env.VITE_TWITTER_HANDLE || '';

/** Languages supported by the app, mapped to their hreflang codes. */
export const SUPPORTED_LANGS = ['es', 'en'];

/** Convert an i18next language code (e.g. "es-ES") to the supported short code. */
export function normalizeLang(lng) {
  if (!lng) return 'es';
  const short = String(lng).toLowerCase().split('-')[0];
  return SUPPORTED_LANGS.includes(short) ? short : 'es';
}

/** Build an absolute canonical URL from a path (always starts with "/"). */
export function buildCanonical(path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean === '/' ? '' : clean}`;
}

// ─── Geo / local-SEO configuration (Phase 8) ──────────────────────────────────
// All values are configurable via VITE_* env vars so a single deployment can
// be re-targeted to a different metro area without code changes. Defaults are
// tuned for the initial NovoFix launch in Miami, FL (US).

export const SITE_CITY    = (import.meta.env.VITE_SITE_CITY    || 'Miami').trim();
export const SITE_REGION  = (import.meta.env.VITE_SITE_REGION  || 'FL').trim();
export const SITE_COUNTRY = (import.meta.env.VITE_SITE_COUNTRY || 'US').trim();

/**
 * Comma-separated list of metro counties / sub-regions served. Renders into
 * Schema.org `areaServed`. Override via VITE_SITE_AREAS to extend coverage.
 */
export const SITE_AREAS = (
  import.meta.env.VITE_SITE_AREAS ||
  'Miami-Dade County, Broward County, Palm Beach County'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Telephone in E.164 format. Optional but recommended for LocalBusiness. */
export const SITE_PHONE = (import.meta.env.VITE_SITE_PHONE || '').trim();

/** Public contact email. Optional. */
export const SITE_EMAIL = (import.meta.env.VITE_SITE_EMAIL || '').trim();

/** Human-readable region label, e.g. "Miami, FL". */
export const SITE_REGION_LABEL = `${SITE_CITY}, ${SITE_REGION}`;

/**
 * Build the Schema.org `LocalBusiness` node that anchors every page of the
 * SPA to the geographic market we want to rank in. Emitted globally on the
 * Home page and referenced (via @id) from sub-pages so Google understands
 * they belong to the same entity.
 */
export function buildLocalBusinessSchema() {
  const node = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    logo: `${SITE_URL}/novofix-logo.svg`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_CITY,
      addressRegion: SITE_REGION,
      addressCountry: SITE_COUNTRY,
    },
    areaServed: SITE_AREAS.map((name) => ({ '@type': 'AdministrativeArea', name })),
    priceRange: '$$',
  };
  if (SITE_PHONE) node.telephone = SITE_PHONE;
  if (SITE_EMAIL) node.email = SITE_EMAIL;
  return node;
}


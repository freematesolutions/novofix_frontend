/**
 * Route-level SEO configuration for NovoFix.
 *
 * Each entry maps a route pattern (the same one used by react-router) to its
 * default SEO metadata. When a user lands on a matching path, <RouteSeo />
 * renders <Seo /> with these defaults. Pages that need dynamic data (e.g.
 * provider profile, request detail) can still render their own <Seo /> which,
 * thanks to react-helmet-async's "last-wins" behavior, will override these
 * defaults at runtime.
 *
 * Conventions:
 *  - `pattern`     : route pattern compatible with react-router `matchPath`.
 *  - `titleKey`    : i18n key for the page title (under `seo.routes.*`).
 *  - `descriptionKey`: i18n key for the meta description.
 *  - `noindex`     : true → emits `<meta name="robots" content="noindex,nofollow">`.
 *  - `type`        : Open Graph type. Defaults to "website".
 *  - `breadcrumbs` : array of `{ labelKey, path }` used to:
 *                      1. emit a `BreadcrumbList` JSON-LD block, and
 *                      2. render the visible <Breadcrumbs /> component when present.
 *  - `skip`        : if true, RouteSeo renders nothing (page provides its own).
 *
 * Order matters: more specific patterns must come BEFORE generic ones.
 */

export const ROUTE_SEO_CONFIG = [
  // ───────── Public landing ─────────
  {
    pattern: '/',
    // Home renders its own inline <Seo /> with custom JSON-LD (Organization+WebSite).
    // We skip the route-level default to avoid duplicated meta tags.
    skip: true,
  },

  // ───────── Public, indexable pages ─────────
  {
    pattern: '/sobre-nosotros',
    titleKey: 'seo.routes.about.title',
    descriptionKey: 'seo.routes.about.description',
    type: 'website',
    breadcrumbs: [
      { labelKey: 'seo.breadcrumbs.home', path: '/' },
      { labelKey: 'seo.breadcrumbs.about', path: '/sobre-nosotros' },
    ],
  },
  {
    pattern: '/terminos',
    titleKey: 'seo.routes.terms.title',
    descriptionKey: 'seo.routes.terms.description',
    type: 'website',
    breadcrumbs: [
      { labelKey: 'seo.breadcrumbs.home', path: '/' },
      { labelKey: 'seo.breadcrumbs.legal', path: '/terminos' },
      { labelKey: 'seo.breadcrumbs.terms', path: '/terminos' },
    ],
  },
  {
    pattern: '/privacidad',
    titleKey: 'seo.routes.privacy.title',
    descriptionKey: 'seo.routes.privacy.description',
    type: 'website',
    breadcrumbs: [
      { labelKey: 'seo.breadcrumbs.home', path: '/' },
      { labelKey: 'seo.breadcrumbs.legal', path: '/privacidad' },
      { labelKey: 'seo.breadcrumbs.privacy', path: '/privacidad' },
    ],
  },
  {
    // Marketing landing for providers (acquisition page) → indexable
    pattern: '/unete',
    titleKey: 'seo.routes.joinProvider.title',
    descriptionKey: 'seo.routes.joinProvider.description',
    type: 'website',
    breadcrumbs: [
      { labelKey: 'seo.breadcrumbs.home', path: '/' },
      { labelKey: 'seo.breadcrumbs.joinProvider', path: '/unete' },
    ],
  },

  // Phase 6: dynamic public landings render their own <Seo /> (built from
  // category / provider data), so we mark them as `skip` here to let the
  // page-level SEO win without duplicate <head> tags.
  { pattern: '/categorias/:slug', skip: true },
  { pattern: '/profesional/:id', skip: true },

  // ───────── Auth pages (no SEO value, prevent indexation) ─────────
  { pattern: '/login', titleKey: 'seo.routes.login.title', descriptionKey: 'seo.routes.login.description', noindex: true },
  { pattern: '/registrarse', titleKey: 'seo.routes.registerClient.title', descriptionKey: 'seo.routes.registerClient.description', noindex: true },
  { pattern: '/registro-proveedor', titleKey: 'seo.routes.joinProvider.title', descriptionKey: 'seo.routes.joinProvider.description', noindex: true },
  { pattern: '/olvide-contrasena', titleKey: 'seo.routes.forgotPassword.title', descriptionKey: 'seo.routes.forgotPassword.description', noindex: true },
  { pattern: '/restablecer-contrasena', titleKey: 'seo.routes.resetPassword.title', descriptionKey: 'seo.routes.resetPassword.description', noindex: true },
  { pattern: '/verificar-email', titleKey: 'seo.routes.verifyEmail.title', descriptionKey: 'seo.routes.verifyEmail.description', noindex: true },

  // ───────── Provider area (private, noindex) ─────────
  { pattern: '/provider/onboarding', titleKey: 'seo.routes.onboarding.title', descriptionKey: 'seo.routes.onboarding.description', noindex: true },
  { pattern: '/servicios', titleKey: 'seo.routes.services.title', descriptionKey: 'seo.routes.services.description', noindex: true },
  { pattern: '/empleos/:id', titleKey: 'seo.routes.jobDetail.title', descriptionKey: 'seo.routes.jobDetail.description', noindex: true },
  { pattern: '/empleos', titleKey: 'seo.routes.jobs.title', descriptionKey: 'seo.routes.jobs.description', noindex: true },
  { pattern: '/mensajes', titleKey: 'seo.routes.inbox.title', descriptionKey: 'seo.routes.inbox.description', noindex: true },
  { pattern: '/portafolio', titleKey: 'seo.routes.portfolio.title', descriptionKey: 'seo.routes.portfolio.description', noindex: true },
  { pattern: '/resenas', titleKey: 'seo.routes.providerReviews.title', descriptionKey: 'seo.routes.providerReviews.description', noindex: true },
  { pattern: '/calendario', titleKey: 'seo.routes.calendar.title', descriptionKey: 'seo.routes.calendar.description', noindex: true },
  { pattern: '/referidos', titleKey: 'seo.routes.referrals.title', descriptionKey: 'seo.routes.referrals.description', noindex: true },
  { pattern: '/plan', titleKey: 'seo.routes.plan.title', descriptionKey: 'seo.routes.plan.description', noindex: true },
  { pattern: '/perfil', titleKey: 'seo.routes.profile.title', descriptionKey: 'seo.routes.profile.description', noindex: true },

  // ───────── Client area (private, noindex) ─────────
  { pattern: '/mis-solicitudes/nueva', titleKey: 'seo.routes.createRequest.title', descriptionKey: 'seo.routes.createRequest.description', noindex: true },
  { pattern: '/mis-solicitudes/:id/propuestas', titleKey: 'seo.routes.requestProposals.title', descriptionKey: 'seo.routes.requestProposals.description', noindex: true },
  { pattern: '/mis-solicitudes', titleKey: 'seo.routes.myRequests.title', descriptionKey: 'seo.routes.myRequests.description', noindex: true },
  { pattern: '/mis-mensajes', titleKey: 'seo.routes.clientMessages.title', descriptionKey: 'seo.routes.clientMessages.description', noindex: true },
  { pattern: '/mis-resenas', titleKey: 'seo.routes.myReviews.title', descriptionKey: 'seo.routes.myReviews.description', noindex: true },

  // ───────── Shared private ─────────
  { pattern: '/reservas', titleKey: 'seo.routes.bookings.title', descriptionKey: 'seo.routes.bookings.description', noindex: true },
  { pattern: '/notificaciones', titleKey: 'seo.routes.notifications.title', descriptionKey: 'seo.routes.notifications.description', noindex: true },
  { pattern: '/payment/:intentId', titleKey: 'seo.routes.payment.title', descriptionKey: 'seo.routes.payment.description', noindex: true },

  // ───────── Admin (always noindex) ─────────
  { pattern: '/admin/usuarios', titleKey: 'seo.routes.adminUsers.title', descriptionKey: 'seo.routes.adminUsers.description', noindex: true },
  { pattern: '/admin/moderacion', titleKey: 'seo.routes.adminModeration.title', descriptionKey: 'seo.routes.adminModeration.description', noindex: true },
  { pattern: '/admin/alertas', titleKey: 'seo.routes.adminAlerts.title', descriptionKey: 'seo.routes.adminAlerts.description', noindex: true },
  { pattern: '/admin/solicitudes', titleKey: 'seo.routes.adminRequests.title', descriptionKey: 'seo.routes.adminRequests.description', noindex: true },
  { pattern: '/admin/reservas', titleKey: 'seo.routes.adminBookings.title', descriptionKey: 'seo.routes.adminBookings.description', noindex: true },
  { pattern: '/admin/reportes', titleKey: 'seo.routes.adminReports.title', descriptionKey: 'seo.routes.adminReports.description', noindex: true },
  { pattern: '/admin', titleKey: 'seo.routes.adminDashboard.title', descriptionKey: 'seo.routes.adminDashboard.description', noindex: true },
];

/**
 * Default fallback when no route matches: be safe and noindex unknown URLs.
 * (The catch-all redirect in Vercel sends every unknown URL to "/", but during
 * dev or with stale links we still want to avoid leaking duplicates to crawlers.)
 */
export const ROUTE_SEO_FALLBACK = {
  titleKey: 'seo.defaultTitle',
  descriptionKey: 'seo.defaultDescription',
  noindex: true,
};

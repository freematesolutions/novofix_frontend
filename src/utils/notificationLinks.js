/**
 * Infer the best navigation URL for a notification.
 * Uses the explicit actionUrl from the notification data when available,
 * otherwise infers a sensible destination from the notification type.
 *
 * @param {Object} n - Notification object (from API or socket payload)
 * @param {Object} [opts] - Optional context
 * @param {string} [opts.viewRole] - 'provider' | 'client' | 'admin' | 'guest' — used to choose role-specific routes for ambiguous types (e.g. NEW_MESSAGE).
 * @returns {string|null} The URL to navigate to, or null if none could be determined.
 */
export function getNotificationActionUrl(n, opts = {}) {
  if (!n) return null;
  const viewRole = opts.viewRole || '';

  let raw = n?.data?.actionUrl;

  // Special case: INVOICE_RECEIVED should always deep-link to the invoice viewer
  // even when actionUrl is already set (server stores a generic '/reservas' as actionUrl)
  const type = (n.type || '').toUpperCase();
  if (type === 'INVOICE_RECEIVED') {
    const bookingId = n?.data?.bookingId;
    raw = bookingId ? `/reservas?openInvoice=${bookingId}` : '/reservas';
  }

  // Role-aware override for NEW_MESSAGE even when server provided an actionUrl:
  // server emits '/mensajes?chat=...' for providers and '/mis-mensajes?chat=...' for clients,
  // but a user may switch viewRole after the notification was generated. Normalize here.
  if (type === 'NEW_MESSAGE' && viewRole) {
    const chatId = n?.data?.chatId;
    const basePath = viewRole === 'provider' ? '/mensajes' : '/mis-mensajes';
    raw = chatId ? `${basePath}?chat=${chatId}` : basePath;
  }

  // If actionUrl is missing or just points to the notifications page itself, infer from type
  if (!raw || raw === '/notificaciones') {

    if (
      [
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'BOOKING_STATUS_UPDATE',
        'REVIEW_REQUEST',
        'NEW_REVIEW',
        'NEW_CLIENT_REVIEW',
        'SERVICE_EVIDENCE_UPLOADED',
        'REVIEW_RESPONSE',
        'REVIEW_RESPONSE_UPDATED',
        'REVIEW_RESPONSE_REMOVED',
        'PROPOSAL_ACCEPTED',
        'INVOICE_VIEWED',
      ].includes(type)
    ) {
      raw = '/reservas';
    } else if (['NEW_BOOKING_SCHEDULED', 'BOOKING_REMINDER'].includes(type)) {
      raw = '/calendario';
    } else if (['PAYMENT_REQUIRED', 'PAYMENT_RECEIVED'].includes(type)) {
      // No existe /pagos como ruta; los pagos están atados a reservas/facturas.
      const bookingId = n?.data?.bookingId;
      raw = bookingId ? `/reservas?openInvoice=${bookingId}` : '/reservas';
    } else if (type === 'NEW_PROPOSAL') {
      raw = n?.data?.requestId
        ? `/mis-solicitudes/${n.data.requestId}/propuestas`
        : '/mis-solicitudes';
    } else if (type === 'NEW_REQUEST') {
      raw = n?.data?.serviceRequestId
        ? `/empleos/${n.data.serviceRequestId}`
        : '/empleos';
    } else if (type === 'REQUEST_UPDATED') {
      raw = n?.data?.serviceRequestId
        ? `/empleos/${n.data.serviceRequestId}`
        : '/empleos';
    } else if (
      ['ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED'].includes(type)
    ) {
      raw = '/perfil';
    } else if (
      ['SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_DOWNGRADED', 'REFERRAL_BONUS_EXPIRED'].includes(type)
    ) {
      raw = '/plan';
    } else if (type === 'REFERRAL_BONUS') {
      raw = '/referidos';
    } else if (['REVIEW_MILESTONE_FIRST', 'REVIEW_MILESTONE_THREE'].includes(type)) {
      raw = '/reservas';
    } else if (type === 'REVIEW_NUDGE') {
      raw = '/reservas';
    } else if (type === 'REVIEW_RESPONSE_NUDGE') {
      raw = '/resenas';
    } else if (type === 'NEW_MESSAGE') {
      // Fallback cuando no se conoce viewRole: provider por defecto (cliente recibirá override en código que sí sabe el rol).
      const chatId = n?.data?.chatId;
      const basePath = viewRole === 'client' ? '/mis-mensajes' : '/mensajes';
      raw = chatId ? `${basePath}?chat=${chatId}` : basePath;
    } else if (
      ['WELCOME_PROVIDER', 'WELCOME_CLIENT', 'WELCOME_ADMIN'].includes(type)
    ) {
      raw = '/perfil';
    }
  }

  if (!raw || raw === '/notificaciones') return null;

  // Normalize provider onboarding deep-links to the profile section
  if (raw.includes('/provider/onboarding')) {
    return '/perfil?section=provider-setup';
  }

  return raw;
}

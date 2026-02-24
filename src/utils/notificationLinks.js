/**
 * Infer the best navigation URL for a notification.
 * Uses the explicit actionUrl from the notification data when available,
 * otherwise infers a sensible destination from the notification type.
 *
 * @param {Object} n - Notification object (from API or socket payload)
 * @returns {string|null} The URL to navigate to, or null if none could be determined.
 */
export function getNotificationActionUrl(n) {
  if (!n) return null;

  let raw = n?.data?.actionUrl;

  // If actionUrl is missing or just points to the notifications page itself, infer from type
  if (!raw || raw === '/notificaciones') {
    const type = (n.type || '').toUpperCase();

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
      ].includes(type)
    ) {
      raw = '/reservas';
    } else if (['PAYMENT_REQUIRED', 'PAYMENT_RECEIVED'].includes(type)) {
      raw = '/pagos';
    } else if (type === 'NEW_PROPOSAL') {
      raw = n?.data?.requestId
        ? `/mis-solicitudes/${n.data.requestId}/propuestas`
        : '/mis-solicitudes';
    } else if (type === 'NEW_REQUEST') {
      raw = n?.data?.serviceRequestId
        ? `/empleos/${n.data.serviceRequestId}`
        : '/empleos';
    } else if (
      ['ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED'].includes(type)
    ) {
      raw = '/perfil';
    } else if (type === 'NEW_MESSAGE') {
      raw = n?.data?.chatId
        ? `/mensajes?chat=${n.data.chatId}`
        : '/mensajes';
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

// utils/chatParticipants.js
//
// Helper único y resiliente para resolver el "nombre visible" de un participante
// en cualquier conversación de chat. Antes de este helper, las páginas
// `client/Messages.jsx`, `provider/Inbox.jsx` y `components/ui/ChatRoom.jsx`
// duplicaban una lógica frágil que terminaba mostrando literalmente "Chat" o
// "Proveedor" cuando el populate del backend no traía nombre, lo que volvía
// imposible distinguir 3+ conversaciones (bug reportado por el empleador).
//
// La estrategia es una cascada robusta de fallbacks:
//   1. Nombre comercial (providerProfile.businessName) — solo si el OTRO es profesional.
//   2. Nombre + apellido (profile.firstName + lastName).
//   3. Solo firstName.
//   4. Parte local del email (capitalizada) — siempre que el populate haya traído `email`.
//   5. Título de la reserva/solicitud asociada (basicInfo.title).
//   6. Sufijo identificable derivado del _id (#abcd) para que NUNCA quede igual a otro.
//
// Nunca debe devolver simplemente "Chat" o "Proveedor": cuando no hay datos
// reales, devolvemos `t('chat.unnamedClient'|'unnamedProvider', { tag })` que
// muestra algo como "Cliente · #a1b2" y permite diferenciar visualmente.

/**
 * Capitaliza la primera letra de cada palabra separada por punto, guion o espacio.
 * Útil para emails tipo "juan.perez" → "Juan Perez".
 */
function prettifyEmailLocal(local) {
  if (!local) return '';
  return String(local)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Devuelve un "tag" corto (#a1b2) derivado de un Mongo ObjectId u otro string,
 * para diferenciar visualmente conversaciones sin nombre legible.
 */
function shortIdTag(value) {
  if (!value) return '';
  const s = String(value);
  return s.length >= 4 ? `#${s.slice(-4)}` : `#${s}`;
}

/**
 * Construye un nombre completo a partir de un objeto `profile`.
 */
function fullNameFromProfile(profile) {
  if (!profile) return '';
  const first = (profile.firstName || '').trim();
  const last = (profile.lastName || '').trim();
  const composed = `${first} ${last}`.trim();
  return composed;
}

/**
 * Devuelve el primer string no vacío.
 */
function firstNonEmpty(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

/**
 * Resuelve el nombre visible del OTRO participante de una conversación.
 *
 * @param {object} chat — Documento de chat/conversación (con `participants.client`
 *                        y `participants.provider` populados — `getUserChats` y
 *                        `getOrCreateInquiryChat` los traen así).
 * @param {object} opts
 * @param {'client'|'provider'} opts.viewRole — Rol del usuario actual (lo que estoy viendo).
 * @param {string|object} [opts.currentUserId] — ID del usuario actual (para detectar el "otro"
 *                                                cuando viewRole no se conoce, p. ej. en multirol).
 * @param {(key: string, options?: any) => string} [opts.t] — Función i18n (opcional).
 * @returns {string}
 */
export function getChatParticipantName(chat, opts = {}) {
  const { viewRole, currentUserId, t } = opts;
  if (!chat) return t ? t('chat.unnamedChat', 'Conversación') : 'Conversación';

  const tt = (key, defaultValue, params) =>
    typeof t === 'function' ? t(key, { defaultValue, ...(params || {}) }) : defaultValue;

  const client = chat.participants?.client || null;
  const provider = chat.participants?.provider || null;

  // Determinar quién es "el otro" participante.
  // Prioridad 1: viewRole explícito.
  // Prioridad 2: currentUserId vs participants.
  let other = null;
  let otherKind = null; // 'client' | 'provider'

  if (viewRole === 'client') {
    other = provider;
    otherKind = 'provider';
  } else if (viewRole === 'provider') {
    other = client;
    otherKind = 'client';
  } else if (currentUserId) {
    const uid = String(currentUserId);
    const clientId = client && String(client._id || client);
    const providerId = provider && String(provider._id || provider);
    if (clientId && clientId === uid) {
      other = provider;
      otherKind = 'provider';
    } else if (providerId && providerId === uid) {
      other = client;
      otherKind = 'client';
    }
  }

  // Si no pudimos determinar, intentar provider (más informativo) y caer a client.
  if (!other) {
    other = provider || client;
    otherKind = provider ? 'provider' : 'client';
  }

  // Cascada de fallbacks (ver comentario superior).
  const businessName =
    otherKind === 'provider' ? other?.providerProfile?.businessName : '';

  const fullName = fullNameFromProfile(other?.profile);
  const firstName = other?.profile?.firstName?.trim() || '';

  let emailPretty = '';
  if (other?.email && typeof other.email === 'string') {
    const local = other.email.split('@')[0];
    emailPretty = prettifyEmailLocal(local);
  }

  const bookingTitle =
    chat?.booking?.basicInfo?.title ||
    chat?.serviceRequest?.basicInfo?.title ||
    '';

  const resolved = firstNonEmpty(businessName, fullName, firstName, emailPretty, bookingTitle);
  if (resolved) return resolved;

  // Último recurso: etiqueta legible + sufijo corto del ID para diferenciar.
  const tag = shortIdTag(other?._id || chat?._id || chat?.conversationId);
  if (otherKind === 'provider') {
    return tt('chat.unnamedProvider', 'Profesional', { tag }) + (tag ? ` · ${tag}` : '');
  }
  return tt('chat.unnamedClient', 'Cliente', { tag }) + (tag ? ` · ${tag}` : '');
}

/**
 * Devuelve la inicial mayúscula para el avatar/letra de la card de chat.
 */
export function getChatParticipantInitial(chat, opts) {
  const name = getChatParticipantName(chat, opts);
  const ch = name.replace(/^#/, '').trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

export default getChatParticipantName;

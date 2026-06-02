// client/src/utils/selfHireGuard.js
//
// Helpers de UI para evitar que un usuario multirol (Cliente/Profesional)
// se autocontrate. El backend impone la validación final, pero la UI debe
// ocultar/inhabilitar los CTAs cuando el "proveedor" mostrado es el propio
// usuario autenticado.
//

/**
 * Normaliza cualquier referencia (string, ObjectId-like, objeto poblado) a string.
 * @param {*} value
 * @returns {string|null}
 */
export function toIdString(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }
  return null;
}

/**
 * ¿El proveedor mostrado es el propio usuario autenticado?
 *
 * @param {object|string|null} currentUser  Usuario actual (objeto con _id o string).
 * @param {object|string|null} provider     Proveedor a mostrar.
 * @returns {boolean}
 */
export function isSelfProvider(currentUser, provider) {
  const userId = toIdString(currentUser);
  const providerId = toIdString(provider);
  if (!userId || !providerId) return false;
  return userId === providerId;
}

/**
 * Filtra de una lista de proveedores al propio usuario autenticado.
 * Útil para construir selectores en CreateRequest u otros formularios.
 *
 * @param {Array<object>} providers
 * @param {object|string|null} currentUser
 * @returns {Array<object>}
 */
export function filterOutSelfProvider(providers, currentUser) {
  if (!Array.isArray(providers)) return [];
  const userId = toIdString(currentUser);
  if (!userId) return providers;
  return providers.filter((p) => toIdString(p) !== userId);
}

export default {
  toIdString,
  isSelfProvider,
  filterOutSelfProvider,
};

// utils/translations.js
// Helper para obtener campos traducidos de objetos que tienen traducciones persistentes

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';

/**
 * Obtiene el código de idioma actual (2 caracteres)
 * @returns {string} - 'es' o 'en'
 */
function getCurrentLang() {
  return i18n.language?.substring(0, 2) || 'es';
}

/**
 * Obtiene el texto traducido según el idioma proporcionado o el actual
 * @param {Object} translations - Objeto con traducciones { es: {...}, en: {...} }
 * @param {string} fieldName - Nombre del campo a obtener
 * @param {string} fallback - Valor fallback si no existe traducción
 * @param {string} [lang] - Idioma opcional (si no se pasa, usa el actual de i18n)
 * @returns {string} - Texto en el idioma solicitado o fallback
 */
export function getTranslatedField(translations, fieldName, fallback = '', lang = null) {
  if (!translations || typeof translations !== 'object') {
    return fallback;
  }

  const currentLang = lang || getCurrentLang();

  // Intentar obtener en el idioma actual
  if (translations[currentLang] && translations[currentLang][fieldName]) {
    return translations[currentLang][fieldName];
  }

  // Fallback al otro idioma
  const otherLang = currentLang === 'es' ? 'en' : 'es';
  if (translations[otherLang] && translations[otherLang][fieldName]) {
    return translations[otherLang][fieldName];
  }

  return fallback;
}

/**
 * Obtiene título y descripción traducidos de una solicitud de servicio
 * @param {Object} request - Objeto de solicitud con basicInfo
 * @param {string} [lang] - Idioma opcional
 * @returns {Object} - { title, description }
 */
export function getTranslatedRequestInfo(request, lang = null) {
  if (!request?.basicInfo) {
    return { title: '', description: '' };
  }

  const { title, description, translations } = request.basicInfo;

  return {
    title: getTranslatedField(translations, 'title', title || '', lang),
    description: getTranslatedField(translations, 'description', description || '', lang)
  };
}

/**
 * Obtiene mensaje traducido de una propuesta
 * @param {Object} proposal - Objeto de propuesta
 * @param {string} [lang] - Idioma opcional
 * @returns {string} - Mensaje traducido
 */
export function getTranslatedProposalMessage(proposal, lang = null) {
  if (!proposal) return '';

  return getTranslatedField(proposal.translations, 'message', proposal.message || '', lang);
}

/**
 * Obtiene título, comentario y respuesta del proveedor traducidos de una reseña
 * @param {Object} review - Objeto de reseña
 * @param {string} [lang] - Idioma opcional
 * @returns {Object} - { title, comment, providerResponseComment }
 */
export function getTranslatedReviewInfo(review, lang = null) {
  if (!review) {
    return { title: '', comment: '', providerResponseComment: '' };
  }

  const title = review.review?.title || '';
  const comment = review.review?.comment || '';
  const providerResponseComment = review.providerResponse?.comment || '';

  return {
    title: getTranslatedField(review.translations, 'title', title, lang),
    comment: getTranslatedField(review.translations, 'comment', comment, lang),
    providerResponseComment: getTranslatedField(review.translations, 'providerResponseComment', providerResponseComment, lang)
  };
}

// ============================================
// HOOKS REACTIVOS - Se actualizan automáticamente al cambiar idioma
// ============================================

/**
 * Hook que retorna el idioma actual y fuerza re-render al cambiar
 * @returns {string} - Código de idioma actual ('es' o 'en')
 */
export function useCurrentLanguage() {
  const { i18n } = useTranslation();
  return i18n.language?.substring(0, 2) || 'es';
}

/**
 * Hook para obtener info traducida de una solicitud (reactivo al cambio de idioma)
 * @param {Object} request - Objeto de solicitud
 * @returns {Object} - { title, description }
 */
export function useTranslatedRequestInfo(request) {
  const lang = useCurrentLanguage();
  return useMemo(() => getTranslatedRequestInfo(request, lang), [request, lang]);
}

/**
 * Hook para obtener mensaje traducido de propuesta (reactivo al cambio de idioma)
 * @param {Object} proposal - Objeto de propuesta
 * @returns {string} - Mensaje traducido
 */
export function useTranslatedProposalMessage(proposal) {
  const lang = useCurrentLanguage();
  return useMemo(() => getTranslatedProposalMessage(proposal, lang), [proposal, lang]);
}

/**
 * Hook para obtener info traducida de reseña (reactivo al cambio de idioma)
 * @param {Object} review - Objeto de reseña
 * @returns {Object} - { title, comment, providerResponseComment }
 */
export function useTranslatedReviewInfo(review) {
  const lang = useCurrentLanguage();
  return useMemo(() => getTranslatedReviewInfo(review, lang), [review, lang]);
}

export default {
  getTranslatedField,
  getTranslatedRequestInfo,
  getTranslatedProposalMessage,
  getTranslatedReviewInfo,
  useCurrentLanguage,
  useTranslatedRequestInfo,
  useTranslatedProposalMessage,
  useTranslatedReviewInfo
};

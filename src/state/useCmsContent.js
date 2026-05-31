// state/useCmsContent.js
//
// Hook para consumir contenidos editoriales servidos por el CMS.
//   - Llama a GET /content/:key?locale=xx
//   - Cachea en memoria por (key, locale) durante esta sesión del browser
//   - Si la API responde 4xx/5xx o devuelve { empty: true }, el consumidor
//     puede caer a sus claves i18n hardcoded (fallback transparente).
//
// Pensado para páginas tipo Términos / Privacidad / About / Hero, donde el
// admin puede sobreescribir cualquier sección desde el panel sin redeploy.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from './apiClient.js';

// Cache compartida entre instancias del hook (vive lo que viva la pestaña).
const memCache = new Map(); // `${key}::${locale}` -> payload

function cacheKey(key, locale) { return `${key}::${locale}`; }

/**
 * @param {string} contentKey  Una de: 'terms' | 'privacy' | 'about' | 'hero' | 'contact'
 * @param {object} [options]
 * @param {string} [options.localeOverride] Forzar locale (por defecto usa i18n).
 * @returns {{
 *   data: object|null,
 *   loading: boolean,
 *   error: Error|null,
 *   isCmsContent: boolean   // true = vino del CMS con datos; false = vacío/fallback
 * }}
 */
export default function useCmsContent(contentKey, options = {}) {
  const { i18n } = useTranslation();
  const locale = (options.localeOverride || i18n.language || 'es').split('-')[0];
  const ck = cacheKey(contentKey, locale);

  const initial = memCache.get(ck) || null;
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    // Si hay cache válido para este key/locale, no volver a pedir.
    const cached = memCache.get(ck);
    if (cached) {
      setData(cached);
      setLoading(false);
      return () => { cancelled.current = true; };
    }

    setLoading(true);
    setError(null);

    api.get(`/content/${contentKey}`, { params: { locale } })
      .then((res) => {
        if (cancelled.current) return;
        const payload = res?.data?.data || null;
        memCache.set(ck, payload);
        setData(payload);
      })
      .catch((err) => {
        if (cancelled.current) return;
        // No bloqueamos el render: el consumidor mostrará el fallback i18n.
        setError(err);
        setData(null);
      })
      .finally(() => {
        if (cancelled.current) return;
        setLoading(false);
      });

    return () => { cancelled.current = true; };
  }, [ck, contentKey, locale]);

  const isCmsContent = Boolean(
    data && !data.empty && (data.title || (Array.isArray(data.sections) && data.sections.length))
  );

  return { data, loading, error, isCmsContent };
}

/**
 * Permite invalidar la caché en memoria desde el admin tras una edición.
 * Útil cuando el editor del CMS guarda y queremos previsualizar el cambio
 * sin esperar 60s al TTL del Cache-Control.
 */
export function invalidateCmsCache(contentKey, locale) {
  if (!contentKey) { memCache.clear(); return; }
  if (!locale) {
    memCache.forEach((_v, k) => { if (k.startsWith(`${contentKey}::`)) memCache.delete(k); });
    return;
  }
  memCache.delete(cacheKey(contentKey, locale));
}

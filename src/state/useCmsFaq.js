// state/useCmsFaq.js
//
// Hook para la lista de FAQ pública. Cachea por (locale, category) en memoria.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from './apiClient.js';

const memCache = new Map(); // `${locale}::${category}` -> { items, total, category }

export default function useCmsFaq({ category = 'all' } = {}) {
  const { i18n } = useTranslation();
  const locale = (i18n.language || 'es').split('-')[0];
  const ck = `${locale}::${category}`;

  const [data, setData] = useState(memCache.get(ck) || null);
  const [loading, setLoading] = useState(!memCache.has(ck));
  const [error, setError] = useState(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const cached = memCache.get(ck);
    if (cached) { setData(cached); setLoading(false); return () => { cancelled.current = true; }; }

    setLoading(true);
    setError(null);
    api.get('/content/faq', { params: { locale, category } })
      .then((res) => {
        if (cancelled.current) return;
        const payload = res?.data?.data || { items: [], total: 0, category };
        memCache.set(ck, payload);
        setData(payload);
      })
      .catch((err) => {
        if (cancelled.current) return;
        setError(err);
        setData({ items: [], total: 0, category });
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });

    return () => { cancelled.current = true; };
  }, [ck, locale, category]);

  return { items: data?.items || [], total: data?.total || 0, loading, error };
}

export function invalidateFaqCache() { memCache.clear(); }

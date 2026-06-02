// state/useHomeHeroVideo.js
//
// Hook ligero para leer el video del Home administrable. Hace una llamada
// pública a /content/home-video. Si falla o está deshabilitado, devuelve
// `{ enabled: false }` para que el componente simplemente no renderice.

import { useEffect, useState } from 'react';
import api from './apiClient.js';

export default function useHomeHeroVideo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/content/home-video', { timeout: 8000 })
      .then((res) => {
        if (!alive) return;
        setData(res?.data?.data || { enabled: false });
      })
      .catch(() => {
        if (!alive) return;
        setData({ enabled: false });
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { data, loading };
}

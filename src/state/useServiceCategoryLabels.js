// state/useServiceCategoryLabels.js
//
// Hook que carga los overrides editoriales de las CATEGORÍAS DE SERVICIO
// (labels y descripciones visibles) desde el CMS y los mergea en el namespace
// i18next por defecto. De este modo, las ~30 llamadas existentes tipo
//   t('home.categories.Plomería')
//   t('home.categoryDescriptions.Plomería')
// recogen automáticamente el texto editado por el admin SIN tener que tocar
// ninguno de los call sites.
//
// Diseño no intrusivo:
//   - Si la API falla, el i18n original sigue siendo la fuente de verdad
//     → la web se ve EXACTAMENTE igual que antes.
//   - Si un campo del override está vacío, no sobreescribe el i18n
//     (porque enviamos vacío como string vacío y sólo aplicamos cuando hay
//     texto real, decidido server-side).
//   - El merge se hace en los namespaces 'home.categories' y
//     'home.categoryDescriptions' usando `addResourceBundle('translation', …, deep=true, overwrite=true)`.
//   - También actualiza `home.carousel.taglines.*` (mismo texto que descriptions
//     en español original) para que el hero pick up igual.
//
// Se llama UNA vez al boot desde App.jsx.

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from './apiClient.js';

let alreadyApplied = false; // evita doble-merge en HMR / re-monta

async function fetchAndApply(i18n, locale) {
  try {
    const res = await api.get('/content/service-categories', { params: { locale } });
    const overrides = res?.data?.data?.overrides || {};
    if (!Object.keys(overrides).length) return;

    const categoriesBundle = {};
    const descriptionsBundle = {};
    const taglinesBundle = {};
    for (const [canonical, vals] of Object.entries(overrides)) {
      if (vals?.label) {
        categoriesBundle[canonical] = vals.label;
      }
      if (vals?.description) {
        descriptionsBundle[canonical] = vals.description;
        taglinesBundle[canonical] = vals.description;
      }
    }

    // Estructura anidada esperada por addResourceBundle con deep=true:
    const patch = {
      home: {
        ...(Object.keys(categoriesBundle).length ? { categories: categoriesBundle } : {}),
        ...(Object.keys(descriptionsBundle).length ? { categoryDescriptions: descriptionsBundle } : {}),
        ...(Object.keys(taglinesBundle).length ? { carousel: { taglines: taglinesBundle } } : {})
      }
    };

    // deep=true, overwrite=true → fusiona sin perder otras claves.
    i18n.addResourceBundle(locale, 'translation', patch, true, true);
  } catch {
    // Silenciar — el fallback i18n garantiza que nada se rompe.
  }
}

/**
 * Llamar una sola vez al montar la app. Idempotente.
 */
export default function useServiceCategoryLabels() {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (alreadyApplied) return;
    alreadyApplied = true;
    // Cargamos ambos idiomas para que un cambio de lengua en runtime ya tenga
    // los overrides aplicados sin un nuevo round-trip.
    fetchAndApply(i18n, 'es');
    fetchAndApply(i18n, 'en');
  }, [i18n]);
}

/**
 * Helper para invalidar y recargar tras una edición en el panel admin.
 * Usar desde CmsServiceCategories.jsx tras un PUT/DELETE exitoso.
 */
export function refreshServiceCategoryLabels(i18n) {
  alreadyApplied = false;
  fetchAndApply(i18n, 'es');
  fetchAndApply(i18n, 'en');
}

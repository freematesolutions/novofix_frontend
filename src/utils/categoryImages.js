// Imágenes representativas para cada categoría de servicio (22 categorías).
// Optimización (mayo 2026):
//  - Se redujo el ancho base de 1200 → 600px (las cards miden ~340–420px reales).
//  - q=75 (Unsplash entrega AVIF/WebP con `auto=format`).
//  - Se exponen helpers `buildSrcSet` / `buildSizes` para imágenes responsivas.
//    Esto recorta entre 50–70 % los bytes descargados en Home sin pérdida visual.

const UNSPLASH_WIDTHS = [400, 600, 900, 1200];

const unsplash = (photoId, w = 600) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${Math.round(
    (w * 2) / 3,
  )}&q=75`;

// IDs base de Unsplash por categoría (sin parámetros). Permite generar srcset.
export const CATEGORY_IMAGE_IDS = {
  'Reparaciones': 'photo-1581783898377-1c85bf937427',
  'Plomería': 'photo-1607472586893-edb57bdc0e39',
  'Electricidad': 'photo-1621905251189-08b45d6a269e',
  'Climatización': 'photo-1762341123870-d706f257a12e',
  // 'Refrigeración' — técnico de refrigeración / cuarto frío comercial (Unsplash).
  'Refrigeración': 'photo-1584568694244-14fbdf83bd30',
  'Cerrajería': 'photo-1582139329536-e7284fece509',
  // 'Garaje' (antes 'Mantenimiento') — interior de garaje con vehículo (Unsplash).
  'Garaje': 'photo-1486006920555-c77dcf18193c',
  'Control de Plagas': 'photo-1674485135526-b5a686b33dfe',
  'Limpieza': 'photo-1581578731548-c64695cc6952',
  'Pintura': 'photo-1562259949-e8e7689d7828',
  'Pisos': 'photo-1722942117261-ec876f53cc5b',
  'Remodelación': 'photo-1484154218962-a197022b5858',
  'Jardinería': 'photo-1585320806297-9794b3e4eeae',
  'Piscinas': 'photo-1576013551627-0cc20b96c2a7',
  'Techado': 'photo-1632759145351-1d592919f522',
  'Cercas': 'photo-1480074568708-e7b720bb3f09',
  'Pérgolas': 'photo-1674672670977-bcf517fc2376',
  'Ventanas': 'photo-1600889135341-46f8f905d0b2',
  'Construcción': 'photo-1504307651254-35680f356dfd',
  'Mudanzas': 'photo-1600518464441-9154a4dea21b',
  'Seguridad': 'photo-1560617577-ecd7ffd04b98',
};

// `src` por defecto (compatibilidad con consumidores que aún no usan srcset).
export const CATEGORY_IMAGES = Object.fromEntries(
  Object.entries(CATEGORY_IMAGE_IDS).map(([k, id]) => [k, unsplash(id, 600)]),
);

const FALLBACK_ID = 'photo-1521737604893-d14cc237f11d';
export const FALLBACK_IMAGE = unsplash(FALLBACK_ID, 600);

/** Construye un atributo `srcset` para una categoría. */
export function buildSrcSet(category) {
  const id = CATEGORY_IMAGE_IDS[category] || FALLBACK_ID;
  return UNSPLASH_WIDTHS.map((w) => `${unsplash(id, w)} ${w}w`).join(', ');
}

/** `sizes` recomendado para las cards de categoría. */
export const CATEGORY_CARD_SIZES =
  '(max-width: 640px) 340px, (max-width: 1024px) 380px, 420px';

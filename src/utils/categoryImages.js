// Imágenes representativas para cada categoría de servicio (22 categorías).
// Se normalizan parámetros para usar formatos modernos (avif/webp), mantener
// recorte estable y reducir peso (q=80) sin degradación visual perceptible.

const unsplash = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&h=800&q=80`;

export const CATEGORY_IMAGES = {
  'Reparaciones': unsplash('photo-1581783898377-1c85bf937427'),
  'Plomería': unsplash('photo-1607472586893-edb57bdc0e39'),
  'Electricidad': unsplash('photo-1621905251189-08b45d6a269e'),
  'Climatización': unsplash('photo-1762341123870-d706f257a12e'),
  'Cerrajería': unsplash('photo-1582139329536-e7284fece509'),
  'Mantenimiento': unsplash('photo-1607400201515-c2c41c07d307'),
  'Control de Plagas': unsplash('photo-1674485135526-b5a686b33dfe'),
  'Limpieza': unsplash('photo-1581578731548-c64695cc6952'),
  'Pintura': unsplash('photo-1562259949-e8e7689d7828'),
  'Gabinetes': unsplash('photo-1682888813734-b1b0a4f79385'),
  'Pisos': unsplash('photo-1722942117261-ec876f53cc5b'),
  'Cocina': unsplash('photo-1772016608838-d8d467da27e8'),
  'Remodelación': unsplash('photo-1484154218962-a197022b5858'),
  'Jardinería': unsplash('photo-1585320806297-9794b3e4eeae'),
  'Piscinas': unsplash('photo-1576013551627-0cc20b96c2a7'),
  'Techado': unsplash('photo-1632759145351-1d592919f522'),
  'Cercas': unsplash('photo-1480074568708-e7b720bb3f09'),
  'Pérgolas': unsplash('photo-1674672670977-bcf517fc2376'),
  'Ventanas': unsplash('photo-1600889135341-46f8f905d0b2'),
  'Construcción': unsplash('photo-1504307651254-35680f356dfd'),
  'Mudanzas': unsplash('photo-1600518464441-9154a4dea21b'),
  'Seguridad': unsplash('photo-1560617577-ecd7ffd04b98')
};

// Imagen de respaldo en caso de error de carga.
export const FALLBACK_IMAGE = unsplash('photo-1521737604893-d14cc237f11d');

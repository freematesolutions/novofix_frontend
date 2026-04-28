// Lista maestra de categorías de servicios (22 categorías)
// Sincronizada entre frontend y backend
// Las claves internas se mantienen en español para compatibilidad con la base de datos

export const SERVICE_CATEGORIES = [
  'Reparaciones',
  'Plomería',
  'Electricidad',
  'Climatización',
  'Cerrajería',
  'Mantenimiento',
  'Control de Plagas',
  'Limpieza',
  'Pintura',
  'Gabinetes',
  'Pisos',
  'Cocina',
  'Remodelación',
  'Jardinería',
  'Piscinas',
  'Techado',
  'Cercas',
  'Pérgolas',
  'Ventanas',
  'Construcción',
  'Mudanzas',
  'Seguridad'
];

// Para validaciones en backend (enum de Mongoose)
export const SERVICE_CATEGORIES_ENUM = SERVICE_CATEGORIES;

// Mapa de migración: claves antiguas → claves nuevas
// Usado para compatibilidad con datos existentes en la BD
export const CATEGORY_MIGRATION_MAP = {
  'Handiman': 'Reparaciones',
  'Plumb': 'Plomería',
  'Electricista': 'Electricidad',
  'HVAC': 'Climatización',
  'Cerrajeria': 'Cerrajería',
  'Control de plagas': 'Control de Plagas',
  'Carpintería': 'Gabinetes',
  'Piscina': 'Piscinas'
};

/**
 * Normaliza una categoría antigua al nuevo nombre
 * @param {string} category - Nombre de categoría (puede ser antiguo o nuevo)
 * @returns {string} Nombre normalizado de la categoría
 */
export function normalizeCategory(category) {
  return CATEGORY_MIGRATION_MAP[category] || category;
}

// Categorías con descripción (para UI más rica)
export const SERVICE_CATEGORIES_WITH_DESCRIPTION = SERVICE_CATEGORIES.map(cat => ({
  value: cat,
  label: cat,
  description: getCategoryDescription(cat)
}));

function getCategoryDescription(category) {
  const descriptions = {
    'Reparaciones': 'Soluciones hoy mismo',
    'Plomería': 'Cero fugas, cero estrés',
    'Electricidad': 'Energía segura',
    'Climatización': 'Tu clima perfecto',
    'Cerrajería': 'Acceso y seguridad',
    'Mantenimiento': 'Siempre impecable',
    'Control de Plagas': '100% protegido',
    'Limpieza': 'Brillo total',
    'Pintura': 'Acabados de lujo',
    'Gabinetes': 'Diseños a medida',
    'Pisos': 'Pisadas con elegancia',
    'Cocina': 'Equipamiento y confort',
    'Remodelación': 'Estrena tu casa',
    'Jardinería': 'Jardines de revista',
    'Piscinas': 'Oasis cristalino',
    'Techado': 'Cobertura de nivel',
    'Cercas': 'Privacidad con estilo',
    'Pérgolas': 'Sombra y estilo',
    'Ventanas': 'Vistas de impacto',
    'Construcción': 'Estructuras garantizadas',
    'Mudanzas': 'Traslados seguros',
    'Seguridad': 'Protección garantizada'
  };
  return descriptions[category] || '';
}

/**
 * Convierte un nombre de categoría en un slug URL-safe (sin tildes, minúsculas,
 * separado por guiones). Es DETERMINISTA y reversible vía findCategoryBySlug.
 * Usado por las landings SEO `/categorias/:slug` y por el sitemap del backend
 * (la implementación gemela vive en `server/src/config/categories.js`).
 *
 * Ejemplos:
 *   'Plomería'         → 'plomeria'
 *   'Control de Plagas'→ 'control-de-plagas'
 *   'Pérgolas'         → 'pergolas'
 */
export function slugifyCategory(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Busca la categoría canónica a partir de un slug producido por slugifyCategory.
 * Devuelve `null` si no hay coincidencia (la página debe mostrar 404 SEO-friendly).
 */
export function findCategoryBySlug(slug) {
  if (!slug) return null;
  const target = String(slug).toLowerCase();
  return SERVICE_CATEGORIES.find((c) => slugifyCategory(c) === target) || null;
}

export default SERVICE_CATEGORIES;

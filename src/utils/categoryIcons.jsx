// Iconos SVG representativos para cada categoría de servicio
export const CATEGORY_ICONS = {
  'Plomería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M20 16L32 28L44 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 28V48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="48" r="4" fill="currentColor"/>
      <path d="M16 20L20 24M48 20L44 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Electricidad': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M38 12L26 36H32L26 52L40 28H34L38 12Z" fill="currentColor"/>
    </svg>
  ),
  'Carpintería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M16 20L24 12L48 36L40 44L16 20Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 12L32 20M40 28L48 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Pintura': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="26" y="20" width="12" height="32" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 18H40V16C40 14 38 12 36 12H28C26 12 24 14 24 16V18Z" fill="currentColor"/>
      <path d="M28 26L36 26M28 32L36 32M28 38L36 38" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Limpieza': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M28 16L28 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M20 48C20 48 24 44 28 44C32 44 36 48 36 48C36 48 32 52 28 52C24 52 20 48 20 48Z" fill="currentColor"/>
      <circle cx="28" cy="14" r="3" fill="currentColor"/>
    </svg>
  ),
  'Jardinería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M32 48V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M32 28C32 28 28 20 24 20C20 20 18 24 20 28C22 32 32 28 32 28Z" fill="currentColor"/>
      <path d="M32 28C32 28 36 20 40 20C44 20 46 24 44 28C42 32 32 28 32 28Z" fill="currentColor"/>
      <path d="M32 28C32 28 32 16 32 12C32 8 28 8 28 12C28 16 32 28 32 28Z" fill="currentColor"/>
    </svg>
  ),
  'Cerrajería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="26" r="8" stroke="currentColor" strokeWidth="3"/>
      <path d="M32 34V48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="28" r="2" fill="currentColor"/>
    </svg>
  ),
  'Albañilería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="24" width="32" height="8" stroke="currentColor" strokeWidth="2"/>
      <rect x="16" y="36" width="32" height="8" stroke="currentColor" strokeWidth="2"/>
      <rect x="20" y="16" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
      <rect x="36" y="16" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
      <rect x="28" y="44" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'Reparación de electrodomésticos': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="20" y="16" width="24" height="32" rx="2" stroke="currentColor" strokeWidth="3"/>
      <circle cx="32" cy="32" r="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M28 22H36M28 42H36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Instalación de aire acondicionado': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="20" width="32" height="16" rx="2" stroke="currentColor" strokeWidth="3"/>
      <path d="M24 36L24 44M32 36L32 46M40 36L40 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 26H26M30 26H34M38 26H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Mudanzas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="16" width="16" height="16" stroke="currentColor" strokeWidth="2"/>
      <rect x="20" y="36" width="24" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="28" cy="52" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="40" cy="52" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'Fumigación': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M20 40C20 40 24 32 32 32C40 32 44 40 44 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="28" cy="20" r="2" fill="currentColor"/>
      <circle cx="36" cy="16" r="2" fill="currentColor"/>
      <circle cx="32" cy="24" r="2" fill="currentColor"/>
      <path d="M32 32V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Tecnología e informática': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="18" width="32" height="22" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 40L12 46H52L48 40" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="32" cy="29" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'Clases particulares': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M16 20H48V44H16V20Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 28L28 36L44 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Belleza y estética': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 32C26 32 20 36 20 42V48H44V42C44 36 38 32 32 32Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'Mecánica automotriz': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M16 32L20 24H44L48 32V44H16V32Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="44" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="40" cy="44" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 24V20M32 24V20M40 24V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Fotografía': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="12" y="22" width="40" height="28" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="36" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="44" cy="28" r="2" fill="currentColor"/>
    </svg>
  ),
  'Catering': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M20 28C20 24 24 20 32 20C40 20 44 24 44 28" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 28H48L44 44H20L16 28Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  'Construcción': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M12 44H52V52H12V44Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 44V28L32 16L44 28V44" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="28" y="36" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'Decoración': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M32 12L40 28H24L32 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="32" cy="44" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 28L16 40H48L40 28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  'Diseño gráfico': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M20 16L32 28L44 16L48 20L36 32L48 44L44 48L32 36L20 48L16 44L28 32L16 20L20 16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  'Asesoría legal': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M20 48H44V24L32 16L20 24V48Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M28 32H36M28 38H36M28 44H36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Contabilidad': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="16" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 24H40M24 32H40M24 40H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Marketing digital': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 16V8M32 56V48M48 32H56M8 32H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M44 44L50 50M44 20L50 14M20 20L14 14M20 44L14 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Traducción': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M16 20H32M24 20V16M20 28C22 32 26 36 32 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M36 24L44 44L52 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Otro': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="32" r="2" fill="currentColor"/>
      <circle cx="32" cy="32" r="2" fill="currentColor"/>
      <circle cx="40" cy="32" r="2" fill="currentColor"/>
    </svg>
  )
};

// Colores de gradiente para cada categoría
export const CATEGORY_COLORS = {
  'Plomería': 'from-blue-500 to-cyan-500',
  'Electricidad': 'from-yellow-500 to-amber-500',
  'Carpintería': 'from-amber-600 to-orange-600',
  'Pintura': 'from-purple-500 to-pink-500',
  'Limpieza': 'from-cyan-500 to-blue-500',
  'Jardinería': 'from-green-500 to-emerald-500',
  'Cerrajería': 'from-gray-600 to-slate-600',
  'Albañilería': 'from-orange-600 to-red-600',
  'Reparación de electrodomésticos': 'from-indigo-500 to-blue-600',
  'Instalación de aire acondicionado': 'from-sky-500 to-cyan-500',
  'Mudanzas': 'from-blue-600 to-indigo-600',
  'Fumigación': 'from-lime-500 to-green-600',
  'Tecnología e informática': 'from-violet-500 to-purple-600',
  'Clases particulares': 'from-rose-500 to-pink-600',
  'Belleza y estética': 'from-pink-500 to-rose-500',
  'Mecánica automotriz': 'from-slate-600 to-gray-700',
  'Fotografía': 'from-blue-500 to-indigo-500',
  'Catering': 'from-orange-500 to-red-500',
  'Construcción': 'from-yellow-600 to-orange-600',
  'Decoración': 'from-fuchsia-500 to-purple-500',
  'Diseño gráfico': 'from-cyan-500 to-blue-600',
  'Asesoría legal': 'from-blue-800 to-indigo-800',
  'Contabilidad': 'from-green-600 to-emerald-600',
  'Marketing digital': 'from-red-500 to-orange-500',
  'Traducción': 'from-teal-500 to-cyan-600',
  'Otro': 'from-gray-500 to-slate-600'
};

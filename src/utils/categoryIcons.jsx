// Iconos SVG realistas y detallados para cada categoría de servicio (22 categorías)
// Diseñados con gradientes, sombras y detalles para una apariencia más profesional

export const CATEGORY_ICONS = {
  'Reparaciones': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Caja de herramientas */}
      <rect x="12" y="28" width="40" height="24" rx="3" fill="currentColor" opacity="0.9"/>
      <rect x="14" y="30" width="36" height="20" rx="2" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M22 28V22C22 19 25 16 32 16C39 16 42 19 42 22V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="28" y="34" width="8" height="6" rx="1" fill="white" opacity="0.4"/>
      <path d="M32 37V39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Llave y destornillador */}
      <path d="M48 8L52 12L44 20L40 16L48 8Z" fill="currentColor" opacity="0.7"/>
      <path d="M16 8L12 12L20 20L24 16L16 8Z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Plomería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M18 22C18 18 21 14 26 14C28 14 30 15 31 16L44 29L48 25L52 29L48 33L44 29L31 42C30 44 28 46 24 46C19 46 15 42 15 37C15 34 17 31 20 29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="36" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M38 20L44 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M50 42C50 42 54 48 54 51C54 54 52 56 50 56C48 56 46 54 46 51C46 48 50 42 50 42Z" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Electricidad': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M36 8L22 32H30L24 56L44 28H35L36 8Z" fill="currentColor"/>
      <path d="M36 8L22 32H30L24 56L44 28H35L36 8Z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="16" cy="24" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="48" cy="36" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="14" cy="40" r="1" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  'Climatización': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="10" y="18" width="36" height="18" rx="3" fill="currentColor"/>
      <rect x="12" y="20" width="32" height="14" rx="2" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M14 24H42M14 28H42M14 32H42" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <rect x="38" y="22" width="6" height="10" rx="1" fill="white" opacity="0.2"/>
      <path d="M18 40C18 40 20 44 18 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <path d="M26 40C26 40 28 46 26 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M34 40C34 40 36 44 34 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <circle cx="50" cy="28" r="1.5" fill="currentColor" opacity="0.5"/>
      <path d="M50 24V32M46 28H54M48 26L52 30M52 26L48 30" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    </svg>
  ),
  'Cerrajería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="36" y="24" width="16" height="14" rx="2" fill="currentColor"/>
      <path d="M40 24V20C40 16 42 14 44 14C46 14 48 16 48 20V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="44" cy="31" r="2" fill="white" opacity="0.5"/>
      <path d="M44 33V36" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <circle cx="18" cy="24" r="8" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="18" cy="24" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M26 24H38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M32 24V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M36 24V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Mantenimiento': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="32" r="3" fill="currentColor"/>
      <path d="M32 16V10M32 54V48M16 32H10M54 32H48M20 20L16 16M44 44L48 48M44 20L48 16M20 44L16 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 10L54 14L48 20L44 16L50 10Z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Control de Plagas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <ellipse cx="20" cy="40" rx="10" ry="14" fill="currentColor" opacity="0.9"/>
      <ellipse cx="20" cy="40" rx="6" ry="10" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M14 30L14 20L26 20L26 30" stroke="currentColor" strokeWidth="2"/>
      <path d="M30 36C34 36 38 32 42 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="42" y="28" width="12" height="8" rx="2" fill="currentColor"/>
      <path d="M54 32H58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M46 44C46 44 46 56 52 56C58 56 58 44 58 44L52 40L46 44Z" fill="currentColor" opacity="0.7"/>
      <path d="M50 48L52 50L56 46" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    </svg>
  ),
  'Limpieza': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M22 24H30V52C30 54 28 56 26 56C24 56 22 54 22 52V24Z" fill="currentColor" opacity="0.9"/>
      <rect x="22" y="18" width="8" height="6" fill="currentColor"/>
      <path d="M26 12V18" stroke="currentColor" strokeWidth="2"/>
      <path d="M26 12L32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="38" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
      <circle cx="44" cy="26" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="40" cy="34" r="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="48" cy="38" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <path d="M50 16L52 14M52 18L54 16M48 14L50 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    </svg>
  ),
  'Pintura': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="20" y="12" width="24" height="14" rx="3" fill="currentColor"/>
      <rect x="22" y="14" width="20" height="10" rx="2" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M32 26V42" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <rect x="28" y="42" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="20" r="4" fill="currentColor" opacity="0.6"/>
      <circle cx="50" cy="24" r="3" fill="currentColor" opacity="0.5"/>
      <ellipse cx="46" cy="44" rx="4" ry="3" fill="currentColor" opacity="0.4"/>
      <path d="M18 28C18 28 16 32 16 34C16 36 17 37 18 37C19 37 20 36 20 34C20 32 18 28 18 28Z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Gabinetes': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Gabinete con puertas */}
      <rect x="10" y="10" width="44" height="44" rx="3" fill="currentColor" opacity="0.9"/>
      <rect x="12" y="12" width="40" height="40" rx="2" stroke="white" strokeWidth="1" opacity="0.2"/>
      {/* División central */}
      <path d="M32 12V52" stroke="white" strokeWidth="1.5" opacity="0.3"/>
      {/* División horizontal */}
      <path d="M12 32H52" stroke="white" strokeWidth="1.5" opacity="0.3"/>
      {/* Tiradores */}
      <circle cx="28" cy="22" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="36" cy="22" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="28" cy="42" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="36" cy="42" r="1.5" fill="white" opacity="0.6"/>
      {/* Detalle de moldura */}
      <rect x="14" y="14" width="16" height="16" rx="1" stroke="white" strokeWidth="0.5" opacity="0.15"/>
      <rect x="34" y="14" width="16" height="16" rx="1" stroke="white" strokeWidth="0.5" opacity="0.15"/>
      <rect x="14" y="34" width="16" height="16" rx="1" stroke="white" strokeWidth="0.5" opacity="0.15"/>
      <rect x="34" y="34" width="16" height="16" rx="1" stroke="white" strokeWidth="0.5" opacity="0.15"/>
    </svg>
  ),
  'Pisos': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="28" width="16" height="16" fill="currentColor" opacity="0.9"/>
      <rect x="24" y="28" width="16" height="16" fill="currentColor" opacity="0.7"/>
      <rect x="40" y="28" width="16" height="16" fill="currentColor" opacity="0.9"/>
      <rect x="8" y="44" width="16" height="12" fill="currentColor" opacity="0.7"/>
      <rect x="24" y="44" width="16" height="12" fill="currentColor" opacity="0.9"/>
      <rect x="40" y="44" width="16" height="12" fill="currentColor" opacity="0.7"/>
      <path d="M24 28V56M40 28V56M8 44H56" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <path d="M14 12L24 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M10 8L14 12L10 16" fill="currentColor"/>
      <rect x="24" y="18" width="16" height="6" rx="1" fill="currentColor" opacity="0.6"/>
      <path d="M40 20H48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'Cocina': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Estufa/cocina */}
      <rect x="10" y="24" width="44" height="30" rx="3" fill="currentColor" opacity="0.9"/>
      <rect x="12" y="26" width="40" height="26" rx="2" stroke="white" strokeWidth="1" opacity="0.2"/>
      {/* Quemadores */}
      <circle cx="22" cy="16" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="22" cy="16" r="2" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <circle cx="42" cy="16" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="42" cy="16" r="2" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      {/* Horno */}
      <rect x="16" y="34" width="32" height="16" rx="2" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <path d="M20 42H44" stroke="white" strokeWidth="1" opacity="0.3"/>
      {/* Tirador del horno */}
      <path d="M28 32H36" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      {/* Vapor */}
      <path d="M30 8C30 8 31 4 32 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M34 6C34 6 35 2 36 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),
  'Remodelación': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M14 32C14 22 22 16 32 16C42 16 50 22 50 32H14Z" fill="currentColor"/>
      <path d="M12 32H52V36C52 38 50 40 48 40H16C14 40 12 38 12 36V32Z" fill="currentColor" opacity="0.9"/>
      <ellipse cx="32" cy="32" rx="18" ry="2" fill="white" opacity="0.2"/>
      <rect x="28" y="18" width="8" height="6" rx="1" fill="white" opacity="0.4"/>
      <rect x="16" y="44" width="32" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 48H44M20 52H36M20 56H40" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <path d="M44 48L48 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Jardinería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Maceta */}
      <path d="M20 40L24 56H40L44 40H20Z" fill="currentColor" opacity="0.8"/>
      <path d="M18 36H46V40H18V36Z" fill="currentColor"/>
      {/* Planta */}
      <path d="M32 36V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M32 28C32 28 24 24 22 18C20 12 26 10 30 14C32 16 32 20 32 28Z" fill="currentColor" opacity="0.7"/>
      <path d="M32 24C32 24 40 20 42 14C44 8 38 6 34 10C32 12 32 16 32 24Z" fill="currentColor" opacity="0.6"/>
      {/* Hoja adicional */}
      <path d="M32 32C32 32 26 30 24 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      {/* Flores/detalles */}
      <circle cx="22" cy="16" r="2" fill="currentColor" opacity="0.5"/>
      <circle cx="42" cy="12" r="2" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  'Piscinas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="28" width="48" height="24" rx="4" fill="currentColor" opacity="0.3"/>
      <path d="M8 36C14 32 18 36 24 32C30 28 34 36 40 32C46 28 50 36 56 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 44C14 40 18 44 24 40C30 36 34 44 40 40C46 36 50 44 56 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M46 18V48" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M52 18V48" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M46 24H52M46 30H52M46 36H52" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="14" r="5" fill="currentColor" opacity="0.7"/>
      <path d="M16 6V8M16 20V22M8 14H10M22 14H24M10 8L12 10M20 18L22 20M10 20L12 18M20 10L22 8" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  'Techado': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M8 32L32 12L56 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 30V52H52V30" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M12 30L32 14L52 30" fill="currentColor" opacity="0.8"/>
      <path d="M16 28L32 16L48 28" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M20 26L32 18L44 26" stroke="white" strokeWidth="1" opacity="0.2"/>
      <rect x="26" y="38" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 38V52M26 44H38" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="42" y="16" width="6" height="12" fill="currentColor"/>
      <path d="M44 12C44 12 45 8 47 10C49 12 45 14 45 14" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    </svg>
  ),
  'Cercas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="20" width="8" height="32" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="18" y="16" width="8" height="36" rx="1" fill="currentColor"/>
      <rect x="30" y="20" width="8" height="32" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="42" y="16" width="8" height="36" rx="1" fill="currentColor"/>
      <rect x="54" y="20" width="6" height="32" rx="1" fill="currentColor" opacity="0.9"/>
      <path d="M6 30H60" stroke="currentColor" strokeWidth="3"/>
      <path d="M6 42H60" stroke="currentColor" strokeWidth="3"/>
      <path d="M18 16L22 10L26 16" fill="currentColor"/>
      <path d="M42 16L46 10L50 16" fill="currentColor"/>
    </svg>
  ),
  'Pérgolas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      <path d="M8 16H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12 16V52" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M52 16V52" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M8 20H56M8 24H56" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <path d="M6 12H58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 12V16M32 12V16M44 12V16" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 36C18 36 22 32 26 36" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <path d="M38 34C38 34 42 30 46 34" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="22" cy="42" r="3" fill="currentColor" opacity="0.3"/>
      <circle cx="42" cy="40" r="4" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  'Ventanas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Marco de ventana */}
      <rect x="10" y="10" width="44" height="44" rx="3" stroke="currentColor" strokeWidth="3"/>
      {/* Divisiones */}
      <path d="M32 10V54" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M10 32H54" stroke="currentColor" strokeWidth="2.5"/>
      {/* Vidrios */}
      <rect x="12" y="12" width="18" height="18" rx="1" fill="currentColor" opacity="0.15"/>
      <rect x="34" y="12" width="18" height="18" rx="1" fill="currentColor" opacity="0.1"/>
      <rect x="12" y="34" width="18" height="18" rx="1" fill="currentColor" opacity="0.1"/>
      <rect x="34" y="34" width="18" height="18" rx="1" fill="currentColor" opacity="0.15"/>
      {/* Reflejo */}
      <path d="M16 16L24 24" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M38 38L46 46" stroke="white" strokeWidth="1" opacity="0.3"/>
      {/* Manija */}
      <circle cx="32" cy="32" r="2" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Construcción': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Grúa */}
      <path d="M16 56V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M16 16H48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 16L10 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 16L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Cable */}
      <path d="M44 16V32" stroke="currentColor" strokeWidth="1.5"/>
      {/* Bloque */}
      <rect x="38" y="32" width="12" height="10" rx="1" fill="currentColor" opacity="0.8"/>
      <path d="M40 36H48M40 38H48" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      {/* Base */}
      <path d="M8 56H24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Edificio en construcción */}
      <rect x="28" y="44" width="20" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 48H36M40 48H44M32 52H36M40 52H44" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  'Mudanzas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Camión */}
      <rect x="6" y="22" width="34" height="22" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="8" y="24" width="30" height="18" rx="1" stroke="white" strokeWidth="1" opacity="0.2"/>
      {/* Cabina */}
      <path d="M40 28H52C54 28 56 30 56 32V44H40V28Z" fill="currentColor"/>
      <rect x="44" y="32" width="8" height="6" rx="1" fill="white" opacity="0.3"/>
      {/* Ruedas */}
      <circle cx="18" cy="46" r="5" fill="currentColor"/>
      <circle cx="18" cy="46" r="2" fill="white" opacity="0.4"/>
      <circle cx="48" cy="46" r="5" fill="currentColor"/>
      <circle cx="48" cy="46" r="2" fill="white" opacity="0.4"/>
      {/* Cajas */}
      <rect x="12" y="26" width="10" height="10" rx="1" stroke="white" strokeWidth="1" opacity="0.4"/>
      <rect x="24" y="30" width="8" height="8" rx="1" stroke="white" strokeWidth="1" opacity="0.3"/>
    </svg>
  ),
  'Seguridad': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Escudo */}
      <path d="M32 8L12 18V34C12 46 20 54 32 58C44 54 52 46 52 34V18L32 8Z" fill="currentColor" opacity="0.9"/>
      <path d="M32 10L14 19V34C14 45 21 52 32 56C43 52 50 45 50 34V19L32 10Z" stroke="white" strokeWidth="1" opacity="0.2"/>
      {/* Check */}
      <path d="M24 32L30 38L42 26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Destellos */}
      <circle cx="8" cy="14" r="1.5" fill="currentColor" opacity="0.4"/>
      <circle cx="56" cy="14" r="1.5" fill="currentColor" opacity="0.4"/>
    </svg>
  )
};

// Colores de gradiente para cada categoría
export const CATEGORY_COLORS = {
  'Reparaciones': 'from-orange-500 to-amber-500',
  'Plomería': 'from-blue-500 to-cyan-500',
  'Electricidad': 'from-yellow-500 to-amber-500',
  'Climatización': 'from-sky-500 to-cyan-500',
  'Cerrajería': 'from-gray-600 to-slate-600',
  'Mantenimiento': 'from-green-600 to-emerald-600',
  'Control de Plagas': 'from-lime-500 to-green-600',
  'Limpieza': 'from-cyan-500 to-blue-500',
  'Pintura': 'from-purple-500 to-pink-500',
  'Gabinetes': 'from-amber-600 to-orange-600',
  'Pisos': 'from-teal-500 to-emerald-500',
  'Cocina': 'from-red-500 to-orange-500',
  'Remodelación': 'from-indigo-500 to-blue-600',
  'Jardinería': 'from-green-500 to-lime-500',
  'Piscinas': 'from-blue-400 to-cyan-400',
  'Techado': 'from-red-600 to-orange-600',
  'Cercas': 'from-stone-500 to-amber-600',
  'Pérgolas': 'from-amber-500 to-yellow-600',
  'Ventanas': 'from-slate-500 to-blue-500',
  'Construcción': 'from-zinc-600 to-stone-600',
  'Mudanzas': 'from-violet-500 to-purple-500',
  'Seguridad': 'from-emerald-600 to-teal-600'
};

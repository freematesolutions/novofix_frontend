// Iconos SVG realistas y detallados para cada categoría de servicio
// Diseñados con gradientes, sombras y detalles para una apariencia más profesional

export const CATEGORY_ICONS = {
  'Plomería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Llave inglesa realista */}
      <path d="M18 22C18 18 21 14 26 14C28 14 30 15 31 16L44 29L48 25L52 29L48 33L44 29L31 42C30 44 28 46 24 46C19 46 15 42 15 37C15 34 17 31 20 29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="36" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M38 20L44 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Gota de agua */}
      <path d="M50 42C50 42 54 48 54 51C54 54 52 56 50 56C48 56 46 54 46 51C46 48 50 42 50 42Z" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Electricidad': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Rayo eléctrico realista */}
      <path d="M36 8L22 32H30L24 56L44 28H35L36 8Z" fill="currentColor"/>
      <path d="M36 8L22 32H30L24 56L44 28H35L36 8Z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      {/* Chispas */}
      <circle cx="16" cy="24" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="48" cy="36" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="14" cy="40" r="1" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  'Carpintería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Martillo y serrucho */}
      <path d="M12 48L36 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M36 24L52 16L54 18L40 30L36 24Z" fill="currentColor"/>
      <path d="M14 46L16 44L18 46L20 44L22 46L24 44L26 46L28 44L30 46L32 44L34 46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="8" y="14" width="18" height="8" rx="1" fill="currentColor"/>
      <path d="M18 22V38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M8 18L26 18" stroke="white" strokeWidth="1" opacity="0.3"/>
    </svg>
  ),
  'Pintura': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Rodillo de pintura */}
      <rect x="20" y="12" width="24" height="14" rx="3" fill="currentColor"/>
      <rect x="22" y="14" width="20" height="10" rx="2" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M32 26V42" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <rect x="28" y="42" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
      {/* Manchas de pintura */}
      <circle cx="14" cy="20" r="4" fill="currentColor" opacity="0.6"/>
      <circle cx="50" cy="24" r="3" fill="currentColor" opacity="0.5"/>
      <ellipse cx="46" cy="44" rx="4" ry="3" fill="currentColor" opacity="0.4"/>
      <path d="M18 28C18 28 16 32 16 34C16 36 17 37 18 37C19 37 20 36 20 34C20 32 18 28 18 28Z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Limpieza': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Spray de limpieza */}
      <path d="M22 24H30V52C30 54 28 56 26 56C24 56 22 54 22 52V24Z" fill="currentColor" opacity="0.9"/>
      <rect x="22" y="18" width="8" height="6" fill="currentColor"/>
      <path d="M26 12V18" stroke="currentColor" strokeWidth="2"/>
      <path d="M26 12L32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Burbujas */}
      <circle cx="38" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
      <circle cx="44" cy="26" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="40" cy="34" r="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="48" cy="38" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <path d="M50 16L52 14M52 18L54 16M48 14L50 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    </svg>
  ),
  'Jardinería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Planta con maceta */}
      <path d="M20 44L24 56H40L44 44H20Z" fill="currentColor" opacity="0.8"/>
      <path d="M18 40H46V44H18V40Z" fill="currentColor"/>
      <ellipse cx="32" cy="42" rx="14" ry="2" fill="white" opacity="0.2"/>
      <path d="M32 40V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M32 32C32 32 26 28 22 30C18 32 18 38 22 38C26 38 32 32 32 32Z" fill="currentColor"/>
      <path d="M32 28C32 28 38 24 42 26C46 28 46 34 42 34C38 34 32 28 32 28Z" fill="currentColor"/>
      <path d="M32 24C32 24 30 16 32 12C34 8 38 10 36 16C34 22 32 24 32 24Z" fill="currentColor"/>
      <circle cx="32" cy="10" r="3" fill="currentColor"/>
      <circle cx="32" cy="10" r="1.5" fill="white" opacity="0.5"/>
    </svg>
  ),
  'Cerrajería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Llave y candado */}
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
  'Albañilería': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Ladrillos con paleta */}
      <rect x="10" y="36" width="20" height="8" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="34" y="36" width="20" height="8" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="10" y="46" width="14" height="8" rx="1" fill="currentColor" opacity="0.8"/>
      <rect x="28" y="46" width="14" height="8" rx="1" fill="currentColor" opacity="0.8"/>
      <rect x="46" y="46" width="8" height="8" rx="1" fill="currentColor" opacity="0.8"/>
      <path d="M10 44H54" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M30 36V44M24 46V54M42 46V54" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M28 12L48 28L44 32L24 16L28 12Z" fill="currentColor"/>
      <path d="M24 16L20 20L14 14L18 10L24 16Z" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Reparación de electrodomésticos': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Lavadora con herramienta */}
      <rect x="14" y="12" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="28" cy="32" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="28" cy="32" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <circle cx="20" cy="18" r="2" fill="currentColor"/>
      <circle cx="28" cy="18" r="2" fill="currentColor" opacity="0.6"/>
      <rect x="33" y="16" width="4" height="4" rx="1" fill="currentColor" opacity="0.5"/>
      <path d="M24 28C26 30 30 30 32 28" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <path d="M46 20L54 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M54 12L58 8L56 6L52 10" fill="currentColor"/>
      <rect x="44" y="18" width="4" height="8" rx="1" transform="rotate(-45 44 18)" fill="currentColor"/>
    </svg>
  ),
  'Instalación de aire acondicionado': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Aire acondicionado con ondas de frío */}
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
  'Mudanzas': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Camión de mudanzas */}
      <path d="M8 32H18V44H8V32Z" fill="currentColor"/>
      <rect x="10" y="34" width="6" height="4" rx="1" fill="white" opacity="0.4"/>
      <rect x="18" y="24" width="28" height="20" rx="2" fill="currentColor" opacity="0.9"/>
      <path d="M20 26H44V42H20V26Z" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M42 28V40" stroke="white" strokeWidth="1" opacity="0.3"/>
      <circle cx="14" cy="46" r="4" fill="currentColor"/>
      <circle cx="14" cy="46" r="2" fill="white" opacity="0.3"/>
      <circle cx="38" cy="46" r="4" fill="currentColor"/>
      <circle cx="38" cy="46" r="2" fill="white" opacity="0.3"/>
      <rect x="48" y="34" width="10" height="10" fill="currentColor" opacity="0.7"/>
      <rect x="52" y="26" width="8" height="8" fill="currentColor" opacity="0.5"/>
      <path d="M48 39H58M53 34V44" stroke="white" strokeWidth="0.5" opacity="0.4"/>
    </svg>
  ),
  'Fumigación': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Rociador con spray */}
      <ellipse cx="20" cy="40" rx="10" ry="14" fill="currentColor" opacity="0.9"/>
      <ellipse cx="20" cy="40" rx="6" ry="10" stroke="white" strokeWidth="1" opacity="0.2"/>
      <path d="M14 30L14 20L26 20L26 30" stroke="currentColor" strokeWidth="2"/>
      <path d="M30 36C34 36 38 32 42 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="42" y="28" width="12" height="8" rx="2" fill="currentColor"/>
      <path d="M54 32H58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="54" cy="20" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="58" cy="24" r="1.5" fill="currentColor" opacity="0.4"/>
      <circle cx="52" cy="16" r="1" fill="currentColor" opacity="0.2"/>
      <circle cx="60" cy="18" r="1.5" fill="currentColor" opacity="0.3"/>
      <circle cx="48" cy="50" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <path d="M46 48L50 52M50 48L46 52" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  'Tecnología e informática': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Laptop con código */}
      <rect x="12" y="14" width="40" height="26" rx="2" fill="currentColor"/>
      <rect x="14" y="16" width="36" height="22" rx="1" fill="white" opacity="0.1"/>
      <path d="M18 22H30" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <path d="M18 26H26" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <path d="M20 30H34" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <path d="M18 34H28" stroke="white" strokeWidth="1.5" opacity="0.3"/>
      <path d="M38 24L42 28L38 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M46 24L42 28L46 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M8 42H56L52 48H12L8 42Z" fill="currentColor" opacity="0.8"/>
      <ellipse cx="32" cy="45" rx="8" ry="1" fill="white" opacity="0.2"/>
      <circle cx="32" cy="38" r="1" fill="white" opacity="0.6"/>
    </svg>
  ),
  'Clases particulares': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Libro abierto con birrete */}
      <path d="M8 16C8 16 16 14 32 14C48 14 56 16 56 16V48C56 48 48 46 32 46C16 46 8 48 8 48V16Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 14V46" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 20C12 20 18 19 30 19" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <path d="M12 26C12 26 18 25 28 25" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
      <path d="M12 32C12 32 18 31 26 31" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
      <path d="M34 19C46 19 52 20 52 20" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <path d="M36 25C46 25 52 26 52 26" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
      <rect x="44" y="6" width="4" height="20" rx="1" fill="currentColor" transform="rotate(25 44 6)"/>
      <path d="M54 22L56 26L52 24L54 22Z" fill="currentColor"/>
      <path d="M18 8L26 4L34 8L26 12L18 8Z" fill="currentColor"/>
      <path d="M26 12V16" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="26" cy="17" r="1" fill="currentColor"/>
    </svg>
  ),
  'Belleza y estética': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Espejo y tijeras */}
      <ellipse cx="32" cy="26" rx="14" ry="16" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="32" cy="26" rx="10" ry="12" fill="currentColor" opacity="0.3"/>
      <path d="M28 44V50" stroke="currentColor" strokeWidth="2"/>
      <path d="M36 44V50" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 50H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 20C28 18 32 18 34 20" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <ellipse cx="12" cy="36" rx="4" ry="6" stroke="currentColor" strokeWidth="2" transform="rotate(-30 12 36)"/>
      <ellipse cx="12" cy="48" rx="4" ry="6" stroke="currentColor" strokeWidth="2" transform="rotate(30 12 48)"/>
      <circle cx="14" cy="42" r="2" fill="currentColor"/>
      <rect x="50" y="28" width="6" height="20" rx="1" fill="currentColor" opacity="0.8"/>
      <path d="M52 32V46M54 32V46" stroke="white" strokeWidth="0.5" opacity="0.4"/>
    </svg>
  ),
  'Mecánica automotriz': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Auto con engranaje */}
      <path d="M10 36L14 28H26L30 22H42L46 28H52L56 36V44H52V40H14V44H10V36Z" fill="currentColor"/>
      <path d="M16 28H26L28 24H40L42 28H50" stroke="white" strokeWidth="1" opacity="0.3"/>
      <rect x="12" y="34" width="4" height="2" rx="0.5" fill="white" opacity="0.6"/>
      <rect x="50" y="34" width="4" height="2" rx="0.5" fill="white" opacity="0.6"/>
      <circle cx="20" cy="42" r="6" fill="currentColor"/>
      <circle cx="20" cy="42" r="3" fill="white" opacity="0.2"/>
      <circle cx="46" cy="42" r="6" fill="currentColor"/>
      <circle cx="46" cy="42" r="3" fill="white" opacity="0.2"/>
      <circle cx="52" cy="14" r="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M52 8V10M52 18V20M46 14H48M56 14H58M48 10L49 11M55 17L56 18M48 18L49 17M55 11L56 10" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="52" cy="14" r="2" fill="currentColor"/>
    </svg>
  ),
  'Fotografía': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Cámara profesional */}
      <rect x="8" y="22" width="48" height="30" rx="4" fill="currentColor"/>
      <rect x="10" y="24" width="44" height="26" rx="3" stroke="white" strokeWidth="1" opacity="0.2"/>
      <rect x="26" y="14" width="12" height="8" rx="2" fill="currentColor"/>
      <circle cx="32" cy="37" r="12" fill="currentColor"/>
      <circle cx="32" cy="37" r="10" stroke="white" strokeWidth="1" opacity="0.3"/>
      <circle cx="32" cy="37" r="6" fill="white" opacity="0.1"/>
      <circle cx="32" cy="37" r="3" fill="white" opacity="0.2"/>
      <path d="M28 33C30 31 34 31 36 33" stroke="white" strokeWidth="1" opacity="0.4"/>
      <rect x="46" y="26" width="6" height="4" rx="1" fill="white" opacity="0.5"/>
      <circle cx="48" cy="18" r="3" fill="currentColor"/>
      <circle cx="48" cy="18" r="1.5" fill="white" opacity="0.3"/>
      <rect x="8" y="26" width="6" height="22" rx="2" fill="currentColor" opacity="0.8"/>
    </svg>
  ),
  'Catering': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Bandeja con cloche */}
      <path d="M12 36C12 24 20 16 32 16C44 16 52 24 52 36" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="32" cy="14" r="3" fill="currentColor"/>
      <path d="M20 28C22 24 28 22 32 22" stroke="white" strokeWidth="1" opacity="0.3"/>
      <path d="M8 36H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12 40H52L48 48H16L12 40Z" fill="currentColor" opacity="0.9"/>
      <ellipse cx="32" cy="38" rx="16" ry="2" fill="white" opacity="0.2"/>
      <path d="M26 10C26 10 24 6 26 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M32 8C32 8 30 4 32 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M38 10C38 10 36 6 38 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'Construcción': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Casco con grúa */}
      <path d="M14 32C14 22 22 16 32 16C42 16 50 22 50 32H14Z" fill="currentColor"/>
      <path d="M12 32H52V36C52 38 50 40 48 40H16C14 40 12 38 12 36V32Z" fill="currentColor" opacity="0.9"/>
      <ellipse cx="32" cy="32" rx="18" ry="2" fill="white" opacity="0.2"/>
      <path d="M14 28H50" stroke="white" strokeWidth="1" opacity="0.3"/>
      <rect x="28" y="18" width="8" height="6" rx="1" fill="white" opacity="0.4"/>
      <path d="M52 44V12H56V44" stroke="currentColor" strokeWidth="2"/>
      <path d="M40 12H56" stroke="currentColor" strokeWidth="2"/>
      <path d="M42 12V20" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="40" y="20" width="4" height="6" fill="currentColor" opacity="0.7"/>
      <rect x="8" y="46" width="16" height="8" rx="1" fill="currentColor" opacity="0.6"/>
      <rect x="26" y="46" width="16" height="8" rx="1" fill="currentColor" opacity="0.6"/>
      <path d="M16 46V54" stroke="white" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  ),
  'Decoración': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Lámpara con cuadro */}
      <path d="M24 12L32 8L40 12L38 28H26L24 12Z" fill="currentColor" opacity="0.9"/>
      <ellipse cx="32" cy="28" rx="8" ry="2" fill="currentColor"/>
      <path d="M32 30V36" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="32" cy="38" rx="4" ry="2" fill="currentColor"/>
      <path d="M28 16L32 14L36 16" stroke="white" strokeWidth="1" opacity="0.4"/>
      <rect x="8" y="42" width="20" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="10" y="44" width="16" height="12" fill="currentColor" opacity="0.3"/>
      <path d="M10 52L16 46L22 52" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <circle cx="22" cy="46" r="2" fill="currentColor" opacity="0.4"/>
      <path d="M48 52C48 52 44 48 44 44C44 40 46 38 50 38C54 38 56 40 56 44C56 48 52 52 52 52H48Z" fill="currentColor" opacity="0.8"/>
      <path d="M48 38V32L50 28L52 32V38" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="50" cy="26" r="3" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
  'Diseño gráfico': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Monitor con pen tablet */}
      <rect x="8" y="10" width="36" height="28" rx="2" fill="currentColor"/>
      <rect x="10" y="12" width="32" height="24" fill="white" opacity="0.1"/>
      <circle cx="20" cy="24" r="6" fill="white" opacity="0.3"/>
      <rect x="28" y="18" width="10" height="12" rx="1" fill="white" opacity="0.25"/>
      <path d="M16 32H38" stroke="white" strokeWidth="1" opacity="0.4"/>
      <path d="M22 38V42H30V38" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 42H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M46 44L58 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M58 12L60 8L56 10L58 12Z" fill="currentColor"/>
      <rect x="42" y="46" width="18" height="12" rx="2" fill="currentColor" opacity="0.7"/>
      <rect x="44" y="48" width="14" height="8" rx="1" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      <circle cx="48" cy="52" r="2" fill="white" opacity="0.4"/>
      <circle cx="54" cy="52" r="2" fill="white" opacity="0.3"/>
    </svg>
  ),
  'Asesoría legal': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Balanza de justicia */}
      <path d="M32 12V52" stroke="currentColor" strokeWidth="3"/>
      <rect x="24" y="52" width="16" height="4" rx="1" fill="currentColor"/>
      <path d="M12 20H52" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M12 20L8 32H24L20 20" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="16" cy="32" rx="8" ry="2" fill="currentColor" opacity="0.8"/>
      <path d="M10 32C10 34 12 36 16 36C20 36 22 34 22 32" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M44 20L40 32H56L52 20" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="48" cy="32" rx="8" ry="2" fill="currentColor" opacity="0.8"/>
      <path d="M42 32C42 34 44 36 48 36C52 36 54 34 54 32" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="32" cy="10" r="4" fill="currentColor"/>
      <circle cx="32" cy="10" r="2" fill="white" opacity="0.3"/>
      <path d="M12 20V18M20 20V18M44 20V18M52 20V18" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  'Contabilidad': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Calculadora con gráfico */}
      <rect x="8" y="12" width="28" height="40" rx="3" fill="currentColor"/>
      <rect x="10" y="14" width="24" height="36" rx="2" stroke="white" strokeWidth="1" opacity="0.2"/>
      <rect x="12" y="16" width="20" height="10" rx="1" fill="white" opacity="0.2"/>
      <path d="M14 22H28" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <rect x="12" y="30" width="6" height="4" rx="0.5" fill="white" opacity="0.3"/>
      <rect x="20" y="30" width="6" height="4" rx="0.5" fill="white" opacity="0.3"/>
      <rect x="28" y="30" width="6" height="4" rx="0.5" fill="white" opacity="0.3"/>
      <rect x="12" y="36" width="6" height="4" rx="0.5" fill="white" opacity="0.25"/>
      <rect x="20" y="36" width="6" height="4" rx="0.5" fill="white" opacity="0.25"/>
      <rect x="12" y="42" width="6" height="8" rx="0.5" fill="white" opacity="0.2"/>
      <rect x="20" y="42" width="14" height="4" rx="0.5" fill="white" opacity="0.35"/>
      <rect x="42" y="36" width="6" height="16" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="50" y="28" width="6" height="24" rx="1" fill="currentColor" opacity="0.8"/>
      <rect x="42" y="20" width="14" height="6" rx="1" fill="currentColor" opacity="0.5"/>
      <path d="M44 18L56 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M52 10H56V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'Marketing digital': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Megáfono con estadísticas */}
      <path d="M12 28L36 18V46L12 36V28Z" fill="currentColor"/>
      <ellipse cx="12" cy="32" rx="4" ry="6" fill="currentColor"/>
      <path d="M36 22L36 42" stroke="white" strokeWidth="1" opacity="0.3"/>
      <rect x="6" y="30" width="6" height="8" rx="1" fill="currentColor" opacity="0.8"/>
      <path d="M40 26C44 28 44 36 40 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M44 22C50 26 50 38 44 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M48 18C56 24 56 40 48 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <circle cx="52" cy="12" r="4" fill="currentColor" opacity="0.6"/>
      <circle cx="58" cy="20" r="3" fill="currentColor" opacity="0.5"/>
      <circle cx="56" cy="48" r="3" fill="currentColor" opacity="0.4"/>
      <path d="M18 48L22 58L24 54L28 56L24 48L18 48Z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  'Traducción': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Globo con idiomas */}
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2.5"/>
      <ellipse cx="32" cy="32" rx="8" ry="18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 32H50" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 24H48" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <path d="M16 40H48" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <path d="M20 22L24 12L28 22M21 19H27" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M42 44H50M46 40V52M44 48H48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 28L34 32L30 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <circle cx="10" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="54" cy="48" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  'Otro': (
    <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
      {/* Herramientas múltiples */}
      <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M26 26L38 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 36L40 40L36 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="46" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="46" cy="24" r="4" fill="currentColor" opacity="0.5"/>
      <path d="M46 14V16M46 32V34M36 24H38M54 24H56M40 18L41 19M51 29L52 30M40 30L41 29M51 19L52 18" stroke="currentColor" strokeWidth="2"/>
      <path d="M14 40L28 54" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M28 54L32 58L36 54L28 46" fill="currentColor"/>
      <rect x="10" y="36" width="8" height="4" rx="1" fill="currentColor" transform="rotate(45 10 36)"/>
      <circle cx="50" cy="44" r="2" fill="currentColor" opacity="0.5"/>
      <circle cx="54" cy="50" r="1.5" fill="currentColor" opacity="0.4"/>
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

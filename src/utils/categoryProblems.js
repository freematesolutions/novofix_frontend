/**
 * Problemáticas y situaciones predefinidas por categoría de servicio
 * Cada categoría tiene un conjunto de opciones visuales para que el cliente
 * pueda seleccionar rápidamente sin necesidad de escribir descripción
 * 
 * Estructura:
 * - id: Identificador único del problema
 * - icon: Emoji representativo
 * - translationKey: Clave para i18n (ui.categoryProblems.[category].[id])
 */

export const CATEGORY_PROBLEMS = {
  'Plomería': [
    { id: 'leak', icon: '💧' },
    { id: 'cloggedDrain', icon: '🚿' },
    { id: 'toiletIssue', icon: '🚽' },
    { id: 'faucetDrip', icon: '🚰' },
    { id: 'pipeRepair', icon: '🔧' },
    { id: 'waterHeater', icon: '🔥' },
    { id: 'waterTank', icon: '🏠' },
    { id: 'waterPump', icon: '⚙️' },
    { id: 'sinkInstall', icon: '🪥' },
    { id: 'other', icon: '➕' }
  ],
  'Electricidad': [
    { id: 'nopower', icon: '⚡' },
    { id: 'shortCircuit', icon: '💥' },
    { id: 'outletIssue', icon: '🔌' },
    { id: 'lightingInstall', icon: '💡' },
    { id: 'switchRepair', icon: '🔘' },
    { id: 'panelUpgrade', icon: '📦' },
    { id: 'wiringRepair', icon: '🔗' },
    { id: 'ceilingFan', icon: '🌀' },
    { id: 'groundingIssue', icon: '🏠' },
    { id: 'other', icon: '➕' }
  ],
  'Carpintería': [
    { id: 'doorRepair', icon: '🚪' },
    { id: 'furnitureRepair', icon: '🪑' },
    { id: 'customFurniture', icon: '🛋️' },
    { id: 'cabinetInstall', icon: '🗄️' },
    { id: 'woodFloor', icon: '🪵' },
    { id: 'windowFrame', icon: '🪟' },
    { id: 'closetBuild', icon: '👔' },
    { id: 'shelfInstall', icon: '📚' },
    { id: 'deckPatio', icon: '🏡' },
    { id: 'other', icon: '➕' }
  ],
  'Pintura': [
    { id: 'interiorPaint', icon: '🏠' },
    { id: 'exteriorPaint', icon: '🏢' },
    { id: 'wallRepair', icon: '🧱' },
    { id: 'ceilingPaint', icon: '⬆️' },
    { id: 'woodPaint', icon: '🪵' },
    { id: 'metalPaint', icon: '🔩' },
    { id: 'texturePaint', icon: '🎨' },
    { id: 'waterproofing', icon: '💧' },
    { id: 'decorative', icon: '✨' },
    { id: 'other', icon: '➕' }
  ],
  'Limpieza': [
    { id: 'deepClean', icon: '🧹' },
    { id: 'regularClean', icon: '🏠' },
    { id: 'postConstruction', icon: '🏗️' },
    { id: 'carpetClean', icon: '🧽' },
    { id: 'windowClean', icon: '🪟' },
    { id: 'upholsteryClean', icon: '🛋️' },
    { id: 'kitchenDeep', icon: '🍳' },
    { id: 'bathroomDeep', icon: '🚿' },
    { id: 'moveInOut', icon: '📦' },
    { id: 'other', icon: '➕' }
  ],
  'Jardinería': [
    { id: 'lawnMowing', icon: '🌿' },
    { id: 'treeTrimming', icon: '🌳' },
    { id: 'gardenDesign', icon: '🌸' },
    { id: 'irrigation', icon: '💧' },
    { id: 'pestControl', icon: '🐛' },
    { id: 'landscaping', icon: '🏡' },
    { id: 'hedgeTrimming', icon: '✂️' },
    { id: 'plantCare', icon: '🪴' },
    { id: 'soilWork', icon: '🌱' },
    { id: 'other', icon: '➕' }
  ],
  'Cerrajería': [
    { id: 'lockout', icon: '🔐' },
    { id: 'lockChange', icon: '🔒' },
    { id: 'keyDuplicate', icon: '🔑' },
    { id: 'lockRepair', icon: '🔧' },
    { id: 'securityUpgrade', icon: '🛡️' },
    { id: 'safeLock', icon: '🗄️' },
    { id: 'carLock', icon: '🚗' },
    { id: 'padlock', icon: '🔓' },
    { id: 'digitalLock', icon: '📱' },
    { id: 'other', icon: '➕' }
  ],
  'Albañilería': [
    { id: 'wallBuild', icon: '🧱' },
    { id: 'floorTile', icon: '🔲' },
    { id: 'roofRepair', icon: '🏠' },
    { id: 'concreteWork', icon: '🏗️' },
    { id: 'plastering', icon: '🪣' },
    { id: 'demolition', icon: '💥' },
    { id: 'foundationRepair', icon: '🏛️' },
    { id: 'stairsBuild', icon: '🪜' },
    { id: 'waterproofing', icon: '💧' },
    { id: 'other', icon: '➕' }
  ],
  'Reparación de electrodomésticos': [
    { id: 'washerRepair', icon: '🧺' },
    { id: 'dryerRepair', icon: '👕' },
    { id: 'fridgeRepair', icon: '🧊' },
    { id: 'ovenRepair', icon: '🍳' },
    { id: 'microwaveRepair', icon: '📡' },
    { id: 'dishwasherRepair', icon: '🍽️' },
    { id: 'tvRepair', icon: '📺' },
    { id: 'smallAppliance', icon: '🔌' },
    { id: 'maintenance', icon: '🔧' },
    { id: 'other', icon: '➕' }
  ],
  'Instalación de aire acondicionado': [
    { id: 'acInstall', icon: '❄️' },
    { id: 'acRepair', icon: '🔧' },
    { id: 'acMaintenance', icon: '🧹' },
    { id: 'acNotCooling', icon: '🌡️' },
    { id: 'acNoise', icon: '🔊' },
    { id: 'acLeak', icon: '💧' },
    { id: 'gasRecharge', icon: '⛽' },
    { id: 'ductClean', icon: '🌬️' },
    { id: 'thermostat', icon: '🌡️' },
    { id: 'other', icon: '➕' }
  ],
  'Mudanzas': [
    { id: 'localMove', icon: '🏠' },
    { id: 'longDistance', icon: '🚛' },
    { id: 'packingService', icon: '📦' },
    { id: 'furnitureOnly', icon: '🛋️' },
    { id: 'officeMove', icon: '🏢' },
    { id: 'heavyItems', icon: '🏋️' },
    { id: 'storage', icon: '🗄️' },
    { id: 'pianoMove', icon: '🎹' },
    { id: 'applianceMove', icon: '🧊' },
    { id: 'other', icon: '➕' }
  ],
  'Fumigación': [
    { id: 'insects', icon: '🐜' },
    { id: 'rodents', icon: '🐀' },
    { id: 'termites', icon: '🪲' },
    { id: 'cockroaches', icon: '🪳' },
    { id: 'bedBugs', icon: '🛏️' },
    { id: 'mosquitoes', icon: '🦟' },
    { id: 'preventive', icon: '🛡️' },
    { id: 'disinfection', icon: '🧴' },
    { id: 'gardenPest', icon: '🌿' },
    { id: 'other', icon: '➕' }
  ],
  'Tecnología e informática': [
    { id: 'pcRepair', icon: '💻' },
    { id: 'virusRemoval', icon: '🦠' },
    { id: 'networkSetup', icon: '📶' },
    { id: 'dataRecovery', icon: '💾' },
    { id: 'softwareInstall', icon: '📀' },
    { id: 'printerSetup', icon: '🖨️' },
    { id: 'emailSetup', icon: '📧' },
    { id: 'smartHome', icon: '🏠' },
    { id: 'securitySetup', icon: '🔐' },
    { id: 'other', icon: '➕' }
  ],
  'Clases particulares': [
    { id: 'math', icon: '🔢' },
    { id: 'language', icon: '📚' },
    { id: 'science', icon: '🔬' },
    { id: 'music', icon: '🎵' },
    { id: 'art', icon: '🎨' },
    { id: 'sports', icon: '⚽' },
    { id: 'programming', icon: '💻' },
    { id: 'examPrep', icon: '📝' },
    { id: 'tutoring', icon: '👨‍🏫' },
    { id: 'other', icon: '➕' }
  ],
  'Belleza y estética': [
    { id: 'haircut', icon: '✂️' },
    { id: 'hairColor', icon: '🎨' },
    { id: 'manicure', icon: '💅' },
    { id: 'pedicure', icon: '🦶' },
    { id: 'facial', icon: '😊' },
    { id: 'makeup', icon: '💄' },
    { id: 'waxing', icon: '🌸' },
    { id: 'massage', icon: '💆' },
    { id: 'bridal', icon: '👰' },
    { id: 'other', icon: '➕' }
  ],
  'Mecánica automotriz': [
    { id: 'oilChange', icon: '🛢️' },
    { id: 'brakeRepair', icon: '🛑' },
    { id: 'engineDiag', icon: '🔍' },
    { id: 'tireService', icon: '🛞' },
    { id: 'batteryService', icon: '🔋' },
    { id: 'acRepair', icon: '❄️' },
    { id: 'transmission', icon: '⚙️' },
    { id: 'electrical', icon: '⚡' },
    { id: 'tuneUp', icon: '🔧' },
    { id: 'other', icon: '➕' }
  ],
  'Fotografía': [
    { id: 'eventPhoto', icon: '🎉' },
    { id: 'wedding', icon: '💒' },
    { id: 'portrait', icon: '👤' },
    { id: 'product', icon: '📸' },
    { id: 'realEstate', icon: '🏠' },
    { id: 'corporate', icon: '👔' },
    { id: 'family', icon: '👨‍👩‍👧' },
    { id: 'videoRecord', icon: '🎬' },
    { id: 'editing', icon: '🖼️' },
    { id: 'other', icon: '➕' }
  ],
  'Catering': [
    { id: 'wedding', icon: '💒' },
    { id: 'corporate', icon: '🏢' },
    { id: 'birthday', icon: '🎂' },
    { id: 'buffet', icon: '🍽️' },
    { id: 'cocktail', icon: '🍸' },
    { id: 'bbq', icon: '🍖' },
    { id: 'breakfast', icon: '🍳' },
    { id: 'desserts', icon: '🧁' },
    { id: 'dietary', icon: '🥗' },
    { id: 'other', icon: '➕' }
  ],
  'Construcción': [
    { id: 'newBuild', icon: '🏗️' },
    { id: 'renovation', icon: '🔨' },
    { id: 'extension', icon: '🏠' },
    { id: 'roofing', icon: '🏛️' },
    { id: 'foundation', icon: '🧱' },
    { id: 'structural', icon: '📐' },
    { id: 'permits', icon: '📋' },
    { id: 'inspection', icon: '🔍' },
    { id: 'demolition', icon: '💥' },
    { id: 'other', icon: '➕' }
  ],
  'Decoración': [
    { id: 'interiorDesign', icon: '🏠' },
    { id: 'furnitureSelect', icon: '🛋️' },
    { id: 'colorConsult', icon: '🎨' },
    { id: 'curtains', icon: '🪟' },
    { id: 'lighting', icon: '💡' },
    { id: 'wallArt', icon: '🖼️' },
    { id: 'eventDecor', icon: '🎉' },
    { id: 'staging', icon: '📷' },
    { id: 'organization', icon: '📦' },
    { id: 'other', icon: '➕' }
  ],
  'Diseño gráfico': [
    { id: 'logoDesign', icon: '🎯' },
    { id: 'branding', icon: '✨' },
    { id: 'webDesign', icon: '🌐' },
    { id: 'socialMedia', icon: '📱' },
    { id: 'printDesign', icon: '📄' },
    { id: 'packaging', icon: '📦' },
    { id: 'illustration', icon: '🎨' },
    { id: 'infographic', icon: '📊' },
    { id: 'videoEdit', icon: '🎬' },
    { id: 'other', icon: '➕' }
  ],
  'Asesoría legal': [
    { id: 'contracts', icon: '📜' },
    { id: 'divorce', icon: '⚖️' },
    { id: 'realEstate', icon: '🏠' },
    { id: 'business', icon: '🏢' },
    { id: 'immigration', icon: '✈️' },
    { id: 'labor', icon: '👔' },
    { id: 'criminal', icon: '🔒' },
    { id: 'inheritance', icon: '📋' },
    { id: 'trademark', icon: '®️' },
    { id: 'other', icon: '➕' }
  ],
  'Contabilidad': [
    { id: 'taxReturn', icon: '📊' },
    { id: 'bookkeeping', icon: '📚' },
    { id: 'audit', icon: '🔍' },
    { id: 'payroll', icon: '💰' },
    { id: 'businessPlan', icon: '📋' },
    { id: 'invoicing', icon: '🧾' },
    { id: 'taxPlanning', icon: '📅' },
    { id: 'startup', icon: '🚀' },
    { id: 'consulting', icon: '💼' },
    { id: 'other', icon: '➕' }
  ],
  'Marketing digital': [
    { id: 'seo', icon: '🔍' },
    { id: 'socialMedia', icon: '📱' },
    { id: 'ads', icon: '📢' },
    { id: 'emailMarketing', icon: '📧' },
    { id: 'contentCreate', icon: '✍️' },
    { id: 'analytics', icon: '📊' },
    { id: 'ecommerce', icon: '🛒' },
    { id: 'branding', icon: '🎯' },
    { id: 'strategy', icon: '📋' },
    { id: 'other', icon: '➕' }
  ],
  'Traducción': [
    { id: 'document', icon: '📄' },
    { id: 'legal', icon: '⚖️' },
    { id: 'medical', icon: '🏥' },
    { id: 'technical', icon: '⚙️' },
    { id: 'website', icon: '🌐' },
    { id: 'subtitles', icon: '🎬' },
    { id: 'interpreter', icon: '🗣️' },
    { id: 'certified', icon: '📜' },
    { id: 'localization', icon: '🌍' },
    { id: 'other', icon: '➕' }
  ],
  'Otro': [
    { id: 'consultation', icon: '💬' },
    { id: 'repair', icon: '🔧' },
    { id: 'installation', icon: '📦' },
    { id: 'maintenance', icon: '🛠️' },
    { id: 'emergency', icon: '🚨' },
    { id: 'quote', icon: '💰' },
    { id: 'inspection', icon: '🔍' },
    { id: 'advice', icon: '💡' },
    { id: 'custom', icon: '✨' },
    { id: 'other', icon: '➕' }
  ]
};

/**
 * Categorías que pueden ofrecer servicios remotos/virtuales
 * Para estas categorías, la ubicación será OPCIONAL
 */
export const REMOTE_CATEGORIES = [
  'Tecnología e informática',  // Soporte remoto, configuración online
  'Clases particulares',       // Clases online
  'Diseño gráfico',            // Trabajo 100% remoto
  'Asesoría legal',            // Consultas virtuales
  'Contabilidad',              // Servicios remotos
  'Marketing digital',         // Trabajo 100% remoto
  'Traducción'                 // Trabajo 100% remoto
];

/**
 * Verifica si una categoría requiere ubicación obligatoria
 * @param {string} category - Nombre de la categoría
 * @returns {boolean} true si requiere ubicación, false si es opcional
 */
export function categoryRequiresLocation(category) {
  return !REMOTE_CATEGORIES.includes(category);
}

/**
 * Obtiene los problemas disponibles para una categoría
 * @param {string} category - Nombre de la categoría
 * @returns {Array} Lista de problemas con id, icon y translationKey
 */
export function getProblemsForCategory(category) {
  const problems = CATEGORY_PROBLEMS[category];
  
  if (!problems) {
    return CATEGORY_PROBLEMS['Otro'].map(problem => ({
      ...problem,
      translationKey: `ui.categoryProblems.Otro.${problem.id}`
    }));
  }
  
  return problems.map(problem => ({
    ...problem,
    translationKey: `ui.categoryProblems.${category}.${problem.id}`
  }));
}

/**
 * Genera la descripción automática basada en problemas seleccionados
 * @param {Array} selectedProblems - Lista de IDs de problemas seleccionados
 * @param {string} category - Categoría del servicio
 * @param {Function} t - Función de traducción i18n
 * @returns {string} Descripción generada
 */
export function generateDescriptionFromProblems(selectedProblems, category, t) {
  if (!selectedProblems || selectedProblems.length === 0) return '';
  
  const problemNames = selectedProblems.map(problemId => {
    const key = `ui.categoryProblems.${category}.${problemId}.name`;
    return t(key, { defaultValue: problemId });
  });
  
  return problemNames.join(', ');
}

export default CATEGORY_PROBLEMS;

/**
 * Problemáticas y situaciones predefinidas por categoría de servicio (22 categorías)
 * Cada categoría tiene un conjunto de opciones visuales para que el cliente
 * pueda seleccionar rápidamente sin necesidad de escribir descripción
 * 
 * Estructura:
 * - id: Identificador único del problema
 * - icon: Emoji representativo
 * - translationKey: Clave para i18n (ui.categoryProblems.[category].[id])
 */

export const CATEGORY_PROBLEMS = {
  'Reparaciones': [
    { id: 'quickFix', icon: '⚡' },
    { id: 'minorRepairs', icon: '🛠️' },
    { id: 'assembly', icon: '🧩' },
    { id: 'wallMount', icon: '🖼️' },
    { id: 'drywallPatch', icon: '🧱' },
    { id: 'doorAdjust', icon: '🚪' },
    { id: 'furnitureAssembly', icon: '🪑' },
    { id: 'generalMaintenance', icon: '🧰' },
    { id: 'oddJobs', icon: '✅' },
    { id: 'other', icon: '➕' }
  ],
  'Plomería': [
    { id: 'leak', icon: '💧' },
    { id: 'cloggedDrain', icon: '🚿' },
    { id: 'toiletIssue', icon: '🚽' },
    { id: 'faucetDrip', icon: '🚰' },
    { id: 'pipeRepair', icon: '🔧' },
    { id: 'waterHeater', icon: '🔥' },
    { id: 'waterPressure', icon: '🌊' },
    { id: 'fixtureInstall', icon: '🧰' },
    { id: 'sewerBackup', icon: '🌀' },
    { id: 'other', icon: '➕' }
  ],
  'Electricidad': [
    { id: 'noPower', icon: '⚡' },
    { id: 'shortCircuit', icon: '💥' },
    { id: 'outletIssue', icon: '🔌' },
    { id: 'lightingInstall', icon: '💡' },
    { id: 'switchRepair', icon: '🔘' },
    { id: 'panelUpgrade', icon: '📦' },
    { id: 'wiringRepair', icon: '🔗' },
    { id: 'ceilingFan', icon: '🌀' },
    { id: 'inspection', icon: '🔍' },
    { id: 'other', icon: '➕' }
  ],
  'Climatización': [
    { id: 'acInstall', icon: '❄️' },
    { id: 'acRepair', icon: '🔧' },
    { id: 'acMaintenance', icon: '🧹' },
    { id: 'notCooling', icon: '🌡️' },
    { id: 'heatingIssue', icon: '🔥' },
    { id: 'thermostat', icon: '🌡️' },
    { id: 'ductClean', icon: '🌬️' },
    { id: 'airQuality', icon: '🫧' },
    { id: 'strangeNoise', icon: '🔊' },
    { id: 'other', icon: '➕' }
  ],
  'Cerrajería': [
    { id: 'lockout', icon: '🔐' },
    { id: 'lockChange', icon: '🔒' },
    { id: 'keyDuplicate', icon: '🔑' },
    { id: 'lockRepair', icon: '🔧' },
    { id: 'securityUpgrade', icon: '🛡️' },
    { id: 'smartLock', icon: '📱' },
    { id: 'carLock', icon: '🚗' },
    { id: 'safeLock', icon: '🗄️' },
    { id: 'rekey', icon: '🔁' },
    { id: 'other', icon: '➕' }
  ],
  'Mantenimiento': [
    { id: 'preventive', icon: '🛡️' },
    { id: 'repairs', icon: '🔧' },
    { id: 'inspection', icon: '🔍' },
    { id: 'gutterClean', icon: '🧹' },
    { id: 'applianceCheck', icon: '📋' },
    { id: 'hvacFilter', icon: '🌬️' },
    { id: 'plumbingCheck', icon: '💧' },
    { id: 'electricalCheck', icon: '⚡' },
    { id: 'seasonalPrep', icon: '📆' },
    { id: 'other', icon: '➕' }
  ],
  'Control de Plagas': [
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
  'Limpieza': [
    { id: 'deepClean', icon: '🧹' },
    { id: 'regularClean', icon: '🏠' },
    { id: 'postConstruction', icon: '🏗️' },
    { id: 'moveInOut', icon: '📦' },
    { id: 'carpetClean', icon: '🧽' },
    { id: 'windowClean', icon: '🪟' },
    { id: 'kitchenDeep', icon: '🍳' },
    { id: 'bathroomDeep', icon: '🚿' },
    { id: 'disinfection', icon: '🧴' },
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
  'Gabinetes': [
    { id: 'cabinetInstall', icon: '🗄️' },
    { id: 'cabinetRepair', icon: '🔧' },
    { id: 'kitchenCabinets', icon: '🍳' },
    { id: 'bathroomCabinets', icon: '🚿' },
    { id: 'closetBuild', icon: '👔' },
    { id: 'customDesign', icon: '📐' },
    { id: 'doorReplacement', icon: '🚪' },
    { id: 'hardwareUpdate', icon: '🔩' },
    { id: 'refinishing', icon: '✨' },
    { id: 'other', icon: '➕' }
  ],
  'Pisos': [
    { id: 'floorInstall', icon: '🧱' },
    { id: 'floorRepair', icon: '🔧' },
    { id: 'hardwood', icon: '🪵' },
    { id: 'laminate', icon: '📏' },
    { id: 'tile', icon: '🔲' },
    { id: 'vinyl', icon: '⬜' },
    { id: 'polishing', icon: '✨' },
    { id: 'leveling', icon: '📐' },
    { id: 'groutRepair', icon: '🧰' },
    { id: 'other', icon: '➕' }
  ],
  'Cocina': [
    { id: 'applianceInstall', icon: '🍳' },
    { id: 'applianceRepair', icon: '🔧' },
    { id: 'countertops', icon: '🧱' },
    { id: 'sinkFaucet', icon: '🚰' },
    { id: 'backsplash', icon: '🎨' },
    { id: 'lighting', icon: '💡' },
    { id: 'ventilation', icon: '🌬️' },
    { id: 'gasLine', icon: '🔥' },
    { id: 'layout', icon: '📐' },
    { id: 'other', icon: '➕' }
  ],
  'Remodelación': [
    { id: 'kitchenRemodel', icon: '🍳' },
    { id: 'bathroomRemodel', icon: '🚿' },
    { id: 'roomAddition', icon: '🏠' },
    { id: 'flooring', icon: '🪵' },
    { id: 'painting', icon: '🎨' },
    { id: 'layoutChange', icon: '📐' },
    { id: 'demolition', icon: '💥' },
    { id: 'permits', icon: '📋' },
    { id: 'projectManagement', icon: '🗂️' },
    { id: 'other', icon: '➕' }
  ],
  'Jardinería': [
    { id: 'lawnCare', icon: '🌿' },
    { id: 'treeTrimming', icon: '🌳' },
    { id: 'planting', icon: '🌱' },
    { id: 'irrigation', icon: '💧' },
    { id: 'landscapeDesign', icon: '📐' },
    { id: 'weedControl', icon: '🧹' },
    { id: 'mulching', icon: '🍂' },
    { id: 'sodInstall', icon: '🟩' },
    { id: 'gardenBeds', icon: '🌺' },
    { id: 'other', icon: '➕' }
  ],
  'Piscinas': [
    { id: 'poolCleaning', icon: '🏊' },
    { id: 'waterTest', icon: '🧪' },
    { id: 'pumpRepair', icon: '⚙️' },
    { id: 'filterService', icon: '🧰' },
    { id: 'leakDetection', icon: '💧' },
    { id: 'poolOpening', icon: '☀️' },
    { id: 'poolClosing', icon: '❄️' },
    { id: 'tileRepair', icon: '🧱' },
    { id: 'equipmentInstall', icon: '📦' },
    { id: 'other', icon: '➕' }
  ],
  'Techado': [
    { id: 'roofRepair', icon: '🏠' },
    { id: 'roofInstall', icon: '🏗️' },
    { id: 'leakFix', icon: '💧' },
    { id: 'shingleReplace', icon: '🧱' },
    { id: 'roofInspection', icon: '🔍' },
    { id: 'gutterInstall', icon: '🧹' },
    { id: 'flashingRepair', icon: '🔩' },
    { id: 'waterproofing', icon: '🛡️' },
    { id: 'stormDamage', icon: '⛈️' },
    { id: 'other', icon: '➕' }
  ],
  'Cercas': [
    { id: 'fenceInstall', icon: '🧱' },
    { id: 'fenceRepair', icon: '🛠️' },
    { id: 'woodFence', icon: '🪵' },
    { id: 'vinylFence', icon: '⬜' },
    { id: 'metalFence', icon: '🔩' },
    { id: 'gateInstall', icon: '🚪' },
    { id: 'fencePainting', icon: '🎨' },
    { id: 'privacyUpgrade', icon: '🛡️' },
    { id: 'fenceRemoval', icon: '🧰' },
    { id: 'other', icon: '➕' }
  ],
  'Pérgolas': [
    { id: 'pergolaBuild', icon: '🏗️' },
    { id: 'pergolaRepair', icon: '🔧' },
    { id: 'shadeInstall', icon: '⛱️' },
    { id: 'woodPergola', icon: '🪵' },
    { id: 'metalPergola', icon: '🧱' },
    { id: 'roofCover', icon: '🏠' },
    { id: 'lighting', icon: '💡' },
    { id: 'staining', icon: '🎨' },
    { id: 'customDesign', icon: '📐' },
    { id: 'other', icon: '➕' }
  ],
  'Ventanas': [
    { id: 'windowInstall', icon: '🪟' },
    { id: 'windowRepair', icon: '🔧' },
    { id: 'glassReplace', icon: '🔲' },
    { id: 'screenRepair', icon: '🧰' },
    { id: 'weatherSeal', icon: '🌧️' },
    { id: 'windowTint', icon: '🕶️' },
    { id: 'shutterInstall', icon: '🏠' },
    { id: 'blindsInstall', icon: '📏' },
    { id: 'energyEfficient', icon: '♻️' },
    { id: 'other', icon: '➕' }
  ],
  'Construcción': [
    { id: 'newBuild', icon: '🏗️' },
    { id: 'foundation', icon: '🧱' },
    { id: 'framing', icon: '🔨' },
    { id: 'concrete', icon: '🪨' },
    { id: 'steelWork', icon: '🔩' },
    { id: 'drywall', icon: '📏' },
    { id: 'permits', icon: '📋' },
    { id: 'sitePrep', icon: '🚜' },
    { id: 'projectManagement', icon: '🗂️' },
    { id: 'other', icon: '➕' }
  ],
  'Mudanzas': [
    { id: 'localMove', icon: '🏠' },
    { id: 'longDistance', icon: '🗺️' },
    { id: 'packing', icon: '📦' },
    { id: 'unpacking', icon: '📭' },
    { id: 'furnitureMove', icon: '🛋️' },
    { id: 'storageService', icon: '🏢' },
    { id: 'pianoMove', icon: '🎹' },
    { id: 'officeMove', icon: '💼' },
    { id: 'disposal', icon: '🗑️' },
    { id: 'other', icon: '➕' }
  ],
  'Seguridad': [
    { id: 'cameraInstall', icon: '📹' },
    { id: 'alarmSystem', icon: '🚨' },
    { id: 'motionSensors', icon: '📡' },
    { id: 'accessControl', icon: '🔑' },
    { id: 'smartHome', icon: '📱' },
    { id: 'intercom', icon: '🔔' },
    { id: 'securityLighting', icon: '💡' },
    { id: 'monitoring', icon: '🖥️' },
    { id: 'assessment', icon: '🔍' },
    { id: 'other', icon: '➕' }
  ]
};

/**
 * Categorías que pueden ofrecer servicios remotos/virtuales
 * Para estas categorías, la ubicación será OPCIONAL
 */
export const REMOTE_CATEGORIES = [];

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
    return [];
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

// Small helpers to safely extract arrays from API responses

function get(obj, path) {
  try {
    return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  } catch {
    return undefined;
  }
}

/**
 * getArray(obj, candidates)
 * - Tries multiple nested paths and returns the first value that is an array.
 * - If obj itself is an array, returns it.
 * - Otherwise returns [].
 * @param {any} obj
 * @param {Array<Array<string>>} candidates list of paths e.g. [['data','requests'], ['requests']]
 */
export function getArray(obj, candidates = []) {
  if (Array.isArray(obj)) return obj;
  for (const path of candidates) {
    const val = get(obj, path);
    if (Array.isArray(val)) return val;
  }
  return [];
}

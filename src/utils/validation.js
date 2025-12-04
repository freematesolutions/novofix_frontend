export function isEmail(value) {
  if (typeof value !== 'string') return false;
  // Simple but effective email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function required(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

export function minLength(value, len) {
  if (typeof value !== 'string') return false;
  return value.length >= len;
}

export function validate(fields, rules) {
  // fields: { name: value }
  // rules:  { name: [(value)=>string|undefined] }
  const errors = {};
  Object.entries(rules).forEach(([name, validators]) => {
    const value = fields[name];
    for (const v of validators) {
      const msg = v(value, fields);
      if (msg) { errors[name] = msg; break; }
    }
  });
  return errors;
}

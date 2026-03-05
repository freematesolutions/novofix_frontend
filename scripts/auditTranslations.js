#!/usr/bin/env node
/* global process */
/**
 * 🔍 TRANSLATION AUDIT SCRIPT
 * Cross-checks all t() keys used in source code against ES/EN translation JSONs.
 *
 * Usage:
 *   node scripts/auditTranslations.js          # Full audit
 *   node scripts/auditTranslations.js --fix     # Show fix suggestions
 *   node scripts/auditTranslations.js --summary # Only show summary
 *
 * What it checks:
 *   1. Static t('key') calls → must exist in BOTH ES and EN JSONs
 *   2. Dynamic t(`prefix.${var}`) → expands known enumerable sets
 *   3. Keys in JSON but never used in code (potential dead translations)
 *   4. Keys in ES but missing in EN, and vice versa (cross-locale sync)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.resolve(__dirname, '..', 'src');

// ─── Config ──────────────────────────────────────────────────────────────────

const ES_PATH = path.join(CLIENT_SRC, 'locales', 'es', 'translation.json');
const EN_PATH = path.join(CLIENT_SRC, 'locales', 'en', 'translation.json');

const FILE_EXTENSIONS = ['.jsx', '.js'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'locales', 'assets'];

// Dynamic key patterns that are enumerable — the script will expand these
// by reading the corresponding JSON subtree
const DYNAMIC_ENUMERABLE_PREFIXES = [
  'home.categories.',
  'home.categoryDescriptions.',
  'home.carousel.taglines.',
  'ui.categoryProblems.',
  'urgency.',
  'provider.plan.planNames.',
  'provider.requestDetail.proposalStatus.',
  'provider.reviews.categories.',
  'testimonials.source.',
  'admin.dashboard.status.',
];

// Dynamic patterns that cannot be statically audited (config-driven)
const DYNAMIC_SKIP_PREFIXES = [
  'ui.requestWizard.steps.',
  'ui.reviewForm.categories.',
  'shared.bookings.',
  'onboarding.',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Flatten nested JSON into dot-notation keys */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** Get value at dot-path from nested object */
function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

/** Recursively find all source files */
function findSourceFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(fullPath));
    } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Extract all t() keys from source code */
function extractKeysFromSource(files) {
  const staticKeys = new Set();
  const dynamicPatterns = [];
  const keyLocations = {}; // key → [file:line, ...]

  // Regex patterns for t() calls
  const staticRegex = /\bt\(\s*['"]([^'"]+)['"]/g;
  const dynamicRegex = /\bt\(\s*`([^`]+)`/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relPath = path.relative(CLIENT_SRC, file).replace(/\\/g, '/');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Static keys: t('key') or t("key")
      let match;
      staticRegex.lastIndex = 0;
      while ((match = staticRegex.exec(line)) !== null) {
        const key = match[1];
        staticKeys.add(key);
        if (!keyLocations[key]) keyLocations[key] = [];
        keyLocations[key].push(`${relPath}:${i + 1}`);
      }

      // Dynamic keys: t(`prefix.${var}`)
      dynamicRegex.lastIndex = 0;
      while ((match = dynamicRegex.exec(line)) !== null) {
        const template = match[1];
        if (template.includes('${')) {
          dynamicPatterns.push({
            template,
            location: `${relPath}:${i + 1}`,
          });
        }
      }
    }
  }

  return { staticKeys, dynamicPatterns, keyLocations };
}

/** Expand dynamic patterns using JSON data */
function expandDynamicKeys(dynamicPatterns, esData) {
  const expandedKeys = new Set();
  const unresolvable = [];

  for (const { template, location } of dynamicPatterns) {
    let resolved = false;

    // Check if it matches a known enumerable prefix
    for (const prefix of DYNAMIC_ENUMERABLE_PREFIXES) {
      if (template.startsWith(prefix.slice(0, -1)) || template.includes(prefix.replace(/\.$/, ''))) {
        // Get all keys under this prefix in the JSON
        const prefixPath = prefix.slice(0, -1); // Remove trailing dot
        const subtree = getNestedValue(esData, prefixPath);
        if (subtree && typeof subtree === 'object') {
          for (const subKey of flattenKeys(subtree, prefixPath)) {
            expandedKeys.add(subKey);
          }
        }
        resolved = true;
        break;
      }
    }

    if (!resolved) {
      // Check if it's a known skip pattern
      const isSkippable = DYNAMIC_SKIP_PREFIXES.some(p => template.includes(p.replace(/\.$/, '')));
      if (!isSkippable) {
        unresolvable.push({ template, location });
      }
    }
  }

  return { expandedKeys, unresolvable };
}

// ─── Main Audit ──────────────────────────────────────────────────────────────

function runAudit() {
  const args = process.argv.slice(2);
  const _showFix = args.includes('--fix');
  const summaryOnly = args.includes('--summary');

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🔍 TRANSLATION AUDIT — novofix                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Load translation files
  const esData = loadJSON(ES_PATH);
  const enData = loadJSON(EN_PATH);
  const esKeys = new Set(flattenKeys(esData));
  const enKeys = new Set(flattenKeys(enData));

  console.log(`📄 ES translation: ${esKeys.size} keys`);
  console.log(`📄 EN translation: ${enKeys.size} keys`);

  // 2. Find all source files and extract keys
  const sourceFiles = findSourceFiles(CLIENT_SRC);
  console.log(`📁 Source files scanned: ${sourceFiles.length}\n`);

  const { staticKeys, dynamicPatterns, keyLocations } = extractKeysFromSource(sourceFiles);
  console.log(`🔑 Static t() keys found: ${staticKeys.size}`);
  console.log(`🔄 Dynamic t() patterns found: ${dynamicPatterns.length}`);

  // 3. Expand dynamic keys
  const { expandedKeys, unresolvable } = expandDynamicKeys(dynamicPatterns, esData);
  console.log(`🔓 Dynamic keys expanded: ${expandedKeys.size}`);
  if (unresolvable.length > 0) {
    console.log(`⚠️  Unresolvable dynamic patterns: ${unresolvable.length}`);
  }

  // Combine all keys used in code
  const allCodeKeys = new Set([...staticKeys, ...expandedKeys]);
  console.log(`📊 Total unique keys to check: ${allCodeKeys.size}\n`);

  // ─── Check 1: Keys used in code but missing in translations ──────────

  const missingInES = [];
  const missingInEN = [];

  for (const key of allCodeKeys) {
    if (!esKeys.has(key)) missingInES.push(key);
    if (!enKeys.has(key)) missingInEN.push(key);
  }

  // ─── Check 2: Cross-locale sync (ES has, EN doesn't, and vice versa) ─

  const inESnotEN = [];
  const inENnotES = [];

  for (const key of esKeys) {
    if (!enKeys.has(key)) inESnotEN.push(key);
  }
  for (const key of enKeys) {
    if (!esKeys.has(key)) inENnotES.push(key);
  }

  // ─── Check 3: Dead translations (in JSON but never used in code) ─────

  const deadInES = [];
  for (const key of esKeys) {
    if (!allCodeKeys.has(key)) {
      // Check if any static key is a prefix (parent object)
      const isParent = [...allCodeKeys].some(ck => ck.startsWith(key + '.'));
      // Check if it's covered by a dynamic pattern
      const isDynamic = DYNAMIC_ENUMERABLE_PREFIXES.some(p => key.startsWith(p)) ||
                       DYNAMIC_SKIP_PREFIXES.some(p => key.startsWith(p));
      if (!isParent && !isDynamic) {
        deadInES.push(key);
      }
    }
  }

  // ─── Report ──────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                       📋 RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Missing in ES
  if (missingInES.length > 0) {
    console.log(`❌ MISSING IN ES (${missingInES.length} keys used in code but not in ES JSON):`);
    if (!summaryOnly) {
      for (const key of missingInES.sort()) {
        const locs = keyLocations[key] ? ` ← ${keyLocations[key][0]}` : '';
        console.log(`   • ${key}${locs}`);
      }
    }
    console.log();
  } else {
    console.log('✅ All code keys exist in ES translation\n');
  }

  // Missing in EN
  if (missingInEN.length > 0) {
    console.log(`❌ MISSING IN EN (${missingInEN.length} keys used in code but not in EN JSON):`);
    if (!summaryOnly) {
      for (const key of missingInEN.sort()) {
        const locs = keyLocations[key] ? ` ← ${keyLocations[key][0]}` : '';
        console.log(`   • ${key}${locs}`);
      }
    }
    console.log();
  } else {
    console.log('✅ All code keys exist in EN translation\n');
  }

  // Cross-locale sync
  if (inESnotEN.length > 0) {
    console.log(`⚠️  IN ES BUT NOT EN (${inESnotEN.length} keys):`);
    if (!summaryOnly) {
      for (const key of inESnotEN.sort().slice(0, 50)) {
        console.log(`   • ${key}`);
      }
      if (inESnotEN.length > 50) console.log(`   ... and ${inESnotEN.length - 50} more`);
    }
    console.log();
  } else {
    console.log('✅ ES and EN are in sync (ES→EN)\n');
  }

  if (inENnotES.length > 0) {
    console.log(`⚠️  IN EN BUT NOT ES (${inENnotES.length} keys):`);
    if (!summaryOnly) {
      for (const key of inENnotES.sort().slice(0, 50)) {
        console.log(`   • ${key}`);
      }
      if (inENnotES.length > 50) console.log(`   ... and ${inENnotES.length - 50} more`);
    }
    console.log();
  } else {
    console.log('✅ ES and EN are in sync (EN→ES)\n');
  }

  // Dead translations
  if (deadInES.length > 0 && !summaryOnly) {
    console.log(`🗑️  POTENTIALLY UNUSED (${deadInES.length} keys in ES JSON but not found in code):`);
    for (const key of deadInES.sort().slice(0, 30)) {
      console.log(`   • ${key}`);
    }
    if (deadInES.length > 30) console.log(`   ... and ${deadInES.length - 30} more`);
    console.log();
  }

  // Unresolvable dynamic patterns
  if (unresolvable.length > 0 && !summaryOnly) {
    console.log(`🔄 UNRESOLVABLE DYNAMIC PATTERNS (${unresolvable.length} — manual review needed):`);
    for (const { template, location } of unresolvable) {
      console.log(`   • \`${template}\` ← ${location}`);
    }
    console.log();
  }

  // ─── Summary ───────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                       📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const issues = missingInES.length + missingInEN.length + inESnotEN.length + inENnotES.length;

  console.log(`   Static keys in code:       ${staticKeys.size}`);
  console.log(`   Dynamic patterns:          ${dynamicPatterns.length}`);
  console.log(`   Expanded dynamic keys:     ${expandedKeys.size}`);
  console.log(`   Total audited keys:        ${allCodeKeys.size}`);
  console.log(`   ES translation keys:       ${esKeys.size}`);
  console.log(`   EN translation keys:       ${enKeys.size}`);
  console.log();
  console.log(`   Missing in ES:             ${missingInES.length}`);
  console.log(`   Missing in EN:             ${missingInEN.length}`);
  console.log(`   In ES but not EN:          ${inESnotEN.length}`);
  console.log(`   In EN but not ES:          ${inENnotES.length}`);
  console.log(`   Potentially unused:        ${deadInES.length}`);
  console.log(`   Unresolvable dynamic:      ${unresolvable.length}`);
  console.log();

  if (issues === 0) {
    console.log('   🎉 ALL CHECKS PASSED — Translations are consistent!\n');
  } else {
    console.log(`   ⚠️  ${issues} ISSUES FOUND — Review above for details\n`);
  }

  // Exit code for CI integration
  process.exit(issues > 0 ? 1 : 0);
}

runAudit();

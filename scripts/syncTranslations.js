#!/usr/bin/env node
/* global process */
/**
 * 🔄 TRANSLATION SYNC SCRIPT
 * Automatically adds missing keys from one locale to the other.
 *
 * Usage:
 *   node scripts/syncTranslations.js           # Dry run (show what would change)
 *   node scripts/syncTranslations.js --apply    # Apply changes to files
 *
 * Strategy:
 *   - Keys in ES but not EN → copies ES value to EN with "[TRADUCIR] " prefix
 *   - Keys in EN but not ES → copies EN value to ES with "[TRADUCIR] " prefix
 *   - Preserves existing structure, inserts alphabetically within parent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.resolve(__dirname, '..', 'src');

const ES_PATH = path.join(CLIENT_SRC, 'locales', 'es', 'translation.json');
const EN_PATH = path.join(CLIENT_SRC, 'locales', 'en', 'translation.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

function setNestedValue(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function prefixValue(value, prefix = '[TRADUCIR] ') {
  if (typeof value === 'string') {
    return prefix + value;
  }
  return value; // Don't prefix non-strings
}

// ─── Main ────────────────────────────────────────────────────────────────────

function runSync() {
  const apply = process.argv.includes('--apply');

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🔄 TRANSLATION SYNC — novofix                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(apply ? '⚙️  MODE: APPLY (will write files)\n' : '👁️  MODE: DRY RUN (preview only)\n');

  const esData = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

  const esKeys = new Set(flattenKeys(esData));
  const enKeys = new Set(flattenKeys(enData));

  // Find mismatches
  const inESnotEN = [...esKeys].filter(k => !enKeys.has(k)).sort();
  const inENnotES = [...enKeys].filter(k => !esKeys.has(k)).sort();

  console.log(`📊 ES keys: ${esKeys.size} | EN keys: ${enKeys.size}`);
  console.log(`➕ To add to EN: ${inESnotEN.length} keys`);
  console.log(`➕ To add to ES: ${inENnotES.length} keys\n`);

  // Add missing keys to EN (from ES)
  if (inESnotEN.length > 0) {
    console.log(`── Adding ${inESnotEN.length} keys to EN ──`);
    for (const key of inESnotEN) {
      const esValue = getNestedValue(esData, key);
      const newValue = prefixValue(esValue);
      setNestedValue(enData, key, newValue);
      console.log(`   ✚ ${key}`);
    }
    console.log();
  }

  // Add missing keys to ES (from EN)
  if (inENnotES.length > 0) {
    console.log(`── Adding ${inENnotES.length} keys to ES ──`);
    for (const key of inENnotES) {
      const enValue = getNestedValue(enData, key);
      const newValue = prefixValue(enValue);
      setNestedValue(esData, key, newValue);
      console.log(`   ✚ ${key}`);
    }
    console.log();
  }

  if (apply) {
    // Write updated files
    fs.writeFileSync(ES_PATH, JSON.stringify(esData, null, 2) + '\n', 'utf8');
    fs.writeFileSync(EN_PATH, JSON.stringify(enData, null, 2) + '\n', 'utf8');

    const newESKeys = flattenKeys(esData).length;
    const newENKeys = flattenKeys(enData).length;

    console.log('✅ Files updated:');
    console.log(`   ES: ${esKeys.size} → ${newESKeys} keys`);
    console.log(`   EN: ${enKeys.size} → ${newENKeys} keys`);
    console.log(`   Both now have ${newESKeys} keys (should match: ${newESKeys === newENKeys})\n`);

    // Verify
    console.log('🔍 Verifying sync...');
    const verifyES = flattenKeys(JSON.parse(fs.readFileSync(ES_PATH, 'utf8')));
    const verifyEN = flattenKeys(JSON.parse(fs.readFileSync(EN_PATH, 'utf8')));
    const verifyESSet = new Set(verifyES);
    const stillMissing = verifyEN.filter(k => !verifyESSet.has(k));
    const verifyENSet = new Set(verifyEN);
    const stillMissing2 = verifyES.filter(k => !verifyENSet.has(k));

    if (stillMissing.length === 0 && stillMissing2.length === 0) {
      console.log('   ✅ All keys are now in sync between ES and EN!\n');
    } else {
      console.log(`   ⚠️  Still ${stillMissing.length + stillMissing2.length} mismatches\n`);
    }

    // Count [TRADUCIR] entries for reference
    const traducirCount = (obj) => {
      return flattenKeys(obj).filter(k => {
        const v = getNestedValue(obj, k);
        return typeof v === 'string' && v.startsWith('[TRADUCIR]');
      }).length;
    };

    const esTraducir = traducirCount(esData);
    const enTraducir = traducirCount(enData);
    console.log(`📝 Pending translations: ES=${esTraducir}, EN=${enTraducir}`);
    console.log('   Search for "[TRADUCIR]" in each file to find them.\n');
  } else {
    console.log('ℹ️  This was a dry run. Run with --apply to write changes.\n');
  }
}

runSync();

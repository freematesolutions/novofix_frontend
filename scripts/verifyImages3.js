#!/usr/bin/env node
/**
 * Ronda 3: URLs más específicas para las 5 categorías que aún no representan bien su servicio.
 * Criterios estrictos del usuario:
 *   - HVAC: split AC, unidad de aire acondicionado montada
 *   - Cercas: postes con alambrado/malla perimetral residencial
 *   - Control de Plagas: fumigador con equipo, insectos, insecticida
 *   - Handyman: hombre profesional con herramientas variadas
 *   - Ventanas: ventanas de una casa visibles
 */

import https from 'https';

const CANDIDATES = {
  'Climatización': [
    // Split AC wall-mounted units, mini-split, HVAC equipment
    { id: 'AC-1', url: 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=1200&h=800&q=85&fit=crop', desc: 'Mini split AC unit on wall' },
    { id: 'AC-2', url: 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?w=1200&h=800&q=85&fit=crop', desc: 'HVAC outdoor condenser unit' },
    { id: 'AC-3', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=1200&h=800&q=85&fit=crop', desc: 'HVAC technician at work' },
    { id: 'AC-4', url: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=1200&h=800&q=85&fit=crop', desc: 'Air conditioner close up' },
    { id: 'AC-5', url: 'https://images.unsplash.com/photo-1614886137744-61d498536e2a?w=1200&h=800&q=85&fit=crop', desc: 'AC split unit living room' },
    { id: 'AC-6', url: 'https://images.unsplash.com/photo-1567176802725-3da25b5fbc94?w=1200&h=800&q=85&fit=crop', desc: 'Wall mounted AC blowing air' },
    { id: 'AC-7', url: 'https://images.unsplash.com/photo-1645488621498-ffc14672bc17?w=1200&h=800&q=85&fit=crop', desc: 'AC technician installing split' },
    { id: 'AC-8', url: 'https://images.unsplash.com/photo-1680262583681-30a5a2a40f96?w=1200&h=800&q=85&fit=crop', desc: 'Modern split AC white wall' },
  ],
  'Cercas': [
    // Chain-link fence, wire mesh fence, perimeter fencing with posts
    { id: 'FEN-1', url: 'https://images.unsplash.com/photo-1584752242818-b4bd7fb3fe10?w=1200&h=800&q=85&fit=crop', desc: 'Metal chain link fence' },
    { id: 'FEN-2', url: 'https://images.unsplash.com/photo-1559087867-ce4c91325525?w=1200&h=800&q=85&fit=crop', desc: 'Iron fence posts residential' },
    { id: 'FEN-3', url: 'https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=1200&h=800&q=85&fit=crop', desc: 'Wooden post fence yard' },
    { id: 'FEN-4', url: 'https://images.unsplash.com/photo-1560749003-f4b1e17e2dff?w=1200&h=800&q=85&fit=crop', desc: 'Privacy fence with posts' },
    { id: 'FEN-5', url: 'https://images.unsplash.com/photo-1495556178102-de3a0747e0cd?w=1200&h=800&q=85&fit=crop', desc: 'Barbed wire perimeter fence' },
    { id: 'FEN-6', url: 'https://images.unsplash.com/photo-1517639493569-5666a7b2f494?w=1200&h=800&q=85&fit=crop', desc: 'Wire mesh fence line' },
    { id: 'FEN-7', url: 'https://images.unsplash.com/photo-1508693613003-d19c129caee7?w=1200&h=800&q=85&fit=crop', desc: 'Fence posts row perspective' },
    { id: 'FEN-8', url: 'https://images.unsplash.com/photo-1604076913837-52ab5f0e2f20?w=1200&h=800&q=85&fit=crop', desc: 'Chain link fence close up' },
  ],
  'Control de Plagas': [
    // Fumigator with equipment, sprayer backpack, insect control, exterminator
    { id: 'PES-1', url: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=1200&h=800&q=85&fit=crop', desc: 'Professional exterminator suit' },
    { id: 'PES-2', url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&h=800&q=85&fit=crop', desc: 'Man with sprayer backpack' },
    { id: 'PES-3', url: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=1200&h=800&q=85&fit=crop', desc: 'Garden sprayer pesticide' },
    { id: 'PES-4', url: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=1200&h=800&q=85&fit=crop', desc: 'Spray equipment pest control' },
    { id: 'PES-5', url: 'https://images.unsplash.com/photo-1626958390898-162d3577f293?w=1200&h=800&q=85&fit=crop', desc: 'Worker fumigating outdoor' },
    { id: 'PES-6', url: 'https://images.unsplash.com/photo-1470723710355-95304d8aece4?w=1200&h=800&q=85&fit=crop', desc: 'Insect close up pest' },
    { id: 'PES-7', url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&h=800&q=85&fit=crop', desc: 'Professional spray equipment' },
  ],
  'Reparaciones': [
    // Handyman: professional man with varied tools, fixing, multi-skilled worker
    { id: 'HND-1', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&h=800&q=85&fit=crop', desc: 'Worker with tools fixing' },
    { id: 'HND-2', url: 'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=1200&h=800&q=85&fit=crop', desc: 'Man repairing at home' },
    { id: 'HND-3', url: 'https://images.unsplash.com/photo-1613323593608-abc90fec84ff?w=1200&h=800&q=85&fit=crop', desc: 'Drill screwdriver repair' },
    { id: 'HND-4', url: 'https://images.unsplash.com/photo-1556156653-e5a7c69cc263?w=1200&h=800&q=85&fit=crop', desc: 'Man with power tools' },
    { id: 'HND-5', url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&h=800&q=85&fit=crop', desc: 'Professional plumber/repair' },
    { id: 'HND-6', url: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=1200&h=800&q=85&fit=crop', desc: 'Toolbelt handyman' },
    { id: 'HND-7', url: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1200&h=800&q=85&fit=crop', desc: 'Carpenter handyman working' },
    { id: 'HND-8', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=800&q=85&fit=crop', desc: 'Construction worker helmet' },
  ],
  'Ventanas': [
    // House windows, visible window frames on building facade, residential windows
    { id: 'WIN-1', url: 'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=1200&h=800&q=85&fit=crop', desc: 'Wooden window frame house' },
    { id: 'WIN-2', url: 'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?w=1200&h=800&q=85&fit=crop', desc: 'Beautiful window facade' },
    { id: 'WIN-3', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&h=800&q=85&fit=crop', desc: 'Room with big window light' },
    { id: 'WIN-4', url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&h=800&q=85&fit=crop', desc: 'Large window home interior' },
    { id: 'WIN-5', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&q=85&fit=crop', desc: 'Modern glass windows' },
    { id: 'WIN-6', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&q=85&fit=crop', desc: 'House exterior windows' },
    { id: 'WIN-7', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&q=85&fit=crop', desc: 'Home exterior facade windows' },
    { id: 'WIN-8', url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&h=800&q=85&fit=crop', desc: 'House front with windows' },
  ]
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        checkUrl(res.headers.location).then(resolve);
        return;
      }
      resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', () => resolve({ status: 0, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false }); });
    req.end();
  });
}

async function main() {
  console.log('🔍 Ronda 3: Verificando URLs para 5 categorías...\n');
  const results = {};

  for (const [category, candidates] of Object.entries(CANDIDATES)) {
    console.log(`📂 ${category}:`);
    results[category] = [];
    for (const c of candidates) {
      const { status, ok } = await checkUrl(c.url);
      const icon = ok ? '✅' : '❌';
      console.log(`   ${icon} [${c.id}] ${c.desc} → HTTP ${status}`);
      if (ok) results[category].push(c);
    }
    const best = results[category][0];
    if (best) {
      console.log(`   🏆 Mejor: ${best.id} — ${best.desc}`);
    } else {
      console.log(`   ⚠️  Sin candidatos válidos`);
    }
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 TODAS las URLs válidas por categoría:');
  console.log('═══════════════════════════════════════════════════════\n');
  for (const [category, valid] of Object.entries(results)) {
    console.log(`--- ${category} (${valid.length} válidas) ---`);
    valid.forEach((v, i) => console.log(`  ${i+1}. [${v.id}] ${v.desc}\n     ${v.url}`));
    console.log();
  }
}

main();

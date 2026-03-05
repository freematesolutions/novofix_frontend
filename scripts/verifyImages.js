#!/usr/bin/env node
/**
 * Verifica URLs candidatas de Unsplash para categorías de servicio.
 * Hace HEAD requests para confirmar que cada imagen existe (HTTP 200/301/302).
 */

import https from 'https';
import http from 'http';

// Candidatos: múltiples opciones por categoría para verificar
const CANDIDATES = {
  'Climatización': [
    // AC unit on wall, split air conditioner
    { id: 'AC-1', url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&h=800&q=85&fit=crop', desc: 'AC unit on wall' },
    { id: 'AC-2', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=1200&h=800&q=85&fit=crop', desc: 'HVAC technician' },
    { id: 'AC-3', url: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=1200&h=800&q=85&fit=crop', desc: 'Air conditioner' },
    { id: 'AC-4', url: 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?w=1200&h=800&q=85&fit=crop', desc: 'HVAC outdoor unit' },
    { id: 'AC-5', url: 'https://images.unsplash.com/photo-1527710305920-75359cd32553?w=1200&h=800&q=85&fit=crop', desc: 'Split AC cool room' },
  ],
  'Piscinas': [
    // Residential backyard pool, clear blue water
    { id: 'POOL-1', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&h=800&q=85&fit=crop', desc: 'Residential pool blue water' },
    { id: 'POOL-2', url: 'https://images.unsplash.com/photo-1572331165267-854da2b021b1?w=1200&h=800&q=85&fit=crop', desc: 'Pool with lounge chairs' },
    { id: 'POOL-3', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&q=85&fit=crop', desc: 'Backyard pool house' },
    { id: 'POOL-4', url: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1200&h=800&q=85&fit=crop', desc: 'Clear blue pool' },
    { id: 'POOL-5', url: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=1200&h=800&q=85&fit=crop', desc: 'Beautiful residential pool' },
  ],
  'Cercas': [
    // Residential fencing, wooden or iron fence around house
    { id: 'FENCE-1', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&q=85&fit=crop', desc: 'Wooden fence' },
    { id: 'FENCE-2', url: 'https://images.unsplash.com/photo-1621947081720-86970823b77a?w=1200&h=800&q=85&fit=crop', desc: 'Fence around yard' },
    { id: 'FENCE-3', url: 'https://images.unsplash.com/photo-1516156008796-094e2e26f679?w=1200&h=800&q=85&fit=crop', desc: 'Wooden picket fence' },
    { id: 'FENCE-4', url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=1200&h=800&q=85&fit=crop', desc: 'White picket fence home' },
    { id: 'FENCE-5', url: 'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?w=1200&h=800&q=85&fit=crop', desc: 'Modern fence residential' },
  ],
  'Mantenimiento': [
    // Home maintenance, property upkeep, tools
    { id: 'MAINT-1', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&q=85&fit=crop', desc: 'Tools workbench maintenance' },
    { id: 'MAINT-2', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&h=800&q=85&fit=crop', desc: 'Maintenance worker' },
    { id: 'MAINT-3', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&h=800&q=85&fit=crop', desc: 'Home maintenance tools' },
    { id: 'MAINT-4', url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&h=800&q=85&fit=crop', desc: 'Property maintenance' },
    { id: 'MAINT-5', url: 'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=1200&h=800&q=85&fit=crop', desc: 'Clean maintained home exterior' },
  ],
  'Remodelación': [
    // Home remodeling, renovation interior
    { id: 'REMOD-1', url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&q=85&fit=crop', desc: 'Renovated modern kitchen' },
    { id: 'REMOD-2', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=800&q=85&fit=crop', desc: 'Modern renovated room' },
    { id: 'REMOD-3', url: 'https://images.unsplash.com/photo-1574739782594-db4ead022697?w=1200&h=800&q=85&fit=crop', desc: 'Home renovation work' },
    { id: 'REMOD-4', url: 'https://images.unsplash.com/photo-1585128792020-803d29415281?w=1200&h=800&q=85&fit=crop', desc: 'Interior remodel' },
    { id: 'REMOD-5', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&q=85&fit=crop', desc: 'Beautiful remodeled living room' },
  ],
  'Cerrajería': [
    // Locksmith: locks, keys, door hardware
    { id: 'LOCK-1', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1200&h=800&q=85&fit=crop', desc: 'Door lock mechanism' },
    { id: 'LOCK-2', url: 'https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=1200&h=800&q=85&fit=crop', desc: 'Door handle and lock' },
    { id: 'LOCK-3', url: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200&h=800&q=85&fit=crop', desc: 'Keys and lock' },
    { id: 'LOCK-4', url: 'https://images.unsplash.com/photo-1459257831348-f0cdd359235f?w=1200&h=800&q=85&fit=crop', desc: 'Vintage keys set' },
    { id: 'LOCK-5', url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=1200&h=800&q=85&fit=crop', desc: 'Smart lock door' },
  ],
  'Control de Plagas': [
    // Pest control, fumigation, spraying pesticide
    { id: 'PEST-1', url: 'https://images.unsplash.com/photo-1632765854612-5b4182b0d514?w=1200&h=800&q=85&fit=crop', desc: 'Pest control sprayer' },
    { id: 'PEST-2', url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&h=800&q=85&fit=crop', desc: 'Fumigation service' },
    { id: 'PEST-3', url: 'https://images.unsplash.com/photo-1585152068601-fa6070aab590?w=1200&h=800&q=85&fit=crop', desc: 'Spraying insecticide' },
    { id: 'PEST-4', url: 'https://images.unsplash.com/photo-1470115636492-6d2b56f9b754?w=1200&h=800&q=85&fit=crop', desc: 'Pest-free clean home' },
    { id: 'PEST-5', url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&h=800&q=85&fit=crop', desc: 'Professional sprayer' },
  ],
  'Reparaciones': [
    // Handyman: tools, multi-service professional, repairs
    { id: 'HANDY-1', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=800&q=85&fit=crop', desc: 'Workshop tools organized' },
    { id: 'HANDY-2', url: 'https://images.unsplash.com/photo-1530124566582-a45a7e3bd8a9?w=1200&h=800&q=85&fit=crop', desc: 'Toolbox handyman' },
    { id: 'HANDY-3', url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=800&q=85&fit=crop', desc: 'Professional repair tools' },
    { id: 'HANDY-4', url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&h=800&q=85&fit=crop', desc: 'Handyman tools belt' },
    { id: 'HANDY-5', url: 'https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=1200&h=800&q=85&fit=crop', desc: 'Tools and hardware' },
  ],
  'Pérgolas': [
    // Pergola: shade structure on house patio/front
    { id: 'PERG-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&q=85&fit=crop', desc: 'Pergola patio outdoor' },
    { id: 'PERG-2', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&q=85&fit=crop', desc: 'Modern house pergola' },
    { id: 'PERG-3', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&q=85&fit=crop', desc: 'Outdoor living pergola' },
    { id: 'PERG-4', url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200&h=800&q=85&fit=crop', desc: 'Patio with shade' },
    { id: 'PERG-5', url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&h=800&q=85&fit=crop', desc: 'House exterior with structure' },
  ]
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', () => resolve({ status: 0, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false }); });
    req.end();
  });
}

async function main() {
  console.log('🔍 Verificando URLs de Unsplash para 9 categorías...\n');

  const results = {};

  for (const [category, candidates] of Object.entries(CANDIDATES)) {
    console.log(`📂 ${category}:`);
    results[category] = [];

    for (const candidate of candidates) {
      const { status, ok } = await checkUrl(candidate.url);
      const icon = ok ? '✅' : '❌';
      console.log(`   ${icon} [${candidate.id}] ${candidate.desc} → HTTP ${status}`);
      if (ok) {
        results[category].push(candidate);
      }
    }

    if (results[category].length > 0) {
      console.log(`   🏆 Mejor: ${results[category][0].id} — ${results[category][0].desc}`);
    } else {
      console.log(`   ⚠️  Sin candidatos válidos para ${category}`);
    }
    console.log();
  }

  // Resumen final: primera URL válida por categoría
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 URLs SELECCIONADAS (primera válida por categoría):');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [category, valid] of Object.entries(results)) {
    if (valid.length > 0) {
      console.log(`'${category}': '${valid[0].url}',`);
    } else {
      console.log(`'${category}': null, // ⚠️ NINGUNA URL VÁLIDA`);
    }
  }
}

main();

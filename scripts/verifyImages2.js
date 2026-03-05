#!/usr/bin/env node
/**
 * Ronda 2: Verificar nuevas URLs candidatas para 5 categorías que aún no representan bien el servicio.
 */

import https from 'https';

const CANDIDATES = {
  'Climatización': [
    // AC split unit, air conditioning equipment, HVAC technician
    { id: 'AC-A', url: 'https://images.unsplash.com/photo-1631545806609-05129b8a97d6?w=1200&h=800&q=85&fit=crop', desc: 'White AC split unit on wall' },
    { id: 'AC-B', url: 'https://images.unsplash.com/photo-1562832135-14a35d25edef?w=1200&h=800&q=85&fit=crop', desc: 'Air conditioner unit close-up' },
    { id: 'AC-C', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=1200&h=800&q=85&fit=crop', desc: 'HVAC technician working' },
    { id: 'AC-D', url: 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?w=1200&h=800&q=85&fit=crop', desc: 'HVAC outdoor condenser unit' },
    { id: 'AC-E', url: 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=1200&h=800&q=85&fit=crop', desc: 'Mini split AC indoor unit' },
    { id: 'AC-F', url: 'https://images.unsplash.com/photo-1596474230040-e07818052075?w=1200&h=800&q=85&fit=crop', desc: 'AC remote and cool air' },
    { id: 'AC-G', url: 'https://images.unsplash.com/photo-1628508566498-1696a1303e92?w=1200&h=800&q=85&fit=crop', desc: 'AC installation technician' },
  ],
  'Cercas': [
    // Residential perimeter fencing, wooden/iron/chain-link fence around property
    { id: 'FEN-A', url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=1200&h=800&q=85&fit=crop', desc: 'White picket fence residential' },
    { id: 'FEN-B', url: 'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?w=1200&h=800&q=85&fit=crop', desc: 'Modern fence residential' },
    { id: 'FEN-C', url: 'https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=1200&h=800&q=85&fit=crop', desc: 'Wooden fence backyard' },
    { id: 'FEN-D', url: 'https://images.unsplash.com/photo-1560749003-f4b1e17e2dff?w=1200&h=800&q=85&fit=crop', desc: 'Privacy fence garden' },
    { id: 'FEN-E', url: 'https://images.unsplash.com/photo-1559087867-ce4c91325525?w=1200&h=800&q=85&fit=crop', desc: 'Iron fence house' },
    { id: 'FEN-F', url: 'https://images.unsplash.com/photo-1584752242818-b4bd7fb3fe10?w=1200&h=800&q=85&fit=crop', desc: 'Metal fence residential' },
    { id: 'FEN-G', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&q=85&fit=crop', desc: 'Fence with green yard' },
  ],
  'Control de Plagas': [
    // Pest control: technician spraying, fumigation equipment, protective suit
    { id: 'PES-A', url: 'https://images.unsplash.com/photo-1632406897798-854e64e42a7c?w=1200&h=800&q=85&fit=crop', desc: 'Pest control worker spraying' },
    { id: 'PES-B', url: 'https://images.unsplash.com/photo-1590272456521-1bbe160a18ce?w=1200&h=800&q=85&fit=crop', desc: 'Fumigation suit professional' },
    { id: 'PES-C', url: 'https://images.unsplash.com/photo-1574863721003-64b532baa134?w=1200&h=800&q=85&fit=crop', desc: 'Spraying pest control' },
    { id: 'PES-D', url: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=1200&h=800&q=85&fit=crop', desc: 'Chemical spray equipment' },
    { id: 'PES-E', url: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=1200&h=800&q=85&fit=crop', desc: 'Garden sprayer pesticide' },
    { id: 'PES-F', url: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=1200&h=800&q=85&fit=crop', desc: 'Professional exterminator' },
    { id: 'PES-G', url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&h=800&q=85&fit=crop', desc: 'Man with sprayer backpack' },
  ],
  'Reparaciones': [
    // Handyman: multi-skilled worker, toolbelt, fixing things at home
    { id: 'HND-A', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&h=800&q=85&fit=crop', desc: 'Handyman with tools working' },
    { id: 'HND-B', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&h=800&q=85&fit=crop', desc: 'Worker fixing things' },
    { id: 'HND-C', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&q=85&fit=crop', desc: 'Handyman toolbox repairs' },
    { id: 'HND-D', url: 'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=1200&h=800&q=85&fit=crop', desc: 'Man repairing home' },
    { id: 'HND-E', url: 'https://images.unsplash.com/photo-1613323593608-abc90fec84ff?w=1200&h=800&q=85&fit=crop', desc: 'Drill and screwdriver repair' },
    { id: 'HND-F', url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=800&q=85&fit=crop', desc: 'Tools organized workbench' },
    { id: 'HND-G', url: 'https://images.unsplash.com/photo-1556156653-e5a7c69cc263?w=1200&h=800&q=85&fit=crop', desc: 'Man with power tools' },
  ],
  'Ventanas': [
    // Windows: house window, window installation, glass, frames
    { id: 'WIN-A', url: 'https://images.unsplash.com/photo-1604082787517-b8da580e9e00?w=1200&h=800&q=85&fit=crop', desc: 'Window frames exterior (ACTUAL)' },
    { id: 'WIN-B', url: 'https://images.unsplash.com/photo-1558346489-19413928158b?w=1200&h=800&q=85&fit=crop', desc: 'Window with light' },
    { id: 'WIN-C', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&q=85&fit=crop', desc: 'Modern window glass' },
    { id: 'WIN-D', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&h=800&q=85&fit=crop', desc: 'Room with big window' },
    { id: 'WIN-E', url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&h=800&q=85&fit=crop', desc: 'Large window home interior' },
    { id: 'WIN-F', url: 'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=1200&h=800&q=85&fit=crop', desc: 'Wooden window frame' },
    { id: 'WIN-G', url: 'https://images.unsplash.com/photo-1565183997392-2f6f06d3028a?w=1200&h=800&q=85&fit=crop', desc: 'Clean window house exterior' },
    { id: 'WIN-H', url: 'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?w=1200&h=800&q=85&fit=crop', desc: 'Beautiful window facade' },
  ]
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', () => resolve({ status: 0, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false }); });
    req.end();
  });
}

async function main() {
  console.log('🔍 Ronda 2: Verificando URLs de Unsplash para 5 categorías...\n');
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
    if (results[category].length > 0) {
      console.log(`   🏆 Mejor: ${results[category][0].id} — ${results[category][0].desc}`);
    } else {
      console.log(`   ⚠️  Sin candidatos válidos`);
    }
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 URLs SELECCIONADAS (primera válida por categoría):');
  console.log('═══════════════════════════════════════════════════════\n');
  for (const [category, valid] of Object.entries(results)) {
    if (valid.length > 0) {
      console.log(`'${category}': '${valid[0].url}',`);
    } else {
      console.log(`'${category}': null, // ⚠️ SIN URL VÁLIDA`);
    }
  }
}

main();

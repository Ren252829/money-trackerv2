/**
 * SCRIPT IMPORT DATA KE RENDER
 * Jalankan: node scripts/import-data.js https://your-app.onrender.com
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const RENDER_URL = process.argv[2];
if (!RENDER_URL) {
  console.error('❌ Masukkan URL Render kamu!');
  console.error('   Contoh: node scripts/import-data.js https://money-tracker-backend.onrender.com');
  process.exit(1);
}

const exportFile = path.join(__dirname, 'data-export.json');
if (!fs.existsSync(exportFile)) {
  console.error('❌ File data-export.json tidak ditemukan!');
  console.error('   Jalankan dulu: node scripts/export-data.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
const baseUrl = RENDER_URL.replace(/\/$/, '');

// helper: HTTP request
function request(url, method, body) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const lib      = parsed.protocol === 'https:' ? https : http;
    const bodyStr  = body ? JSON.stringify(body) : null;

    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// delay helper
const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`🚀 Import data ke: ${baseUrl}\n`);

  // 1. Cek koneksi
  console.log('1️⃣  Mengecek koneksi ke Render...');
  try {
    const health = await request(`${baseUrl}/api/health`, 'GET');
    if (health.status !== 200) throw new Error('Server tidak merespons');
    console.log('   ✅ Terhubung!\n');
  } catch (e) {
    console.error('   ❌ Tidak bisa terhubung ke Render. Pastikan URL benar dan server aktif.');
    console.error('   Tip: Render free tier butuh ~30 detik warm up jika baru sleep.');
    process.exit(1);
  }

  // 2. Cek kategori yang sudah ada di Render
  console.log('2️⃣  Mengecek kategori di Render...');
  const existingCats = await request(`${baseUrl}/api/categories`, 'GET');
  const existingNames = (existingCats.body || []).map(c => c.name);
  console.log(`   ${existingNames.length} kategori sudah ada\n`);

  // 3. Import kategori custom (yang belum ada)
  const customCats = data.categories.filter(c => !existingNames.includes(c.name));
  console.log(`3️⃣  Import kategori custom (${customCats.length} baru dari ${data.categories.length} total)...`);

  const catIdMap = {}; // old_id → new_id

  // Map existing categories by name
  (existingCats.body || []).forEach(c => {
    const old = data.categories.find(o => o.name === c.name);
    if (old) catIdMap[old.id] = c.id;
  });

  for (const cat of customCats) {
    try {
      const res = await request(`${baseUrl}/api/categories`, 'POST', {
        name:  cat.name,
        icon:  cat.icon,
        type:  cat.type,
        color: cat.color,
      });
      if (res.status === 201 && res.body.id) {
        catIdMap[cat.id] = res.body.id;
        process.stdout.write(`   ✓ ${cat.icon} ${cat.name}\n`);
      }
      await delay(100);
    } catch (e) {
      console.error(`   ⚠️  Skip ${cat.name}: ${e.message}`);
    }
  }

  // Pastikan semua kategori lama ter-map
  for (const cat of data.categories) {
    if (!catIdMap[cat.id]) {
      const match = (existingCats.body || []).find(c => c.name === cat.name);
      if (match) catIdMap[cat.id] = match.id;
    }
  }
  console.log(`   ✅ ${Object.keys(catIdMap).length} kategori ter-map\n`);

  // 4. Import transaksi
  console.log(`4️⃣  Import transaksi (${data.transactions.length} data)...`);
  let txOk = 0, txSkip = 0;

  for (const tx of data.transactions) {
    const newCatId = catIdMap[tx.category_id];
    if (!newCatId) { txSkip++; continue; }

    try {
      const res = await request(`${baseUrl}/api/transactions`, 'POST', {
        amount:      tx.amount,
        type:        tx.type,
        category_id: newCatId,
        description: tx.description,
        date:        tx.date,
        source:      tx.source || 'migration',
      });
      if (res.status === 201) txOk++;
      else txSkip++;
      await delay(80);
    } catch (e) {
      txSkip++;
    }

    // Progress setiap 10 transaksi
    if ((txOk + txSkip) % 10 === 0) {
      process.stdout.write(`   Progress: ${txOk + txSkip}/${data.transactions.length}\r`);
    }
  }
  console.log(`   ✅ ${txOk} berhasil, ${txSkip} dilewati\n`);

  // 5. Import budget
  console.log(`5️⃣  Import budget (${data.budgets.length} data)...`);
  let bdgOk = 0;
  for (const b of data.budgets) {
    const newCatId = catIdMap[b.category_id];
    if (!newCatId) continue;
    try {
      await request(`${baseUrl}/api/budgets`, 'POST', {
        category_id: newCatId,
        amount:      b.amount,
        month:       b.month,
      });
      bdgOk++;
      await delay(100);
    } catch (e) {}
  }
  console.log(`   ✅ ${bdgOk} budget diimport\n`);

  // 6. Verifikasi
  console.log('6️⃣  Verifikasi...');
  const verify = await request(`${baseUrl}/api/transactions/summary`, 'GET');
  if (verify.body?.summary) {
    const s = verify.body.summary;
    console.log(`   💰 Pemasukan  : Rp ${s.total_pemasukan?.toLocaleString('id-ID') || 0}`);
    console.log(`   💸 Pengeluaran: Rp ${s.total_pengeluaran?.toLocaleString('id-ID') || 0}`);
    console.log(`   📋 Transaksi  : ${s.total_transaksi || 0}`);
  }

  console.log('\n🎉 Migrasi selesai! Buka web app kamu untuk memverifikasi data.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

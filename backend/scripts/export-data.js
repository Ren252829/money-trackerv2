/**
 * SCRIPT EXPORT DATA LOKAL
 * Jalankan: node scripts/export-data.js
 * Output: scripts/data-export.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { initDB, getDB } = require('../db/database');
const fs = require('fs');
const path = require('path');

async function main() {
  await initDB();
  const db = getDB();

  console.log('📦 Mengekspor data dari database lokal...\n');

  const categories   = db.prepare('SELECT * FROM categories').all();
  const transactions = db.prepare('SELECT * FROM transactions ORDER BY date ASC').all();
  const budgets      = db.prepare('SELECT * FROM budgets').all();

  const exportData = {
    exported_at: new Date().toISOString(),
    categories,
    transactions,
    budgets,
  };

  const outPath = path.join(__dirname, 'data-export.json');
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));

  console.log(`✅ Export selesai!`);
  console.log(`   📂 Kategori  : ${categories.length}`);
  console.log(`   💸 Transaksi : ${transactions.length}`);
  console.log(`   🎯 Budget    : ${budgets.length}`);
  console.log(`\n📄 File tersimpan di: ${outPath}`);
  console.log(`\n👉 Langkah selanjutnya:`);
  console.log(`   node scripts/import-data.js https://your-app.onrender.com`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });

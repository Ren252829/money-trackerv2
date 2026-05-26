const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'money_tracker.db');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

class SyncDB {
  constructor(sqlJs, fileData) {
    this.db = new sqlJs.Database(fileData || null);
  }

  pragma(str) { try { this.db.run(`PRAGMA ${str}`); } catch(e) {} }

  exec(sql) { this.db.run(sql); this._save(); }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self.db.run(sql, params);
        self._save();
        try {
          const r = self.db.exec('SELECT last_insert_rowid() as id');
          return { lastInsertRowid: r[0] ? r[0].values[0][0] : null };
        } catch(e) { return { lastInsertRowid: null }; }
      },
      get(...params) {
        const res = self.db.exec(sql, params);
        if (!res.length || !res[0].values.length) return undefined;
        const { columns, values } = res[0];
        return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]));
      },
      all(...params) {
        const res = self.db.exec(sql, params);
        if (!res.length) return [];
        const { columns, values } = res[0];
        return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
      },
    };
  }

  _save() {
    const data = this.db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Singleton
let _db = null;

async function initDB() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  const fileData = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  _db = new SyncDB(SQL, fileData);

  _db.pragma('foreign_keys = ON');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '💰',
      type TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT DEFAULT 'web'
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL UNIQUE,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS wa_sessions (
      phone TEXT PRIMARY KEY,
      state TEXT DEFAULT 'idle',
      temp_data TEXT DEFAULT '{}',
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existing = _db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (!existing || existing.count === 0) {
    const defaults = [
      { name: 'Makan & Minum', icon: '🍽️', type: 'pengeluaran', color: '#f97316' },
      { name: 'Transportasi', icon: '🚗', type: 'pengeluaran', color: '#3b82f6' },
      { name: 'Belanja', icon: '🛍️', type: 'pengeluaran', color: '#ec4899' },
      { name: 'Kesehatan', icon: '🏥', type: 'pengeluaran', color: '#ef4444' },
      { name: 'Hiburan', icon: '🎮', type: 'pengeluaran', color: '#8b5cf6' },
      { name: 'Tagihan', icon: '💡', type: 'pengeluaran', color: '#eab308' },
      { name: 'Pendidikan', icon: '📚', type: 'pengeluaran', color: '#06b6d4' },
      { name: 'Lainnya', icon: '📦', type: 'pengeluaran', color: '#6b7280' },
      { name: 'Gaji', icon: '💼', type: 'pemasukan', color: '#10b981' },
      { name: 'Freelance', icon: '💻', type: 'pemasukan', color: '#14b8a6' },
      { name: 'Investasi', icon: '📈', type: 'pemasukan', color: '#22c55e' },
      { name: 'Bonus', icon: '🎁', type: 'pemasukan', color: '#84cc16' },
      { name: 'Lainnya (Masuk)', icon: '💵', type: 'pemasukan', color: '#a3e635' },
    ];
    defaults.forEach(c => {
      _db.prepare('INSERT OR IGNORE INTO categories (name, icon, type, color) VALUES (?, ?, ?, ?)').run(c.name, c.icon, c.type, c.color);
    });
    console.log('✅ Default categories seeded');
  }

  console.log('✅ Database ready:', DB_PATH);
  return _db;
}

function getDB() {
  if (!_db) throw new Error('DB not initialized');
  return _db;
}

module.exports = { initDB, getDB };

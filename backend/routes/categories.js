const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const db = { prepare: (...a) => getDB().prepare(...a), exec: (...a) => getDB().exec(...a) };

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];
    if (type) { query += ' WHERE type = ?'; params.push(type); }
    query += ' ORDER BY type, name';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories
router.post('/', (req, res) => {
  try {
    const { name, icon, type, color } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name dan type wajib diisi' });
    const result = db.prepare(`
      INSERT INTO categories (name, icon, type, color) VALUES (?, ?, ?, ?)
    `).run(name, icon || '💰', type, color || '#6366f1');
    res.status(201).json({ id: result.lastInsertRowid, name, icon, type, color });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Kategori sudah ada' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  try {
    const { name, icon, color } = req.body;
    db.prepare('UPDATE categories SET name=?, icon=?, color=? WHERE id=?')
      .run(name, icon, color, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  try {
    const used = db.prepare('SELECT COUNT(*) as c FROM transactions WHERE category_id=?').get(req.params.id);
    if (used.c > 0) return res.status(400).json({ error: 'Kategori masih digunakan oleh transaksi' });
    db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

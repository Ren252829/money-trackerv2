const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const db = { prepare: (...a) => getDB().prepare(...a), exec: (...a) => getDB().exec(...a) };

// GET /api/budgets?month=MM&year=YYYY
router.get('/', (req, res) => {
  try {
    const now = new Date();
    const month = (req.query.month || (now.getMonth() + 1)).toString().padStart(2, '0');
    const year = req.query.year || now.getFullYear().toString();
    const monthKey = `${year}-${month}`;

    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.category_id = b.category_id
            AND t.type = 'pengeluaran'
            AND strftime('%m', t.date) = ?
            AND strftime('%Y', t.date) = ?
        ), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.month = ?
    `).all(month, year, monthKey);

    res.json(budgets.map(b => ({
      ...b,
      percentage: b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0,
      remaining: b.amount - b.spent,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets - set atau update budget
router.post('/', (req, res) => {
  try {
    const { category_id, amount, month } = req.body;
    if (!category_id || !amount) return res.status(400).json({ error: 'category_id dan amount wajib' });

    const now = new Date();
    const m = (month || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);

    db.prepare(`
      INSERT INTO budgets (category_id, amount, month)
      VALUES (?, ?, ?)
      ON CONFLICT(category_id) DO UPDATE SET amount=excluded.amount, month=excluded.month
    `).run(category_id, parseFloat(amount), m);

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM budgets WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

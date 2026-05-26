const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const db = { prepare: (...a) => getDB().prepare(...a), exec: (...a) => getDB().exec(...a) };
const { v4: uuidv4 } = require('uuid');

// GET /api/transactions - list dengan filter
router.get('/', (req, res) => {
  try {
    const { month, year, type, category_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (month && year) {
      query += ` AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?`;
      params.push(month.padStart(2, '0'), year);
    } else if (year) {
      query += ` AND strftime('%Y', t.date) = ?`;
      params.push(year);
    }

    if (type) { query += ` AND t.type = ?`; params.push(type); }
    if (category_id) { query += ` AND t.category_id = ?`; params.push(category_id); }

    query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const transactions = db.prepare(query).all(...params);

    // Count total
    let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
    const countParams = [];
    if (month && year) { countQuery += ` AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?`; countParams.push(month.padStart(2, '0'), year); }
    if (type) { countQuery += ` AND t.type = ?`; countParams.push(type); }
    if (category_id) { countQuery += ` AND t.category_id = ?`; countParams.push(category_id); }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({ data: transactions, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/summary - ringkasan untuk dashboard
router.get('/summary', (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = (month || (now.getMonth() + 1)).toString().padStart(2, '0');
    const y = year || now.getFullYear().toString();

    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END) as total_pemasukan,
        SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END) as total_pengeluaran,
        COUNT(*) as total_transaksi
      FROM transactions
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `).get(m, y);

    // Per kategori pengeluaran
    const byCategory = db.prepare(`
      SELECT c.name, c.icon, c.color, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'pengeluaran'
        AND strftime('%m', t.date) = ?
        AND strftime('%Y', t.date) = ?
      GROUP BY c.id
      ORDER BY total DESC
    `).all(m, y);

    // Tren harian bulan ini
    const dailyTrend = db.prepare(`
      SELECT
        date,
        SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END) as pemasukan,
        SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END) as pengeluaran
      FROM transactions
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
      GROUP BY date
      ORDER BY date ASC
    `).all(m, y);

    // Tren bulanan (12 bulan terakhir)
    const monthlyTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END) as pemasukan,
        SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END) as pengeluaran
      FROM transactions
      WHERE date >= date('now', '-11 months', 'start of month')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all();

    res.json({
      summary: {
        total_pemasukan: summary.total_pemasukan || 0,
        total_pengeluaran: summary.total_pengeluaran || 0,
        saldo: (summary.total_pemasukan || 0) - (summary.total_pengeluaran || 0),
        total_transaksi: summary.total_transaksi || 0,
      },
      by_category: byCategory,
      daily_trend: dailyTrend,
      monthly_trend: monthlyTrend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions
router.post('/', (req, res) => {
  try {
    const { amount, type, category_id, description, date, source = 'web' } = req.body;

    if (!amount || !type || !category_id) {
      return res.status(400).json({ error: 'amount, type, dan category_id wajib diisi' });
    }

    const id = uuidv4();
    const txDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO transactions (id, amount, type, category_id, description, date, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, parseFloat(amount), type, category_id, description || '', txDate, source);

    const created = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', (req, res) => {
  try {
    const { amount, type, category_id, description, date } = req.body;
    db.prepare(`
      UPDATE transactions SET amount=?, type=?, category_id=?, description=?, date=?
      WHERE id=?
    `).run(parseFloat(amount), type, category_id, description, date, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const db = { prepare: (...a) => getDB().prepare(...a), exec: (...a) => getDB().exec(...a) };
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// GET /api/export/excel?month=MM&year=YYYY
router.get('/excel', async (req, res) => {
  try {
    const now = new Date();
    const month = (req.query.month || (now.getMonth() + 1)).toString().padStart(2, '0');
    const year = req.query.year || now.getFullYear().toString();

    const transactions = db.prepare(`
      SELECT t.date, t.type, c.name as category, t.description, t.amount, t.source
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
      ORDER BY t.date ASC
    `).all(month, year);

    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END) as pemasukan,
        SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END) as pengeluaran
      FROM transactions
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `).get(month, year);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Money Tracker';

    // Sheet 1: Transaksi
    const sheet = workbook.addWorksheet('Transaksi');
    sheet.columns = [
      { header: 'Tanggal', key: 'date', width: 14 },
      { header: 'Tipe', key: 'type', width: 14 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Keterangan', key: 'description', width: 30 },
      { header: 'Jumlah (Rp)', key: 'amount', width: 18 },
      { header: 'Sumber', key: 'source', width: 10 },
    ];

    // Style header
    sheet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    transactions.forEach(t => {
      const row = sheet.addRow({
        date: t.date,
        type: t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        category: t.category || '-',
        description: t.description || '-',
        amount: t.amount,
        source: t.source,
      });
      row.getCell('amount').numFmt = '#,##0';
      row.getCell('amount').font = {
        color: { argb: t.type === 'pemasukan' ? 'FF16A34A' : 'FFDC2626' },
        bold: true,
      };
      if (t.type === 'pengeluaran') {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
      }
    });

    // Sheet 2: Ringkasan
    const summarySheet = workbook.addWorksheet('Ringkasan');
    const bulanNama = new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    summarySheet.addRow(['LAPORAN KEUANGAN', bulanNama]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Pemasukan', summary.pemasukan || 0]);
    summarySheet.addRow(['Total Pengeluaran', summary.pengeluaran || 0]);
    summarySheet.addRow(['Saldo', (summary.pemasukan || 0) - (summary.pengeluaran || 0)]);

    summarySheet.getColumn(1).width = 22;
    summarySheet.getColumn(2).width = 20;
    ['C3', 'C4', 'C5'].forEach(c => { if (summarySheet.getCell(c)) summarySheet.getCell(c).numFmt = '#,##0'; });

    const bulanFile = new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(' ', '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_${bulanFile}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/pdf?month=MM&year=YYYY
router.get('/pdf', (req, res) => {
  try {
    const now = new Date();
    const month = (req.query.month || (now.getMonth() + 1)).toString().padStart(2, '0');
    const year = req.query.year || now.getFullYear().toString();

    const transactions = db.prepare(`
      SELECT t.date, t.type, c.name as category, t.description, t.amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
      ORDER BY t.date ASC
    `).all(month, year);

    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END) as pemasukan,
        SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END) as pengeluaran,
        COUNT(*) as total
      FROM transactions
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `).get(month, year);

    const byCategory = db.prepare(`
      SELECT c.name, c.icon, SUM(t.amount) as total
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.type='pengeluaran'
        AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
      GROUP BY c.id ORDER BY total DESC LIMIT 5
    `).all(month, year);

    const bulanNama = new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    const bulanFile = bulanNama.replace(' ', '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_${bulanFile}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#1e293b');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('💰 Money Tracker', 40, 20);
    doc.fontSize(12).font('Helvetica')
      .text(`Laporan Keuangan — ${bulanNama}`, 40, 50);

    doc.fillColor('#1e293b').fontSize(10);

    // Summary boxes
    const boxY = 100;
    const boxes = [
      { label: 'Pemasukan', value: summary.pemasukan || 0, color: '#16a34a' },
      { label: 'Pengeluaran', value: summary.pengeluaran || 0, color: '#dc2626' },
      { label: 'Saldo', value: (summary.pemasukan || 0) - (summary.pengeluaran || 0), color: '#2563eb' },
    ];

    boxes.forEach((box, i) => {
      const x = 40 + i * 175;
      doc.roundedRect(x, boxY, 160, 70, 8).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(box.color).fontSize(9).font('Helvetica-Bold').text(box.label, x + 12, boxY + 12);
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold')
        .text(formatRupiah(box.value), x + 12, boxY + 30, { width: 136 });
    });

    // Top kategori
    doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold')
      .text('Top Pengeluaran per Kategori', 40, 195);
    doc.moveTo(40, 213).lineTo(doc.page.width - 40, 213).stroke('#e2e8f0');

    byCategory.forEach((cat, i) => {
      const y = 222 + i * 24;
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`${cat.icon} ${cat.name}`, 50, y);
      doc.fillColor('#dc2626').font('Helvetica-Bold').text(formatRupiah(cat.total), 0, y, { align: 'right', width: doc.page.width - 40 });
    });

    // Daftar transaksi
    const tableY = 230 + byCategory.length * 24 + 20;
    doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text('Riwayat Transaksi', 40, tableY);
    doc.moveTo(40, tableY + 18).lineTo(doc.page.width - 40, tableY + 18).stroke('#e2e8f0');

    // Table header
    const th = tableY + 24;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('Tanggal', 40, th);
    doc.text('Kategori', 120, th);
    doc.text('Keterangan', 230, th);
    doc.text('Jumlah', 0, th, { align: 'right', width: doc.page.width - 40 });

    let rowY = th + 18;
    transactions.forEach((t, i) => {
      if (rowY > doc.page.height - 60) { doc.addPage(); rowY = 40; }
      if (i % 2 === 0) doc.rect(40, rowY - 4, doc.page.width - 80, 20).fill('#f8fafc');
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica');
      doc.text(t.date, 40, rowY);
      doc.text(t.category || '-', 120, rowY);
      doc.text((t.description || '-').substring(0, 25), 230, rowY);
      doc.fillColor(t.type === 'pemasukan' ? '#16a34a' : '#dc2626').font('Helvetica-Bold')
        .text(formatRupiah(t.amount), 0, rowY, { align: 'right', width: doc.page.width - 40 });
      rowY += 20;
    });

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
      .text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Total ${summary.total} transaksi`,
        40, doc.page.height - 30, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

# 💰 Money Tracker + Telegram Bot

Aplikasi pencatat keuangan pribadi dengan integrasi **Telegram Bot** — gratis, tanpa webhook, langsung jalan di localhost.

## Fitur
- 📊 Dashboard ringkasan keuangan bulanan
- 📝 Catat pemasukan & pengeluaran (web & Telegram)
- 📈 Laporan & grafik visual (harian, bulanan, per kategori)
- 🎯 Budget per kategori dengan alert otomatis
- 🤖 Bot Telegram dengan tombol inline interaktif
- 📥 Export Excel & PDF
- 🌙 Dark mode

---

## 🚀 Cara Install & Jalankan

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Isi TELEGRAM_BOT_TOKEN di .env (lihat bagian setup bot)
npm run dev
```

Backend berjalan di: http://localhost:3001

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: http://localhost:5173

---

## 🤖 Setup Telegram Bot (2 Menit, Gratis)

1. **Buka Telegram** → cari **@BotFather**
2. Ketik `/newbot` → ikuti instruksi (masukkan nama & username bot)
3. **Copy token** yang diberikan BotFather (format: `123456:ABCdef...`)
4. **Edit `backend/.env`**:
   ```
   TELEGRAM_BOT_TOKEN=token_dari_botfather
   ```
5. **Restart backend** → `npm run dev`
6. **Cari username bot** kamu di Telegram → ketik `/start`

> ✅ **Tidak perlu ngrok, tidak perlu domain, tidak perlu bayar apapun!**
> Bot berjalan dengan long polling — otomatis terhubung saat backend aktif.

---

## 📱 Cara Pakai Bot Telegram

| Aksi | Fungsi |
|------|--------|
| `/start` | Tampilkan menu utama |
| `/menu`  | Kembali ke menu |
| Tombol **➕ Catat Pengeluaran** | Pilih kategori → nominal → keterangan |
| Tombol **💰 Catat Pemasukan** | Pilih kategori → nominal → keterangan |
| Tombol **📊 Lihat Ringkasan** | Ringkasan saldo bulan ini |
| Tombol **📋 Transaksi Terakhir** | 5 transaksi terbaru |

---

## ☁️ Deploy ke Cloud (Railway - Gratis)

1. Push repo ke GitHub
2. Buka [railway.app](https://railway.app) → New Project → dari GitHub
3. Pilih folder `backend`, set env vars:
   - `TELEGRAM_BOT_TOKEN=...`
   - `PORT=3001`
4. Deploy! Bot langsung aktif tanpa konfigurasi tambahan.

Frontend bisa deploy ke [Vercel](https://vercel.com) (gratis juga).

---

## 📁 Struktur Project

```
money-tracker/
├── backend/
│   ├── server.js              # Express + Telegram bot init
│   ├── db/database.js         # SQLite via sql.js (pure JS)
│   ├── routes/
│   │   ├── telegram.js        # Bot logic (Telegraf.js)
│   │   ├── transactions.js    # CRUD transaksi
│   │   ├── categories.js      # CRUD kategori
│   │   ├── budgets.js         # Budget management
│   │   └── export.js          # Excel & PDF export
│   └── .env.example
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx     # Ringkasan + quick add
        │   ├── Transactions.jsx  # Riwayat + filter
        │   ├── Laporan.jsx       # Grafik + export
        │   ├── Budget.jsx        # Budget tracker
        │   └── Pengaturan.jsx    # Kategori + setup bot
        └── components/
            └── AddTransactionModal.jsx
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Database | SQLite via sql.js (zero native deps) |
| Bot | Telegraf.js + Telegram Bot API |
| Export | ExcelJS + PDFKit |

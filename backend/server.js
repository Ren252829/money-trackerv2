require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const { initBot, stopBot } = require('./routes/telegram');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

initDB().then(() => {
  // REST API routes
  app.use('/api/transactions', require('./routes/transactions'));
  app.use('/api/categories',   require('./routes/categories'));
  app.use('/api/budgets',      require('./routes/budgets'));
  app.use('/api/export',       require('./routes/export'));

  app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
  );

  // Start Telegram bot (long polling - works on localhost tanpa ngrok!)
  initBot();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Money Tracker Backend → http://localhost:${PORT}`);
    console.log(`📊 API            → http://localhost:${PORT}/api`);
    console.log(`🤖 Telegram bot   → long polling aktif`);
    console.log(`\n💡 Setup bot: buka Telegram → @BotFather → /newbot`);
    console.log(`   Lalu isi TELEGRAM_BOT_TOKEN di file .env\n`);
  });

  // Graceful shutdown
  process.once('SIGINT',  () => { stopBot(); server.close(); });
  process.once('SIGTERM', () => { stopBot(); server.close(); });

}).catch(err => {
  console.error('Failed to init:', err);
  process.exit(1);
});

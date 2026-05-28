require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const { initBot, stopBot } = require('./routes/telegram');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

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
  app.use('/api/transactions', require('./routes/transactions'));
  app.use('/api/categories',   require('./routes/categories'));
  app.use('/api/budgets',      require('./routes/budgets'));
  app.use('/api/export',       require('./routes/export'));

  app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
  );

  // Koyeb health check endpoint
  app.get('/', (req, res) => res.json({ status: 'Money Tracker API is running' }));

  initBot();

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📊 API    → http://${HOST}:${PORT}/api`);
    console.log(`🤖 Telegram bot aktif (long polling)`);
  });

  process.once('SIGINT',  () => { stopBot(); server.close(); });
  process.once('SIGTERM', () => { stopBot(); server.close(); });

}).catch(err => {
  console.error('Failed to init:', err);
  process.exit(1);
});

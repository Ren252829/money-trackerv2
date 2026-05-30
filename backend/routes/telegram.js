const { Telegraf, Markup } = require('telegraf');
const { getDB } = require('../db/database');

const db = { prepare: (...a) => getDB().prepare(...a) };

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

// ── helpers ──────────────────────────────────────────────────────────────────
const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

function getSession(chatId) {
  const id = String(chatId);
  const s = db.prepare('SELECT * FROM wa_sessions WHERE phone=?').get(id);
  return s ? { ...s, temp_data: JSON.parse(s.temp_data || '{}') } : { phone: id, state: 'idle', temp_data: {} };
}

function setSession(chatId, state, temp_data = {}) {
  const id = String(chatId);
  db.prepare(`
    INSERT INTO wa_sessions (phone, state, temp_data, last_active)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(phone) DO UPDATE
      SET state=excluded.state, temp_data=excluded.temp_data, last_active=CURRENT_TIMESTAMP
  `).run(id, state, JSON.stringify(temp_data));
}

// ── main menu keyboard ────────────────────────────────────────────────────────
const mainMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➕ Catat Pengeluaran', 'menu:pengeluaran')],
    [Markup.button.callback('💰 Catat Pemasukan',   'menu:pemasukan')],
    [Markup.button.callback('📊 Lihat Ringkasan',   'menu:ringkasan')],
    [Markup.button.callback('📋 Transaksi Terakhir','menu:riwayat')],
  ]);

async function sendMainMenu(ctx) {
  const chatId = ctx.chat?.id || ctx.from?.id;
  setSession(chatId, 'idle');
  await ctx.reply(
    '🏠 *Menu Utama Money Tracker*\n\nHalo\\! Mau ngapain hari ini?',
    { parse_mode: 'MarkdownV2', ...mainMenuKeyboard() }
  );
}

// category keyboard (max 2 per row)
function categoryKeyboard(categories, type) {
  const buttons = categories.map(c =>
    Markup.button.callback(`${c.icon} ${c.name}`, `cat:${c.id}:${c.name}:${c.icon}`)
  );
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  rows.push([Markup.button.callback('🔙 Kembali ke Menu', 'menu:back')]);
  return Markup.inlineKeyboard(rows);
}

// ── show ringkasan ────────────────────────────────────────────────────────────
async function showRingkasan(ctx) {
  const now = new Date();
  const m  = String(now.getMonth() + 1).padStart(2, '0');
  const y  = String(now.getFullYear());

  const summary = db.prepare(`
    SELECT
      SUM(CASE WHEN type='pemasukan'   THEN amount ELSE 0 END) as pemasukan,
      SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END) as pengeluaran,
      COUNT(*) as total
    FROM transactions
    WHERE strftime('%m', date)=? AND strftime('%Y', date)=?
  `).get(m, y);

  const topKat = db.prepare(`
    SELECT c.name, c.icon, SUM(t.amount) as total
    FROM transactions t JOIN categories c ON t.category_id=c.id
    WHERE t.type='pengeluaran'
      AND strftime('%m', t.date)=? AND strftime('%Y', t.date)=?
    GROUP BY c.id ORDER BY total DESC LIMIT 3
  `).all(m, y);

  const bulan = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const pemasukan   = summary?.pemasukan   || 0;
  const pengeluaran = summary?.pengeluaran || 0;
  const saldo       = pemasukan - pengeluaran;

  const topStr = topKat.length
    ? '\n\n🏆 *Top Pengeluaran:*\n' + topKat.map((k, i) => `${i + 1}\\. ${k.icon} ${escMd(k.name)}: ${escMd(formatRp(k.total))}`).join('\n')
    : '';

  await ctx.reply(
    `📊 *Ringkasan ${escMd(bulan)}*\n\n` +
    `💰 Pemasukan: *${escMd(formatRp(pemasukan))}*\n` +
    `💸 Pengeluaran: *${escMd(formatRp(pengeluaran))}*\n` +
    `━━━━━━━━━━━━\n` +
    `${saldo >= 0 ? '✅' : '⚠️'} Saldo: *${escMd(formatRp(saldo))}*\n` +
    `📝 Transaksi: ${summary?.total || 0}` +
    topStr,
    { parse_mode: 'MarkdownV2' }
  );
  setSession(ctx.chat.id, 'idle');
  await sendMainMenu(ctx);
}

// ── show riwayat ──────────────────────────────────────────────────────────────
async function showRiwayat(ctx) {
  const txs = db.prepare(`
    SELECT t.date, t.type, t.amount, t.description, c.icon, c.name as cat
    FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
    ORDER BY t.created_at DESC LIMIT 5
  `).all();

  if (!txs.length) {
    await ctx.reply('📋 Belum ada transaksi\\.\n\nYuk mulai catat keuanganmu\\!', { parse_mode: 'MarkdownV2' });
  } else {
    const list = txs.map(t => {
      const sign = t.type === 'pemasukan' ? '➕' : '➖';
      const desc = t.description ? `\n   📝 ${escMd(t.description)}` : '';
      return `${sign} ${t.icon || '📦'} *${escMd(t.cat || 'Lainnya')}*\n   ${escMd(formatRp(t.amount))} — ${t.date}${desc}`;
    }).join('\n\n');
    await ctx.reply(`📋 *5 Transaksi Terakhir:*\n\n${list}`, { parse_mode: 'MarkdownV2' });
  }
  setSession(ctx.chat.id, 'idle');
  await sendMainMenu(ctx);
}

// escape MarkdownV2 special chars
function escMd(str) {
  return String(str).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// ── init bot ──────────────────────────────────────────────────────────────────
function initBot() {
  if (!TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN tidak di-set. Bot Telegram tidak aktif.');
    console.warn('   Buat bot via @BotFather di Telegram, lalu isi .env');
    return null;
  }

  bot = new Telegraf(TOKEN);

  // /start command
  bot.start(ctx => sendMainMenu(ctx));
  bot.command('menu', ctx => sendMainMenu(ctx));

  // ── callback query (tombol inline) ─────────────────────────────────────────
  bot.action('menu:back', async ctx => { await ctx.answerCbQuery(); await sendMainMenu(ctx); });

  bot.action('menu:ringkasan', async ctx => {
    await ctx.answerCbQuery();
    await showRingkasan(ctx);
  });

  bot.action('menu:riwayat', async ctx => {
    await ctx.answerCbQuery();
    await showRiwayat(ctx);
  });

  bot.action(/^menu:(pengeluaran|pemasukan)$/, async ctx => {
    await ctx.answerCbQuery();
    const type = ctx.match[1];
    const cats = db.prepare('SELECT * FROM categories WHERE type=? ORDER BY name').all(type);
    const label = type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    setSession(ctx.chat.id, 'pilih_kategori', { type });
    await ctx.reply(
      `📂 *Pilih Kategori ${escMd(label)}:*`,
      { parse_mode: 'MarkdownV2', ...categoryKeyboard(cats, type) }
    );
  });

  // pilih kategori
  bot.action(/^cat:(\d+):(.+):(.+)$/, async ctx => {
    await ctx.answerCbQuery();
    const [, catId, catName, catIcon] = ctx.match;
    const session = getSession(ctx.chat.id);
    setSession(ctx.chat.id, 'input_nominal', {
      ...session.temp_data,
      category_id: parseInt(catId),
      category_name: catName,
      category_icon: catIcon,
    });
    await ctx.reply(
      `${catIcon} *${escMd(catName)}* dipilih\\!\n\nMasukkan nominal \\(angka saja\\):\nContoh: *25000*`,
      { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Kembali', 'menu:back')]]) }
    );
  });

  // ── text messages (state machine) ─────────────────────────────────────────
  bot.on('text', async ctx => {
    const session = getSession(ctx.chat.id);
    const msg     = ctx.message.text.trim();
    const msgLow  = msg.toLowerCase();

    // global cancel
    if (['/menu', '/start', 'menu', 'batal', 'cancel'].includes(msgLow)) {
      return sendMainMenu(ctx);
    }

    // ── input nominal ────────────────────────────────────────────────────────
    if (session.state === 'input_nominal') {
      const nominal = parseFloat(msg.replace(/[^0-9]/g, ''));
      if (isNaN(nominal) || nominal <= 0) {
        return ctx.reply('❌ Nominal tidak valid\\. Masukkan angka saja\\.\nContoh: *25000*', { parse_mode: 'MarkdownV2' });
      }
      setSession(ctx.chat.id, 'input_keterangan', { ...session.temp_data, amount: nominal });
      return ctx.reply(
        `💵 Nominal: *${escMd(formatRp(nominal))}*\n\nMasukkan keterangan \\(opsional\\), atau tekan tombol di bawah:`,
        {
          parse_mode: 'MarkdownV2',
          ...Markup.inlineKeyboard([[Markup.button.callback('⏭ Lewati', 'skip_desc')]])
        }
      );
    }

    // ── input keterangan ─────────────────────────────────────────────────────
    if (session.state === 'input_keterangan') {
      return saveTransaction(ctx, session, msg);
    }

    // default fallback
    return sendMainMenu(ctx);
  });

  // lewati keterangan
  bot.action('skip_desc', async ctx => {
    await ctx.answerCbQuery();
    const session = getSession(ctx.chat.id);
    return saveTransaction(ctx, session, '');
  });

  bot.launch({
    dropPendingUpdates: true,
    allowedUpdates: ['message', 'callback_query'],
  }).catch(err => {
    // 409 = instance lain masih jalan, tunggu sebentar lalu retry
    if (err.response?.error_code === 409) {
      console.warn('⚠️  Bot conflict (409), retry dalam 5 detik...');
      setTimeout(() => {
        bot.launch({
          dropPendingUpdates: true,
          allowedUpdates: ['message', 'callback_query'],
        }).catch(e => console.error('Bot launch gagal:', e.message));
      }, 5000);
    } else {
      console.error('Bot launch error:', err.message);
    }
  });
  console.log('✅ Telegram bot aktif (long polling)');
  return bot;
}

// ── save transaction ──────────────────────────────────────────────────────────
async function saveTransaction(ctx, session, rawDesc) {
  const { type, category_id, category_name, category_icon, amount } = session.temp_data;
  const desc  = ['skip', 'lewati', '-', ''].includes(rawDesc.toLowerCase()) ? '' : rawDesc;
  const today = new Date().toISOString().split('T')[0];
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();

  db.prepare(`
    INSERT INTO transactions (id, amount, type, category_id, description, date, source)
    VALUES (?, ?, ?, ?, ?, ?, 'telegram')
  `).run(id, amount, type, category_id, desc, today);

  // cek budget alert
  let budgetWarning = '';
  if (type === 'pengeluaran') {
    const now = new Date();
    const m   = String(now.getMonth() + 1).padStart(2, '0');
    const y   = String(now.getFullYear());
    const mKey = `${y}-${m}`;
    const budget = db.prepare('SELECT * FROM budgets WHERE category_id=? AND month=?').get(category_id, mKey);
    if (budget) {
      const spent = db.prepare(`
        SELECT SUM(amount) as total FROM transactions
        WHERE category_id=? AND type='pengeluaran'
          AND strftime('%m', date)=? AND strftime('%Y', date)=?
      `).get(category_id, m, y);
      const totalSpent = spent?.total || 0;
      const pct = Math.round((totalSpent / budget.amount) * 100);
      if (pct >= 100) {
        budgetWarning = `\n\n⚠️ *PERINGATAN\\!* Budget ${escMd(category_name)} *melewati batas* \\(${pct}%\\)\nBudget: ${escMd(formatRp(budget.amount))} \\| Terpakai: ${escMd(formatRp(totalSpent))}`;
      } else if (pct >= 80) {
        budgetWarning = `\n\n🟡 Budget ${escMd(category_name)} sudah *${pct}%* terpakai\nSisa: ${escMd(formatRp(budget.amount - totalSpent))}`;
      }
    }
  }

  const emoji = type === 'pemasukan' ? '✅💰' : '✅';
  await ctx.reply(
    `${emoji} *Transaksi Berhasil Dicatat\\!*\n\n` +
    `📂 Kategori: ${category_icon} ${escMd(category_name)}\n` +
    `💵 Jumlah: *${escMd(formatRp(amount))}*\n` +
    `📝 Keterangan: ${escMd(desc || '-')}\n` +
    `📅 Tanggal: ${today}` +
    budgetWarning,
    { parse_mode: 'MarkdownV2' }
  );

  setSession(ctx.chat.id, 'idle');
  await sendMainMenu(ctx);
}

function stopBot() {
  if (bot) {
    bot.stop('SIGTERM');
    bot = null;
  }
}

module.exports = { initBot, stopBot };
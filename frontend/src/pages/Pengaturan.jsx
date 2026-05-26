import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Send, ExternalLink, Copy, Check } from 'lucide-react';
import api from '../utils/api';

function CategoryManager({ type }) {
  const [cats, setCats]         = useState([]);
  const [form, setForm]         = useState({ name: '', icon: '💰', color: '#6366f1' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');

  const fetchCats = () => api.get(`/categories?type=${type}`).then(setCats).catch(console.error);
  useEffect(() => { fetchCats(); }, [type]);

  const handleAdd = async () => {
    if (!form.name) { setError('Nama wajib diisi'); return; }
    try {
      await api.post('/categories', { ...form, type });
      setForm({ name: '', icon: '💰', color: '#6366f1' });
      setShowForm(false); setError(''); fetchCats();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/categories/${id}`); fetchCats(); }
    catch (e) { alert(e.message); }
  };

  const ICONS = ['🍽️','🚗','🛍️','🏥','🎮','💡','📚','📦','💼','💻','📈','🎁','💵','🏠','✈️','☕','💊','🐾','👗','🎓'];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-200">
          {type === 'pengeluaran' ? '💸 Pengeluaran' : '💰 Pemasukan'}
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-sm py-2 px-3">
          <Plus size={14} /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="card p-4 mb-3 border border-emerald-500/20 fade-in">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-2">
              <label className="label">Nama Kategori</label>
              <input className="input" placeholder="Nama kategori..." value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Warna</label>
              <input type="color" className="h-10 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 cursor-pointer"
                value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    form.icon === icon ? 'bg-emerald-500/30 border border-emerald-500/50 scale-110' : 'hover:bg-slate-700/50 border border-transparent'
                  }`}>{icon}</button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="btn-primary text-sm py-2"><Save size={14} /> Simpan</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/40 transition-colors group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: `${c.color}20` }}>{c.icon}</div>
            <span className="text-sm text-slate-200 flex-1">{c.name}</span>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
            <button onClick={() => handleDelete(c.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pengaturan() {
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    navigator.clipboard.writeText('TELEGRAM_BOT_TOKEN=token_kamu_di_sini');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
        <p className="text-slate-400 text-sm mt-0.5">Kelola kategori dan konfigurasi Telegram Bot</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Categories */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-5">Kategori Transaksi</h2>
          <div className="space-y-6">
            <CategoryManager type="pengeluaran" />
            <div className="border-t border-slate-700/50" />
            <CategoryManager type="pemasukan" />
          </div>
        </div>

        {/* Telegram Setup */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <Send size={20} className="text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Telegram Bot</h2>
                <p className="text-slate-400 text-xs">Gratis · Tanpa ngrok · Langsung jalan</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                {
                  step: '1',
                  title: 'Buat bot via @BotFather',
                  desc: 'Buka Telegram, cari @BotFather, lalu ketik /newbot. Ikuti instruksi, masukkan nama dan username bot.',
                  link: 'https://t.me/BotFather',
                  linkText: 'Buka @BotFather →',
                  color: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
                },
                {
                  step: '2',
                  title: 'Copy token bot',
                  desc: 'Setelah bot dibuat, BotFather akan memberi token seperti: 123456789:ABCdefGhIJKlmNoPQRstuVWXyz',
                },
                {
                  step: '3',
                  title: 'Isi file .env',
                  desc: 'Buka backend/.env dan tambahkan baris ini:',
                  code: 'TELEGRAM_BOT_TOKEN=token_dari_botfather',
                },
                {
                  step: '4',
                  title: 'Restart backend & chat bot kamu!',
                  desc: 'Jalankan ulang npm run dev di folder backend, lalu cari username bot kamu di Telegram dan ketik /start.',
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold border ${s.color || 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'}`}>
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200 mb-1">{s.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 mt-1.5 transition-colors">
                        {s.linkText} <ExternalLink size={11} />
                      </a>
                    )}
                    {s.code && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-700/50">
                        <code className="text-xs font-mono text-sky-300 flex-1">{s.code}</code>
                        <button onClick={copyToken}
                          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
                          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keunggulan */}
          <div className="card p-5 border border-sky-500/20 bg-sky-500/5">
            <p className="text-sm font-semibold text-sky-300 mb-3">✨ Kenapa Telegram lebih baik?</p>
            <div className="space-y-2 text-xs text-slate-400">
              {[
                ['🆓', 'Sepenuhnya gratis, selamanya'],
                ['🔘', 'Tombol inline native (lebih bagus dari WA)'],
                ['🌐', 'Long polling — tidak perlu ngrok atau domain'],
                ['⚡', 'Setup cukup 2 menit via @BotFather'],
                ['🔒', 'API resmi Telegram, stabil & terdokumentasi'],
              ].map(([icon, text], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Perintah bot */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-white mb-3">📱 Perintah Telegram Bot</p>
            <div className="space-y-2 text-xs">
              {[
                ['/start', 'Tampilkan menu utama'],
                ['/menu',  'Kembali ke menu'],
                ['Tombol ➕', 'Catat pengeluaran'],
                ['Tombol 💰', 'Catat pemasukan'],
                ['Tombol 📊', 'Ringkasan bulan ini'],
                ['Tombol 📋', '5 transaksi terakhir'],
              ].map(([cmd, desc], i) => (
                <div key={i} className="flex items-center gap-3">
                  <code className="px-2 py-0.5 bg-slate-800 rounded text-sky-300 min-w-[90px] text-center">{cmd}</code>
                  <span className="text-slate-400">→ {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Send, ExternalLink, Copy, Check } from 'lucide-react';
import api from '../utils/api';

function CategoryManager({ type }) {
  const [cats, setCats]         = useState([]);
  const [form, setForm]         = useState({ name:'', icon:'💰', color:'#6366f1' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const fetchCats = () => api.get(`/categories?type=${type}`).then(setCats).catch(console.error);
  useEffect(() => { fetchCats(); }, [type]);

  const handleAdd = async () => {
    if (!form.name){ setError('Nama wajib diisi'); return; }
    try {
      await api.post('/categories', { ...form, type });
      setForm({ name:'', icon:'💰', color:'#6366f1' });
      setShowForm(false); setError(''); fetchCats();
    } catch(e){ setError(e.message); }
  };
  const handleDelete = async (id) => {
    try { await api.delete(`/categories/${id}`); fetchCats(); }
    catch(e){ alert(e.message); }
  };

  const ICONS = ['🍽️','🚗','🛍️','🏥','🎮','💡','📚','📦','💼','💻','📈','🎁','💵','🏠','✈️','☕','💊','🐾','👗','🎓'];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize:'0.82rem', fontWeight:700, color:'#f0f0f8' }}>
          {type==='pengeluaran' ? '💸 Pengeluaran' : '💰 Pemasukan'}
        </p>
        <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-xs py-1.5 px-3">
          <Plus size={12}/> Tambah
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl mb-3 scale-in" style={{ background:'#0d0d14', border:'1px solid rgba(0,200,83,0.2)' }}>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-2">
              <label className="label">Nama</label>
              <input className="input" placeholder="Nama kategori..." value={form.name}
                onChange={e => setForm(f => ({ ...f, name:e.target.value }))} />
            </div>
            <div>
              <label className="label">Warna</label>
              <input type="color" className="w-full h-10 rounded-xl cursor-pointer"
                style={{ border:'1px solid rgba(255,255,255,0.1)', background:'transparent', padding:2 }}
                value={form.color} onChange={e => setForm(f => ({ ...f, color:e.target.value }))} />
            </div>
          </div>
          <label className="label">Icon</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-base"
                style={form.icon===icon ? { background:'rgba(0,200,83,0.2)', border:'1px solid rgba(0,200,83,0.4)', transform:'scale(1.1)' }
                  : { background:'rgba(255,255,255,0.04)', border:'1px solid transparent' }}>
                {icon}
              </button>
            ))}
          </div>
          {error && <p style={{ color:'#ff5370', fontSize:'0.75rem', marginBottom:8 }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs py-2"><Save size={12}/> Simpan</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-2"><X size={12}/></button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-colors"
            onMouseEnter={e => e.currentTarget.style.background='#16161f'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background:`${c.color}22`, fontSize:'1rem' }}>{c.icon}</div>
            <span style={{ fontSize:'0.82rem', color:'#f0f0f8' }} className="flex-1">{c.name}</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background:c.color }} />
            <button onClick={() => handleDelete(c.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
              style={{ color:'#44445a' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,83,112,0.1)'; e.currentTarget.style.color='#ff5370'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#44445a'; }}>
              <X size={12}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pengaturan() {
  const [copied, setCopied] = useState(false);
  const copyToken = () => { navigator.clipboard.writeText('TELEGRAM_BOT_TOKEN=token_kamu_di_sini'); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div className="page stagger">
      <div className="mb-6">
        <p style={{ fontSize:'0.72rem', color:'#8888aa', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Konfigurasi</p>
        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(1.3rem,3vw,1.7rem)', color:'#f0f0f8' }}>Pengaturan</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Categories */}
        <div className="card p-5">
          <p className="section-title mb-5">Kategori Transaksi</p>
          <div className="space-y-5">
            <CategoryManager type="pengeluaran" />
            <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />
            <CategoryManager type="pemasukan" />
          </div>
        </div>

        {/* Telegram setup */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background:'rgba(130,177,255,0.1)', border:'1px solid rgba(130,177,255,0.2)' }}>
                <Send size={18} style={{ color:'#82b1ff' }}/>
              </div>
              <div>
                <p className="section-title">Telegram Bot</p>
                <p style={{ fontSize:'0.68rem', color:'#8888aa', marginTop:2 }}>Gratis · Tanpa ngrok</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { step:'1', title:'Buka @BotFather', desc:'Cari @BotFather di Telegram, ketik /newbot, ikuti instruksi.', link:'https://t.me/BotFather', linkText:'Buka @BotFather →' },
                { step:'2', title:'Copy token bot', desc:'BotFather akan memberi token seperti: 123456:ABCdef...' },
                { step:'3', title:'Isi backend/.env', desc:'Tambahkan baris berikut di file .env kamu:', code:'TELEGRAM_BOT_TOKEN=token_dari_botfather' },
                { step:'4', title:'Restart & chat!', desc:'Jalankan ulang backend, cari bot kamu di Telegram, ketik /start.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background:'rgba(130,177,255,0.1)', border:'1px solid rgba(130,177,255,0.3)', fontSize:'0.7rem', fontWeight:700, color:'#82b1ff' }}>
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize:'0.82rem', fontWeight:600, color:'#f0f0f8', marginBottom:2 }}>{s.title}</p>
                    <p style={{ fontSize:'0.75rem', color:'#8888aa', lineHeight:1.5 }}>{s.desc}</p>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 transition-colors"
                        style={{ fontSize:'0.72rem', color:'#82b1ff', fontWeight:600 }}>
                        {s.linkText} <ExternalLink size={10}/>
                      </a>
                    )}
                    {s.code && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background:'#0a0a0f', border:'1px solid rgba(255,255,255,0.07)' }}>
                        <code style={{ fontSize:'0.72rem', color:'#82b1ff', fontFamily:'DM Mono,monospace', flex:1 }}>{s.code}</code>
                        <button onClick={copyToken} className="p-1 rounded-lg transition-colors" style={{ color:'#44445a' }}
                          onMouseEnter={e=>e.currentTarget.style.color='#f0f0f8'} onMouseLeave={e=>e.currentTarget.style.color='#44445a'}>
                          {copied ? <Check size={12} style={{ color:'#00e676' }}/> : <Copy size={12}/>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="card p-4" style={{ border:'1px solid rgba(130,177,255,0.15)', background:'rgba(130,177,255,0.03)' }}>
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#82b1ff', marginBottom:10 }}>✨ Keunggulan Telegram</p>
            <div className="space-y-2">
              {[['🆓','Gratis selamanya'], ['🔘','Tombol inline native'], ['🌐','Long polling — tidak perlu ngrok'], ['⚡','Setup 2 menit via @BotFather']].map(([icon,text],i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ fontSize:'0.9rem' }}>{icon}</span>
                  <span style={{ fontSize:'0.75rem', color:'#8888aa' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commands */}
          <div className="card p-4">
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#f0f0f8', marginBottom:10 }}>📱 Perintah Bot</p>
            <div className="space-y-2">
              {[['/start','Tampilkan menu utama'],['/menu','Kembali ke menu'],['Tombol ➕','Catat pengeluaran'],['Tombol 💰','Catat pemasukan'],['Tombol 📊','Ringkasan']].map(([cmd,desc],i) => (
                <div key={i} className="flex items-center gap-3">
                  <code style={{ padding:'2px 8px', background:'#0a0a0f', borderRadius:6, fontSize:'0.7rem', color:'#82b1ff', fontFamily:'DM Mono,monospace', minWidth:90, textAlign:'center' }}>{cmd}</code>
                  <span style={{ fontSize:'0.72rem', color:'#44445a' }}>→ {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

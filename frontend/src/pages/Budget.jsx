import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatRp, getNowMonthYear, getMonthName } from '../utils/api';

export default function Budget() {
  const now = getNowMonthYear();
  const [month, setMonth]       = useState(now.month);
  const [year, setYear]         = useState(now.year);
  const [budgets, setBudgets]   = useState([]);
  const [categories, setCats]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ category_id:'', amount:'' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b,c] = await Promise.all([
        api.get(`/budgets?month=${month}&year=${year}`),
        api.get('/categories?type=pengeluaran'),
      ]);
      setBudgets(b); setCats(c);
    } catch(e){ console.error(e); } finally{ setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [month, year]);

  const handleSave = async () => {
    if (!form.category_id || !form.amount){ setError('Kategori dan jumlah wajib'); return; }
    setSaving(true); setError('');
    try {
      const m = `${year}-${month.toString().padStart(2,'0')}`;
      await api.post('/budgets', { ...form, month: m });
      setShowForm(false); setForm({ category_id:'', amount:'' }); fetchData();
    } catch(e){ setError(e.message); } finally{ setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Hapus budget ini?')) return;
    await api.delete(`/budgets/${id}`); fetchData();
  };
  const prevMonth = () => { if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };
  const availableCats = categories.filter(c => !budgets.find(b => b.category_id === c.id));

  return (
    <div className="page stagger">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize:'0.72rem', color:'#8888aa', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Kelola</p>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(1.3rem,3vw,1.7rem)', color:'#f0f0f8' }}>Budget</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={15}/> <span className="hidden sm:inline">Set Budget</span>
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-3 mb-6 p-3 card w-fit mx-auto">
        <button onClick={prevMonth} className="p-1.5 rounded-lg" style={{ color:'#8888aa' }}><ChevronLeft size={16}/></button>
        <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#f0f0f8', minWidth:150, textAlign:'center' }}>{getMonthName(month,year)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg" style={{ color:'#8888aa' }}><ChevronRight size={16}/></button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-5 scale-in" style={{ border:'1px solid rgba(0,200,83,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Set Budget Baru</p>
            <button onClick={() => setShowForm(false)} style={{ color:'#8888aa' }}><X size={16}/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Kategori</label>
              <select className="input" value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: parseInt(e.target.value) }))}
                style={{ background:'#0a0a0f' }}>
                <option value="">Pilih kategori...</option>
                {availableCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batas Budget (Rp)</label>
              <input type="number" className="input num" placeholder="500000"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          {error && <p style={{ color:'#ff5370', fontSize:'0.8rem', marginTop:10 }}>{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn-primary mt-4 text-sm">
            <Save size={14}/> {saving ? 'Menyimpan...' : 'Simpan Budget'}
          </button>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor:'rgba(0,200,83,0.2)', borderTopColor:'#00c853' }} />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16" style={{ color:'#44445a' }}>
          <p className="text-4xl mb-3">🎯</p>
          <p style={{ fontSize:'0.9rem', color:'#8888aa' }}>Belum ada budget</p>
          <p style={{ fontSize:'0.75rem', marginTop:4 }}>Set budget untuk kontrol pengeluaran</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map(b => {
            const isOver    = b.percentage >= 100;
            const isWarning = b.percentage >= 80 && !isOver;
            const barColor  = isOver ? '#ff5370' : isWarning ? '#ffd740' : '#00e676';

            return (
              <div key={b.id} className="card p-5 transition-all duration-300"
                style={{ border: `1px solid ${isOver ? 'rgba(255,83,112,0.25)' : isWarning ? 'rgba(255,215,64,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background:`${b.category_color || '#1c1c28'}22`, fontSize:'1.4rem' }}>
                      {b.category_icon}
                    </div>
                    <div>
                      <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#f0f0f8' }}>{b.category_name}</p>
                      <p className="num" style={{ fontSize:'0.72rem', color:'#8888aa' }}>Budget: {formatRp(b.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isOver || isWarning) && <AlertTriangle size={14} style={{ color: isOver ? '#ff5370' : '#ffd740' }} />}
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg transition-colors"
                      style={{ color:'#44445a' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,83,112,0.1)'; e.currentTarget.style.color='#ff5370'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#44445a'; }}>
                      <X size={14}/>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background:'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width:`${Math.min(b.percentage,100)}%`, background:barColor,
                      boxShadow: `0 0 8px ${barColor}55` }} />
                </div>

                <div className="flex justify-between items-center">
                  <p className="num" style={{ fontSize:'0.78rem', color:'#8888aa' }}>
                    Terpakai: <span style={{ color: barColor }}>{formatRp(b.spent)}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span style={{
                      fontSize:'0.7rem', fontWeight:700, padding:'2px 8px', borderRadius:99,
                      background: isOver ? 'rgba(255,83,112,0.12)' : isWarning ? 'rgba(255,215,64,0.12)' : 'rgba(0,200,83,0.12)',
                      color: barColor,
                    }}>{b.percentage}%</span>
                    <span className="num" style={{ fontSize:'0.75rem', color: isOver ? '#ff5370' : '#8888aa' }}>
                      {isOver ? `+${formatRp(Math.abs(b.remaining))}` : `Sisa ${formatRp(b.remaining)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatRp, getNowMonthYear, getMonthName } from '../utils/api';

export default function Budget() {
  const now = getNowMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        api.get(`/budgets?month=${month}&year=${year}`),
        api.get('/categories?type=pengeluaran'),
      ]);
      setBudgets(b);
      setCategories(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleSave = async () => {
    if (!form.category_id || !form.amount) { setError('Kategori dan jumlah wajib diisi'); return; }
    setSaving(true);
    setError('');
    try {
      const m = `${year}-${month.toString().padStart(2, '0')}`;
      await api.post('/budgets', { ...form, month: m });
      setShowForm(false);
      setForm({ category_id: '', amount: '' });
      fetchData();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus budget ini?')) return;
    await api.delete(`/budgets/${id}`);
    fetchData();
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const availableCategories = categories.filter(c => !budgets.find(b => b.category_id === c.id));

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget</h1>
          <p className="text-slate-400 text-sm mt-0.5">Kelola batas pengeluaran per kategori</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {/* Month nav */}
      <div className="card p-3 mb-6 flex items-center justify-center gap-4 w-fit">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-white min-w-[160px] text-center">{getMonthName(month, year)}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-6 border border-emerald-500/20 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Set Budget Baru</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Kategori</label>
              <select className="input" value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: parseInt(e.target.value) }))}>
                <option value="">Pilih kategori...</option>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Batas Budget (Rp)</label>
              <input type="number" className="input font-mono" placeholder="500000"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Budget'}
          </button>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat...
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-slate-400 font-medium">Belum ada budget</p>
          <p className="text-slate-500 text-sm mt-1">Set budget untuk mengontrol pengeluaran kamu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {budgets.map(b => {
            const isOver = b.percentage >= 100;
            const isWarning = b.percentage >= 80 && !isOver;
            const barColor = isOver ? '#ef4444' : isWarning ? '#eab308' : b.category_color || '#22c55e';

            return (
              <div key={b.id} className={`card p-5 border ${isOver ? 'border-red-500/30' : isWarning ? 'border-yellow-500/30' : 'border-slate-700/50'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: `${b.category_color}20` }}>
                      {b.category_icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{b.category_name}</p>
                      <p className="text-xs text-slate-500">Budget: {formatRp(b.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && <AlertTriangle size={16} className="text-red-400" />}
                    {isWarning && <AlertTriangle size={16} className="text-yellow-400" />}
                    <button onClick={() => handleDelete(b.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(b.percentage, 100)}%`, backgroundColor: barColor }} />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Terpakai: <span className="font-mono font-semibold" style={{ color: barColor }}>{formatRp(b.spent)}</span>
                  </span>
                  <span className={`font-semibold ${isOver ? 'text-red-400' : 'text-slate-300'}`}>
                    {isOver ? `Lebih ${formatRp(Math.abs(b.remaining))}` : `Sisa ${formatRp(b.remaining)}`}
                  </span>
                </div>

                <div className="mt-2 text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isOver ? 'bg-red-500/20 text-red-400' :
                    isWarning ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {b.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

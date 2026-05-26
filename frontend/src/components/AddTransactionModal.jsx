import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../utils/api';

export default function AddTransactionModal({ onClose, onSuccess, defaultType = 'pengeluaran', editData = null }) {
  const [form, setForm] = useState({
    type: editData?.type || defaultType,
    category_id: editData?.category_id || '',
    amount: editData?.amount || '',
    description: editData?.description || '',
    date: editData?.date || new Date().toISOString().split('T')[0],
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/categories?type=${form.type}`).then(setCategories).catch(console.error);
  }, [form.type]);

  const handleSubmit = async () => {
    if (!form.amount || !form.category_id) {
      setError('Nominal dan kategori wajib diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (editData) {
        await api.put(`/transactions/${editData.id}`, form);
      } else {
        await api.post('/transactions', form);
      }
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 mx-4 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {editData ? 'Edit Transaksi' : 'Catat Transaksi'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5 p-1 bg-slate-900/60 rounded-xl">
          {['pengeluaran', 'pemasukan'].map(t => (
            <button
              key={t}
              onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                form.type === t
                  ? t === 'pemasukan'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Nominal */}
          <div>
            <label className="label">Nominal (Rp)</label>
            <input
              type="number"
              className="input font-mono text-lg"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="label">Kategori</label>
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(f => ({ ...f, category_id: cat.id }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all duration-200 ${
                    form.category_id === cat.id
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-600/40 bg-slate-800/40 text-slate-400 hover:border-slate-500/60 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="label">Keterangan (opsional)</label>
            <input
              type="text"
              className="input"
              placeholder="mis. Makan siang, bensin motor..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {loading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}

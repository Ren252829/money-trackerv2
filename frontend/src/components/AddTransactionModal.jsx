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
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get(`/categories?type=${form.type}`).then(setCategories).catch(console.error);
  }, [form.type]);

  const handleSubmit = async () => {
    if (!form.amount || !form.category_id) { setError('Nominal dan kategori wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      if (editData) await api.put(`/transactions/${editData.id}`, form);
      else await api.post('/transactions', form);
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose} />
      <div className="relative w-full sm:max-w-md mx-0 sm:mx-4 scale-in"
        style={{
          background: '#111118', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px 24px 0 0',
          ...(window.innerWidth >= 640 ? { borderRadius: 24 } : {}),
          padding: '24px',
        }}>
        {/* Handle (mobile) */}
        <div className="sm:hidden w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: 'rgba(255,255,255,0.15)' }} />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0f0f8' }}>
            {editData ? 'Edit Transaksi' : 'Catat Transaksi'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors"
            style={{ background: '#1c1c28', color: '#8888aa' }}>
            <X size={16} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: '#0a0a0f' }}>
          {['pengeluaran', 'pemasukan'].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={form.type === t ? {
                background: t === 'pemasukan' ? '#00c853' : '#ff5370',
                color: t === 'pemasukan' ? '#000' : '#fff',
              } : { color: '#8888aa' }}>
              {t === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Nominal */}
          <div>
            <label className="label">Nominal (Rp)</label>
            <input type="number" className="input num" placeholder="0" style={{ fontSize: '1.2rem' }}
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          {/* Kategori */}
          <div>
            <label className="label">Kategori</label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-0.5">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setForm(f => ({ ...f, category_id: cat.id }))}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all duration-150 text-xs font-medium"
                  style={form.category_id === cat.id ? {
                    background: 'rgba(0,200,83,0.1)',
                    border: '1px solid rgba(0,200,83,0.4)',
                    color: '#00e676',
                  } : {
                    background: '#0a0a0f',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#8888aa',
                  }}>
                  <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                  <span className="text-center leading-tight" style={{ fontSize: '0.65rem' }}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="label">Keterangan (opsional)</label>
            <input type="text" className="input" placeholder="mis. Makan siang, bensin..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Tanggal */}
          <div>
            <label className="label">Tanggal</label>
            <input type="date" className="input" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {error && (
            <p style={{ color: '#ff5370', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(255,83,112,0.08)', borderRadius: 10, border: '1px solid rgba(255,83,112,0.2)' }}>
              {error}
            </p>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <Check size={16} />}
            {loading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}

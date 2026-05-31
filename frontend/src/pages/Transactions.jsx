import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatRp, formatDate, getNowMonthYear, getMonthName } from '../utils/api';
import AddTransactionModal from '../components/AddTransactionModal';

export default function Transactions() {
  const now = getNowMonthYear();
  const [month, setMonth]           = useState(now.month);
  const [year, setYear]             = useState(now.year);
  const [filterType, setFilterType] = useState('');
  const [transactions, setTx]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editData, setEditData]     = useState(null);
  const [page, setPage]             = useState(0);
  const PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month, year, limit: PER_PAGE, offset: page * PER_PAGE, ...(filterType && { type: filterType }) });
      const res = await api.get(`/transactions?${params}`);
      setTx(res.data); setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year, filterType, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    await api.delete(`/transactions/${id}`); fetchData();
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); setPage(0); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); setPage(0); };

  const grouped = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t); return acc;
  }, {});

  return (
    <div className="page stagger">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize: '0.72rem', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Riwayat
          </p>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', color: '#f0f0f8' }}>
            Transaksi
          </h1>
        </div>
        <button onClick={() => { setEditData(null); setShowAdd(true); }} className="btn-primary text-sm">
          <Plus size={15} /> <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-3 mb-5 flex items-center gap-3 flex-wrap">
        {/* Month nav */}
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg transition-colors"
            style={{ color: '#8888aa' }} onMouseEnter={e => e.currentTarget.style.background='#1c1c28'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f0f8', minWidth: 130, textAlign: 'center' }}>
            {getMonthName(month, year)}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg transition-colors"
            style={{ color: '#8888aa' }} onMouseEnter={e => e.currentTarget.style.background='#1c1c28'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Type filter */}
        <div className="flex gap-1.5">
          {[['', 'Semua'], ['pemasukan', '💰'], ['pengeluaran', '💸']].map(([val, label]) => (
            <button key={val} onClick={() => { setFilterType(val); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={filterType === val ? {
                background: 'rgba(0,200,83,0.15)', color: '#00e676', border: '1px solid rgba(0,200,83,0.3)',
              } : { color: '#8888aa', border: '1px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.72rem', color: '#44445a', marginLeft: 'auto' }}>{total} transaksi</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(0,200,83,0.2)', borderTopColor: '#00c853' }} />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16" style={{ color: '#44445a' }}>
          <p className="text-4xl mb-3">📭</p>
          <p style={{ fontSize: '0.9rem' }}>Tidak ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a)).map(([date, txs]) => {
            const dayTotal = txs.reduce((s, t) => s + (t.type==='pemasukan' ? t.amount : -t.amount), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#44445a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {formatDate(date)}
                  </p>
                  <p className="num" style={{ fontSize: '0.75rem', fontWeight: 700, color: dayTotal >= 0 ? '#00e676' : '#ff5370' }}>
                    {dayTotal >= 0 ? '+' : ''}{formatRp(dayTotal)}
                  </p>
                </div>
                <div className="card overflow-hidden">
                  {txs.map((t, i) => (
                    <div key={t.id}
                      className="flex items-center gap-3 p-4 group transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background='#16161f'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${t.category_color || '#1c1c28'}22`, fontSize: '1.1rem' }}>
                        {t.category_icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f0f8' }}>{t.category_name || 'Lainnya'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.description && <p style={{ fontSize: '0.7rem', color: '#44445a' }} className="truncate">{t.description}</p>}
                          <span style={{ fontSize: '0.65rem', color: '#44445a' }}>{t.source === 'telegram' ? '📱' : '🌐'}</span>
                        </div>
                      </div>
                      <p className="num" style={{ fontSize: '0.9rem', fontWeight: 700, color: t.type==='pemasukan' ? '#00e676' : '#ff5370', flexShrink: 0 }}>
                        {t.type==='pemasukan' ? '+' : '-'}{formatRp(t.amount)}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { setEditData(t); setShowAdd(true); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#8888aa' }}
                          onMouseEnter={e => { e.currentTarget.style.background='#1c1c28'; e.currentTarget.style.color='#f0f0f8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#8888aa'; }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#8888aa' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,83,112,0.1)'; e.currentTarget.style.color='#ff5370'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#8888aa'; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} className="btn-secondary text-sm">
            <ChevronLeft size={15}/> Sebelumnya
          </button>
          <span style={{ padding: '10px 16px', fontSize: '0.82rem', color: '#8888aa' }}>
            {page+1} / {Math.ceil(total/PER_PAGE)}
          </span>
          <button onClick={() => setPage(p => p+1)} disabled={(page+1)*PER_PAGE >= total} className="btn-secondary text-sm">
            Selanjutnya <ChevronRight size={15}/>
          </button>
        </div>
      )}

      {showAdd && (
        <AddTransactionModal
          defaultType={editData?.type || 'pengeluaran'}
          editData={editData}
          onClose={() => { setShowAdd(false); setEditData(null); }}
          onSuccess={() => { setShowAdd(false); setEditData(null); fetchData(); }}
        />
      )}
    </div>
  );
}

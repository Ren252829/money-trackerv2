import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatRp, formatDate, getNowMonthYear, getMonthName } from '../utils/api';
import AddTransactionModal from '../components/AddTransactionModal';

export default function Transactions() {
  const now = getNowMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [filterType, setFilterType] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month, year, limit: PER_PAGE, offset: page * PER_PAGE,
        ...(filterType && { type: filterType }),
      });
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year, filterType, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    await api.delete(`/transactions/${id}`);
    fetchData();
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setPage(0);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setPage(0);
  };

  // Group by date
  const grouped = transactions.reduce((acc, t) => {
    const d = t.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Transaksi</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} transaksi ditemukan</p>
        </div>
        <button onClick={() => { setEditData(null); setShowAdd(true); }} className="btn-primary">
          <Plus size={16} /> Tambah Transaksi
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex items-center gap-4 flex-wrap">
        {/* Month Nav */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-slate-200 min-w-[140px] text-center">
            {getMonthName(month, year)}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Type filter */}
        <div className="flex gap-2">
          {[['', 'Semua'], ['pemasukan', '💰 Pemasukan'], ['pengeluaran', '💸 Pengeluaran']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setFilterType(val); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === val ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400">Tidak ada transaksi</p>
          <p className="text-slate-500 text-sm mt-1">Coba ubah filter atau tambah transaksi baru</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, txs]) => {
            const dayTotal = txs.reduce((sum, t) =>
              sum + (t.type === 'pemasukan' ? t.amount : -t.amount), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {formatDate(date)}
                  </p>
                  <p className={`text-xs font-mono font-semibold ${dayTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dayTotal >= 0 ? '+' : ''}{formatRp(dayTotal)}
                  </p>
                </div>
                <div className="card divide-y divide-slate-700/40">
                  {txs.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-slate-700/20 transition-colors group">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${t.category_color}20` }}>
                        {t.category_icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{t.category_name || 'Lainnya'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.description && <p className="text-xs text-slate-500 truncate">{t.description}</p>}
                          <span className="text-xs text-slate-600">{t.source === 'telegram' ? '📱' : '🌐'}</span>
                        </div>
                      </div>
                      <p className={`font-mono font-bold text-sm ${t.type === 'pemasukan' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'pemasukan' ? '+' : '-'}{formatRp(t.amount)}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditData(t); setShowAdd(true); }}
                          className="p-2 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
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
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary">
            <ChevronLeft size={16} /> Sebelumnya
          </button>
          <span className="py-2.5 px-4 text-sm text-slate-400">
            {page + 1} / {Math.ceil(total / PER_PAGE)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER_PAGE >= total} className="btn-secondary">
            Selanjutnya <ChevronRight size={16} />
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

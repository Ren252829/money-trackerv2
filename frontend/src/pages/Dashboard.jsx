import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api, { formatRp, getNowMonthYear, getMonthName, formatDate } from '../utils/api';
import AddTransactionModal from '../components/AddTransactionModal';

const COLORS = ['#f97316', '#3b82f6', '#ec4899', '#ef4444', '#8b5cf6', '#eab308', '#06b6d4', '#6b7280'];

const CustomTooltipRp = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-600/50 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {formatRp(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('pengeluaran');
  const { month, year } = getNowMonthYear();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summary, recent] = await Promise.all([
        api.get(`/transactions/summary?month=${month}&year=${year}`),
        api.get('/transactions?limit=5'),
      ]);
      setData({ summary, recent: recent.data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSuccess = () => { setShowAdd(false); fetchData(); };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  const { summary, by_category, daily_trend, monthly_trend } = data?.summary || {};
  const recent = data?.recent || [];
  const bulan = getMonthName(month, year);

  // Pie chart data
  const pieData = (by_category || []).slice(0, 6).map((c, i) => ({
    name: `${c.icon} ${c.name}`,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  // Area chart data
  const areaData = (daily_trend || []).map(d => ({
    date: d.date.slice(5),
    Pemasukan: d.pemasukan,
    Pengeluaran: d.pengeluaran,
  }));

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">{bulan}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => { setAddType('pemasukan'); setShowAdd(true); }} className="btn-secondary">
            <TrendingUp size={16} />
            Pemasukan
          </button>
          <button onClick={() => { setAddType('pengeluaran'); setShowAdd(true); }} className="btn-primary">
            <Plus size={16} />
            Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Pemasukan Bulan Ini',
            value: summary?.total_pemasukan || 0,
            icon: <TrendingUp size={20} />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            iconBg: 'bg-emerald-500/20',
          },
          {
            label: 'Pengeluaran Bulan Ini',
            value: summary?.total_pengeluaran || 0,
            icon: <TrendingDown size={20} />,
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/20',
            iconBg: 'bg-red-500/20',
          },
          {
            label: 'Saldo Bulan Ini',
            value: summary?.saldo || 0,
            icon: <Wallet size={20} />,
            color: summary?.saldo >= 0 ? 'text-blue-400' : 'text-orange-400',
            bg: summary?.saldo >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20',
            iconBg: summary?.saldo >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20',
          },
        ].map((card, i) => (
          <div key={i} className={`card p-6 border ${card.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm">{card.label}</p>
              <div className={`p-2 rounded-xl ${card.iconBg} ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono ${card.color}`}>
              {formatRp(card.value)}
            </p>
            <p className="text-slate-500 text-xs mt-1">{summary?.total_transaksi || 0} transaksi</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Area Chart - 2/3 width */}
        <div className="card p-6 col-span-2">
          <h3 className="font-semibold text-white mb-4">Arus Kas Harian</h3>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltipRp />} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#22c55e" fill="url(#gradIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="url(#gradExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Belum ada data untuk bulan ini
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Pengeluaran per Kategori</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatRp(v)} />
                <Legend
                  formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Transaksi Terbaru</h3>
          <a href="/transaksi" className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors">
            Lihat semua →
          </a>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-3xl mb-2">📭</p>
            <p>Belum ada transaksi</p>
            <p className="text-xs mt-1">Mulai catat via tombol di atas atau WhatsApp bot</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl flex-shrink-0">
                  {t.category_icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {t.category_name || 'Lainnya'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{t.description || formatDate(t.date)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-semibold text-sm ${t.type === 'pemasukan' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'pemasukan' ? '+' : '-'}{formatRp(t.amount)}
                  </p>
                  <p className="text-xs text-slate-500">{t.source === 'telegram' ? '📱 TG' : '🌐 Web'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddTransactionModal
          defaultType={addType}
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import api, { formatRp, getNowMonthYear, getMonthName } from '../utils/api';

const COLORS = ['#f97316', '#3b82f6', '#ec4899', '#ef4444', '#8b5cf6', '#eab308', '#06b6d4', '#6b7280'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-600/50 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {formatRp(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

const BULAN_NAMA = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function Laporan() {
  const now = getNowMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/transactions/summary?month=${month}&year=${year}`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleExport = (type) => {
    window.open(`/api/export/${type}?month=${month}&year=${year}`, '_blank');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { summary, by_category = [], daily_trend = [], monthly_trend = [] } = data || {};

  const pieData = by_category.slice(0, 7).map((c, i) => ({
    name: `${c.icon} ${c.name}`,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  const monthlyData = monthly_trend.map(m => {
    const [y, mo] = m.month.split('-');
    return {
      name: BULAN_NAMA[parseInt(mo) - 1],
      Pemasukan: m.pemasukan,
      Pengeluaran: m.pengeluaran,
    };
  });

  const dailyData = daily_trend.map(d => ({
    date: d.date.slice(8) + '/' + d.date.slice(5, 7),
    Pemasukan: d.pemasukan,
    Pengeluaran: d.pengeluaran,
  }));

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Laporan Keuangan</h1>
          <p className="text-slate-400 text-sm mt-0.5">Analisis lengkap per bulan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} className="btn-secondary">
            <FileSpreadsheet size={16} className="text-green-400" /> Export Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary">
            <FileText size={16} className="text-red-400" /> Export PDF
          </button>
        </div>
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

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pemasukan', value: summary?.total_pemasukan, color: 'text-emerald-400', icon: '📈' },
          { label: 'Pengeluaran', value: summary?.total_pengeluaran, color: 'text-red-400', icon: '📉' },
          { label: 'Saldo', value: summary?.saldo, color: summary?.saldo >= 0 ? 'text-blue-400' : 'text-orange-400', icon: '💼' },
          { label: 'Transaksi', value: null, count: summary?.total_transaksi, color: 'text-purple-400', icon: '📋' },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
            <p className={`text-xl font-bold font-mono ${s.color}`}>
              {s.count !== undefined ? s.count : formatRp(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Daily bar chart */}
        <div className="card p-6 col-span-2">
          <h3 className="font-semibold text-white mb-4">Pengeluaran vs Pemasukan Harian</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Pemasukan" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">Belum ada data</div>
          )}
        </div>

        {/* Pie */}
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Komposisi Pengeluaran</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="40%" innerRadius={45} outerRadius={75}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip formatter={v => formatRp(v)} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 10 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="card p-6 mb-4">
        <h3 className="font-semibold text-white mb-4">Tren 12 Bulan Terakhir</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">Belum ada data</div>
        )}
      </div>

      {/* Category breakdown */}
      {by_category.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Detail per Kategori</h3>
          <div className="space-y-3">
            {by_category.map((cat, i) => {
              const pct = summary?.total_pengeluaran > 0
                ? Math.round((cat.total / summary.total_pengeluaran) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xl w-8 text-center">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                      <span className="font-mono text-red-400 font-semibold">{formatRp(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: cat.color || COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

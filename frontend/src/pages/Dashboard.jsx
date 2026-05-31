import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Plus,
  RefreshCw, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api, { formatRp, getNowMonthYear, getMonthName, formatDate } from '../utils/api';
import AddTransactionModal from '../components/AddTransactionModal';

const COLORS = ['#00e676','#82b1ff','#ff5370','#ffd740','#ea80fc','#64ffda','#ff6e40','#b0bec5'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#16161f', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: '#8888aa', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
          {p.name}: {formatRp(p.value)}
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, icon: Icon, color, bg, sub, trend }) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:border-white/10 transition-all duration-300"
      style={{ borderRadius: 20 }}>
      <div className="flex items-center justify-between">
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: bg }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="num" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0f0f8', lineHeight: 1.1 }}>
          {formatRp(value)}
        </p>
        {sub && (
          <p style={{ fontSize: '0.7rem', color: '#8888aa', marginTop: 4 }}>{sub}</p>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: trend >= 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,83,112,0.1)',
              color: trend >= 0 ? '#00e676' : '#ff5370',
            }}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </div>
          <span style={{ fontSize: '0.68rem', color: '#44445a' }}>bulan ini</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('pengeluaran');
  const { month, year } = getNowMonthYear();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summary, recent] = await Promise.all([
        api.get(`/transactions/summary?month=${month}&year=${year}`),
        api.get('/transactions?limit=6'),
      ]);
      setData({ summary, recent: recent.data });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(0,200,83,0.2)', borderTopColor: '#00c853' }} />
        <p style={{ color: '#8888aa', fontSize: '0.85rem' }}>Memuat data...</p>
      </div>
    </div>
  );

  const { summary, by_category = [], daily_trend = [] } = data?.summary || {};
  const recent = data?.recent || [];
  const bulan  = getMonthName(month, year);

  const pieData = by_category.slice(0, 6).map((c, i) => ({
    name: `${c.icon} ${c.name}`, value: c.total, color: COLORS[i],
  }));

  const areaData = daily_trend.map(d => ({
    date: d.date.slice(8),
    Pemasukan: d.pemasukan,
    Pengeluaran: d.pengeluaran,
  }));

  const saldo = summary?.saldo || 0;

  return (
    <div className="page stagger">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p style={{ fontSize: '0.75rem', color: '#8888aa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {bulan}
          </p>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', color: '#f0f0f8' }}>
            Ringkasan Keuangan
          </h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={fetchData} className="btn-secondary p-2.5">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => { setAddType('pengeluaran'); setShowAdd(true); }} className="btn-primary text-sm">
            <Plus size={15} /> <span className="hidden sm:inline">Catat</span>
          </button>
        </div>
      </div>

      {/* Saldo utama */}
      <div className="mb-5 p-6 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1f16 0%, #0a1a20 100%)',
          border: '1px solid rgba(0,200,83,0.2)',
        }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #00e676, transparent)' }} />
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#00c853', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Total Saldo
        </p>
        <p className="num" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 700, color: saldo >= 0 ? '#00e676' : '#ff5370', lineHeight: 1 }}>
          {formatRp(saldo)}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#8888aa', marginTop: 8 }}>
          {summary?.total_transaksi || 0} transaksi · {bulan}
        </p>
        <div className="absolute bottom-4 right-6">
          <Zap size={32} style={{ color: 'rgba(0,200,83,0.1)' }} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          label="Pemasukan" value={summary?.total_pemasukan || 0}
          icon={TrendingUp} color="#00e676" bg="rgba(0,230,118,0.1)"
        />
        <StatCard
          label="Pengeluaran" value={summary?.total_pengeluaran || 0}
          icon={TrendingDown} color="#ff5370" bg="rgba(255,83,112,0.1)"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Area chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Arus Kas Harian</p>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5370" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff5370" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#44445a', fontSize: 10 }} />
                <YAxis stroke="transparent" tick={{ fill: '#44445a', fontSize: 10 }}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#00e676" strokeWidth={2} fill="url(#gIncome)" dot={false} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#ff5370" strokeWidth={2} fill="url(#gExpense)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center" style={{ color: '#44445a', fontSize: '0.85rem' }}>
              Belum ada data bulan ini
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <p className="section-title mb-4">Pengeluaran</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                    paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => formatRp(v)} contentStyle={{
                    background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span style={{ fontSize: '0.72rem', color: '#8888aa' }} className="truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="num" style={{ fontSize: '0.72rem', color: '#f0f0f8' }}>
                      {formatRp(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center" style={{ color: '#44445a', fontSize: '0.85rem' }}>
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">Transaksi Terbaru</p>
          <a href="/transaksi" style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 600 }}>
            Lihat semua →
          </a>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-10" style={{ color: '#44445a' }}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-default"
                style={{ borderRadius: 14 }}
                onMouseEnter={e => e.currentTarget.style.background = '#16161f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', fontSize: '1.1rem' }}>
                  {t.category_icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f0f8' }} className="truncate">
                    {t.category_name || 'Lainnya'}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#44445a' }} className="truncate">
                    {t.description || formatDate(t.date)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="num" style={{
                    fontSize: '0.9rem', fontWeight: 700,
                    color: t.type === 'pemasukan' ? '#00e676' : '#ff5370',
                  }}>
                    {t.type === 'pemasukan' ? '+' : '-'}{formatRp(t.amount)}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: '#44445a' }}>
                    {t.source === 'telegram' ? '📱' : '🌐'}
                  </p>
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
          onSuccess={() => { setShowAdd(false); fetchData(); }}
        />
      )}
    </div>
  );
}

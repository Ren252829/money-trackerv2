import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api, { formatRp, getNowMonthYear, getMonthName } from '../utils/api';

const COLORS = ['#00e676','#82b1ff','#ff5370','#ffd740','#ea80fc','#64ffda','#ff6e40','#b0bec5'];
const BULAN  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 12px', fontSize:11 }}>
      <p style={{ color:'#8888aa', marginBottom:3 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontWeight:600, fontFamily:'DM Mono,monospace' }}>{p.name}: {formatRp(p.value)}</p>)}
    </div>
  );
};

export default function Laporan() {
  const now = getNowMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear]   = useState(now.year);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/transactions/summary?month=${month}&year=${year}`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };
  const handleExport = (type) => window.open(`/api/export/${type}?month=${month}&year=${year}`, '_blank');

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor:'rgba(0,200,83,0.2)', borderTopColor:'#00c853' }} />
    </div>
  );

  const { summary, by_category=[], daily_trend=[], monthly_trend=[] } = data || {};
  const pieData    = by_category.slice(0,7).map((c,i) => ({ name:`${c.icon} ${c.name}`, value:c.total, color:COLORS[i%COLORS.length] }));
  const monthlyData = monthly_trend.map(m => {
    const [,mo] = m.month.split('-');
    return { name: BULAN[parseInt(mo)-1], Pemasukan: m.pemasukan, Pengeluaran: m.pengeluaran };
  });
  const dailyData = daily_trend.map(d => ({
    date: d.date.slice(8)+'/'+d.date.slice(5,7),
    Pemasukan: d.pemasukan, Pengeluaran: d.pengeluaran,
  }));

  return (
    <div className="page stagger">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize:'0.72rem', color:'#8888aa', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Analisis</p>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(1.3rem,3vw,1.7rem)', color:'#f0f0f8' }}>Laporan</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} className="btn-secondary text-xs py-2 px-3">
            <FileSpreadsheet size={14} style={{ color:'#00e676' }}/> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary text-xs py-2 px-3">
            <FileText size={14} style={{ color:'#ff5370' }}/> <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-3 mb-6 p-3 card w-fit mx-auto">
        <button onClick={prevMonth} className="p-1.5 rounded-lg" style={{ color:'#8888aa' }}><ChevronLeft size={16}/></button>
        <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#f0f0f8', minWidth:150, textAlign:'center' }}>{getMonthName(month,year)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg" style={{ color:'#8888aa' }}><ChevronRight size={16}/></button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Pemasukan',   val: summary?.total_pemasukan,   color:'#00e676', icon:'📈' },
          { label:'Pengeluaran', val: summary?.total_pengeluaran, color:'#ff5370', icon:'📉' },
          { label:'Saldo',       val: summary?.saldo,             color: summary?.saldo>=0 ? '#82b1ff':'#ffd740', icon:'💼' },
          { label:'Transaksi',   val: null, count: summary?.total_transaksi, color:'#ea80fc', icon:'📋' },
        ].map((s,i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
              <p style={{ fontSize:'0.68rem', color:'#8888aa', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
            </div>
            <p className="num" style={{ fontSize:'clamp(0.95rem,2.5vw,1.2rem)', fontWeight:700, color:s.color }}>
              {s.count !== undefined ? s.count : formatRp(s.val)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Harian</p>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="transparent" tick={{ fill:'#44445a', fontSize:9 }} />
                <YAxis stroke="transparent" tick={{ fill:'#44445a', fontSize:9 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="Pemasukan" fill="#00e676" radius={[4,4,0,0]} opacity={0.85} />
                <Bar dataKey="Pengeluaran" fill="#ff5370" radius={[4,4,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center" style={{ color:'#44445a', fontSize:'0.85rem' }}>Belum ada data</div>}
        </div>

        <div className="card p-5">
          <p className="section-title mb-4">Komposisi</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v=>formatRp(v)} contentStyle={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {pieData.slice(0,4).map((d,i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:d.color }} />
                    <span style={{ fontSize:'0.7rem', color:'#8888aa' }} className="flex-1 truncate">{d.name}</span>
                    <span className="num" style={{ fontSize:'0.7rem', color:'#f0f0f8' }}>{formatRp(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-[200px] flex items-center justify-center" style={{ color:'#44445a', fontSize:'0.85rem' }}>Belum ada data</div>}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="card p-5 mb-4">
        <p className="section-title mb-4">Tren 12 Bulan</p>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="transparent" tick={{ fill:'#44445a', fontSize:10 }} />
              <YAxis stroke="transparent" tick={{ fill:'#44445a', fontSize:10 }} tickFormatter={v=>`${(v/1000000).toFixed(1)}jt`} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#00e676" strokeWidth={2.5} dot={{ fill:'#00e676', r:3 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#ff5370" strokeWidth={2.5} dot={{ fill:'#ff5370', r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-[180px] flex items-center justify-center" style={{ color:'#44445a', fontSize:'0.85rem' }}>Belum ada data</div>}
      </div>

      {/* Category breakdown */}
      {by_category.length > 0 && (
        <div className="card p-5">
          <p className="section-title mb-4">Detail Kategori</p>
          <div className="space-y-3">
            {by_category.map((cat,i) => {
              const pct = summary?.total_pengeluaran > 0 ? Math.round((cat.total/summary.total_pengeluaran)*100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span style={{ fontSize:'1.2rem', width:24, textAlign:'center' }}>{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#f0f0f8' }}>{cat.name}</span>
                      <span className="num" style={{ fontSize:'0.8rem', color:'#ff5370', fontWeight:700 }}>{formatRp(cat.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${pct}%`, background: COLORS[i%COLORS.length] }} />
                    </div>
                  </div>
                  <span style={{ fontSize:'0.7rem', color:'#44445a', minWidth:32, textAlign:'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

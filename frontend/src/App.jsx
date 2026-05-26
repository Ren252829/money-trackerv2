import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, List, TrendingUp, Wallet, Settings, Send } from 'lucide-react';
import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Laporan      from './pages/Laporan';
import Budget       from './pages/Budget';
import Pengaturan   from './pages/Pengaturan';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/transaksi', icon: List,            label: 'Transaksi'   },
  { to: '/laporan',   icon: TrendingUp,      label: 'Laporan'     },
  { to: '/budget',    icon: Wallet,          label: 'Budget'      },
  { to: '/pengaturan',icon: Settings,        label: 'Pengaturan'  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col z-40">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
            💰
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Money Tracker</h1>
            <p className="text-slate-500 text-xs">Catat & Kelola Keuangan</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ` +
              (isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Telegram badge */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
          <Send size={15} className="text-sky-400" />
          <div>
            <p className="text-xs font-medium text-slate-300">Telegram Bot</p>
            <p className="text-xs text-slate-500">via Telegraf.js • Gratis</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <Routes>
            <Route path="/"           element={<Dashboard />}    />
            <Route path="/transaksi"  element={<Transactions />} />
            <Route path="/laporan"    element={<Laporan />}      />
            <Route path="/budget"     element={<Budget />}       />
            <Route path="/pengaturan" element={<Pengaturan />}   />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

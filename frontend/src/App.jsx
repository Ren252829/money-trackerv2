import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, List, TrendingUp, Wallet,
  Settings, Send, Menu, X
} from 'lucide-react';
import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Laporan      from './pages/Laporan';
import Budget       from './pages/Budget';
import Pengaturan   from './pages/Pengaturan';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/transaksi',  icon: List,            label: 'Transaksi'  },
  { to: '/laporan',    icon: TrendingUp,      label: 'Laporan'    },
  { to: '/budget',     icon: Wallet,          label: 'Budget'     },
  { to: '/pengaturan', icon: Settings,        label: 'Pengaturan' },
];

/* ── Desktop Sidebar ─────────────────────────────────────── */
function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        transition-transform duration-300 ease-out
        w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `} style={{ background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.25)' }}>
              💰
            </div>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0f0f8', lineHeight: 1.2 }}>
                Money Tracker
              </p>
              <p style={{ fontSize: '0.7rem', color: '#8888aa' }}>Personal Finance</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg"
            style={{ color: '#8888aa' }}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200 relative
                ${isActive
                  ? 'text-black'
                  : 'hover:bg-white/5'
                }
              `}
              style={({ isActive }) => isActive ? {
                background: 'var(--green-mid)',
                color: '#000',
                fontWeight: 600,
              } : { color: '#8888aa' }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} />
                  {label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.4)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Telegram status */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Send size={14} style={{ color: '#82b1ff' }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f0f0f8' }}>Telegram Bot</p>
              <p style={{ fontSize: '0.65rem', color: '#8888aa' }}>via Telegraf.js · Gratis</p>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00e676' }} />
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Mobile Bottom Navigation ────────────────────────────── */
function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-30 lg:hidden flex items-center justify-around px-2 pt-3 pb-2"
      style={{
        background: 'rgba(13,13,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
      {navItems.map(({ to, icon: Icon, label }) => {
        const isActive = to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(to);
        return (
          <NavLink key={to} to={to}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]"
            style={isActive ? {
              background: 'rgba(0,200,83,0.12)',
            } : {}}>
            <Icon size={20} style={{ color: isActive ? 'var(--green-bright)' : '#44445a', transition: 'color 0.2s' }} />
            <span style={{
              fontSize: '0.6rem',
              fontWeight: isActive ? 700 : 400,
              color: isActive ? 'var(--green-bright)' : '#44445a',
              transition: 'color 0.2s',
              letterSpacing: '0.02em',
            }}>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ── Mobile Top Bar ──────────────────────────────────────── */
function MobileTopBar({ onMenuOpen }) {
  const location = useLocation();
  const current = navItems.find(n =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  );

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4"
      style={{
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'rgba(0,200,83,0.15)' }}>💰</div>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#f0f0f8' }}>
          {current?.label || 'Money Tracker'}
        </p>
      </div>
      <button onClick={onMenuOpen} className="p-2 rounded-xl"
        style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', color: '#8888aa' }}>
        <Menu size={18} />
      </button>
    </header>
  );
}

/* ── Layout ──────────────────────────────────────────────── */
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <MobileTopBar onMenuOpen={() => setSidebarOpen(true)} />

        <main className="main-content flex-1 pt-16 lg:pt-0">
          <Routes>
            <Route path="/"           element={<Dashboard />}    />
            <Route path="/transaksi"  element={<Transactions />} />
            <Route path="/laporan"    element={<Laporan />}      />
            <Route path="/budget"     element={<Budget />}       />
            <Route path="/pengaturan" element={<Pengaturan />}   />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

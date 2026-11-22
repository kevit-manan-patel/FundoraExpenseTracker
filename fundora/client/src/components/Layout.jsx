import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart3, PiggyBank, Target, Repeat, CreditCard, Sparkles, FileText, Settings, CalendarDays, Activity, LogOut, Bell, Search, Plus, ChevronsLeft, ChevronsRight, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import TransactionModal from './TransactionModal.jsx';
import api from '../api';
import { fmtDate } from '../utils/format';
import BrandMark from './BrandMark.jsx';
import EclipticBackdrop from './EclipticBackdrop.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import HalfMoon from './HalfMoon.jsx';
import CursorTwinkle from './CursorTwinkle.jsx';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const NAV = [
  ['/', 'Overview', LayoutDashboard], ['/transactions', 'Transactions', ArrowLeftRight], ['/analytics', 'Analytics', BarChart3], ['/calendar', 'Calendar', CalendarDays], ['/heatmap', 'Heatmap', Activity],
  ['/budgets', 'Budgets', PiggyBank], ['/goals', 'Goals', Target], ['/recurring', 'Recurring Payments', Repeat],
  ['/subscriptions', 'Subscriptions', CreditCard], ['/insights', 'Smart Insights', Sparkles], ['/reports', 'Reports', FileText], ['/settings', 'Settings', Settings],
];
const TITLES = Object.fromEntries(NAV.map(([p, l]) => [p, l]));

export function Avatar({ user, size = 'h-8 w-8' }) {
  return user?.avatar
    ? <img src={user.avatar} alt="" className={`${size} rounded-full object-cover border border-line`} />
    : <div className={`${size} grid place-items-center rounded-full bg-gradient-to-br from-neon-green to-neon-emerald text-xs font-semibold text-black`}>{(user?.name || '?').slice(0, 1).toUpperCase()}</div>;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const [collapsed, setCollapsed] = useState(localStorage.getItem('fundora_collapsed') === '1');
  const [mobile, setMobile] = useState(false);
  const [txnModal, setTxnModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState(params.get('q') || '');
  const mainRef = useRef(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const openTxn = useCallback((initial = {}) => setTxnModal(initial), []);
  const goHome = useCallback(() => {
    nav('/');
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [nav]);
  const openProfile = useCallback(() => {
    nav('/settings');
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [nav]);

  useEffect(() => { localStorage.setItem('fundora_collapsed', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => { setMobile(false); setBell(false); if (loc.pathname !== '/transactions') setQ(''); }, [loc.pathname]);
  useEffect(() => { api.get('/insights').then((r) => setAlerts(r.data.alerts || [])).catch(() => {}); }, [refreshKey]);

  useEffect(() => {
    if (q === (params.get('q') || '')) return;
    const t = setTimeout(() => nav(q ? `/transactions?q=${encodeURIComponent(q)}` : '/transactions'), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  useEffect(() => {
    const h = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); openTxn({}); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [openTxn]);

  const w = collapsed ? 'lg:w-[72px]' : 'lg:w-64';
  const tone = { danger: 'bg-neg', warn: 'bg-neon-amber', info: 'bg-zinc-500' };

  return (
    <AppCtx.Provider value={{ openTxn, refresh, refreshKey }}>
      <div className="flex h-full">
        {mobile && <div className="mobile-nav-overlay fixed inset-0 z-30 backdrop-blur-sm lg:hidden" onClick={() => setMobile(false)} />}
        <aside className={`sidebar-shell fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line transition-all duration-300 lg:static ${w} ${mobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <button type="button" className="flex cursor-pointer items-center gap-2.5 text-left" onClick={goHome} aria-label="Go to Overview">
                <BrandMark />
                {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-glow-green">Fundora</span>}
              </button>
            </div>
            <button className="icon-btn hidden lg:inline-flex" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
            {NAV.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} title={label}
                className={({ isActive }) => `nav-link group ${isActive ? 'active' : ''}`}>
                {({ isActive }) => (<>
                  {isActive && <span className="nav-glow-bar" />}
                  <Icon className="h-[18px] w-[18px] shrink-0" style={isActive ? { color: '#B6FF4A', filter: 'drop-shadow(0 0 5px rgba(182,255,74,.8))' } : undefined} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>)}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-line p-3">
            <button type="button" className={`flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-card2 ${collapsed ? 'justify-center' : ''}`} onClick={openProfile} aria-label={`Open profile settings for ${user.name}`}>
              <Avatar user={user} size="h-9 w-9" />
              {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div>}
            </button>
            <div className={`mt-1 flex ${collapsed ? 'flex-col' : 'items-center'} gap-1`}>
              <button className="icon-btn" title="Account settings" onClick={() => nav('/settings')}><Settings className="h-4 w-4" /></button>
              <button className={`${collapsed ? 'icon-btn' : 'btn-ghost !h-9 !px-3 !py-2 !text-xs'} hover:!text-neg`} title="Log out" aria-label="Log out" onClick={() => { logout(); nav('/login'); }}>
                <LogOut className="h-4 w-4" />
                {!collapsed && 'Log out'}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass app-header relative z-50 flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 lg:px-8">
            <button className="icon-btn lg:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
            <h1 className="hidden text-[15px] font-semibold sm:block">{TITLES[loc.pathname] || 'Fundora'}</h1>
            <div className="relative mx-auto w-full max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input !py-2 pl-10" placeholder="Search transactions…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <span className="hidden text-xs text-muted xl:block">{fmtDate(new Date(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <ThemeToggle />
            <div className="relative">
              <button className="icon-btn relative" onClick={() => setBell(!bell)} aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
                {alerts.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neon-green shadow-glow-green ring-2 ring-ink" />}
              </button>
              {bell && (
                <div className="notification-panel animate-fadeUp absolute right-0 top-11 z-50 w-80 rounded-2xl border border-line p-2 shadow-2xl">
                  <p className="eyebrow px-3 py-2">Notifications</p>
                  {alerts.length === 0 && <p className="px-3 pb-3 text-sm text-muted">You're all caught up.</p>}
                  {alerts.map((a, i) => (
                    <div key={i} className="notification-item flex items-start gap-3 rounded-xl px-3 py-2.5">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone[a.level]}`} />
                      <div><p className="text-sm">{a.text}</p>{a.date && <p className="text-xs text-muted">{fmtDate(a.date)}</p>}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-primary hidden sm:inline-flex" onClick={() => openTxn({})}><Plus className="h-4 w-4" />Add Transaction<kbd className="ml-1 rounded bg-black/10 px-1.5 text-[10px]">N</kbd></button>
            <button className="btn-primary !px-3 sm:hidden" onClick={() => openTxn({})} aria-label="Add"><Plus className="h-4 w-4" /></button>
            <button type="button" className="cursor-pointer rounded-full transition-transform duration-200 hover:scale-105" onClick={openProfile} aria-label="Open profile settings" title="Profile settings">
              <Avatar user={user} />
            </button>
          </header>
          <main ref={mainRef} className="main-stage relative isolate flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <EclipticBackdrop />
            <div className="relative z-10 mx-auto max-w-[1400px]"><Outlet /></div>
          </main>
        </div>
      </div>
      {txnModal && <TransactionModal initial={txnModal} onClose={() => setTxnModal(null)} onSaved={refresh} />}
      <HalfMoon />
      <CursorTwinkle />
    </AppCtx.Provider>
  );
}

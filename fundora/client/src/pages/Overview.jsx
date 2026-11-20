import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, ArrowDownLeft, ArrowUpRight, Percent, Plus, PiggyBank, Target, AlertTriangle } from 'lucide-react';
import api from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, StatCard, Empty, CatIcon, Progress } from '../components/UI.jsx';
import { Segmented, NeonTooltip, GlowDefs } from '../components/Glow.jsx';
import { money, compact, fmtDate, CHART_SHADES, thisMonth } from '../utils/format';

export default function Overview() {
  const { user } = useAuth();
  const { refreshKey, openTxn } = useApp();
  const nav = useNavigate();
  const [range, setRange] = useState('month');
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [hidden, setHidden] = useState([]);
  const c = user.currency;

  useEffect(() => {
    Promise.all([api.get('/analytics/overview', { params: { range } }), api.get('/budgets', { params: { month: thisMonth() } })])
      .then(([o, b]) => { setData(o.data); setBudgets(b.data); });
  }, [range, refreshKey]);

  if (!data) return <Loading />;
  const { cards, cashflow, categories, recent, health } = data;
  const shown = categories.filter((x) => !hidden.includes(x.name));
  const toggle = (n) => setHidden((h) => (h.includes(n) ? h.filter((x) => x !== n) : [...h, n]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Good to see you, <span className="text-glow-green">{user.name.split(' ')[0]}</span></h2>
        <p className="mt-1 text-sm text-muted">Here's your financial overview — {fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total balance" icon={Wallet} value={money(cards.balance.value, c)} change={cards.balance.change} delay={0} tone={0} />
        <StatCard label="Income" icon={ArrowDownLeft} value={money(cards.income.value, c)} change={cards.income.change} delay={60} tone={1} />
        <StatCard label="Expenses" icon={ArrowUpRight} value={money(cards.expense.value, c)} change={cards.expense.change} goodWhenUp={false} delay={120} tone={2} />
        <StatCard label="Savings rate" icon={Percent} value={`${cards.savingsRate.value.toFixed(1)}%`} change={cards.savingsRate.change} suffix=" pts" delay={180} tone={3} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="font-semibold">Cash flow</h3><p className="text-xs text-muted">Income versus expenses</p></div>
            <Segmented value={range} onChange={setRange} options={[['week', 'Weekly'], ['month', 'Monthly'], ['year', 'Yearly']]} />
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={cashflow} margin={{ left: -10, right: 8, top: 8 }}>
                <GlowDefs />
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00E5FF" stopOpacity={0.35} /><stop offset="100%" stopColor="#00E5FF" stopOpacity={0} /></linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF4FD8" stopOpacity={0.3} /><stop offset="100%" stopColor="#FF4FD8" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--c-line)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="var(--c-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => compact(v, c)} />
                <Tooltip content={<NeonTooltip formatter={(v) => money(v, c)} />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#00E5FF" strokeWidth={2.5} fill="url(#gi)" filter="url(#neonGlow)" dot={false} activeDot={{ r: 4, fill: '#00E5FF' }} />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="#FF4FD8" strokeWidth={2.5} fill="url(#ge)" filter="url(#neonGlow)" dot={false} activeDot={{ r: 4, fill: '#FF4FD8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">Spending breakdown</h3>
          <p className="text-xs text-muted">This month by category</p>
          {categories.length === 0 ? <Empty title="No expenses yet" hint="Add an expense to see your breakdown." /> : (<>
            <div className="relative h-48">
              <ResponsiveContainer>
                <PieChart>
                  <GlowDefs />
                  <Pie data={shown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" filter="url(#neonGlow)">
                    {shown.map((x) => <Cell key={x.name} fill={CHART_SHADES[categories.indexOf(x) % CHART_SHADES.length]} />)}
                  </Pie>
                  <Tooltip content={<NeonTooltip formatter={(v) => money(v, c)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-xs text-muted">Spent</p><p className="text-sm font-semibold text-glow-cyan">{compact(shown.reduce((a, x) => a + x.value, 0), c)}</p></div></div>
            </div>
            <div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-1">
              {categories.map((x, i) => (
                <button key={x.name} onClick={() => toggle(x.name)} className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-all hover:bg-card2 ${hidden.includes(x.name) ? 'opacity-40' : ''}`}>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_SHADES[i % CHART_SHADES.length] }} />{x.name}</span>
                  <span className="text-muted">{x.percent}%</span>
                </button>
              ))}
            </div>
          </>)}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent transactions</h3><button className="text-xs text-muted hover:text-neon-cyan transition-colors" onClick={() => nav('/transactions')}>View all →</button></div>
          {recent.length === 0 ? <Empty title="No transactions yet" hint="Your latest activity will appear here." action={<button className="btn-primary mt-2" onClick={() => openTxn({})}><Plus className="h-4 w-4" />Add transaction</button>} /> : (
            <div className="divide-y divide-line">
              {recent.map((t) => (
                <div key={t._id} className="flex items-center gap-3 py-3">
                  <CatIcon category={t.category} type={t.type} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.title}</p><p className="text-xs text-muted">{t.category} · {fmtDate(t.date)}</p></div>
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-pos' : 'text-text'}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount, c)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-4 font-semibold">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost !justify-start" onClick={() => openTxn({ type: 'income' })}><ArrowDownLeft className="h-4 w-4 text-pos" />Income</button>
              <button className="btn-ghost !justify-start" onClick={() => openTxn({ type: 'expense' })}><ArrowUpRight className="h-4 w-4" />Expense</button>
              <button className="btn-ghost !justify-start" onClick={() => nav('/budgets?new=1')}><PiggyBank className="h-4 w-4" />Budget</button>
              <button className="btn-ghost !justify-start" onClick={() => nav('/goals?new=1')}><Target className="h-4 w-4" />Goal</button>
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Financial health</h3><span className="text-2xl font-semibold">{health.score ?? '—'}<span className="text-xs text-muted">/100</span></span></div>
            {[['Savings', health.savings], ['Spending consistency', health.consistency], ['Budget adherence', health.adherence], ['Emergency fund (3 mo)', health.emergency]].map(([l, v]) => (
              <div key={l} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted">{l}</span><span>{v === null ? 'No data' : `${v}%`}</span></div>
                <Progress percent={v || 0} tone="bg-pos" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Budget progress</h3><button className="text-xs text-muted hover:text-neon-cyan transition-colors" onClick={() => nav('/budgets')}>Manage →</button></div>
        {budgets.length === 0 ? <Empty title="No budgets this month" hint="Set a category budget to track your limits." action={<button className="btn-ghost mt-2" onClick={() => nav('/budgets?new=1')}>Create budget</button>} /> : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((b) => (
              <div key={b._id}>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2">{b.category}{b.percent >= 75 && <AlertTriangle className={`h-3.5 w-3.5 ${b.percent >= 100 ? 'text-neg' : 'text-neon-amber'}`} />}</span><span className="text-xs text-muted">{money(b.spent, c)} / {money(b.amount, c)}</span></div>
                <Progress percent={b.percent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { useReport } from '../components/RangeSelect.jsx';
import { PageHeader, Loading, Empty, CatIcon, Progress, Delta } from '../components/UI.jsx';
import { NeonTooltip, GlowDefs } from '../components/Glow.jsx';
import { money, compact, fmtDate } from '../utils/format';

const axis = { stroke: 'var(--c-muted)', fontSize: 11, tickLine: false, axisLine: false };

function Panel({ title, sub, children, className = '' }) {
  return <div className={`card p-5 ${className}`}><h3 className="font-semibold">{title}</h3>{sub && <p className="mb-4 text-xs text-muted">{sub}</p>}{!sub && <div className="mb-4" />}{children}</div>;
}

export default function Analytics() {
  const { user } = useAuth();
  const { data, control } = useReport();
  const c = user.currency;
  if (!data) return <div><PageHeader title="Analytics" subtitle="Patterns across your money.">{control}</PageHeader><Loading /></div>;
  const { totals, byCategory, byDay, byMonth, top } = data;
  const last = byMonth[byMonth.length - 1], prev = byMonth[byMonth.length - 2];
  const mom = (k) => (prev && prev[k] ? ((last[k] - prev[k]) / prev[k]) * 100 : 0);
  const none = totals.count === 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle={`${fmtDate(data.range.from)} – ${fmtDate(data.range.to)}`}>{control}</PageHeader>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Income', money(totals.income, c)], ['Expenses', money(totals.expense, c)], ['Net savings', money(totals.net, c)], ['Avg. daily spend', money(totals.avgDaily, c)]].map(([l, v]) => <div key={l} className="card p-5"><p className="eyebrow">{l}</p><p className="mt-3 text-2xl font-semibold">{v}</p></div>)}
      </div>
      {none ? <div className="card"><Empty title="No data in this range" hint="Pick a wider range or add transactions." /></div> : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Income vs expenses" sub="Month by month">
            <div className="h-64"><ResponsiveContainer><BarChart data={byMonth} margin={{ left: -10 }}>
              <GlowDefs />
              <CartesianGrid stroke="var(--c-line)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={(v) => compact(v, c)} />
              <Tooltip content={<NeonTooltip formatter={(v) => money(v, c)} />} cursor={{ fill: 'rgba(0,229,255,.05)' }} />
              <Bar dataKey="income" name="Income" fill="#00E5A0" radius={[6, 6, 0, 0]} filter="url(#neonGlow)" />
              <Bar dataKey="expense" name="Expenses" fill="#FF4FD8" radius={[6, 6, 0, 0]} filter="url(#neonGlow)" />
            </BarChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Daily spending" sub="Expenses per day">
            <div className="h-64"><ResponsiveContainer><AreaChart data={byDay} margin={{ left: -10 }}>
              <GlowDefs />
              <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} /><stop offset="100%" stopColor="#00E5FF" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--c-line)" vertical={false} /><XAxis dataKey="date" {...axis} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" /><YAxis {...axis} tickFormatter={(v) => compact(v, c)} />
              <Tooltip content={<NeonTooltip formatter={(v) => money(v, c)} />} />
              <Area type="monotone" dataKey="amount" name="Spent" stroke="#00E5FF" strokeWidth={2.5} fill="url(#gd)" filter="url(#neonGlow)" />
            </AreaChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Savings trend" sub="Net savings per month">
            <div className="h-64"><ResponsiveContainer><LineChart data={byMonth} margin={{ left: -10 }}>
              <GlowDefs />
              <CartesianGrid stroke="var(--c-line)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={(v) => compact(v, c)} />
              <Tooltip content={<NeonTooltip formatter={(v) => money(v, c)} />} />
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#B6FF4A" strokeWidth={2.5} dot={{ r: 3, fill: '#B6FF4A' }} filter="url(#neonGlow)" />
            </LineChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Highest expense categories" sub="Share of total spending">
            {byCategory.length === 0 ? <Empty title="No expenses" /> : <div className="space-y-4">{byCategory.slice(0, 7).map((x) => <div key={x.name}><div className="mb-1.5 flex justify-between text-sm"><span>{x.name}</span><span className="text-muted">{money(x.value, c)} · {x.percent}%</span></div><Progress percent={x.percent} /></div>)}</div>}
          </Panel>
          <Panel title="Month-over-month" sub={last && prev ? `${last.label} vs ${prev.label}` : 'Needs two months of data'}>
            {last && prev ? <div className="grid grid-cols-3 gap-3">{[['Income', 'income', true], ['Expenses', 'expense', false], ['Savings', 'savings', true]].map(([l, k, good]) => <div key={k} className="card-flat p-4"><p className="eyebrow">{l}</p><p className="mt-2 text-lg font-semibold">{compact(last[k], c)}</p><Delta value={mom(k)} goodWhenUp={good} /></div>)}</div> : <Empty title="Not enough data" hint="Choose a range spanning at least two months." />}
          </Panel>
          <Panel title="Top transactions" sub="Largest expenses in range">
            <div className="divide-y divide-line">{top.map((t) => <div key={t._id} className="flex items-center gap-3 py-2.5"><CatIcon category={t.category} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.title}</p><p className="text-xs text-muted">{fmtDate(t.date)}</p></div><span className="text-sm font-semibold">{money(t.amount, c)}</span></div>)}</div>
          </Panel>
        </div>
      )}
    </div>
  );
}

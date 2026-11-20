import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Info, Flame, Trophy } from 'lucide-react';
import api from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Loading, Delta } from '../components/UI.jsx';
import { money } from '../utils/format';

const LEVEL = { good: [CheckCircle2, 'text-pos'], warn: [AlertTriangle, 'text-neon-amber'], danger: [Flame, 'text-neg'], info: [Info, 'text-muted'] };

export default function Insights() {
  const { user } = useAuth();
  const { refreshKey } = useApp();
  const [d, setD] = useState(null);
  const c = user.currency;
  useEffect(() => { api.get('/insights').then((r) => setD(r.data)); }, [refreshKey]);
  if (!d) return <Loading />;
  const { summary: s, personality: p } = d;

  return (
    <div>
      <PageHeader title="Smart Insights" subtitle="Rule-based analysis of this month versus last month. No paid AI involved." />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card relative overflow-hidden p-6 xl:col-span-1">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-line" />
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full border border-line" />
          <p className="eyebrow flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-pos" />Spending personality</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{p.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">{p.signals.map((x) => <span key={x} className="chip">{x}</span>)}</div>
        </div>

        <div className="card p-6 xl:col-span-2">
          <h3 className="mb-4 font-semibold">Monthly financial summary</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[['Income', money(s.income, c)], ['Expenses', money(s.expense, c)], ['Savings rate', `${s.savingsRate}%`],
              ['Top category', s.topCategory ? `${s.topCategory.name}` : '—', s.topCategory && money(s.topCategory.amount, c)],
              ['Biggest expense', s.biggest ? s.biggest.title : '—', s.biggest && money(s.biggest.amount, c)],
              ['Best improvement', s.improvement ? s.improvement.name : '—', s.improvement && `${Math.abs(Math.round(s.improvement.change))}% lower`]].map(([l, v, sub]) => (
              <div key={l} className="card-flat p-4"><p className="eyebrow">{l}</p><p className="mt-2 truncate text-lg font-semibold">{v}</p>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
            ))}
          </div>
        </div>

        <div className="card p-6 xl:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-pos" />Smart recommendations</h3>
          <div className="space-y-2">
            {d.recommendations.map((r, i) => { const [I, tone] = LEVEL[r.level] || LEVEL.info; return <div key={i} className="card-flat flex items-start gap-3 p-4 transition-colors hover:border-[#363636]"><I className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} /><p className="text-sm">{r.text}</p></div>; })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4" />Category changes</h3>
          {d.categories.length === 0 ? <p className="text-sm text-muted">No spending data yet.</p> : (
            <div className="divide-y divide-line">{d.categories.slice(0, 8).map((x) => (
              <div key={x.name} className="flex items-center justify-between py-2.5 text-sm"><div><p>{x.name}</p><p className="text-xs text-muted">{money(x.current, c)} <span className="text-muted">vs {money(x.previous, c)}</span></p></div>{x.previous > 0 ? <Delta value={x.change} goodWhenUp={false} /> : <span className="chip">new</span>}</div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

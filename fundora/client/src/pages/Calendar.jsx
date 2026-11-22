import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat, Target } from 'lucide-react';
import api from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader } from '../components/UI.jsx';
import { Segmented } from '../components/Glow.jsx';
import DayPanel from '../components/DayPanel.jsx';
import { compact, toInputDate } from '../utils/format';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export default function Calendar() {
  const { user } = useAuth();
  const { refreshKey } = useApp();
  const c = user.currency;
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(toInputDate(new Date()));
  const [data, setData] = useState({ days: {}, bills: [], goals: [] });

  const { start, count } = useMemo(() => {
    if (view === 'week') { const s = addDays(cursor, -cursor.getDay()); return { start: s, count: 7 }; }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    return { start: addDays(first, -first.getDay()), count: 42 };
  }, [view, cursor]);
  const cells = useMemo(() => Array.from({ length: count }, (_, i) => addDays(start, i)), [start, count]);
  const from = toInputDate(cells[0]), to = toInputDate(cells[cells.length - 1]);

  useEffect(() => { api.get('/analytics/daily', { params: { from, to } }).then((r) => setData(r.data)).catch(() => {}); }, [from, to, refreshKey]);

  const step = (dir) => setCursor((d) => (view === 'week' ? addDays(d, 7 * dir) : new Date(d.getFullYear(), d.getMonth() + dir, 1)));
  const title = view === 'week'
    ? `${cells[0].toLocaleDateString('en', { day: 'numeric', month: 'short' })} – ${cells[6].toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const today = toInputDate(new Date());

  return (
    <div>
      <PageHeader title="Financial Calendar" subtitle="Daily income, spending, bills due and goal deadlines.">
        <Segmented value={view} onChange={setView} options={[['month', 'Month'], ['week', 'Week']]} />
        <div className="flex items-center gap-1 rounded-xl border border-line bg-card2 px-1">
          <button className="icon-btn" onClick={() => step(-1)}><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-44 text-center text-sm">{title}</span>
          <button className="icon-btn" onClick={() => step(1)}><ChevronRight className="h-4 w-4" /></button>
        </div>
        <button className="btn-ghost" onClick={() => { setCursor(new Date()); setSelected(today); }}>Today</button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line">{WD.map((w) => <div key={w} className="eyebrow px-2 py-2.5 text-center">{w}</div>)}</div>
          <div className="grid grid-cols-7">
            {cells.map((d) => {
              const k = toInputDate(d);
              const info = data.days[k];
              const bills = data.bills.filter((b) => b.date === k);
              const goals = data.goals.filter((g) => g.date === k);
              const outside = view === 'month' && d.getMonth() !== cursor.getMonth();
              const sel = k === selected;
              return (
                <button key={k} onClick={() => setSelected(k)}
                  className={`${view === 'week' ? 'min-h-40' : 'min-h-[92px]'} flex flex-col items-stretch gap-1 border-b border-r border-line/60 p-1.5 text-left transition-colors hover:bg-card2 sm:p-2 ${sel ? 'bg-card2 ring-1 ring-inset ring-[var(--c-line-strong)]' : ''} ${outside ? 'opacity-35' : ''}`}>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${k === today ? 'bg-gradient-to-br from-neon-green to-neon-emerald font-semibold text-black shadow-glow-green' : 'text-muted'}`}>{d.getDate()}</span>
                  {info?.income > 0 && <span className="truncate text-[10px] font-medium text-pos sm:text-[11px]">+{compact(info.income, c)}</span>}
                  {info?.expense > 0 && <span className="truncate text-[10px] text-neg sm:text-[11px]">−{compact(info.expense, c)}</span>}
                  {bills.length > 0 && <span className="flex items-center gap-1 truncate text-[10px] text-muted"><Repeat className="h-2.5 w-2.5 shrink-0" />{view === 'week' ? bills.map((b) => b.name).join(', ') : bills.length}</span>}
                  {goals.length > 0 && <span className="flex items-center gap-1 truncate text-[10px] text-pos"><Target className="h-2.5 w-2.5 shrink-0" />{goals.length > 1 ? goals.length : goals[0].name}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-5 border-t border-line px-4 py-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pos" />Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-neg" />Spending</span>
            <span className="flex items-center gap-1.5"><Repeat className="h-3 w-3" />Bill due</span>
            <span className="flex items-center gap-1.5"><Target className="h-3 w-3 text-pos" />Goal deadline</span>
          </div>
        </div>
        <DayPanel date={selected} bills={data.bills.filter((b) => b.date === selected)} goals={data.goals.filter((g) => g.date === selected)} />
      </div>
    </div>
  );
}

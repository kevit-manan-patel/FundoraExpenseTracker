import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Loading, Progress } from '../components/UI.jsx';
import { Segmented } from '../components/Glow.jsx';
import DayPanel from '../components/DayPanel.jsx';
import { money, fmtDate, toInputDate } from '../utils/format';

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const LEVELS = ['var(--c-card2)', 'rgba(182,255,74,.22)', 'rgba(182,255,74,.45)', 'rgba(0,229,160,.7)', '#B6FF4A'];
const LEVEL_GLOW = ['none', 'none', '0 0 6px rgba(182,255,74,.4)', '0 0 8px rgba(0,229,160,.6)', '0 0 12px rgba(182,255,74,.85)'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Heatmap() {
  const { user } = useAuth();
  const { refreshKey } = useApp();
  const c = user.currency;
  const [months, setMonths] = useState(6);
  const [days, setDays] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tip, setTip] = useState(null);

  const today = new Date();
  const rangeStart = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  const gridStart = addDays(rangeStart, -rangeStart.getDay());
  const from = toInputDate(rangeStart), to = toInputDate(today);

  useEffect(() => { setDays(null); api.get('/analytics/daily', { params: { from, to } }).then((r) => setDays(r.data.days)).catch(() => setDays({})); }, [from, to, refreshKey]);

  const calc = useMemo(() => {
    if (!days) return null;
    const total = Math.round((today - gridStart) / 86400000) + 1;
    const weeks = [];
    const all = []; // days inside range
    for (let i = 0; i < total; i++) {
      const d = addDays(gridStart, i);
      const inRange = d >= rangeStart && d <= today;
      const amount = inRange ? days[toInputDate(d)]?.expense || 0 : 0;
      const cell = { d, key: toInputDate(d), inRange, amount, count: days[toInputDate(d)]?.count || 0 };
      if (inRange) all.push(cell);
      if (i % 7 === 0) weeks.push([]);
      weeks[weeks.length - 1].push(cell);
    }
    const nz = all.filter((x) => x.amount > 0).map((x) => x.amount).sort((a, b) => a - b);
    const q = (p) => nz[Math.min(nz.length - 1, Math.floor(nz.length * p))];
    const t1 = nz.length ? q(0.25) : 0, t2 = nz.length ? q(0.5) : 0, t3 = nz.length ? q(0.75) : 0;
    const level = (a) => (a <= 0 ? 0 : a <= t1 ? 1 : a <= t2 ? 2 : a <= t3 ? 3 : 4);
    const mean = nz.reduce((a, b) => a + b, 0) / (nz.length || 1);
    const sd = Math.sqrt(nz.reduce((a, b) => a + (b - mean) ** 2, 0) / (nz.length || 1));
    const highCut = nz.length >= 5 ? mean + 1.5 * sd : Infinity;
    const totalSpent = nz.reduce((a, b) => a + b, 0);
    const byMonth = {};
    all.forEach((x) => { const k = x.key.slice(0, 7); byMonth[k] = byMonth[k] || { month: k, total: 0, active: 0, peak: 0, daysInRange: 0 }; byMonth[k].total += x.amount; byMonth[k].daysInRange += 1; if (x.amount > 0) byMonth[k].active += 1; byMonth[k].peak = Math.max(byMonth[k].peak, x.amount); });
    const wd = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
    all.forEach((x) => { wd[x.d.getDay()].sum += x.amount; wd[x.d.getDay()].n += 1; });
    return { weeks, level, highCut, totalSpent, active: nz.length, top: [...all].sort((a, b) => b.amount - a.amount).filter((x) => x.amount > 0).slice(0, 5), highCount: all.filter((x) => x.amount >= highCut).length, byMonth: Object.values(byMonth), wd: wd.map((w) => (w.n ? w.sum / w.n : 0)) };
  }, [days, months]); // eslint-disable-line

  const monthLabels = useMemo(() => {
    if (!calc) return [];
    let last = -1;
    return calc.weeks.map((w) => { const first = w.find((x) => x.inRange) || w[0]; const m = first.d.getMonth(); const show = m !== last && first.inRange; if (first.inRange) last = m; return show ? first.d.toLocaleDateString('en', { month: 'short' }) : ''; });
  }, [calc]);

  const showTip = (e, cell) => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.top, cell }); };
  const maxMonth = calc ? Math.max(...calc.byMonth.map((m) => m.total), 1) : 1;
  const maxWd = calc ? Math.max(...calc.wd, 1) : 1;

  return (
    <div>
      <PageHeader title="Spending Heatmap" subtitle="Each square is a day. Brighter means you spent more.">
        <Segmented value={months} onChange={(m) => { setMonths(m); setSelected(null); }} options={[[3, '3 months'], [6, '6 months'], [12, '12 months']]} />
      </PageHeader>
      {!calc ? <Loading /> : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[['Total spent', money(calc.totalSpent, c)], ['Active spending days', `${calc.active}`], ['Avg. per active day', money(calc.active ? calc.totalSpent / calc.active : 0, c)], ['High-spending days', `${calc.highCount}`]].map(([l, v]) => <div key={l} className="card p-5"><p className="eyebrow">{l}</p><p className="mt-3 text-2xl font-semibold">{v}</p></div>)}
          </div>

          <div className="card p-5">
            <div className="overflow-x-auto pb-2">
              <div className="inline-block min-w-max">
                <div className="mb-1.5 flex gap-[3px] pl-9">{monthLabels.map((l, i) => <div key={i} className="w-4 text-[10px] text-muted">{l}</div>)}</div>
                <div className="flex gap-[3px]">
                  <div className="flex w-8 flex-col gap-[3px] pr-1 text-right text-[10px] text-muted">{WD.map((w, i) => <div key={w} className="h-4 leading-4">{i % 2 === 1 ? w : ''}</div>)}</div>
                  {calc.weeks.map((w, i) => (
                    <div key={i} className="flex flex-col gap-[3px]">
                      {w.map((cell) => cell.inRange ? (
                        <button key={cell.key} onMouseEnter={(e) => showTip(e, cell)} onMouseLeave={() => setTip(null)} onClick={() => setSelected(cell.key)}
                          className={`h-4 w-4 rounded-[4px] border transition-transform hover:scale-125 ${selected === cell.key ? 'border-neon-cyan' : cell.amount >= calc.highCut ? 'border-neg/80' : 'border-line'}`}
                          style={{ background: LEVELS[calc.level(cell.amount)], boxShadow: LEVEL_GLOW[calc.level(cell.amount)] }} aria-label={`${cell.key} ${cell.amount}`} />
                      ) : <div key={cell.key} className="h-4 w-4" />)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              Less {LEVELS.map((l, i) => <span key={i} className="h-3.5 w-3.5 rounded-[3px] border border-line" style={{ background: l, boxShadow: LEVEL_GLOW[i] }} />)} More
              <span className="ml-4 flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-[3px] border border-neg/80" />High-spending day</span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="card p-5">
              <h3 className="mb-4 font-semibold">Month comparison</h3>
              <div className="space-y-4">{calc.byMonth.map((m) => (
                <div key={m.month}>
                  <div className="mb-1.5 flex justify-between text-sm"><span>{new Date(Number(m.month.slice(0, 4)), Number(m.month.slice(5)) - 1, 1).toLocaleDateString('en', { month: 'short', year: '2-digit' })}</span><span className="text-muted">{money(m.total, c)}</span></div>
                  <Progress percent={(m.total / maxMonth) * 100} />
                  <p className="mt-1 text-[11px] text-muted">{m.active} active days · peak {money(m.peak, c)}</p>
                </div>
              ))}</div>
            </div>
            <div className="card p-5">
              <h3 className="mb-4 font-semibold">Average by weekday</h3>
              <div className="space-y-3">{calc.wd.map((v, i) => <div key={i} className="flex items-center gap-3 text-sm"><span className="w-8 text-xs text-muted">{WD[i]}</span><div className="flex-1"><Progress percent={(v / maxWd) * 100} tone="bg-pos" /></div><span className="w-20 text-right text-xs text-muted">{money(v, c)}</span></div>)}</div>
            </div>
            <div className="card p-5">
              <h3 className="mb-4 font-semibold">Biggest spending days</h3>
              {calc.top.length === 0 ? <p className="text-sm text-muted">No spending in this range yet.</p> : <div className="space-y-1">{calc.top.map((x) => <button key={x.key} onClick={() => setSelected(x.key)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-card2"><span>{fmtDate(x.d, { weekday: 'short', day: 'numeric', month: 'short' })}</span><span className="font-semibold">{money(x.amount, c)}</span></button>)}</div>}
            </div>
          </div>
          {selected && <DayPanel date={selected} onClose={() => setSelected(null)} />}
        </div>
      )}
      {tip && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-card2 px-3 py-2 text-xs shadow-xl" style={{ left: tip.x, top: tip.y - 8 }}>
          <p className="font-medium">{fmtDate(tip.cell.d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="text-muted">{tip.cell.amount > 0 ? `${money(tip.cell.amount, c)} spent · ${tip.cell.count} txn` : 'No spending'}</p>
        </div>
      )}
    </div>
  );
}

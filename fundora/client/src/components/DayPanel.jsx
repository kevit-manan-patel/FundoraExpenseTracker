import { useEffect, useState } from 'react';
import { Plus, Repeat, Target, X } from 'lucide-react';
import api from '../api';
import { useApp } from './Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CatIcon, Empty, Spinner } from './UI.jsx';
import { money, fmtDate } from '../utils/format';

const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export default function DayPanel({ date, bills = [], goals = [], onClose }) {
  const { user } = useAuth();
  const { openTxn, refreshKey } = useApp();
  const [items, setItems] = useState(null);
  const c = user.currency;

  useEffect(() => {
    setItems(null);
    api.get('/transactions', { params: { from: date, to: date, limit: 100, sort: 'amount_desc' } }).then((r) => setItems(r.data.items)).catch(() => setItems([]));
  }, [date, refreshKey]);

  const inc = (items || []).filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const exp = (items || []).filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  return (
    <div className="card animate-fadeUp p-5">
      <div className="mb-4 flex items-start justify-between">
        <div><p className="eyebrow">Selected day</p><h3 className="mt-1 font-semibold">{fmtDate(parse(date), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3></div>
        {onClose && <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="card-flat p-3"><p className="eyebrow">Income</p><p className="mt-1 font-semibold text-pos">{money(inc, c)}</p></div>
        <div className="card-flat p-3"><p className="eyebrow">Spent</p><p className="mt-1 font-semibold">{money(exp, c)}</p></div>
      </div>
      {bills.length > 0 && (
        <div className="mb-4 space-y-2">{bills.map((b, i) => <div key={i} className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-sm"><Repeat className="h-4 w-4 text-muted" /><span className="flex-1 truncate">{b.name} <span className="text-xs text-muted">due</span></span><span>{money(b.amount, c)}</span></div>)}</div>
      )}
      {goals.length > 0 && (
        <div className="mb-4 space-y-2">{goals.map((g, i) => <div key={i} className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-sm"><Target className="h-4 w-4 text-pos" /><span className="flex-1 truncate">{g.name} <span className="text-xs text-muted">{g.done ? 'target date (reached)' : 'target date'}</span></span></div>)}</div>
      )}
      {items === null ? <div className="grid h-24 place-items-center"><Spinner /></div> : items.length === 0 ? <Empty title="No transactions" hint="Nothing recorded on this day." /> : (
        <div className="divide-y divide-line">
          {items.map((t) => (
            <div key={t._id} className="flex items-center gap-3 py-2.5">
              <CatIcon category={t.category} type={t.type} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.title}</p><p className="text-xs text-muted">{t.category}</p></div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-pos' : ''}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount, c)}</span>
            </div>
          ))}
        </div>
      )}
      <button className="btn-ghost mt-4 w-full" onClick={() => openTxn({ date: parse(date) })}><Plus className="h-4 w-4" />Add transaction on this day</button>
    </div>
  );
}

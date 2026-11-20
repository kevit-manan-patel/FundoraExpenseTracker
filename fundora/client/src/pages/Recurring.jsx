import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, Pause, Play } from 'lucide-react';
import api, { errMsg } from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Loading, Empty, CatIcon, Button } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import { money, fmtDate, toInputDate, EXPENSE_CATEGORIES } from '../utils/format';

const monthly = (r) => (r.cycle === 'weekly' ? (r.amount * 52) / 12 : r.cycle === 'yearly' ? r.amount / 12 : r.amount);
const daysUntil = (d) => Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 86400000);

export default function Recurring({ mode }) {
  const { user } = useAuth();
  const { refresh, refreshKey } = useApp();
  const isSub = mode === 'subscriptions';
  const [all, setAll] = useState(null);
  const [form, setForm] = useState(null);
  const c = user.currency;

  useEffect(() => { api.get('/recurring').then((r) => setAll(r.data)); }, [refreshKey]);

  const items = (all || []).filter((r) => (isSub ? r.category === 'Subscriptions' : true));
  const active = items.filter((r) => r.status === 'active');
  const total = active.reduce((a, r) => a + monthly(r), 0);

  const act = async (fn, ok) => { try { await fn(); toast.success(ok); refresh(); } catch (e) { toast.error(errMsg(e)); } };
  const remove = (r) => confirm(`Delete "${r.name}"?`) && act(() => api.delete(`/recurring/${r._id}`), 'Deleted');

  return (
    <div>
      <PageHeader title={isSub ? 'Subscriptions' : 'Recurring Payments'} subtitle={isSub ? 'Services that bill you on repeat.' : 'Rent, bills and everything that repeats.'}>
        <Button onClick={() => setForm({ category: isSub ? 'Subscriptions' : 'Rent' })}><Plus className="h-4 w-4" />Add {isSub ? 'subscription' : 'payment'}</Button>
      </PageHeader>
      {!all ? <Loading /> : (<>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card p-5"><p className="eyebrow">Monthly cost</p><p className="mt-3 text-2xl font-semibold">{money(total, c)}</p></div>
          <div className="card p-5"><p className="eyebrow">Yearly cost</p><p className="mt-3 text-2xl font-semibold">{money(total * 12, c)}</p></div>
          <div className="card p-5"><p className="eyebrow">Active</p><p className="mt-3 text-2xl font-semibold">{active.length}<span className="text-sm text-muted"> of {items.length}</span></p></div>
        </div>

        {active.length > 0 && (
          <div className="card mb-6 p-5">
            <h3 className="mb-4 font-semibold">Upcoming timeline</h3>
            <div className="space-y-0">
              {[...active].sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate)).slice(0, 6).map((r, i, arr) => {
                const d = daysUntil(r.nextDate);
                return (
                  <div key={r._id} className="flex gap-4">
                    <div className="flex flex-col items-center"><span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${d < 0 ? 'bg-neg' : d <= 7 ? 'bg-neon-amber shadow-glow-amber' : 'bg-[var(--c-line-strong)]'}`} />{i < arr.length - 1 && <span className="w-px flex-1 bg-line" />}</div>
                    <div className="flex flex-1 items-center justify-between pb-5"><div><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-muted">{fmtDate(r.nextDate)} · {d < 0 ? `${-d} day(s) overdue` : d === 0 ? 'Due today' : `in ${d} day(s)`}</p></div><span className="text-sm font-medium">{money(r.amount, c)}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card divide-y divide-line">
          {items.length === 0 ? <Empty title="Nothing here yet" hint="Add Netflix, rent, internet… anything that repeats." /> : items.map((r) => (
            <div key={r._id} className={`flex flex-wrap items-center gap-3 p-4 ${r.status === 'inactive' ? 'opacity-50' : ''}`}>
              <CatIcon category={r.category} />
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.name}</p><p className="text-xs capitalize text-muted">{r.cycle} · next {fmtDate(r.nextDate)} · {r.category}</p></div>
              <span className="font-semibold">{money(r.amount, c)}</span>
              <div className="flex items-center">
                {r.status === 'active' && <button className="icon-btn hover:!text-pos" title="Mark as paid (adds an expense, moves due date)" onClick={() => act(() => api.post(`/recurring/${r._id}/pay`), 'Paid. Expense added')}><Check className="h-4 w-4" /></button>}
                <button className="icon-btn" title={r.status === 'active' ? 'Pause' : 'Resume'} onClick={() => act(() => api.patch(`/recurring/${r._id}/toggle`), r.status === 'active' ? 'Paused' : 'Resumed')}>{r.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                <button className="icon-btn" onClick={() => setForm(r)}><Pencil className="h-4 w-4" /></button>
                <button className="icon-btn hover:!text-neg" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Tip: tap ✓ when a payment is made. One tap adds exactly one expense and moves the due date forward, so nothing is ever duplicated.</p>
      </>)}
      {form && <RecurringForm initial={form} onClose={() => setForm(null)} onSaved={refresh} />}
    </div>
  );
}

function RecurringForm({ initial, onClose, onSaved }) {
  const editing = !!initial._id;
  const [f, setF] = useState({ name: initial.name || '', amount: initial.amount || '', cycle: initial.cycle || 'monthly', nextDate: toInputDate(initial.nextDate || new Date()), category: initial.category || 'Subscriptions', status: initial.status || 'active' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error('Enter a name');
    if (!(Number(f.amount) > 0)) return toast.error('Amount must be greater than 0');
    setBusy(true);
    try {
      const body = { ...f, amount: Number(f.amount) };
      if (editing) await api.put(`/recurring/${initial._id}`, body); else await api.post('/recurring', body);
      toast.success('Saved'); onSaved(); onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Modal title={editing ? 'Edit payment' : 'New recurring payment'} onClose={onClose} width="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Name</label><input className="input" autoFocus placeholder="e.g. Netflix" value={f.name} onChange={set('name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Amount</label><input className="input" type="number" min="0" step="0.01" value={f.amount} onChange={set('amount')} /></div>
          <div><label className="label">Billing cycle</label><select className="input" value={f.cycle} onChange={set('cycle')}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
          <div><label className="label">Next payment</label><input className="input" type="date" value={f.nextDate} onChange={set('nextDate')} /></div>
          <div><label className="label">Category</label><select className="input" value={f.category} onChange={set('category')}>{EXPENSE_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
      </form>
    </Modal>
  );
}

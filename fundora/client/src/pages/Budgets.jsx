import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { errMsg } from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Loading, Empty, CatIcon, Progress, Button } from '../components/UI.jsx';
import { ProgressRing } from '../components/Glow.jsx';
import Modal from '../components/Modal.jsx';
import { money, EXPENSE_CATEGORIES, thisMonth, monthLabel } from '../utils/format';

const shift = (m, d) => { const x = new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1 + d, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };

export default function Budgets() {
  const { user } = useAuth();
  const { refresh, refreshKey } = useApp();
  const [params, setParams] = useSearchParams();
  const [month, setMonth] = useState(thisMonth());
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(params.get('new') ? {} : null);
  const c = user.currency;

  useEffect(() => { api.get('/budgets', { params: { month } }).then((r) => setItems(r.data)); }, [month, refreshKey]);
  useEffect(() => { if (params.get('new')) setParams({}, { replace: true }); }, []); // eslint-disable-line

  const remove = async (b) => {
    if (!confirm(`Delete the ${b.category} budget?`)) return;
    try { await api.delete(`/budgets/${b._id}`); toast.success('Budget deleted'); refresh(); } catch (e) { toast.error(errMsg(e)); }
  };
  const total = items?.find((b) => b.category === 'Overall');

  return (
    <div>
      <PageHeader title="Budgets" subtitle="Monthly limits, tracked against your real spending.">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-card2 px-1">
          <button className="icon-btn" onClick={() => setMonth(shift(month, -1))}><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-32 text-center text-sm">{monthLabel(month)}</span>
          <button className="icon-btn" onClick={() => setMonth(shift(month, 1))}><ChevronRight className="h-4 w-4" /></button>
        </div>
        <Button onClick={() => setForm({})}><Plus className="h-4 w-4" />New budget</Button>
      </PageHeader>

      {!items ? <Loading /> : items.length === 0 ? (
        <div className="card"><Empty title={`No budgets for ${monthLabel(month)}`} hint="Create a category budget, or an Overall budget for total spending." action={<Button className="mt-2" onClick={() => setForm({})}>Create budget</Button>} /></div>
      ) : (<>
        {total && <p className="mb-4 text-sm text-muted">Overall: <span className="text-text font-medium">{money(total.spent, c)}</span> of {money(total.amount, c)} · {Math.round(total.percent)}% used</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => {
            const state = b.percent >= 100 ? ['Exceeded', 'text-neg'] : b.percent >= 90 ? ['90% reached', 'text-neon-amber'] : b.percent >= 75 ? ['75% reached', 'text-neon-amber'] : null;
            const ringColor = b.percent >= 100 ? 'red' : b.percent >= 75 ? 'amber' : 'green';
            return (
              <div key={b._id} className="card p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3"><CatIcon category={b.category} /><div><p className="font-medium">{b.category}</p><p className="text-xs text-muted">{money(b.amount, c)} limit</p></div></div>
                  <div className="flex"><button className="icon-btn" onClick={() => setForm(b)}><Pencil className="h-4 w-4" /></button><button className="icon-btn hover:!text-neg" onClick={() => remove(b)}><Trash2 className="h-4 w-4" /></button></div>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressRing percent={b.percent} size={64} stroke={6} color={ringColor} />
                  <div className="flex-1">
                    <Progress percent={b.percent} />
                    <div className="mt-3 flex items-center justify-between text-xs"><span className="text-muted">{money(b.spent, c)} spent</span><span className={b.remaining < 0 ? 'text-neg' : 'text-muted'}>{b.remaining < 0 ? `${money(-b.remaining, c)} over` : `${money(b.remaining, c)} left`}</span></div>
                  </div>
                </div>
                {state && <div className="mt-3"><span className={`flex items-center gap-1 text-xs ${state[1]}`}><AlertTriangle className="h-3.5 w-3.5" />{state[0]}</span></div>}
              </div>
            );
          })}
        </div>
      </>)}
      {form && <BudgetForm initial={form} month={month} onClose={() => setForm(null)} onSaved={refresh} />}
    </div>
  );
}

function BudgetForm({ initial, month, onClose, onSaved }) {
  const editing = !!initial._id;
  const [category, setCategory] = useState(initial.category || 'Food');
  const [amount, setAmount] = useState(initial.amount || '');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) return toast.error('Enter a budget amount greater than 0');
    setBusy(true);
    try {
      if (editing) await api.put(`/budgets/${initial._id}`, { amount: Number(amount) });
      else await api.post('/budgets', { category, amount: Number(amount), month });
      toast.success(editing ? 'Budget updated' : 'Budget created'); onSaved(); onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Modal title={editing ? 'Edit budget' : `New budget · ${monthLabel(month)}`} onClose={onClose} width="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Category</label><select className="input" disabled={editing} value={category} onChange={(e) => setCategory(e.target.value)}><option value="Overall">Overall (all spending)</option>{EXPENSE_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><label className="label">Monthly limit</label><input className="input" type="number" min="1" autoFocus placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{editing ? 'Save' : 'Create budget'}</Button></div>
      </form>
    </Modal>
  );
}

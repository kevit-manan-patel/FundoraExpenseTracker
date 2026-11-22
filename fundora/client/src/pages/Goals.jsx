import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CheckCircle2, PiggyBank } from 'lucide-react';
import api, { errMsg } from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Loading, Empty, Progress, Button } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import { money, fmtDate, toInputDate } from '../utils/format';

// Estimate completion from average contribution pace since the first contribution
function estimate(g) {
  if (g.currentAmount >= g.targetAmount) return 'Completed';
  const cs = g.contributions || [];
  if (cs.length === 0) return 'Add a contribution to see an estimate';
  const first = new Date(cs[0].date);
  const days = Math.max((Date.now() - first) / 86400000, 7);
  const perDay = g.currentAmount / days;
  if (perDay <= 0) return '—';
  return `Est. ${fmtDate(new Date(Date.now() + ((g.targetAmount - g.currentAmount) / perDay) * 86400000), { month: 'short', year: 'numeric' })}`;
}

export default function Goals() {
  const { user } = useAuth();
  const { refreshKey, refresh } = useApp();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(params.get('new') ? {} : null);
  const [contrib, setContrib] = useState(null);
  const c = user.currency;

  useEffect(() => { api.get('/goals').then((r) => setItems(r.data)); }, [refreshKey]);
  useEffect(() => { if (params.get('new')) setParams({}, { replace: true }); }, []); // eslint-disable-line

  const remove = async (g) => {
    if (!confirm(`Delete goal "${g.name}"?`)) return;
    try { await api.delete(`/goals/${g._id}`); toast.success('Goal deleted'); refresh(); } catch (e) { toast.error(errMsg(e)); }
  };
  const active = (items || []).filter((g) => g.currentAmount < g.targetAmount);
  const done = (items || []).filter((g) => g.currentAmount >= g.targetAmount);

  const Card = ({ g }) => {
    const pct = (g.currentAmount / g.targetAmount) * 100;
    return (
      <div className="card p-5">
        <div className="mb-3 flex items-start justify-between">
          <div><p className="font-medium">{g.name}</p>{g.description && <p className="mt-0.5 text-xs text-muted">{g.description}</p>}</div>
          <div className="flex"><button className="icon-btn" onClick={() => setForm(g)}><Pencil className="h-4 w-4" /></button><button className="icon-btn hover:!text-neg" onClick={() => remove(g)}><Trash2 className="h-4 w-4" /></button></div>
        </div>
        <div className="mb-2 flex items-baseline justify-between"><span className="text-xl font-semibold">{money(g.currentAmount, c)}</span><span className="text-xs text-muted">of {money(g.targetAmount, c)}</span></div>
        <Progress percent={pct} tone={pct >= 100 ? 'pos' : undefined} />
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{Math.min(Math.round(pct), 100)}% · {pct >= 100 ? 'Goal reached' : `${money(g.targetAmount - g.currentAmount, c)} to go`}</span>
          {g.targetDate && <span>Due {fmtDate(g.targetDate, { month: 'short', year: 'numeric' })}</span>}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted">{pct >= 100 && <CheckCircle2 className="h-3.5 w-3.5 text-pos" />}{estimate(g)}</span>
          {pct < 100 && <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => setContrib(g)}><PiggyBank className="h-3.5 w-3.5" />Contribute</Button>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Goals" subtitle="Save towards the things that matter."><Button onClick={() => setForm({})}><Plus className="h-4 w-4" />New goal</Button></PageHeader>
      {!items ? <Loading /> : items.length === 0 ? <div className="card"><Empty title="No goals yet" hint="A laptop, a trip, an emergency fund. Start with one." action={<Button className="mt-2" onClick={() => setForm({})}>Create goal</Button>} /></div> : (<>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{active.map((g) => <Card key={g._id} g={g} />)}</div>
        {done.length > 0 && (<><h3 className="eyebrow mb-3 mt-8">Completed</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{done.map((g) => <Card key={g._id} g={g} />)}</div></>)}
      </>)}
      {form && <GoalForm initial={form} onClose={() => setForm(null)} onSaved={refresh} />}
      {contrib && <Contribute goal={contrib} currency={c} onClose={() => setContrib(null)} onSaved={refresh} />}
    </div>
  );
}

function GoalForm({ initial, onClose, onSaved }) {
  const editing = !!initial._id;
  const [f, setF] = useState({ name: initial.name || '', targetAmount: initial.targetAmount || '', currentAmount: initial.currentAmount ?? '', targetDate: initial.targetDate ? toInputDate(initial.targetDate) : '', description: initial.description || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error('Give your goal a name');
    if (!(Number(f.targetAmount) > 0)) return toast.error('Target amount must be greater than 0');
    setBusy(true);
    try {
      if (editing) await api.put(`/goals/${initial._id}`, f); else await api.post('/goals', f);
      toast.success(editing ? 'Goal updated' : 'Goal created'); onSaved(); onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Modal title={editing ? 'Edit goal' : 'New goal'} onClose={onClose} width="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Goal name</label><input className="input" autoFocus placeholder="e.g. New laptop" value={f.name} onChange={set('name')} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label">Target amount</label><input className="input" type="number" min="1" value={f.targetAmount} onChange={set('targetAmount')} /></div><div><label className="label">Saved so far</label><input className="input" type="number" min="0" placeholder="0" value={f.currentAmount} onChange={set('currentAmount')} /></div></div>
        <div><label className="label">Target date</label><input className="input" type="date" value={f.targetDate} onChange={set('targetDate')} /></div>
        <div><label className="label">Description</label><input className="input" placeholder="Optional" value={f.description} onChange={set('description')} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{editing ? 'Save' : 'Create goal'}</Button></div>
      </form>
    </Modal>
  );
}

function Contribute({ goal, currency, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) return toast.error('Enter an amount greater than 0');
    setBusy(true);
    try { await api.post(`/goals/${goal._id}/contribute`, { amount: Number(amount) }); toast.success('Contribution added'); onSaved(); onClose(); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Contribute to ${goal.name}`} onClose={onClose} width="max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">{money(goal.targetAmount - goal.currentAmount, currency)} remaining</p>
        <input className="input" type="number" min="1" autoFocus placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Add</Button></div>
      </form>
    </Modal>
  );
}

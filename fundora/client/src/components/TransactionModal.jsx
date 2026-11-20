import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import { Button } from './UI.jsx';
import api, { errMsg } from '../api';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, toInputDate } from '../utils/format';

export default function TransactionModal({ initial, onClose, onSaved }) {
  const editing = !!initial?._id;
  const [f, setF] = useState({
    type: initial?.type || 'expense', title: initial?.title || '', amount: initial?.amount || '',
    category: initial?.category || (initial?.type === 'income' ? 'Salary' : 'Food'),
    date: toInputDate(initial?.date || new Date()), paymentMethod: initial?.paymentMethod || 'UPI',
    description: initial?.description || '', notes: initial?.notes || '', tags: (initial?.tags || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const cats = f.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const setType = (type) => setF((s) => ({ ...s, type, category: type === 'income' ? 'Salary' : 'Food' }));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = 'Title is required';
    if (!(Number(f.amount) > 0)) er.amount = 'Enter an amount greater than 0';
    if (!f.date) er.date = 'Pick a date';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const payload = { ...f, amount: Number(f.amount) };
      let res;
      if (editing) res = await api.put(`/transactions/${initial._id}`, payload);
      else res = await api.post('/transactions', payload);
      toast.success(editing ? 'Transaction updated' : 'Transaction added');
      (res.data.budgetAlerts || []).forEach((a) => toast(`${a.category} budget ${a.threshold >= 100 ? 'exceeded' : `reached ${a.threshold}%`} (${a.percent}% used)`, { icon: a.threshold >= 100 ? '🚨' : '⚠️', duration: 6000 }));
      onSaved();
      onClose();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <Modal title={editing ? 'Edit transaction' : 'New transaction'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-card2 p-1">
          {['expense', 'income'].map((t) => (
            <button type="button" key={t} onClick={() => setType(t)}
              className={`rounded-lg py-2 text-sm font-medium capitalize transition-all ${f.type === t ? (t === 'income' ? 'bg-gradient-to-r from-neon-emerald to-neon-green text-black shadow-glow-emerald' : 'bg-gradient-to-r from-neon-pink to-neon-purple text-black shadow-glow-pink') : 'text-muted hover:text-text'}`}>{t}</button>
          ))}
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" autoFocus placeholder="e.g. Swiggy dinner" value={f.title} onChange={set('title')} />
          {errors.title && <p className="mt-1 text-xs text-neg">{errors.title}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={f.amount} onChange={set('amount')} />
            {errors.amount && <p className="mt-1 text-xs text-neg">{errors.amount}</p>}
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={f.date} onChange={set('date')} />
            {errors.date && <p className="mt-1 text-xs text-neg">{errors.date}</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={f.category} onChange={set('category')}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label className="label">Payment method</label>
            <select className="input" value={f.paymentMethod} onChange={set('paymentMethod')}>{PAYMENT_METHODS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="Optional" value={f.description} onChange={set('description')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Notes</label><input className="input" placeholder="Optional" value={f.notes} onChange={set('notes')} /></div>
          <div><label className="label">Tags (comma separated)</label><input className="input" placeholder="work, trip" value={f.tags} onChange={set('tags')} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add transaction'}</Button>
        </div>
      </form>
    </Modal>
  );
}

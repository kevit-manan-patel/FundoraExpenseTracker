import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Download, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api, { errMsg } from '../api';
import { useApp } from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Loading, Empty, CatIcon, Button } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import { money, fmtDate, EXPENSE_CATEGORIES, INCOME_CATEGORIES, downloadCSV } from '../utils/format';

const ALL_CATS = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export default function Transactions() {
  const { user } = useAuth();
  const { openTxn, refresh, refreshKey } = useApp();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [f, setF] = useState({ type: '', category: '', from: '', to: '', min: '', max: '', sort: 'date_desc' });
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [detail, setDetail] = useState(null);
  const [exporting, setExporting] = useState(false);
  const c = user.currency;

  const query = useCallback(() => ({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')), q, page, limit: 10 }), [f, q, page]);
  useEffect(() => { setPage(1); }, [f, q]);
  useEffect(() => { api.get('/transactions', { params: query() }).then((r) => setRes(r.data)).catch((e) => toast.error(errMsg(e))); }, [query, refreshKey]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const remove = async (t) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    try { await api.delete(`/transactions/${t._id}`); toast.success('Deleted'); setDetail(null); refresh(); } catch (e) { toast.error(errMsg(e)); }
  };
  const exportCSV = async () => {
    setExporting(true);
    try { const { data } = await api.get('/transactions', { params: { ...query(), page: 1, limit: 5000 } }); downloadCSV(data.items); toast.success(`Exported ${data.items.length} rows`); } catch (e) { toast.error(errMsg(e)); } finally { setExporting(false); }
  };
  const reset = () => setF({ type: '', category: '', from: '', to: '', min: '', max: '', sort: 'date_desc' });

  return (
    <div>
      <PageHeader title="Transactions" subtitle={q ? `Results for “${q}”` : 'Every rupee in and out.'}>
        <Button variant="ghost" onClick={exportCSV} loading={exporting}><Download className="h-4 w-4" />Export CSV</Button>
        <Button onClick={() => openTxn({})}><Plus className="h-4 w-4" />Add</Button>
      </PageHeader>

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <select className="input" value={f.type} onChange={set('type')}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
        <select className="input" value={f.category} onChange={set('category')}><option value="">All categories</option>{ALL_CATS.map((x) => <option key={x}>{x}</option>)}</select>
        <input className="input" type="date" title="From" value={f.from} onChange={set('from')} />
        <input className="input" type="date" title="To" value={f.to} onChange={set('to')} />
        <input className="input" type="number" placeholder="Min amount" value={f.min} onChange={set('min')} />
        <input className="input" type="number" placeholder="Max amount" value={f.max} onChange={set('max')} />
        <select className="input" value={f.sort} onChange={set('sort')}><option value="date_desc">Newest first</option><option value="date_asc">Oldest first</option><option value="amount_desc">Amount: high → low</option><option value="amount_asc">Amount: low → high</option></select>
        <button className="btn-ghost" onClick={reset}>Reset</button>
      </div>

      <div className="card overflow-hidden">
        {!res ? <Loading /> : res.items.length === 0 ? <Empty title="No transactions found" hint="Try different filters, or add a new transaction." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-line text-left"><th className="eyebrow px-5 py-3 font-medium">Transaction</th><th className="eyebrow px-3 py-3 font-medium">Category</th><th className="eyebrow px-3 py-3 font-medium">Date</th><th className="eyebrow px-3 py-3 font-medium">Method</th><th className="eyebrow px-3 py-3 text-right font-medium">Amount</th><th className="w-24" /></tr></thead>
              <tbody>
                {res.items.map((t) => (
                  <tr key={t._id} onClick={() => setDetail(t)} className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-card2">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><CatIcon category={t.category} type={t.type} /><div className="min-w-0"><p className="truncate font-medium">{t.title}</p>{t.tags?.length > 0 && <p className="truncate text-xs text-muted">{t.tags.map((x) => `#${x}`).join(' ')}</p>}</div></div></td>
                    <td className="px-3 py-3"><span className="chip">{t.category}</span></td>
                    <td className="px-3 py-3 text-muted">{fmtDate(t.date)}</td>
                    <td className="px-3 py-3 text-muted">{t.paymentMethod}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${t.type === 'income' ? 'text-pos' : ''}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount, c, { decimals: 2 })}</td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end"><button className="icon-btn" title="Edit" onClick={() => openTxn(t)}><Pencil className="h-4 w-4" /></button><button className="icon-btn hover:!text-neg" title="Delete" onClick={() => remove(t)}><Trash2 className="h-4 w-4" /></button></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {res && res.total > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
            <span>{res.total} transaction{res.total !== 1 && 's'}</span>
            <div className="flex items-center gap-2">
              <button className="icon-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button>
              <span>Page {res.page} of {res.pages}</span>
              <button className="icon-btn" disabled={page >= res.pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <Modal title="Transaction details" onClose={() => setDetail(null)}>
          <div className="mb-5 flex items-center gap-3"><CatIcon category={detail.category} type={detail.type} size="h-12 w-12" /><div><p className="font-semibold">{detail.title}</p><p className={`text-xl font-semibold ${detail.type === 'income' ? 'text-pos' : ''}`}>{detail.type === 'income' ? '+' : '−'}{money(detail.amount, c, { decimals: 2 })}</p></div></div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[['Type', detail.type], ['Category', detail.category], ['Date', fmtDate(detail.date)], ['Payment method', detail.paymentMethod], ['Description', detail.description || '—'], ['Notes', detail.notes || '—'], ['Tags', detail.tags?.length ? detail.tags.join(', ') : '—'], ['ID', detail._id.slice(-8).toUpperCase()]].map(([k, v]) => (
              <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-1 capitalize-first break-words">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-6 flex justify-end gap-2"><Button variant="danger" onClick={() => remove(detail)}><Trash2 className="h-4 w-4" />Delete</Button><Button onClick={() => { openTxn(detail); setDetail(null); }}><Pencil className="h-4 w-4" />Edit</Button></div>
        </Modal>
      )}
    </div>
  );
}

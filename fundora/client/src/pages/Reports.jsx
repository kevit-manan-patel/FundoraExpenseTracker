import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useReport } from '../components/RangeSelect.jsx';
import { PageHeader, Loading, Empty, Button } from '../components/UI.jsx';
import { money, fmtDate, downloadCSV } from '../utils/format';

export default function Reports() {
  const { user } = useAuth();
  const { data, control } = useReport();
  const [busy, setBusy] = useState(false);
  const c = user.currency;

  const exportCSV = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const { data: r } = await api.get('/transactions', { params: { from: data.range.from, to: data.range.to, limit: 5000, sort: 'date_asc' } });
      downloadCSV(r.items, `fundora-report-${data.range.from}_to_${data.range.to}.csv`);
      toast.success(`Exported ${r.items.length} transactions`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle={data ? `${fmtDate(data.range.from)} – ${fmtDate(data.range.to)}` : 'Summaries you can export.'}>
        {control}
        <Button variant="ghost" onClick={exportCSV} loading={busy} disabled={!data || data.totals.count === 0}><Download className="h-4 w-4" />Export CSV</Button>
      </PageHeader>
      {!data ? <Loading /> : data.totals.count === 0 ? <div className="card"><Empty title="No transactions in this range" /></div> : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[['Transactions', data.totals.count], ['Income', money(data.totals.income, c)], ['Expenses', money(data.totals.expense, c)], ['Savings rate', `${data.totals.savingsRate}%`]].map(([l, v]) => <div key={l} className="card p-5"><p className="eyebrow">{l}</p><p className="mt-3 text-2xl font-semibold">{v}</p></div>)}
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b border-line text-left"><th className="eyebrow px-5 py-3 font-medium">Month</th><th className="eyebrow px-3 py-3 text-right font-medium">Income</th><th className="eyebrow px-3 py-3 text-right font-medium">Expenses</th><th className="eyebrow px-5 py-3 text-right font-medium">Net</th></tr></thead>
              <tbody>{data.byMonth.map((m) => <tr key={m.month} className="border-b border-line/60 transition-colors last:border-0 hover:bg-card2"><td className="px-5 py-3">{m.label}</td><td className="px-3 py-3 text-right text-pos">{money(m.income, c)}</td><td className="px-3 py-3 text-right text-neon-pink">{money(m.expense, c)}</td><td className={`px-5 py-3 text-right font-semibold ${m.savings < 0 ? 'text-neg' : 'text-neon-green'}`}>{money(m.savings, c)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="border-b border-line text-left"><th className="eyebrow px-5 py-3 font-medium">Category</th><th className="eyebrow px-3 py-3 text-right font-medium">Spent</th><th className="eyebrow px-5 py-3 text-right font-medium">Share</th></tr></thead>
              <tbody>{data.byCategory.map((x) => <tr key={x.name} className="border-b border-line/60 transition-colors last:border-0 hover:bg-card2"><td className="px-5 py-3">{x.name}</td><td className="px-3 py-3 text-right">{money(x.value, c)}</td><td className="px-5 py-3 text-right text-muted">{x.percent}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

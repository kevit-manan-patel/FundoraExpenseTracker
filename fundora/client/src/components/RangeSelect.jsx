import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from './Layout.jsx';

export const RANGES = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['3m', 'Last 3 months'], ['6m', 'Last 6 months'], ['ytd', 'This year'], ['custom', 'Custom range']];

export function useReport() {
  const { refreshKey } = useApp();
  const [range, setRange] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);

  useEffect(() => {
    if (range === 'custom' && !custom.from) return;
    api.get('/analytics/report', { params: { range, ...(range === 'custom' ? custom : {}) } }).then((r) => setData(r.data));
  }, [range, custom, refreshKey]);

  const control = (
    <div className="flex flex-wrap items-center gap-2">
      <select className="input !w-auto" value={range} onChange={(e) => setRange(e.target.value)}>{RANGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {range === 'custom' && (<>
        <input className="input !w-auto" type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
        <input className="input !w-auto" type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
      </>)}
    </div>
  );
  return { data, control, range, custom };
}

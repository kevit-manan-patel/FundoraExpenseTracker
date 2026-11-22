import { Loader2, TrendingUp, TrendingDown, Inbox } from 'lucide-react';
import { CAT_ICONS, CAT_TONES } from '../utils/format';

export const Spinner = ({ className = '' }) => <Loader2 className={`h-5 w-5 animate-spin text-muted ${className}`} />;

export function Loading() {
  return <div className="grid h-64 place-items-center"><Spinner className="h-6 w-6" /></div>;
}

export function Empty({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-card2"><Inbox className="h-5 w-5 text-muted" /></div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted">{hint}</p>}
      {action}
    </div>
  );
}

const VARIANTS = { primary: 'btn-primary', ghost: 'btn-ghost', danger: 'btn-danger' };
export function Button({ loading, disabled, children, variant = 'primary', className = '', ...p }) {
  return (
    <button className={`${VARIANTS[variant]} ${className}`} disabled={loading || disabled} {...p}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function CatIcon({ category, type, size = 'h-9 w-9' }) {
  const Icon = CAT_ICONS[category] || CAT_ICONS.Other;
  const tone = CAT_TONES[category] || (type === 'income' ? '#00E5A0' : '#A1A1AA');
  return (
    <div className={`grid ${size} shrink-0 place-items-center rounded-xl border border-line bg-card2`} style={{ color: tone, boxShadow: `0 0 0 1px ${tone}1a inset` }}>
      <Icon className="h-4 w-4" style={{ filter: `drop-shadow(0 0 4px ${tone}80)` }} />
    </div>
  );
}

export function Progress({ percent, tone }) {
  const gradient = tone === 'bg-pos' || tone === 'pos'
    ? 'linear-gradient(90deg,#00E5A0,#B6FF4A)'
    : percent >= 100 ? 'linear-gradient(90deg,#FF5C70,#FF4FD8)'
    : percent >= 75 ? 'linear-gradient(90deg,#FFC857,#FF8A4F)'
    : 'linear-gradient(90deg,#00E5FF,#B6FF4A)';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-card2">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(percent, 100)}%`, background: gradient, boxShadow: '0 0 10px -1px currentColor' }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Delta({ value, goodWhenUp = true, suffix = '%' }) {
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${value === 0 ? 'text-muted' : good ? 'text-pos' : 'text-neg'}`}>
      <Icon className="h-3.5 w-3.5" />{up ? '+' : ''}{Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

const STAT_TONES = ['#B6FF4A', '#00E5FF', '#FF4FD8', '#FFC857'];
export function StatCard({ label, value, change, goodWhenUp = true, suffix, icon: Icon, delay = 0, tone = 0 }) {
  const hex = STAT_TONES[tone % STAT_TONES.length];
  return (
    <div className="card animate-fadeUp p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="glow-ring" style={{ background: `radial-gradient(120px 70px at 85% 0%, ${hex}22, transparent 70%)` }} />
      <div className="relative flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {Icon && (
          <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${hex}1a`, boxShadow: `0 0 12px -2px ${hex}80` }}>
            <Icon className="h-4 w-4" style={{ color: hex }} />
          </div>
        )}
      </div>
      <p className="relative mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="relative mt-2 flex items-center gap-2">
        <Delta value={change} goodWhenUp={goodWhenUp} suffix={suffix} />
        <span className="text-xs text-muted">vs last month</span>
      </div>
    </div>
  );
}

export const chartTooltip = {
  contentStyle: { background: 'var(--c-card2)', border: '1px solid var(--c-line)', borderRadius: 12, fontSize: 12, color: 'var(--c-text)', boxShadow: '0 12px 30px -10px var(--c-shadow)' },
  itemStyle: { color: 'var(--c-text)' },
  labelStyle: { color: 'var(--c-muted)' },
  cursor: { fill: 'rgba(0,229,255,.05)' },
};

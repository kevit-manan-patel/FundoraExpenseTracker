import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

/* Sun / moon theme switcher with a smooth sliding glow */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="icon-btn relative overflow-hidden"
    >
      <span
        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300"
        style={{ background: dark ? 'radial-gradient(circle, rgba(0,229,255,.25), transparent 70%)' : 'radial-gradient(circle, rgba(255,200,87,.3), transparent 70%)' }}
      />
      <span className="relative grid h-[18px] w-[18px] place-items-center">
        <Sun className={`absolute h-[18px] w-[18px] text-neon-amber transition-all duration-300 ${dark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
        <Moon className={`absolute h-[18px] w-[18px] text-neon-cyan transition-all duration-300 ${dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`} />
      </span>
    </button>
  );
}

/* Segmented control used for range/view pickers across pages */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={`seg-btn ${value === k ? 'active' : ''}`}>{l}</button>
      ))}
    </div>
  );
}

const RING_COLORS = { green: '#B6FF4A', cyan: '#00E5FF', pink: '#FF4FD8', amber: '#FFC857', red: '#FF5C70', emerald: '#00E5A0' };

/* Glowing circular progress ring — used for budgets / goal completion */
export function ProgressRing({ percent, size = 72, stroke = 7, color = 'green', label }) {
  const p = Math.min(Math.max(percent, 0), 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hex = RING_COLORS[color] || color;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ filter: `drop-shadow(0 0 6px ${hex}80)` }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (p / 100) * c}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="text-sm font-semibold" style={{ textShadow: `0 0 10px ${hex}60` }}>{label ?? `${Math.round(p)}%`}</span>
      </div>
    </div>
  );
}

/* Custom dark-glass tooltip for Recharts */
export function NeonTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card2/95 px-3 py-2 text-xs shadow-2xl shadow-black/60 backdrop-blur">
      {label && <p className="mb-1 text-muted">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke || p.fill, boxShadow: `0 0 6px ${p.color || p.stroke || p.fill}` }} />
          <span className="text-text/80">{p.name}:</span>
          <span className="font-medium text-text">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* SVG filter defs (glow blur) shared by charts — render once per chart via <defs> */
export function GlowDefs() {
  return (
    <defs>
      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

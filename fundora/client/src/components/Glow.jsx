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
    <div className="chart-tooltip rounded-xl border border-line bg-card2/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
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

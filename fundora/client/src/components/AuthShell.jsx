import { TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import BrandMark from './BrandMark.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-full bg-ink lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-side p-12 lg:flex">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-neon-green/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-neon-cyan/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <BrandMark size="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight text-glow-green">Fundora</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Know where <span className="text-glow-cyan text-neon-cyan">every rupee</span> goes.</h2>
          <p className="mt-4 text-muted">Budgets, goals, subscriptions and rule-based insights in one calm, focused workspace.</p>
          <div className="mt-10 space-y-4">
            {[[TrendingUp, 'Live cash-flow analytics from your own data', 'cyan'], [Sparkles, 'Smart insights, no paid AI required', 'pink'], [ShieldCheck, 'Private by design. Your records stay yours', 'green']].map(([I, t, tone]) => (
              <div key={t} className="flex items-center gap-3 text-sm text-muted">
                <div className={`grid h-8 w-8 place-items-center rounded-lg border border-line bg-card ${tone === 'cyan' ? 'shadow-glow-cyan' : tone === 'pink' ? 'shadow-glow-pink' : 'shadow-glow-green'}`}>
                  <I className={`h-4 w-4 ${tone === 'cyan' ? 'text-neon-cyan' : tone === 'pink' ? 'text-neon-pink' : 'text-neon-green'}`} />
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted">© Fundora</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="animate-fadeUp w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-8 mt-1.5 text-sm text-muted">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  );
}

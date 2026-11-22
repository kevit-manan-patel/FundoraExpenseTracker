import { useTheme } from '../context/ThemeContext.jsx';

export default function HalfMoon() {
  const { isLight, toggleTheme } = useTheme();

  if (!isLight) return null;

  return (
    <button
      type="button"
      className="half-moon"
      aria-label="Switch to dark mode"
      title="Switch to dark mode"
      onClick={toggleTheme}
    >
      <span className="half-moon__halo" aria-hidden="true" />
      <span className="half-moon__spark half-moon__spark--one" aria-hidden="true" />
      <span className="half-moon__spark half-moon__spark--two" aria-hidden="true" />
      <svg className="half-moon__svg" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="half-moon-lit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff8d8" />
            <stop offset="100%" stopColor="#f4b740" />
          </linearGradient>
        </defs>
        <path d="M47.7 42.6A24 24 0 0 1 21.4 16.3 24 24 0 1 0 47.7 42.6Z" fill="url(#half-moon-lit)" />
        <circle cx="23" cy="37" r="2.1" fill="#c88928" opacity=".42" />
        <circle cx="27" cy="45" r="1.3" fill="#c88928" opacity=".34" />
        <circle cx="18" cy="30" r="1.1" fill="#c88928" opacity=".3" />
      </svg>
    </button>
  );
}

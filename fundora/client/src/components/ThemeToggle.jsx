import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme();
  const nextTheme = isLight ? 'dark' : 'light';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      className={`theme-toggle ${isLight ? 'is-light' : ''}`}
      onClick={toggleTheme}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__star theme-toggle__star--one" />
        <span className="theme-toggle__star theme-toggle__star--two" />
        <span className="theme-toggle__star theme-toggle__star--three" />
        <span className="theme-toggle__cloud theme-toggle__cloud--one" />
        <span className="theme-toggle__cloud theme-toggle__cloud--two" />
      </span>
      <span className="theme-toggle__knob" aria-hidden="true">
        <Sun className="theme-toggle__icon theme-toggle__sun" />
        <Moon className="theme-toggle__icon theme-toggle__moon" />
      </span>
    </button>
  );
}

import { useEffect } from 'react';

export default function CursorTwinkle() {
  useEffect(() => {
    const root = document.documentElement;
    const handlePointerMove = (event) => {
      root.style.setProperty('--cursor-x', `${event.clientX}px`);
      root.style.setProperty('--cursor-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <div className="cursor-twinkle" aria-hidden="true">
      <span className="cursor-twinkle__aura" />
      <span className="cursor-twinkle__spark cursor-twinkle__spark--one" />
      <span className="cursor-twinkle__spark cursor-twinkle__spark--two" />
      <span className="cursor-twinkle__spark cursor-twinkle__spark--three" />
    </div>
  );
}

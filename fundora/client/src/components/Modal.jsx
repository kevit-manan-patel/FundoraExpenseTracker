import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`glass animate-fadeUp w-full ${width} max-h-[92vh] overflow-y-auto rounded-2xl border border-line bg-card/95 shadow-2xl shadow-black`} style={{ boxShadow: '0 0 0 1px rgba(182,255,74,.06) inset, 0 30px 60px -20px rgba(0,0,0,.7)' }}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-semibold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

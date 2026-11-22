import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-surface glass animate-fadeUp w-full ${width} max-h-[92vh] overflow-y-auto rounded-2xl border border-line`}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-semibold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

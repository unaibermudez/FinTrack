import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}

export const Modal = ({ open, onClose, title, subtitle, children, width = 'max-w-md' }: ModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${width} ft-card border ft-border rounded-2xl ft-shadow-lg animate-scale-in`}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b ft-border">
          <div>
            <h2 className="text-base font-semibold ft-text">{title}</h2>
            {subtitle && <p className="text-xs ft-text-2 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ft-text-3 hover:ft-text transition-colors cursor-pointer p-1 rounded-lg hover:ft-hover -mt-0.5 -mr-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

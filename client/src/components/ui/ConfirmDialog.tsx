import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm ft-card border ft-border rounded-2xl ft-shadow-lg animate-scale-in">
        <div className="p-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 ft-warning-bg"
          >
            <AlertTriangle size={18} className="ft-warning" />
          </div>
          <h2 className="text-base font-semibold ft-text mb-1.5">{title}</h2>
          <p className="text-sm ft-text-2 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('common.yesDelete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

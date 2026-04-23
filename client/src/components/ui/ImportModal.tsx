import { useState, useCallback, useRef, type DragEvent } from 'react';
import { X, Upload, FileText, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { CSV_TEMPLATE } from '../../utils/exportCsv';
import type { ImportResult } from '../../api/transactions';

type Step = 'idle' | 'selected' | 'loading' | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<ImportResult>;
}

const downloadTemplate = () => {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fintrack-template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

export const ImportModal = ({ open, onClose, onImport }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('idle');
    setFile(null);
    setResult(null);
    setFatalError(null);
    setDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const selectFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') {
      setFatalError('Only .csv files are accepted.');
      setStep('done');
      return;
    }
    setFile(f);
    setStep('selected');
    setFatalError(null);
    setResult(null);
  }, []);

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) selectFile(picked);
  };

  const handleImport = async () => {
    if (!file) return;
    setStep('loading');
    try {
      const res = await onImport(file);
      setResult(res);
      setStep('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Upload failed. Please try again.';
      setFatalError(msg);
      setStep('done');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-lg ft-card border ft-border rounded-2xl ft-shadow-lg animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b ft-border">
          <div>
            <h2 className="text-base font-semibold ft-text">Import Transactions</h2>
            <p className="text-xs ft-text-2 mt-0.5">Upload a CSV file to bulk-import transactions</p>
          </div>
          <button
            onClick={handleClose}
            className="ft-text-3 hover:ft-text transition-colors cursor-pointer p-1.5 rounded-lg hover:ft-hover"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* IDLE / SELECTED — dropzone */}
          {(step === 'idle' || step === 'selected') && (
            <>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  'relative flex flex-col items-center justify-center gap-3 rounded-xl',
                  'border-2 border-dashed px-6 py-10 cursor-pointer',
                  'transition-all duration-150',
                  dragging
                    ? 'border-[var(--primary)] bg-[var(--primary-bg)]'
                    : step === 'selected'
                      ? 'border-[var(--primary)]/50 bg-[var(--primary-bg)]'
                      : 'ft-border hover:border-[var(--primary)]/40 hover:ft-hover',
                ].join(' ')}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onFileChange}
                />

                {step === 'selected' && file ? (
                  <>
                    <div className="w-12 h-12 rounded-xl ft-primary-subtle flex items-center justify-center">
                      <FileText size={22} className="ft-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium ft-text">{file.name}</p>
                      <p className="text-xs ft-text-2 mt-0.5">{formatSize(file.size)} — Click to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl ft-hover border ft-border flex items-center justify-center">
                      <Upload size={22} className="ft-text-3" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm ft-text-2">
                        <span className="ft-primary font-medium">Click to select</span> or drag & drop
                      </p>
                      <p className="text-xs ft-text-3 mt-1">CSV files only · max 2 MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Format hint */}
              <div className="rounded-xl ft-bg border ft-border px-4 py-3">
                <p className="text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] mb-1.5">
                  Expected format
                </p>
                <code className="text-xs ft-primary font-mono-num">
                  date, symbol, type, quantity, price, notes
                </code>
                <p className="text-xs ft-text-3 mt-1.5">
                  Header row optional. <code className="ft-text-2">type</code> must be <code className="ft-text-2">buy</code> or <code className="ft-text-2">sell</code>.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="flex items-center gap-1.5 text-xs ft-primary hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <Download size={13} />
                  Download template
                </button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleClose}>{t('common.cancel')}</Button>
                  <Button size="sm" disabled={step !== 'selected'} onClick={handleImport}>
                    Import
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* LOADING */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <svg className="animate-spin w-8 h-8" style={{ color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm ft-text-2">Importing transactions…</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="space-y-4">
              {fatalError ? (
                <div className="rounded-xl ft-negative-bg border border-[var(--negative)]/25 px-4 py-4 flex items-start gap-3">
                  <XCircle size={18} className="ft-negative mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold ft-negative">Import failed</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--negative)', opacity: 0.7 }}>{fatalError}</p>
                  </div>
                </div>
              ) : result && (
                <>
                  <div className={[
                    'rounded-xl border px-4 py-4 flex items-start gap-3',
                    result.imported > 0
                      ? 'ft-positive-bg border-[var(--positive)]/25'
                      : 'ft-warning-bg border-[var(--warning)]/25',
                  ].join(' ')}>
                    {result.imported > 0
                      ? <CheckCircle size={18} className="ft-positive mt-0.5 shrink-0" />
                      : <AlertCircle size={18} className="ft-warning mt-0.5 shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-semibold ${result.imported > 0 ? 'ft-positive' : 'ft-warning'}`}>
                        {result.imported > 0
                          ? `${result.imported} transaction${result.imported !== 1 ? 's' : ''} imported`
                          : 'No transactions imported'}
                      </p>
                      {result.errors.length > 0 && (
                        <p className="text-xs ft-text-2 mt-0.5">
                          {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped due to errors
                        </p>
                      )}
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="rounded-xl ft-bg border ft-border overflow-hidden">
                      <div className="px-4 py-2.5 border-b ft-border">
                        <p className="text-xs font-semibold ft-text-2 uppercase tracking-[0.07em]">Row errors</p>
                      </div>
                      <ul className="divide-y ft-border max-h-44 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <li key={i} className="px-4 py-2.5 flex items-start gap-2">
                            <XCircle size={13} className="ft-negative mt-0.5 shrink-0" />
                            <span className="text-xs ft-text-2">{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="secondary" size="sm" onClick={reset}>Import another</Button>
                <Button size="sm" onClick={handleClose}>{t('common.close')}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

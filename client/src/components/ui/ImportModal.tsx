import { useState, useCallback, useRef, DragEvent } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1d27] border border-[#2a2d3a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2a2d3a]">
          <h2 className="text-base font-semibold text-slate-100">Import Transactions</h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none cursor-pointer">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* ── IDLE / SELECTED: drop zone ── */}
          {(step === 'idle' || step === 'selected') && (
            <>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors
                  ${dragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : step === 'selected'
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : 'border-[#2a2d3a] hover:border-indigo-500/50 hover:bg-white/[0.02]'
                  }`}
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
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatSize(file.size)} — Click to change file</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#23263a] flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-300">
                        <span className="text-indigo-400 font-medium">Click to select</span> or drag & drop
                      </p>
                      <p className="text-xs text-slate-500 mt-1">CSV files only · max 2 MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Expected format */}
              <div className="rounded-lg bg-[#0f1117] border border-[#2a2d3a] px-4 py-3">
                <p className="text-xs font-medium text-slate-400 mb-1.5">Expected format (columns in order):</p>
                <code className="text-xs text-indigo-300 font-mono">date, symbol, type, quantity, price, notes</code>
                <p className="text-xs text-slate-600 mt-1.5">Header row is optional. <code className="text-slate-500">type</code> must be <code className="text-slate-500">buy</code> or <code className="text-slate-500">sell</code>.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV template
                </button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
                  <Button size="sm" disabled={step !== 'selected'} onClick={handleImport}>
                    Import
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-slate-400">Importing transactions…</p>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="space-y-4">
              {fatalError ? (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-400">Import failed</p>
                    <p className="text-xs text-red-400/70 mt-0.5">{fatalError}</p>
                  </div>
                </div>
              ) : result && (
                <>
                  {/* Success banner */}
                  <div className={`rounded-xl border px-4 py-4 flex items-start gap-3 ${result.imported > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                    <svg className={`w-5 h-5 mt-0.5 shrink-0 ${result.imported > 0 ? 'text-green-400' : 'text-yellow-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={result.imported > 0 ? 'M5 13l4 4L19 7' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
                    </svg>
                    <div>
                      <p className={`text-sm font-medium ${result.imported > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {result.imported > 0
                          ? `${result.imported} transaction${result.imported !== 1 ? 's' : ''} imported successfully`
                          : 'No transactions were imported'}
                      </p>
                      {result.errors.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped due to errors
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Error list */}
                  {result.errors.length > 0 && (
                    <div className="rounded-xl bg-[#0f1117] border border-[#2a2d3a] overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-[#2a2d3a]">
                        <p className="text-xs font-medium text-slate-400">Row errors</p>
                      </div>
                      <ul className="divide-y divide-[#1e2130] max-h-44 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <li key={i} className="px-4 py-2.5 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5 text-xs shrink-0">✕</span>
                            <span className="text-xs text-slate-400">{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="secondary" size="sm" onClick={reset}>Import another file</Button>
                <Button size="sm" onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

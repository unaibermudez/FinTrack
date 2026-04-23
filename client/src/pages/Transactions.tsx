import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Download, Upload, Pencil, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { getPortfolio } from '../api/portfolios';
import type { Portfolio } from '../api/portfolios';
import type { Transaction, TransactionInput } from '../api/transactions';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ImportModal } from '../components/ui/ImportModal';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/ui/Navbar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, toInputDate } from '../utils/formatDate';
import { exportToCsv } from '../utils/exportCsv';

const EMPTY_FORM: TransactionInput = {
  assetSymbol: '',
  type: 'buy',
  quantity: 0,
  priceAtTransaction: 0,
  date: toInputDate(new Date()),
  notes: '',
};

export const Transactions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const { transactions, loading, create, update, remove, importCsv } = useTransactions(id!);

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) getPortfolio(id).then(setPortfolio).catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  const openCreate = () => { setEditingTx(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      assetSymbol: tx.assetSymbol,
      type: tx.type,
      quantity: tx.quantity,
      priceAtTransaction: tx.priceAtTransaction,
      date: toInputDate(tx.date),
      notes: tx.notes ?? '',
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingTx(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTx) {
        await update(editingTx._id, { ...form, assetSymbol: form.assetSymbol.toUpperCase() });
        toast.success(t('transactions.transactionUpdated'));
      } else {
        await create({ ...form, assetSymbol: form.assetSymbol.toUpperCase() });
        toast.success(t('transactions.transactionCreated'));
      }
      closeForm();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget._id);
      toast.success(t('transactions.transactionDeleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportToCsv(`${portfolio?.name ?? 'transactions'}.csv`, transactions);
    toast.success(t('transactions.exportSuccess'));
  };

  const handleImport = async (file: File) => {
    const res = await importCsv(file);
    if (res.imported > 0) toast.success(t('transactions.importSuccess', { count: res.imported }));
    return res;
  };

  const field = (key: keyof TransactionInput) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="min-h-screen ft-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs ft-text-2 mb-2">
              <Link to="/dashboard" className="hover:ft-text transition-colors flex items-center gap-1">
                <ArrowLeft size={11} />
                {t('portfolio.portfolios')}
              </Link>
              <span className="ft-text-3">/</span>
              <Link to={`/portfolio/${id}`} className="hover:ft-text transition-colors">
                {portfolio?.name ?? '…'}
              </Link>
              <span className="ft-text-3">/</span>
              <span className="ft-text">{t('transactions.title')}</span>
            </nav>
            <h1 className="text-xl font-bold ft-text tracking-tight">{t('transactions.title')}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={transactions.length === 0}
              onClick={handleExport}
            >
              <Download size={13} />
              {t('transactions.exportCSV')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={13} />
              {t('transactions.importCSV')}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={13} strokeWidth={2.5} />
              {t('transactions.addTransaction')}
            </Button>
          </div>
        </div>

        {/* Table card */}
        <div className="ft-card border ft-border rounded-xl ft-shadow-sm animate-fade-in" style={{ animationDelay: '40ms' }}>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-lg ft-bg animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-12 h-12 rounded-2xl ft-primary-subtle flex items-center justify-center mx-auto mb-4">
                <FileText size={20} className="ft-primary" />
              </div>
              <h3 className="font-semibold ft-text mb-1">{t('transactions.noTransactions')}</h3>
              <p className="text-sm ft-text-2 mb-6">{t('transactions.noTransactionsDesc')}</p>
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" onClick={openCreate}>
                  <Plus size={13} />
                  {t('transactions.addTransaction')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
                  <Upload size={13} />
                  {t('transactions.importCSV')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b ft-border">
                    {[
                      t('transactions.date'),
                      t('transactions.symbol'),
                      t('transactions.type'),
                      t('transactions.quantity'),
                      t('transactions.price'),
                      t('transactions.total'),
                      t('transactions.notes'),
                      '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-left text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] ${
                          i >= 3 && i <= 5 ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx._id}
                      className="border-b ft-border last:border-0 hover:ft-hover transition-colors group"
                    >
                      <td className="px-4 py-3 ft-text-2 text-xs whitespace-nowrap font-mono-num">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold ft-text font-mono-num text-sm tracking-wide">
                          {tx.assetSymbol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                            tx.type === 'buy'
                              ? 'ft-positive-bg ft-positive'
                              : 'ft-negative-bg ft-negative',
                          ].join(' ')}
                        >
                          {tx.type === 'buy' ? t('transactions.buy') : t('transactions.sell')}
                        </span>
                      </td>
                      <td className="px-4 py-3 ft-text text-right font-mono-num">
                        {tx.quantity}
                      </td>
                      <td className="px-4 py-3 ft-text-2 text-right font-mono-num">
                        {formatCurrency(tx.priceAtTransaction)}
                      </td>
                      <td className="px-4 py-3 ft-text font-semibold text-right font-mono-num">
                        {formatCurrency(tx.quantity * tx.priceAtTransaction)}
                      </td>
                      <td className="px-4 py-3 ft-text-3 text-xs max-w-[140px] truncate">
                        {tx.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(tx)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg ft-text-3 hover:ft-primary hover:ft-primary-subtle transition-colors cursor-pointer"
                            title={t('common.edit')}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tx)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg ft-text-3 hover:ft-negative hover:ft-negative-bg transition-colors cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Import modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />

      {/* Create / Edit modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingTx ? t('transactions.editTransaction') : t('transactions.addTransaction')}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('transactions.symbol')}
              placeholder={t('transactions.symbolPlaceholder')}
              {...field('assetSymbol')}
              required
              className="uppercase"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium ft-text-2 uppercase tracking-[0.07em]">
                {t('transactions.type')}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'buy' | 'sell' }))}
                className="w-full h-10 rounded-lg ft-input-bg border ft-border px-3 text-sm ft-text focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              >
                <option value="buy">{t('transactions.buy')}</option>
                <option value="sell">{t('transactions.sell')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('transactions.quantity')} type="number" step="any" min="0" {...field('quantity')} required />
            <Input label={t('transactions.price')} type="number" step="any" min="0" {...field('priceAtTransaction')} required />
          </div>
          <Input label={t('transactions.date')} type="date" {...field('date')} required />
          <Input
            label={t('transactions.notes')}
            hint={t('common.optional')}
            placeholder={t('transactions.notesPlaceholder')}
            {...field('notes')}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" type="button" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button type="submit" loading={saving}>
              {editingTx ? t('common.save') : t('transactions.addTransaction')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('transactions.deleteConfirmTitle')}
        description={t('transactions.deleteConfirmDesc')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

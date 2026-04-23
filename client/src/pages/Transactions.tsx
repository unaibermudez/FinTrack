import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Download, Upload, Pencil, Trash2, ArrowLeft, FileText, ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { getTransactions } from '../api/transactions';
import { getPortfolio } from '../api/portfolios';
import type { Portfolio } from '../api/portfolios';
import { usePortfolioStore } from '../store/portfolioStore';
import type { Transaction, TransactionInput } from '../api/transactions';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ImportModal } from '../components/ui/ImportModal';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/ui/Navbar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, toInputDate } from '../utils/formatDate';
import { exportToCsv } from '../utils/exportCsv';

type SortField = 'date' | 'assetSymbol' | 'quantity' | 'priceAtTransaction';

const SortIcon = ({ field, sort, order }: { field: SortField; sort: SortField; order: 'asc' | 'desc' }) => {
  if (sort !== field) return <ChevronsUpDown size={11} className="opacity-30" />;
  return order === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
};

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
  const activePortfolio = usePortfolioStore((s) => s.activePortfolio);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  // Filter / sort / pagination state
  const [symbolInput, setSymbolInput] = useState('');
  const [debouncedSymbol, setDebouncedSymbol] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'buy' | 'sell'>('');
  const [sort, setSort] = useState<SortField>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Debounce symbol input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSymbol(symbolInput), 300);
    return () => clearTimeout(timer);
  }, [symbolInput]);

  // Reset to page 1 when filters/sort change
  useEffect(() => { setPage(1); }, [debouncedSymbol, typeFilter, sort, order]);

  const query = useMemo(() => ({
    symbol: debouncedSymbol || undefined,
    type: typeFilter || undefined,
    sort,
    order,
    page,
    limit: 25,
  }), [debouncedSymbol, typeFilter, sort, order, page]);

  const { transactions, total, pages, loading, create, update, remove, importCsv } = useTransactions(id!, query);

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (activePortfolio?._id === id) {
      setPortfolio(activePortfolio);
      return;
    }
    getPortfolio(id).then(setPortfolio).catch(() => navigate('/dashboard'));
  }, [id, activePortfolio, navigate]);

  const handleSortColumn = (field: SortField) => {
    if (sort === field) {
      setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(field);
      setOrder('desc');
    }
  };

  const hasFilters = !!debouncedSymbol || !!typeFilter;
  const clearFilters = () => { setSymbolInput(''); setDebouncedSymbol(''); setTypeFilter(''); };

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

  const handleExport = async () => {
    // Export all transactions matching current filters (no pagination)
    const allData = await getTransactions(id!, { symbol: debouncedSymbol || undefined, type: typeFilter || undefined, sort, order, limit: 0 });
    exportToCsv(`${portfolio?.name ?? 'transactions'}.csv`, allData.transactions);
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

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 animate-fade-in" style={{ animationDelay: '20ms' }}>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 ft-text-3 pointer-events-none" />
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder={t('transactions.searchSymbol')}
              className="w-full h-9 pl-8 pr-3 rounded-lg ft-input-bg border ft-border text-sm ft-text placeholder:ft-text-3 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-mono-num"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | 'buy' | 'sell')}
            className="h-9 px-3 rounded-lg ft-input-bg border ft-border text-sm ft-text focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            <option value="">{t('transactions.filterAll')}</option>
            <option value="buy">{t('transactions.filterBuy')}</option>
            <option value="sell">{t('transactions.filterSell')}</option>
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-9 px-3 rounded-lg text-xs ft-text-2 hover:ft-text hover:ft-hover transition-colors cursor-pointer"
            >
              <X size={12} />
              Clear
            </button>
          )}
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
              {hasFilters ? (
                <>
                  <h3 className="font-semibold ft-text mb-1">No results</h3>
                  <p className="text-sm ft-text-2 mb-4">No transactions match your filters</p>
                  <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b ft-border">
                      {/* Sortable: Date */}
                      <th
                        onClick={() => handleSortColumn('date')}
                        className="px-4 py-3 text-left text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] cursor-pointer hover:ft-text transition-colors select-none"
                      >
                        <span className="flex items-center gap-1">
                          {t('transactions.date')}
                          <SortIcon field="date" sort={sort} order={order} />
                        </span>
                      </th>
                      {/* Sortable: Symbol */}
                      <th
                        onClick={() => handleSortColumn('assetSymbol')}
                        className="px-4 py-3 text-left text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] cursor-pointer hover:ft-text transition-colors select-none"
                      >
                        <span className="flex items-center gap-1">
                          {t('transactions.symbol')}
                          <SortIcon field="assetSymbol" sort={sort} order={order} />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold ft-text-2 uppercase tracking-[0.07em]">
                        {t('transactions.type')}
                      </th>
                      {/* Sortable: Quantity */}
                      <th
                        onClick={() => handleSortColumn('quantity')}
                        className="px-4 py-3 text-right text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] cursor-pointer hover:ft-text transition-colors select-none"
                      >
                        <span className="flex items-center justify-end gap-1">
                          {t('transactions.quantity')}
                          <SortIcon field="quantity" sort={sort} order={order} />
                        </span>
                      </th>
                      {/* Sortable: Price */}
                      <th
                        onClick={() => handleSortColumn('priceAtTransaction')}
                        className="px-4 py-3 text-right text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] cursor-pointer hover:ft-text transition-colors select-none"
                      >
                        <span className="flex items-center justify-end gap-1">
                          {t('transactions.price')}
                          <SortIcon field="priceAtTransaction" sort={sort} order={order} />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold ft-text-2 uppercase tracking-[0.07em]">
                        {t('transactions.total')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold ft-text-2 uppercase tracking-[0.07em]">
                        {t('transactions.notes')}
                      </th>
                      <th />
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
                        <td className="px-4 py-3 ft-text text-right font-mono-num">{tx.quantity}</td>
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
              <Pagination page={page} pages={pages} total={total} onPage={setPage} />
            </>
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { getPortfolio } from '../api/portfolios';
import type { Portfolio } from '../api/portfolios';
import type { TransactionInput } from '../api/transactions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Navbar } from '../components/ui/Navbar';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, toInputDate } from '../utils/formatDate';

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
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const { transactions, loading, create, remove } = useTransactions(id!);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TransactionInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) getPortfolio(id).then(setPortfolio).catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await create({ ...form, assetSymbol: form.assetSymbol.toUpperCase() });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof TransactionInput) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link to="/dashboard" className="hover:text-slate-300 transition-colors">Portfolios</Link>
              <span>/</span>
              <Link to={`/portfolio/${id}`} className="hover:text-slate-300 transition-colors">
                {portfolio?.name ?? '…'}
              </Link>
              <span>/</span>
              <span className="text-slate-300">Transactions</span>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>+ Add Transaction</Button>
        </div>

        <Card>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-[#0f1117] animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No transactions yet.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>Add first transaction</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-[#2a2d3a]">
                    {['Date', 'Symbol', 'Type', 'Qty', 'Price', 'Total', 'Notes', ''].map((h) => (
                      <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-[#1e2130] hover:bg-white/[0.02] group">
                      <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-100">{tx.assetSymbol}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tx.type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{tx.quantity}</td>
                      <td className="py-3 pr-4 text-slate-300">{formatCurrency(tx.priceAtTransaction)}</td>
                      <td className="py-3 pr-4 text-slate-200 font-medium">{formatCurrency(tx.quantity * tx.priceAtTransaction)}</td>
                      <td className="py-3 pr-4 text-slate-500 text-xs max-w-[120px] truncate">{tx.notes ?? '—'}</td>
                      <td className="py-3">
                        <button
                          onClick={() => remove(tx._id)}
                          className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Transaction">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Symbol" placeholder="AAPL" {...field('assetSymbol')} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'buy' | 'sell' }))}
                className="w-full rounded-lg bg-[#1a1d27] border border-[#2a2d3a] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" step="any" min="0" {...field('quantity')} required />
            <Input label="Price" type="number" step="any" min="0" {...field('priceAtTransaction')} required />
          </div>
          <Input label="Date" type="date" {...field('date')} required />
          <Input label="Notes (optional)" placeholder="Optional note" {...field('notes')} />
          <div className="flex gap-2 justify-end mt-1">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPerformance, getHistory } from '../api/assets';
import type { PerformanceResult, HistoryPoint } from '../api/assets';
import { getPortfolio } from '../api/portfolios';
import type { Portfolio as IPortfolio } from '../api/portfolios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/ui/Navbar';
import { AllocationChart } from '../components/charts/AllocationChart';
import { HoldingsChart } from '../components/charts/HoldingsChart';
import { HistoryChart } from '../components/charts/HistoryChart';
import { formatCurrency, formatPercent } from '../utils/formatCurrency';

const Stat = ({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) => (
  <div>
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={`text-xl font-bold ${positive === undefined ? 'text-slate-100' : positive ? 'text-green-400' : 'text-red-400'}`}>
      {value}
    </p>
    {sub && <p className={`text-xs mt-0.5 ${positive === undefined ? 'text-slate-500' : positive ? 'text-green-500' : 'text-red-500'}`}>{sub}</p>}
  </div>
);

export const Portfolio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<IPortfolio | null>(null);
  const [performance, setPerformance] = useState<PerformanceResult | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPortfolio(id), getPerformance(id), getHistory(id)])
      .then(([p, perf, hist]) => { setPortfolio(p); setPerformance(perf); setHistory(hist); })
      .catch(() => setError('Failed to load portfolio'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-[#1a1d27] animate-pulse" />)}
      </div>
    </div>
  );

  if (error || !portfolio) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">Portfolio not found.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  );

  const isPositive = (performance?.totalPl ?? 0) >= 0;

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
              <span className="text-slate-300">{portfolio.name}</span>
            </div>
            {portfolio.description && <p className="text-sm text-slate-500">{portfolio.description}</p>}
          </div>
          <Button variant="secondary" onClick={() => navigate(`/portfolio/${id}/transactions`)}>
            Transactions
          </Button>
        </div>

        {/* Price error banner */}
        {performance?.priceErrors && performance.priceErrors.length > 0 && (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-yellow-300">
              Could not fetch live price for{' '}
              <span className="font-semibold">{performance.priceErrors.join(', ')}</span>.
              {' '}P&L for those holdings is shown as —. Check that the symbol is valid or try again later.
            </p>
          </div>
        )}

        {/* Stats */}
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Stat label="Total Value" value={formatCurrency(performance?.totalValue ?? 0)} />
            <Stat
              label="Total P&L"
              value={formatCurrency(performance?.totalPl ?? 0)}
              sub={performance ? formatPercent(performance.totalPlPercent) : undefined}
              positive={isPositive}
            />
            <Stat label="Holdings" value={String(performance?.holdings.length ?? 0)} />
            <Stat label="Portfolio" value={portfolio.name} />
          </div>
        </Card>

        {performance && performance.holdings.length > 0 ? (
          <>
            {/* History chart */}
            {history.length > 1 && (
              <Card title="Portfolio Value Over Time">
                <HistoryChart data={history} />
              </Card>
            )}

            {/* Allocation & P&L charts */}
            {(() => {
              const pricedHoldings = performance.holdings.filter((h) => !h.priceError);
              return pricedHoldings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card title="Allocation">
                    <AllocationChart holdings={pricedHoldings} />
                  </Card>
                  <Card title="P&L by Asset">
                    <HoldingsChart holdings={pricedHoldings} />
                  </Card>
                </div>
              ) : null;
            })()}

            {/* Holdings table */}
            <Card title="Holdings">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-[#2a2d3a]">
                      {['Symbol', 'Qty', 'Avg Cost', 'Price', 'Value', 'P&L', '%'].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {performance.holdings.map((h) => (
                      <tr key={h.symbol} className="border-b border-[#1e2130] hover:bg-white/[0.02]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">{h.symbol}</span>
                            {h.priceError && (
                              <span title="Live price unavailable" className="text-yellow-400 text-xs leading-none cursor-default">⚠</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{h.quantity}</td>
                        <td className="py-3 pr-4 text-slate-400">{formatCurrency(h.avgCost)}</td>
                        <td className="py-3 pr-4 text-slate-300">
                          {h.priceError ? <span className="text-slate-600 text-xs">unavailable</span> : formatCurrency(h.currentPrice)}
                        </td>
                        <td className="py-3 pr-4 text-slate-200">
                          {h.priceError ? <span className="text-slate-600 text-xs">—</span> : formatCurrency(h.currentValue)}
                        </td>
                        <td className={`py-3 pr-4 font-medium ${h.priceError ? 'text-slate-600' : h.plAbsolute >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h.priceError ? '—' : formatCurrency(h.plAbsolute)}
                        </td>
                        <td className={`py-3 font-medium text-xs ${h.priceError ? 'text-slate-600' : h.plPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h.priceError ? '—' : formatPercent(h.plPercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No holdings yet.</p>
            <Button className="mt-4" onClick={() => navigate(`/portfolio/${id}/transactions`)}>
              Add first transaction
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

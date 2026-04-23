import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Layers, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPerformance, getHistory } from '../api/assets';
import type { PerformanceResult, HistoryPoint } from '../api/assets';
import { getPortfolio } from '../api/portfolios';
import type { Portfolio as IPortfolio } from '../api/portfolios';
import { usePortfolioStore } from '../store/portfolioStore';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/ui/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { AllocationChart } from '../components/charts/AllocationChart';
import { HoldingsChart } from '../components/charts/HoldingsChart';
import { HistoryChart } from '../components/charts/HistoryChart';
import { formatCurrency, formatPercent } from '../utils/formatCurrency';


export const Portfolio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setActivePortfolio = usePortfolioStore((s) => s.setActivePortfolio);
  const [portfolio, setPortfolio] = useState<IPortfolio | null>(null);
  const [performance, setPerformance] = useState<PerformanceResult | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPortfolio(id), getPerformance(id), getHistory(id)])
      .then(([p, perf, hist]) => {
        setPortfolio(p);
        setActivePortfolio(p);
        setPerformance(perf);
        setHistory(hist);
      })
      .catch(() => setError('Failed to load portfolio'))
      .finally(() => setLoading(false));
    return () => setActivePortfolio(null);
  }, [id, setActivePortfolio]);

  if (loading) return (
    <div className="min-h-screen ft-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl ft-card border ft-border animate-pulse" />)}
        </div>
        <div className="h-64 rounded-xl ft-card border ft-border animate-pulse" />
      </main>
    </div>
  );

  if (error || !portfolio) return (
    <div className="min-h-screen ft-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="ft-text-2 text-sm">{t('common.error')}</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>{t('common.back')}</Button>
      </div>
    </div>
  );

  const isPositive = (performance?.totalPl ?? 0) >= 0;

  return (
    <div className="min-h-screen ft-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in">
          <div>
            <nav className="flex items-center gap-1.5 text-xs ft-text-2 mb-2">
              <Link to="/dashboard" className="hover:ft-text transition-colors flex items-center gap-1">
                <ArrowLeft size={11} />
                {t('portfolio.portfolios')}
              </Link>
              <span className="ft-text-3">/</span>
              <span className="ft-text">{portfolio.name}</span>
            </nav>
            <h1 className="text-2xl font-bold ft-text tracking-tight">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-sm ft-text-2 mt-0.5">{portfolio.description}</p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/portfolio/${id}/transactions`)}
          >
            {t('portfolio.transactions')}
          </Button>
        </div>

        {/* Price error banner */}
        {performance?.priceErrors && performance.priceErrors.length > 0 && (
          <div className="rounded-xl ft-warning-bg border border-[var(--warning)]/25 px-4 py-3 flex items-start gap-3 animate-slide-down">
            <AlertTriangle size={15} className="ft-warning mt-0.5 shrink-0" />
            <p className="text-sm ft-warning">
              {t('portfolio.priceErrorBanner', { symbols: performance.priceErrors.join(', ') })}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
          <StatCard
            label={t('portfolio.totalValue')}
            value={formatCurrency(performance?.totalValue ?? 0)}
            icon={<BarChart2 size={16} />}
          />
          <StatCard
            label={t('portfolio.totalPL')}
            value={formatCurrency(performance?.totalPl ?? 0)}
            sub={performance ? formatPercent(performance.totalPlPercent) : undefined}
            positive={isPositive}
            icon={isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          />
          <StatCard
            label={t('portfolio.holdings')}
            value={String(performance?.holdings.length ?? 0)}
            icon={<Layers size={16} />}
          />
          <StatCard
            label={t('portfolio.portfolio')}
            value={portfolio.name}
          />
        </div>

        {performance && performance.holdings.length > 0 ? (
          <>
            {/* History chart */}
            {history.length > 1 && (
              <div className="ft-card border ft-border rounded-xl ft-shadow-sm animate-fade-in" style={{ animationDelay: '80ms' }}>
                <div className="px-5 pt-5 pb-2">
                  <h3 className="text-xs font-semibold ft-text-2 uppercase tracking-[0.08em]">
                    {t('portfolio.valueOverTime')}
                  </h3>
                </div>
                <div className="px-2 pb-4">
                  <HistoryChart data={history} />
                </div>
              </div>
            )}

            {/* Allocation + P&L charts */}
            {(() => {
              const pricedHoldings = performance.holdings.filter((h) => !h.priceError);
              return pricedHoldings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '120ms' }}>
                  <div className="ft-card border ft-border rounded-xl ft-shadow-sm">
                    <div className="px-5 pt-5 pb-2">
                      <h3 className="text-xs font-semibold ft-text-2 uppercase tracking-[0.08em]">
                        {t('portfolio.allocation')}
                      </h3>
                    </div>
                    <AllocationChart holdings={pricedHoldings} />
                  </div>
                  <div className="ft-card border ft-border rounded-xl ft-shadow-sm">
                    <div className="px-5 pt-5 pb-2">
                      <h3 className="text-xs font-semibold ft-text-2 uppercase tracking-[0.08em]">
                        {t('portfolio.plByAsset')}
                      </h3>
                    </div>
                    <HoldingsChart holdings={pricedHoldings} />
                  </div>
                </div>
              ) : null;
            })()}

            {/* Holdings table */}
            <div
              className="ft-card border ft-border rounded-xl ft-shadow-sm overflow-hidden animate-fade-in"
              style={{ animationDelay: '160ms' }}
            >
              <div className="px-5 py-4 border-b ft-border">
                <h3 className="text-xs font-semibold ft-text-2 uppercase tracking-[0.08em]">
                  {t('portfolio.holdings')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b ft-border">
                      {[
                        { label: t('portfolio.symbol'), align: 'left' },
                        { label: t('portfolio.qty'), align: 'right' },
                        { label: t('portfolio.avgCost'), align: 'right' },
                        { label: t('portfolio.price'), align: 'right' },
                        { label: t('portfolio.value'), align: 'right' },
                        { label: t('portfolio.pl'), align: 'right' },
                        { label: t('portfolio.plPct'), align: 'right' },
                      ].map(({ label, align }) => (
                        <th
                          key={label}
                          className={`px-4 py-3 text-xs font-semibold ft-text-2 uppercase tracking-[0.07em] ${
                            align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {performance.holdings.map((h) => (
                      <tr key={h.symbol} className="border-b ft-border last:border-0 hover:ft-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold ft-text font-mono-num tracking-wide">{h.symbol}</span>
                            {h.priceError && (
                              <span
                                title={t('portfolio.priceUnavailable')}
                                className="ft-warning text-xs leading-none cursor-default"
                              >
                                ⚠
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 ft-text-2 text-right font-mono-num">{h.quantity}</td>
                        <td className="px-4 py-3 ft-text-2 text-right font-mono-num">{formatCurrency(h.avgCost)}</td>
                        <td className="px-4 py-3 ft-text text-right font-mono-num">
                          {h.priceError
                            ? <span className="ft-text-3 text-xs">{t('portfolio.priceUnavailable')}</span>
                            : formatCurrency(h.currentPrice)
                          }
                        </td>
                        <td className="px-4 py-3 ft-text font-medium text-right font-mono-num">
                          {h.priceError
                            ? <span className="ft-text-3">—</span>
                            : formatCurrency(h.currentValue)
                          }
                        </td>
                        <td
                          className="px-4 py-3 font-semibold text-right font-mono-num"
                          style={{ color: h.priceError ? 'var(--text-3)' : h.plAbsolute >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                        >
                          {h.priceError ? '—' : formatCurrency(h.plAbsolute)}
                        </td>
                        <td
                          className="px-4 py-3 text-xs font-medium text-right font-mono-num"
                          style={{ color: h.priceError ? 'var(--text-3)' : h.plPercent >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                        >
                          {h.priceError ? '—' : formatPercent(h.plPercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="ft-card border ft-border rounded-2xl p-16 text-center animate-fade-in">
            <p className="ft-text-2 text-sm mb-4">{t('portfolio.noHoldings')}</p>
            <Button onClick={() => navigate(`/portfolio/${id}/transactions`)}>
              {t('portfolio.addFirstTransaction')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

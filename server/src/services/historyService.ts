import Transaction from '../models/Transaction.js';
import Portfolio from '../models/Portfolio.js';
import { getPrice } from './priceService.js';
import { ApiError } from '../utils/ApiError.js';

export interface HistoryPoint {
  date: string;
  value: number;
}

export const getHistory = async (portfolioId: string, userId: string): Promise<HistoryPoint[]> => {
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');

  const transactions = await Transaction.find({ portfolioId }).sort({ date: 1 });
  if (transactions.length === 0) return [];

  // Replay transactions, building snapshots at each unique date
  const holdings: Record<string, number> = {};
  const costBasis: Record<string, number> = {};
  const points: HistoryPoint[] = [];

  for (const tx of transactions) {
    const sym = tx.assetSymbol;
    if (!holdings[sym]) { holdings[sym] = 0; costBasis[sym] = 0; }

    if (tx.type === 'buy') {
      holdings[sym] += tx.quantity;
      costBasis[sym] += tx.quantity * tx.priceAtTransaction;
    } else {
      holdings[sym] -= tx.quantity;
      costBasis[sym] -= tx.quantity * tx.priceAtTransaction;
    }

    // Snapshot: value at transaction time using transaction prices as proxy
    const snapshotValue = Object.entries(holdings)
      .filter(([, qty]) => qty > 0)
      .reduce((sum, [s, qty]) => {
        const price = s === sym ? tx.priceAtTransaction : (costBasis[s] / holdings[s]);
        return sum + qty * price;
      }, 0);

    points.push({
      date: tx.date.toISOString().split('T')[0],
      value: parseFloat(snapshotValue.toFixed(2)),
    });
  }

  // Final point: current value using live prices
  const liveSymbols = Object.entries(holdings).filter(([, qty]) => qty > 0);
  if (liveSymbols.length > 0) {
    const prices = await Promise.allSettled(liveSymbols.map(([sym]) => getPrice(sym)));
    const currentValue = liveSymbols.reduce((sum, [sym, qty], i) => {
      const result = prices[i];
      const price = result.status === 'fulfilled' ? result.value : costBasis[sym] / qty;
      return sum + qty * price;
    }, 0);

    points.push({
      date: new Date().toISOString().split('T')[0],
      value: parseFloat(currentValue.toFixed(2)),
    });
  }

  // Deduplicate by date — keep last point per date
  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.value);
  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
};

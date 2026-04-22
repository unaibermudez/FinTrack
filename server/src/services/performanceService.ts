import Transaction from '../models/Transaction.js';
import Portfolio from '../models/Portfolio.js';
import { getPrice } from './priceService.js';
import { ApiError } from '../utils/ApiError.js';

interface HoldingAccumulator {
  totalQty: number;
  totalCost: number;
}

interface HoldingResult {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  plAbsolute: number;
  plPercent: number;
}

export interface PerformanceResult {
  portfolioId: string;
  totalValue: number;
  totalPl: number;
  totalPlPercent: number;
  holdings: HoldingResult[];
}

export const getPerformance = async (
  portfolioId: string,
  userId: string
): Promise<PerformanceResult> => {
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');

  const transactions = await Transaction.find({ portfolioId });

  const holdings: Record<string, HoldingAccumulator> = {};
  for (const tx of transactions) {
    const { assetSymbol, type, quantity, priceAtTransaction } = tx;
    if (!holdings[assetSymbol]) {
      holdings[assetSymbol] = { totalQty: 0, totalCost: 0 };
    }

    if (type === 'buy') {
      holdings[assetSymbol].totalQty += quantity;
      holdings[assetSymbol].totalCost += quantity * priceAtTransaction;
    } else {
      holdings[assetSymbol].totalQty -= quantity;
      holdings[assetSymbol].totalCost -= quantity * priceAtTransaction;
    }
  }

  const results = await Promise.all(
    Object.entries(holdings)
      .filter(([, h]) => h.totalQty > 0)
      .map(async ([symbol, h]): Promise<HoldingResult> => {
        const avgCost = h.totalCost / h.totalQty;
        const currentPrice = await getPrice(symbol);
        const currentValue = currentPrice * h.totalQty;
        const costBasis = avgCost * h.totalQty;
        const plAbsolute = currentValue - costBasis;
        const plPercent = costBasis > 0 ? (plAbsolute / costBasis) * 100 : 0;

        return {
          symbol,
          quantity: h.totalQty,
          avgCost: parseFloat(avgCost.toFixed(4)),
          currentPrice,
          currentValue: parseFloat(currentValue.toFixed(2)),
          plAbsolute: parseFloat(plAbsolute.toFixed(2)),
          plPercent: parseFloat(plPercent.toFixed(2)),
        };
      })
  );

  const totalValue = results.reduce((sum, r) => sum + r.currentValue, 0);
  const totalCost = results.reduce((sum, r) => sum + r.avgCost * r.quantity, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  return {
    portfolioId,
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalPl: parseFloat(totalPl.toFixed(2)),
    totalPlPercent: parseFloat(totalPlPercent.toFixed(2)),
    holdings: results,
  };
};

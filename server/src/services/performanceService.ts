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
  priceError?: boolean;
}

export interface PerformanceResult {
  portfolioId: string;
  totalValue: number;
  totalPl: number;
  totalPlPercent: number;
  totalDividends: number;
  totalFees: number;
  totalReturn: number;
  holdings: HoldingResult[];
  priceErrors?: string[];
}

export interface SummaryResult {
  totalValue: number;
  totalPl: number;
  totalPlPercent: number;
  totalDividends: number;
  totalReturn: number;
  portfolioCount: number;
  holdingsCount: number;
}

export const getPortfoliosSummary = async (userId: string): Promise<SummaryResult> => {
  const portfolios = await Portfolio.find({ userId });

  const settled = await Promise.allSettled(
    portfolios.map((p) => getPerformance(p._id.toString(), userId))
  );

  let totalValue = 0;
  let totalCost = 0;
  let totalDividends = 0;
  let totalReturn = 0;
  let holdingsCount = 0;

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const { totalValue: val, totalPl: pl, totalDividends: div, totalReturn: ret, holdings } = result.value;
      totalValue += val;
      totalCost += val - pl;
      totalDividends += div;
      totalReturn += ret;
      holdingsCount += holdings.filter((h) => !h.priceError).length;
    }
  }

  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  return {
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalPl: parseFloat(totalPl.toFixed(2)),
    totalPlPercent: parseFloat(totalPlPercent.toFixed(2)),
    totalDividends: parseFloat(totalDividends.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    portfolioCount: portfolios.length,
    holdingsCount,
  };
};

export const getPerformance = async (
  portfolioId: string,
  userId: string
): Promise<PerformanceResult> => {
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');

  const transactions = await Transaction.find({ portfolioId });

  const holdings: Record<string, HoldingAccumulator> = {};
  let totalDividends = 0;
  let totalFees = 0;

  for (const tx of transactions) {
    const { assetSymbol, type, quantity, priceAtTransaction } = tx;

    if (type === 'dividend') {
      totalDividends += quantity * priceAtTransaction;
      continue;
    }
    if (type === 'fee') {
      totalFees += quantity * priceAtTransaction;
      continue;
    }

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

        let currentPrice = 0;
        let priceError = false;
        try {
          currentPrice = await getPrice(symbol);
        } catch {
          priceError = true;
        }

        const currentValue = currentPrice * h.totalQty;
        const costBasis = avgCost * h.totalQty;
        const plAbsolute = priceError ? 0 : currentValue - costBasis;
        const plPercent = priceError || costBasis <= 0 ? 0 : (plAbsolute / costBasis) * 100;

        return {
          symbol,
          quantity: h.totalQty,
          avgCost: parseFloat(avgCost.toFixed(4)),
          currentPrice,
          currentValue: parseFloat(currentValue.toFixed(2)),
          plAbsolute: parseFloat(plAbsolute.toFixed(2)),
          plPercent: parseFloat(plPercent.toFixed(2)),
          ...(priceError && { priceError: true }),
        };
      })
  );

  const pricedResults = results.filter((r) => !r.priceError);
  const totalValue = pricedResults.reduce((sum, r) => sum + r.currentValue, 0);
  const totalCost = pricedResults.reduce((sum, r) => sum + r.avgCost * r.quantity, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;
  const priceErrors = results.filter((r) => r.priceError).map((r) => r.symbol);

  const totalDividendsRounded = parseFloat(totalDividends.toFixed(2));
  const totalFeesRounded = parseFloat(totalFees.toFixed(2));
  const totalReturn = parseFloat((totalPl + totalDividendsRounded - totalFeesRounded).toFixed(2));

  return {
    portfolioId,
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalPl: parseFloat(totalPl.toFixed(2)),
    totalPlPercent: parseFloat(totalPlPercent.toFixed(2)),
    totalDividends: totalDividendsRounded,
    totalFees: totalFeesRounded,
    totalReturn,
    holdings: results,
    ...(priceErrors.length > 0 && { priceErrors }),
  };
};

import YahooFinance from 'yahoo-finance2';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

interface CacheEntry {
  price: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — Yahoo Finance has no daily limit

const fetchQuote = async (ticker: string): Promise<number> => {
  const quote = await yahooFinance.quote(ticker);
  const price = (quote as { regularMarketPrice?: unknown }).regularMarketPrice;
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error(`No valid price in quote response for ${ticker}`);
  }
  return price;
};

export const getPrice = async (symbol: string): Promise<number> => {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const ageSeconds = Number(((Date.now() - cached.timestamp) / 1000).toFixed(1));
    logger.info('yahoo_finance: cache hit', { symbol, price: cached.price, cacheAgeSeconds: ageSeconds });
    return cached.price;
  }

  logger.info('yahoo_finance: fetching price', { symbol });

  let price: number;

  // Try the symbol as-is first (stocks, ETFs, funds).
  // If that fails, retry with a -USD suffix (crypto: BTC → BTC-USD).
  try {
    price = await fetchQuote(symbol);
    logger.info('yahoo_finance: price fetched', { symbol, ticker: symbol, price });
  } catch (firstErr) {
    const cryptoTicker = `${symbol}-USD`;
    logger.info('yahoo_finance: retrying as crypto ticker', { symbol, cryptoTicker });
    try {
      price = await fetchQuote(cryptoTicker);
      logger.info('yahoo_finance: price fetched', { symbol, ticker: cryptoTicker, price });
    } catch (secondErr) {
      logger.warn('yahoo_finance: symbol not found on either ticker', {
        symbol,
        tried: [symbol, cryptoTicker],
        firstErr: String(firstErr),
        secondErr: String(secondErr),
      });
      throw new ApiError(404, `No price data found for symbol: ${symbol}`);
    }
  }

  cache.set(symbol, { price, timestamp: Date.now() });
  return price;
};

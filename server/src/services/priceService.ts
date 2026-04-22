import { ALPHA_VANTAGE_API_KEY } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

interface CacheEntry {
  price: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

export const getPrice = async (symbol: string): Promise<number> => {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.price;
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(502, 'Failed to fetch price from Alpha Vantage');

  const data = (await res.json()) as Record<string, Record<string, string>>;
  const quote = data['Global Quote'];
  if (!quote || !quote['05. price']) {
    throw new ApiError(404, `No price data found for symbol: ${symbol}`);
  }

  const price = parseFloat(quote['05. price']);
  cache.set(symbol, { price, timestamp: Date.now() });
  return price;
};

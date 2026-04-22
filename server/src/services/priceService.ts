import { ALPHA_VANTAGE_API_KEY } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

interface CacheEntry {
  price: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

export const getPrice = async (symbol: string): Promise<number> => {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const ageSeconds = ((Date.now() - cached.timestamp) / 1000).toFixed(1);
    logger.info('alpha_vantage: cache hit', { symbol, price: cached.price, cacheAgeSeconds: Number(ageSeconds) });
    return cached.price;
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  logger.info('alpha_vantage: fetching price', { symbol });

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    logger.error('alpha_vantage: network error', { symbol, err });
    throw new ApiError(502, 'Failed to reach Alpha Vantage (network error)');
  }

  logger.info('alpha_vantage: response received', { symbol, status: res.status, ok: res.ok });

  if (!res.ok) {
    logger.error('alpha_vantage: non-2xx response', { symbol, status: res.status });
    throw new ApiError(502, `Alpha Vantage returned HTTP ${res.status}`);
  }

  let data: Record<string, unknown>;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch (err) {
    logger.error('alpha_vantage: failed to parse JSON response', { symbol, err });
    throw new ApiError(502, 'Alpha Vantage returned an invalid response');
  }

  logger.debug('alpha_vantage: response body keys', { symbol, responseKeys: Object.keys(data) });

  // Rate limit or invalid API key
  if ('Note' in data) {
    logger.warn('alpha_vantage: rate limit or API key note', { symbol, note: data['Note'] });
    throw new ApiError(429, 'Alpha Vantage rate limit reached — try again in a minute');
  }

  if ('Information' in data) {
    logger.warn('alpha_vantage: API key / plan restriction', { symbol, information: data['Information'] });
    throw new ApiError(403, 'Alpha Vantage API key issue — check your plan or key');
  }

  const quote = (data['Global Quote'] ?? {}) as Record<string, string>;

  if (!quote || Object.keys(quote).length === 0) {
    logger.warn('alpha_vantage: empty Global Quote — symbol may not exist', { symbol, data });
    throw new ApiError(404, `No price data found for symbol: ${symbol}`);
  }

  if (!quote['05. price']) {
    logger.warn('alpha_vantage: Global Quote present but missing "05. price" field', { symbol, quote });
    throw new ApiError(404, `No price data found for symbol: ${symbol}`);
  }

  const price = parseFloat(quote['05. price']);
  if (isNaN(price)) {
    logger.error('alpha_vantage: price field is not a valid number', { symbol, rawPrice: quote['05. price'] });
    throw new ApiError(502, `Alpha Vantage returned invalid price for ${symbol}`);
  }

  logger.info('alpha_vantage: price fetched and cached', { symbol, price });
  cache.set(symbol, { price, timestamp: Date.now() });
  return price;
};

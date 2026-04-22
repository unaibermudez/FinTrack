import { Request, Response, NextFunction } from 'express';
import { getPrice } from '../services/priceService.js';

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getAssetPrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const symbol = param(req.params.symbol).toUpperCase();
    const price = await getPrice(symbol);
    res.json({ symbol, price });
  } catch (err) {
    next(err);
  }
};

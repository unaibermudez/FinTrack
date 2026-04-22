import { Request, Response, NextFunction } from 'express';
import { getHistory } from '../services/historyService.js';

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getPortfolioHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const history = await getHistory(param(req.params.id), req.userId);
    res.json({ history });
  } catch (err) {
    next(err);
  }
};

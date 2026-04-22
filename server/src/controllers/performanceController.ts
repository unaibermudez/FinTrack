import { Request, Response, NextFunction } from 'express';
import { getPerformance } from '../services/performanceService.js';

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getPortfolioPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const performance = await getPerformance(param(req.params.id), req.userId);
    res.json(performance);
  } catch (err) {
    next(err);
  }
};

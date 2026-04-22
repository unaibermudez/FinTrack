import { Request, Response, NextFunction } from 'express';
import * as portfolioService from '../services/portfolioService.js';

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getPortfolios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolios = await portfolioService.getPortfoliosByUser(req.userId);
    res.json({ portfolios });
  } catch (err) {
    next(err);
  }
};

export const createPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await portfolioService.createPortfolio({
      userId: req.userId,
      ...req.body,
    });
    res.status(201).json({ portfolio });
  } catch (err) {
    next(err);
  }
};

export const getPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await portfolioService.getPortfolioById(param(req.params.id), req.userId);
    res.json({ portfolio });
  } catch (err) {
    next(err);
  }
};

export const updatePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolio = await portfolioService.updatePortfolio(
      param(req.params.id),
      req.userId,
      req.body
    );
    res.json({ portfolio });
  } catch (err) {
    next(err);
  }
};

export const deletePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await portfolioService.deletePortfolio(param(req.params.id), req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

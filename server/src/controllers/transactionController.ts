import { Request, Response, NextFunction } from 'express';
import * as transactionService from '../services/transactionService.js';

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { symbol, type, sort, order, page, limit } = req.query as Record<string, string>;
    const result = await transactionService.getTransactions(param(req.params.id), req.userId, {
      symbol,
      type,
      sort,
      order,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await transactionService.createTransaction(
      param(req.params.id),
      req.userId,
      req.body
    );
    res.status(201).json({ transaction });
  } catch (err) {
    next(err);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await transactionService.updateTransaction(
      param(req.params.id),
      req.userId,
      param(req.params.txId),
      req.body
    );
    res.json({ transaction });
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await transactionService.deleteTransaction(param(req.params.id), req.userId, param(req.params.txId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

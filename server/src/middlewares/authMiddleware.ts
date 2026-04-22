import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new ApiError(401, 'Authorization header missing'));
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  req.userId = payload.sub as string;
  next();
};

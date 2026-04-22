import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getMe(req.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.updateMe(req.userId, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

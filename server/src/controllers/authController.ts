import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.cookies as { refreshToken?: string };
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(refreshToken ?? '');
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.cookies as { refreshToken?: string };
    await authService.logoutUser(refreshToken);
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';

const SALT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const generateAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId }, JWT_ACCESS_SECRET, { expiresIn: '15m' });

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId, jti: randomUUID() }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async ({ email, password, name }: RegisterInput) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already in use');

  const hashed = await hashPassword(password);
  const user = await User.create({ email, password: hashed, name });
  return { id: user._id, email: user.email, name: user.name };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);

  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Refresh token reuse or invalid session');
  }

  const newAccessToken = generateAccessToken(user._id.toString());
  const newRefreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken: string | undefined): Promise<void> => {
  if (!refreshToken) return;
  const user = await User.findOne({ refreshToken });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
};

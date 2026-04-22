import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { comparePassword, hashPassword } from './authService.js';

interface UpdateMeInput {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateMe = async (userId: string, input: UpdateMeInput) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (input.newPassword) {
    if (!input.currentPassword) throw new ApiError(400, 'Current password is required to set a new password');
    const valid = await comparePassword(input.currentPassword, user.password);
    if (!valid) throw new ApiError(401, 'Current password is incorrect');
    user.password = await hashPassword(input.newPassword);
  }

  if (input.email && input.email !== user.email) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) throw new ApiError(409, 'Email already in use');
    user.email = input.email.toLowerCase();
  }

  if (input.name !== undefined) user.name = input.name;

  await user.save();
  return { id: user._id, email: user.email, name: user.name };
};

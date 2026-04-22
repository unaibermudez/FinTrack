import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';
import logger from '../utils/logger.js';

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(MONGODB_URI);
  logger.info('MongoDB connected');
};

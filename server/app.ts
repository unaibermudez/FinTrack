import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './src/middlewares/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import portfolioRoutes from './src/routes/portfolioRoutes.js';
import assetRoutes from './src/routes/assetRoutes.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/assets', assetRoutes);

app.use(errorHandler);

export default app;

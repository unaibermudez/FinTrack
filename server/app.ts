import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { setupSwagger } from './src/config/swagger.js';
import authRoutes from './src/routes/authRoutes.js';
import portfolioRoutes from './src/routes/portfolioRoutes.js';
import assetRoutes from './src/routes/assetRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

export default app;

import Portfolio, { IPortfolio } from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';

interface PortfolioInput {
  userId: string;
  name: string;
  description?: string;
}

export const createPortfolio = (input: PortfolioInput): Promise<IPortfolio> =>
  Portfolio.create(input);

export const getPortfoliosByUser = (userId: string): Promise<IPortfolio[]> =>
  Portfolio.find({ userId }).sort({ createdAt: -1 });

export const getPortfolioById = async (id: string, userId: string): Promise<IPortfolio> => {
  const portfolio = await Portfolio.findOne({ _id: id, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');
  return portfolio;
};

export const updatePortfolio = async (
  id: string,
  userId: string,
  update: Partial<Pick<IPortfolio, 'name' | 'description'>>
): Promise<IPortfolio> => {
  const portfolio = await Portfolio.findOneAndUpdate(
    { _id: id, userId },
    update,
    { new: true, runValidators: true }
  );
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');
  return portfolio;
};

export const deletePortfolio = async (id: string, userId: string): Promise<void> => {
  const portfolio = await Portfolio.findOneAndDelete({ _id: id, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');
};

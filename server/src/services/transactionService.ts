import Transaction, { ITransaction, TransactionType } from '../models/Transaction.js';
import Portfolio from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';

interface TransactionInput {
  assetSymbol: string;
  type: TransactionType;
  quantity: number;
  priceAtTransaction: number;
  date?: Date;
  notes?: string;
}

const assertOwnership = async (portfolioId: string, userId: string): Promise<void> => {
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');
};

export const getTransactions = async (
  portfolioId: string,
  userId: string
): Promise<ITransaction[]> => {
  await assertOwnership(portfolioId, userId);
  return Transaction.find({ portfolioId }).sort({ date: -1 });
};

export const createTransaction = async (
  portfolioId: string,
  userId: string,
  data: TransactionInput
): Promise<ITransaction> => {
  await assertOwnership(portfolioId, userId);
  return Transaction.create({ portfolioId, ...data });
};

export const deleteTransaction = async (
  portfolioId: string,
  userId: string,
  txId: string
): Promise<void> => {
  await assertOwnership(portfolioId, userId);
  const tx = await Transaction.findOneAndDelete({ _id: txId, portfolioId });
  if (!tx) throw new ApiError(404, 'Transaction not found');
};

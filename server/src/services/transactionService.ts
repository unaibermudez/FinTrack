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

export interface TransactionQuery {
  symbol?: string;
  type?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: ITransaction[];
  total: number;
  page: number;
  pages: number;
}

const VALID_SORT_FIELDS = ['date', 'assetSymbol', 'quantity', 'priceAtTransaction'];

const assertOwnership = async (portfolioId: string, userId: string): Promise<void> => {
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');
};

export const getTransactions = async (
  portfolioId: string,
  userId: string,
  query: TransactionQuery = {}
): Promise<PaginatedTransactions> => {
  await assertOwnership(portfolioId, userId);

  const { symbol, type, sort = 'date', order = 'desc', page = 1, limit = 25 } = query;

  const filter: Record<string, unknown> = { portfolioId };
  if (symbol) filter.assetSymbol = { $regex: symbol, $options: 'i' };
  if (type === 'buy' || type === 'sell') filter.type = type;

  const sortField = VALID_SORT_FIELDS.includes(sort) ? sort : 'date';
  const sortDir = order === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, page);
  const limitNum = limit === 0 ? 0 : Math.min(Math.max(1, limit), 100);
  const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

  const baseQuery = Transaction.find(filter).sort({ [sortField]: sortDir });
  const [transactions, total] = await Promise.all([
    limitNum > 0 ? baseQuery.skip(skip).limit(limitNum) : baseQuery,
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    total,
    page: pageNum,
    pages: limitNum > 0 ? Math.max(1, Math.ceil(total / limitNum)) : 1,
  };
};

export const createTransaction = async (
  portfolioId: string,
  userId: string,
  data: TransactionInput
): Promise<ITransaction> => {
  await assertOwnership(portfolioId, userId);
  return Transaction.create({ portfolioId, ...data });
};

export const updateTransaction = async (
  portfolioId: string,
  userId: string,
  txId: string,
  data: Partial<TransactionInput>
): Promise<ITransaction> => {
  await assertOwnership(portfolioId, userId);
  const tx = await Transaction.findOneAndUpdate(
    { _id: txId, portfolioId },
    data,
    { new: true, runValidators: true }
  );
  if (!tx) throw new ApiError(404, 'Transaction not found');
  return tx;
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

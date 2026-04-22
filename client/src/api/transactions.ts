import api from './axiosInstance';

export interface Transaction {
  _id: string;
  portfolioId: string;
  assetSymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  priceAtTransaction: number;
  date: string;
  notes?: string;
}

export interface TransactionInput {
  assetSymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  priceAtTransaction: number;
  date?: string;
  notes?: string;
}

export const getTransactions = (portfolioId: string) =>
  api.get<{ transactions: Transaction[] }>(`/portfolios/${portfolioId}/transactions`)
    .then((r) => r.data.transactions);

export const createTransaction = (portfolioId: string, data: TransactionInput) =>
  api.post<{ transaction: Transaction }>(`/portfolios/${portfolioId}/transactions`, data)
    .then((r) => r.data.transaction);

export const deleteTransaction = (portfolioId: string, txId: string) =>
  api.delete(`/portfolios/${portfolioId}/transactions/${txId}`);

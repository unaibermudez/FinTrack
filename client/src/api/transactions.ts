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

export interface TransactionQuery {
  symbol?: string;
  type?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
}

export const getTransactions = (portfolioId: string, query: TransactionQuery = {}) =>
  api.get<PaginatedTransactions>(`/portfolios/${portfolioId}/transactions`, { params: query })
    .then((r) => r.data);

export const createTransaction = (portfolioId: string, data: TransactionInput) =>
  api.post<{ transaction: Transaction }>(`/portfolios/${portfolioId}/transactions`, data)
    .then((r) => r.data.transaction);

export const updateTransaction = (portfolioId: string, txId: string, data: Partial<TransactionInput>) =>
  api.put<{ transaction: Transaction }>(`/portfolios/${portfolioId}/transactions/${txId}`, data)
    .then((r) => r.data.transaction);

export const deleteTransaction = (portfolioId: string, txId: string) =>
  api.delete(`/portfolios/${portfolioId}/transactions/${txId}`);

export interface ImportResult {
  imported: number;
  errors: string[];
}

export const importTransactions = (portfolioId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<ImportResult>(`/portfolios/${portfolioId}/transactions/import`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

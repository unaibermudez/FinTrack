import { useState, useEffect, useCallback } from 'react';
import * as txApi from '../api/transactions';
import type { Transaction, TransactionInput, TransactionQuery, ImportResult } from '../api/transactions';

export const useTransactions = (portfolioId: string, query: TransactionQuery = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable key so the effect only re-runs when query values actually change
  const queryKey = JSON.stringify(query);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await txApi.getTransactions(portfolioId, JSON.parse(queryKey));
      setTransactions(data.transactions);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, queryKey]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: TransactionInput) => {
    await txApi.createTransaction(portfolioId, data);
    await fetch();
  };

  const update = async (txId: string, data: Partial<TransactionInput>) => {
    const tx = await txApi.updateTransaction(portfolioId, txId, data);
    await fetch();
    return tx;
  };

  const remove = async (txId: string) => {
    await txApi.deleteTransaction(portfolioId, txId);
    await fetch();
  };

  const importCsv = async (file: File): Promise<ImportResult> => {
    const result = await txApi.importTransactions(portfolioId, file);
    await fetch();
    return result;
  };

  return { transactions, total, pages, loading, error, refetch: fetch, create, update, remove, importCsv };
};

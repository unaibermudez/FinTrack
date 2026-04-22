import { useState, useEffect, useCallback } from 'react';
import * as txApi from '../api/transactions';
import type { Transaction, TransactionInput } from '../api/transactions';

export const useTransactions = (portfolioId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await txApi.getTransactions(portfolioId);
      setTransactions(data);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: TransactionInput) => {
    const tx = await txApi.createTransaction(portfolioId, data);
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  };

  const remove = async (txId: string) => {
    await txApi.deleteTransaction(portfolioId, txId);
    setTransactions((prev) => prev.filter((t) => t._id !== txId));
  };

  return { transactions, loading, error, refetch: fetch, create, remove };
};

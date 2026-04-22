import { useState, useEffect, useCallback } from 'react';
import * as txApi from '../api/transactions';
import type { Transaction, TransactionInput, ImportResult } from '../api/transactions';

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

  const update = async (txId: string, data: Partial<TransactionInput>) => {
    const tx = await txApi.updateTransaction(portfolioId, txId, data);
    setTransactions((prev) => prev.map((t) => (t._id === txId ? tx : t)));
    return tx;
  };

  const remove = async (txId: string) => {
    await txApi.deleteTransaction(portfolioId, txId);
    setTransactions((prev) => prev.filter((t) => t._id !== txId));
  };

  const importCsv = async (file: File): Promise<ImportResult> => {
    const result = await txApi.importTransactions(portfolioId, file);
    await fetch();
    return result;
  };

  return { transactions, loading, error, refetch: fetch, create, update, remove, importCsv };
};

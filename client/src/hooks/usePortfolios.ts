import { useState, useEffect, useCallback } from 'react';
import * as portfoliosApi from '../api/portfolios';
import type { Portfolio } from '../api/portfolios';

export const usePortfolios = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portfoliosApi.getPortfolios();
      setPortfolios(data);
    } catch {
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: { name: string; description?: string }) => {
    const portfolio = await portfoliosApi.createPortfolio(data);
    setPortfolios((prev) => [portfolio, ...prev]);
    return portfolio;
  };

  const update = async (id: string, data: { name?: string; description?: string }) => {
    const portfolio = await portfoliosApi.updatePortfolio(id, data);
    setPortfolios((prev) => prev.map((p) => (p._id === id ? portfolio : p)));
    return portfolio;
  };

  const remove = async (id: string) => {
    await portfoliosApi.deletePortfolio(id);
    setPortfolios((prev) => prev.filter((p) => p._id !== id));
  };

  return { portfolios, loading, error, refetch: fetch, create, update, remove };
};

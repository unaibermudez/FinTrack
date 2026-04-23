import { useState, useEffect } from 'react';
import { getPortfoliosSummary } from '../api/portfolios';
import type { PortfolioSummary } from '../api/portfolios';

export const usePortfolioSummary = () => {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortfoliosSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading };
};

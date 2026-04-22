import { create } from 'zustand';
import type { Portfolio } from '../api/portfolios';

interface PortfolioState {
  activePortfolio: Portfolio | null;
  setActivePortfolio: (portfolio: Portfolio | null) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  activePortfolio: null,
  setActivePortfolio: (portfolio) => set({ activePortfolio: portfolio }),
}));

import api from './axiosInstance';

export interface HoldingResult {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  plAbsolute: number;
  plPercent: number;
}

export interface PerformanceResult {
  portfolioId: string;
  totalValue: number;
  totalPl: number;
  totalPlPercent: number;
  holdings: HoldingResult[];
}

export const getAssetPrice = (symbol: string) =>
  api.get<{ symbol: string; price: number }>(`/assets/price/${symbol}`).then((r) => r.data);

export const getPerformance = (portfolioId: string) =>
  api.get<PerformanceResult>(`/portfolios/${portfolioId}/performance`).then((r) => r.data);

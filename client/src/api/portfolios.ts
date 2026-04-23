import api from './axiosInstance';

export interface Portfolio {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export const getPortfolios = () =>
  api.get<{ portfolios: Portfolio[] }>('/portfolios').then((r) => r.data.portfolios);

export const getPortfolio = (id: string) =>
  api.get<{ portfolio: Portfolio }>(`/portfolios/${id}`).then((r) => r.data.portfolio);

export const createPortfolio = (data: { name: string; description?: string }) =>
  api.post<{ portfolio: Portfolio }>('/portfolios', data).then((r) => r.data.portfolio);

export const updatePortfolio = (id: string, data: { name?: string; description?: string }) =>
  api.put<{ portfolio: Portfolio }>(`/portfolios/${id}`, data).then((r) => r.data.portfolio);

export const deletePortfolio = (id: string) =>
  api.delete(`/portfolios/${id}`);

export interface PortfolioSummary {
  totalValue: number;
  totalPl: number;
  totalPlPercent: number;
  portfolioCount: number;
  holdingsCount: number;
}

export const getPortfoliosSummary = () =>
  api.get<PortfolioSummary>('/portfolios/summary').then((r) => r.data);

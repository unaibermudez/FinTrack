import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

// Mock priceService para no llamar a Alpha Vantage en tests
vi.mock('../services/priceService.js', () => ({
  getPrice: vi.fn((symbol: string) => {
    const prices: Record<string, number> = {
      AAPL: 210.0,
      MSFT: 420.0,
      BTC: 65000,
    };
    return Promise.resolve(prices[symbol] ?? 100.0);
  }),
}));

const AUTH = '/api/auth';
const BASE = '/api/portfolios';

const user = { email: 'txuser@fintrack.dev', password: 'password123', name: 'Tx User' };

const loginAndCreatePortfolio = async () => {
  await request(app).post(`${AUTH}/register`).send(user);
  const loginRes = await request(app).post(`${AUTH}/login`).send(user);
  const token = loginRes.body.accessToken as string;

  const portfolioRes = await request(app)
    .post(BASE)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Portfolio' });

  return { token, portfolioId: portfolioRes.body.portfolio._id as string };
};

const buyTx = {
  assetSymbol: 'AAPL',
  type: 'buy',
  quantity: 10,
  priceAtTransaction: 180.0,
  date: '2024-01-15',
};

describe('POST /api/portfolios/:id/transactions', () => {
  it('registra una compra y devuelve 201', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();
    const res = await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send(buyTx);

    expect(res.status).toBe(201);
    expect(res.body.transaction).toMatchObject({
      assetSymbol: 'AAPL',
      type: 'buy',
      quantity: 10,
    });
  });

  it('registra una venta', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();
    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send(buyTx);

    const res = await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...buyTx, type: 'sell', quantity: 5, priceAtTransaction: 200 });

    expect(res.status).toBe(201);
    expect(res.body.transaction.type).toBe('sell');
  });

  it('devuelve 404 si el portfolio no existe', async () => {
    await request(app).post(`${AUTH}/register`).send(user).catch(() => {});
    const loginRes = await request(app).post(`${AUTH}/login`).send(user);
    const token = loginRes.body.accessToken as string;

    const res = await request(app)
      .post(`${BASE}/000000000000000000000001/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send(buyTx);

    expect(res.status).toBe(404);
  });

  it('devuelve 401 sin token', async () => {
    const { portfolioId } = await loginAndCreatePortfolio();
    const res = await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .send(buyTx);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/portfolios/:id/transactions', () => {
  it('devuelve lista vacía para portfolio sin transacciones', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();
    const res = await request(app)
      .get(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it('devuelve las transacciones en orden descendente por fecha', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();

    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...buyTx, date: '2024-01-01' });

    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...buyTx, date: '2024-06-01' });

    const res = await request(app)
      .get(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.transactions).toHaveLength(2);
    const dates = res.body.transactions.map((t: { date: string }) => new Date(t.date).getTime());
    expect(dates[0]).toBeGreaterThan(dates[1]);
  });
});

describe('DELETE /api/portfolios/:id/transactions/:txId', () => {
  it('elimina la transacción y devuelve 204', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();

    const created = await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send(buyTx);

    const txId = created.body.transaction._id;
    const del = await request(app)
      .delete(`${BASE}/${portfolioId}/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);

    const list = await request(app)
      .get(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.body.transactions).toHaveLength(0);
  });

  it('devuelve 404 para transacción inexistente', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();
    const res = await request(app)
      .delete(`${BASE}/${portfolioId}/transactions/000000000000000000000001`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/portfolios/:id/performance', () => {
  it('calcula P&L correctamente con posiciones abiertas', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();

    // Compra 10 AAPL a 180 → coste medio 180, precio actual mockeado 210
    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assetSymbol: 'AAPL', type: 'buy', quantity: 10, priceAtTransaction: 180 });

    const res = await request(app)
      .get(`${BASE}/${portfolioId}/performance`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.holdings).toHaveLength(1);

    const holding = res.body.holdings[0];
    expect(holding.symbol).toBe('AAPL');
    expect(holding.quantity).toBe(10);
    expect(holding.avgCost).toBe(180);
    expect(holding.currentPrice).toBe(210);
    expect(holding.currentValue).toBe(2100);
    expect(holding.plAbsolute).toBe(300);
    expect(holding.plPercent).toBeCloseTo(16.67, 1);
  });

  it('excluye posiciones completamente vendidas', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();

    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assetSymbol: 'AAPL', type: 'buy', quantity: 5, priceAtTransaction: 180 });

    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assetSymbol: 'AAPL', type: 'sell', quantity: 5, priceAtTransaction: 200 });

    const res = await request(app)
      .get(`${BASE}/${portfolioId}/performance`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.holdings).toHaveLength(0);
    expect(res.body.totalValue).toBe(0);
  });

  it('agrega correctamente múltiples activos', async () => {
    const { token, portfolioId } = await loginAndCreatePortfolio();

    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assetSymbol: 'AAPL', type: 'buy', quantity: 10, priceAtTransaction: 180 });

    await request(app)
      .post(`${BASE}/${portfolioId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assetSymbol: 'MSFT', type: 'buy', quantity: 5, priceAtTransaction: 400 });

    const res = await request(app)
      .get(`${BASE}/${portfolioId}/performance`)
      .set('Authorization', `Bearer ${token}`);

    // AAPL: 10 * 210 = 2100 | MSFT: 5 * 420 = 2100 → total 4200
    expect(res.body.holdings).toHaveLength(2);
    expect(res.body.totalValue).toBe(4200);
  });
});

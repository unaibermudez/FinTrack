import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

const AUTH = '/api/auth';
const BASE = '/api/portfolios';

const userA = { email: 'usera@fintrack.dev', password: 'password123', name: 'User A' };
const userB = { email: 'userb@fintrack.dev', password: 'password123', name: 'User B' };

const login = async (credentials: { email: string; password: string }) => {
  await request(app).post(`${AUTH}/register`).send(credentials);
  const res = await request(app).post(`${AUTH}/login`).send(credentials);
  return res.body.accessToken as string;
};

describe('GET /api/portfolios', () => {
  it('devuelve lista vacía para usuario sin portfolios', async () => {
    const token = await login(userA);
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.portfolios).toEqual([]);
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/portfolios', () => {
  it('crea un portfolio y devuelve 201', async () => {
    const token = await login(userA);
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mi Portfolio', description: 'Descripción' });

    expect(res.status).toBe(201);
    expect(res.body.portfolio).toMatchObject({ name: 'Mi Portfolio', description: 'Descripción' });
    expect(res.body.portfolio).toHaveProperty('_id');
  });

  it('el portfolio aparece al listar', async () => {
    const token = await login(userA);
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tech Stocks' });

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.portfolios).toHaveLength(1);
    expect(res.body.portfolios[0].name).toBe('Tech Stocks');
  });

  it('un usuario no ve los portfolios de otro', async () => {
    const tokenA = await login(userA);
    const tokenB = await login(userB);

    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Portfolio de A' });

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.body.portfolios).toHaveLength(0);
  });
});

describe('GET /api/portfolios/:id', () => {
  it('devuelve el portfolio si pertenece al usuario', async () => {
    const token = await login(userA);
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mi Portfolio' });

    const id = created.body.portfolio._id;
    const res = await request(app)
      .get(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.portfolio._id).toBe(id);
  });

  it('devuelve 404 si el portfolio pertenece a otro usuario', async () => {
    const tokenA = await login(userA);
    const tokenB = await login(userB);

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Portfolio de A' });

    const id = created.body.portfolio._id;
    const res = await request(app)
      .get(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/portfolios/:id', () => {
  it('actualiza nombre y descripción', async () => {
    const token = await login(userA);
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre original' });

    const id = created.body.portfolio._id;
    const res = await request(app)
      .put(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre actualizado', description: 'Nueva descripción' });

    expect(res.status).toBe(200);
    expect(res.body.portfolio.name).toBe('Nombre actualizado');
    expect(res.body.portfolio.description).toBe('Nueva descripción');
  });

  it('devuelve 404 al editar portfolio de otro usuario', async () => {
    const tokenA = await login(userA);
    const tokenB = await login(userB);

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Portfolio de A' });

    const res = await request(app)
      .put(`${BASE}/${created.body.portfolio._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Intento de edición' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/portfolios/:id', () => {
  it('elimina el portfolio y devuelve 204', async () => {
    const token = await login(userA);
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A eliminar' });

    const id = created.body.portfolio._id;
    const del = await request(app)
      .delete(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it('devuelve 404 al borrar portfolio de otro usuario', async () => {
    const tokenA = await login(userA);
    const tokenB = await login(userB);

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Portfolio de A' });

    const res = await request(app)
      .delete(`${BASE}/${created.body.portfolio._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});

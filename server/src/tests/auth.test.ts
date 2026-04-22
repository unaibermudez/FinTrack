import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import User from '../models/User.js';

const BASE = '/api/auth';

const validUser = {
  email: 'test@fintrack.dev',
  password: 'password123',
  name: 'Test User',
};

describe('POST /api/auth/register', () => {
  it('crea un usuario y devuelve 201 con los datos del usuario', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: validUser.email, name: validUser.name });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('devuelve 409 si el email ya está en uso', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const res = await request(app).post(`${BASE}/register`).send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already in use/i);
  });

  it('registra el email en minúsculas independientemente del input', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...validUser, email: 'TEST@FINTRACK.DEV' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@fintrack.dev');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
  });

  it('devuelve accessToken y establece cookie refreshToken', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toMatchObject({ email: validUser.email });
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  it('devuelve 401 con contraseña incorrecta', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('devuelve 401 con email inexistente', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'noexiste@fintrack.dev', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('emite nuevo accessToken con refresh token válido', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rota el refresh token en cada uso', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    const firstCookie = loginRes.headers['set-cookie'][0];
    const refreshRes = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', firstCookie);

    const secondCookie = refreshRes.headers['set-cookie'][0];
    expect(secondCookie).not.toBe(firstCookie);
  });

  it('devuelve 401 si se reutiliza un refresh token ya rotado', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    const oldCookie = loginRes.headers['set-cookie'][0];
    await request(app).post(`${BASE}/refresh`).set('Cookie', oldCookie);

    // Segundo uso del mismo token (ya rotado)
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', oldCookie);

    expect(res.status).toBe(401);
  });

  it('devuelve 401 sin cookie', async () => {
    const res = await request(app).post(`${BASE}/refresh`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('invalida el refresh token y devuelve 204', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    const cookie = loginRes.headers['set-cookie'][0];
    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Cookie', cookie);

    expect(res.status).toBe(204);

    // El refresh token ya no sirve
    const refreshRes = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', cookie);

    expect(refreshRes.status).toBe(401);
  });

  it('borra el refreshToken del usuario en BD', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });

    await request(app)
      .post(`${BASE}/logout`)
      .set('Cookie', loginRes.headers['set-cookie'][0]);

    const user = await User.findOne({ email: validUser.email });
    expect(user?.refreshToken).toBeNull();
  });
});

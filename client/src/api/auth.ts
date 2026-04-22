import api from './axiosInstance';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export const register = (data: { email: string; password: string; name?: string }) =>
  api.post<{ user: AuthUser }>('/auth/register', data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<{ accessToken: string; user: AuthUser }>('/auth/login', data).then((r) => r.data);

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data);

export const refresh = () =>
  api.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data);

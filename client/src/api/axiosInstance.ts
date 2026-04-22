import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    original._retry = true;
    try {
      if (!refreshing) {
        refreshing = axios
          .post(import.meta.env.VITE_API_URL + '/api/auth/refresh', {}, { withCredentials: true })
          .then((r) => {
            const token: string = r.data.accessToken;
            useAuthStore.getState().setAccessToken(token);
            return token;
          })
          .finally(() => { refreshing = null; });
      }
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }
  }
);

export default api;

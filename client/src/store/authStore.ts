import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

const STORED_USER_KEY = 'fintrack_user';

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORED_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  accessToken: null,
  isInitialized: false,

  setAuth: (user, accessToken) => {
    localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
    set({ user, accessToken });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => {
    localStorage.removeItem(STORED_USER_KEY);
    set({ user: null, accessToken: null });
  },
  setInitialized: () => set({ isInitialized: true }),
}));

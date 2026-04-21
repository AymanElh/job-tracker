import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setInitialized: (val: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, token) => {
    set({ user, token, isAuthenticated: true, isInitialized: true });
  },
  setUser: (user) => {
    set({ user });
  },
  setToken: (token) => {
    set({ token, isAuthenticated: !!token });
  },
  setInitialized: (val) => {
    set({ isInitialized: val });
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

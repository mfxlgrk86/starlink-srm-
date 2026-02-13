import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

// Separate storage for auth token (for api.js to access)
const AUTH_TOKEN_KEY = 'auth-token';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        try {
          const response = await api.post('/auth/login', { username, password });
          const { token, user } = response.data;
          // Also save token separately for api.js to access
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          set({ user, token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || '登录失败'
          };
        }
      },

      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return false;

        try {
          const response = await api.get('/auth/profile');
          set({ user: response.data, isAuthenticated: true });
          return true;
        } catch (error) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
);

// Initialize token in localStorage on load if it exists in persisted state
const stored = localStorage.getItem('auth-storage');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.state?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, parsed.state.token);
    }
  } catch (e) {}
}

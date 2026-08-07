import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: { nickname?: string; photoUrl?: string; role?: string } | null;
  setToken: (token: string, user?: { nickname?: string; photoUrl?: string; role?: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token, user = null) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    return (exp * 1000) < Date.now();
  } catch (e) {
    return true;
  }
};

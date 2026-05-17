import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

// 미들웨어가 읽을 수 있는 일반 쿠키 설정 (httpOnly 아님 — 존재 여부만 체크)
function setAuthCookie() {
  if (typeof document === "undefined") return;
  // 7일 유효, SameSite=Strict으로 CSRF 방어
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `auth_flag=1; path=/; max-age=${maxAge}; SameSite=Strict`;
}

function removeAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "auth_flag=; path=/; max-age=0; SameSite=Strict";
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (params: { user: AuthUser; accessToken: string }) => void;
  restoreAuthSession: () => void;
  clearAuth: () => void;
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken }) => {
        setAuthCookie();
        set({ user, accessToken, isAuthenticated: true });
      },

      restoreAuthSession: () => {
        set((state) => {
          if (!state.user || !state.accessToken) {
            return state;
          }

          setAuthCookie();
          return { ...state, isAuthenticated: true };
        });
      },

      clearAuth: () => {
        removeAuthCookie();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      setAccessToken: (accessToken) => {
        setAuthCookie();
        set((state) => ({
          accessToken,
          isAuthenticated: Boolean(state.user),
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

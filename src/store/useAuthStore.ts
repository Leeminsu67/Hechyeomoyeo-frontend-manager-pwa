import { create } from "zustand";
import {
  AUTH_FLAG_COOKIE_NAME,
  getAuthClientType,
  getAuthFlagMaxAge,
} from "@/features/auth/lib/clientType";
import type { AuthClientType, AuthUser } from "@/types/auth";

// 미들웨어가 읽을 수 있는 일반 쿠키 설정 (httpOnly 아님 — 존재 여부만 체크)
function setAuthCookie(clientType: AuthClientType) {
  if (typeof document === "undefined") return;

  const maxAge = getAuthFlagMaxAge(clientType);
  const maxAgePart = maxAge ? `; max-age=${maxAge}` : "";
  document.cookie = `${AUTH_FLAG_COOKIE_NAME}=1; path=/${maxAgePart}; SameSite=Strict`;
}

function removeAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_FLAG_COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}

function removeLegacyPersistedAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("auth-storage");
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  clientType: AuthClientType | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (params: {
    user: AuthUser;
    accessToken: string;
    clientType?: AuthClientType;
  }) => void;
  clearAuth: () => void;
  setAccessToken: (accessToken: string) => void;
  clearAccessToken: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  clientType: null,
  isAuthenticated: false,

  setAuth: ({ user, accessToken, clientType }) => {
    const resolvedClientType = clientType ?? getAuthClientType();

    removeLegacyPersistedAuth();
    setAuthCookie(resolvedClientType);
    set({
      user,
      accessToken,
      clientType: resolvedClientType,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    removeAuthCookie();
    removeLegacyPersistedAuth();
    set({
      user: null,
      accessToken: null,
      clientType: null,
      isAuthenticated: false,
    });
  },

  setAccessToken: (accessToken) => {
    set((state) => {
      const clientType = state.clientType ?? getAuthClientType();

      setAuthCookie(clientType);
      removeLegacyPersistedAuth();

      return {
        accessToken,
        clientType,
        isAuthenticated: Boolean(state.user),
      };
    });
  },

  clearAccessToken: () => {
    set({ accessToken: null });
  },
}));

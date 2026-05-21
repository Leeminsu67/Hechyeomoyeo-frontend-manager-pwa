import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  getSessionExpiredLoginPath,
  SESSION_EXPIRED_MESSAGE,
} from "@/features/auth/lib/sessionExpired";
import { refreshAuthSession } from "@/features/auth/services/sessionApi";
import { useAuthStore } from "@/store/useAuthStore";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// 요청 인터셉터: Authorization 헤더에 access token 자동 주입
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// refresh 요청이 이미 진행 중인지 추적 (중복 요청 방지)
let isRefreshing = false;
// refresh 완료를 기다리는 요청 큐
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];
let refreshAbortController: AbortController | null = null;
let isRedirectingToLogin = false;

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

function getRequestPath(config: InternalAxiosRequestConfig | undefined) {
  if (!config?.url) return null;

  try {
    const baseUrl =
      config.baseURL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost";
    return new URL(config.url, baseUrl).pathname;
  } catch {
    return config.url.split("?")[0] ?? null;
  }
}

function shouldSkipAuthHandling(config: InternalAxiosRequestConfig) {
  if (config.skipAuthRefresh) return true;

  const path = getRequestPath(config);
  if (!path) return false;

  return path.startsWith("/auth/") && path !== "/auth/phone/me/verify";
}

function setBearerToken(config: InternalAxiosRequestConfig, token: string) {
  config.headers["Authorization"] = `Bearer ${token}`;
}

function clearAuthAndRedirect(
  error: unknown = new Error(SESSION_EXPIRED_MESSAGE)
) {
  if (typeof window === "undefined") return;

  refreshAbortController?.abort();
  refreshAbortController = null;
  isRefreshing = false;
  processQueue(error, null);

  useAuthStore.getState().clearAuth();

  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  window.location.replace(getSessionExpiredLoginPath());
}

// 응답 인터셉터: 401 처리 + refresh token 자동 재발급
// refreshToken은 httpOnly 쿠키로 관리 → withCredentials: true로 자동 전송
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      shouldSkipAuthHandling(originalRequest)
    ) {
      return Promise.reject(error);
    }

    useAuthStore.getState().clearAccessToken();

    if (originalRequest._retry) {
      clearAuthAndRedirect(error);
      return Promise.reject(error);
    }

    // 이미 refresh 진행 중이면 큐에 추가
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        setBearerToken(originalRequest, newToken);
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    const controller = new AbortController();
    refreshAbortController = controller;

    try {
      const data = await refreshAuthSession(controller.signal);
      const newAccessToken = data.data.accessToken;
      if (!newAccessToken) throw new Error("새 토큰 발급 실패");

      useAuthStore.getState().setAccessToken(newAccessToken);

      processQueue(null, newAccessToken);
      setBearerToken(originalRequest, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthAndRedirect(refreshError);
      return Promise.reject(refreshError);
    } finally {
      if (refreshAbortController === controller) {
        refreshAbortController = null;
      }
      if (isRefreshing) {
        isRefreshing = false;
      }
    }
  }
);

export default apiClient;

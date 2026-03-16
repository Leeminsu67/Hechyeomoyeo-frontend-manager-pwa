import axios, { AxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// 요청 인터셉터: Authorization 헤더에 access token 자동 주입
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth-storage");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const accessToken = parsed?.state?.accessToken;
          if (accessToken) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
          }
        } catch {
          // 파싱 실패 시 무시
        }
      }
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

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("auth-storage");
    if (!stored) return null;
    return JSON.parse(stored)?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

function clearAuthAndRedirect() {
  if (typeof window === "undefined") return;
  // 쿠키 제거
  document.cookie = "auth_flag=; path=/; max-age=0; SameSite=Strict";
  // localStorage 제거
  localStorage.removeItem("auth-storage");
  window.location.href = "/login";
}

// 응답 인터셉터: 401 처리 + refresh token 자동 재발급
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getStoredRefreshToken();

    // refresh token 없으면 즉시 로그아웃
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // 이미 refresh 진행 중이면 큐에 추가
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      const newAccessToken: string = data?.data?.accessToken;
      if (!newAccessToken) throw new Error("새 토큰 발급 실패");

      // localStorage의 accessToken 갱신
      const stored = localStorage.getItem("auth-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.accessToken = newAccessToken;
        localStorage.setItem("auth-storage", JSON.stringify(parsed));
      }

      processQueue(null, newAccessToken);
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;

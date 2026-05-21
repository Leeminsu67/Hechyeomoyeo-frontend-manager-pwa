"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AppLayout } from "@/components/shared/AppLayout";
import { PushNotificationBootstrap } from "@/features/notifications/components/PushNotificationBootstrap";
import {
  getAuthClientType,
  hasAuthFlagCookie,
} from "@/features/auth/lib/clientType";
import { getSessionExpiredLoginPath } from "@/features/auth/lib/sessionExpired";
import { getAuthUserFromAccessToken } from "@/features/auth/lib/token";
import { refreshAuthSession } from "@/features/auth/services/sessionApi";

/**
 * 보호된 라우트 레이아웃 (클라이언트 2중 가드)
 *
 * 1차 가드: middleware.ts — 쿠키(auth_flag) 기반, Edge에서 즉시 차단 (SSR)
 * 2차 가드: 이 컴포넌트 — 메모리 상태가 비어 있으면 refresh cookie로 세션 복구
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      setIsCheckingSession(false);
      return () => {
        cancelled = true;
      };
    }

    async function restoreSession() {
      if (!hasAuthFlagCookie()) {
        clearAuth();
        router.replace("/login");
        setIsCheckingSession(false);
        return;
      }

      try {
        const response = await refreshAuthSession();
        const accessToken = response.data.accessToken;
        const user = getAuthUserFromAccessToken(accessToken);

        if (!cancelled) {
          setAuth({ user, accessToken, clientType: getAuthClientType() });
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          router.replace(getSessionExpiredLoginPath());
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, isAuthenticated, router, setAuth]);

  // 세션 확인 전 또는 미인증 상태면 아무것도 렌더하지 않음
  if (isCheckingSession || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <PushNotificationBootstrap />
      <AppLayout>{children}</AppLayout>
    </>
  );
}

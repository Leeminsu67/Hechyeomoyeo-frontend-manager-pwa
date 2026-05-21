"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getAuthClientType,
  hasAuthFlagCookie,
} from "@/features/auth/lib/clientType";
import {
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_REASON_PARAM,
  SESSION_EXPIRED_REASON_VALUE,
} from "@/features/auth/lib/sessionExpired";
import { getAuthUserFromAccessToken } from "@/features/auth/lib/token";
import { refreshAuthSession } from "@/features/auth/services/sessionApi";

export function LoginSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get(SESSION_EXPIRED_REASON_PARAM) ===
      SESSION_EXPIRED_REASON_VALUE
    ) {
      toast.error(SESSION_EXPIRED_MESSAGE);
      params.delete(SESSION_EXPIRED_REASON_PARAM);
      const nextSearch = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`
      );
    }

    let cancelled = false;

    async function redirectIfSessionExists() {
      const { accessToken, isAuthenticated, user, setAuth, clearAuth } =
        useAuthStore.getState();

      if (isAuthenticated && user && accessToken) {
        router.replace("/dashboard");
        return;
      }

      if (!hasAuthFlagCookie()) return;

      try {
        const response = await refreshAuthSession();
        const nextAccessToken = response.data.accessToken;
        const nextUser = getAuthUserFromAccessToken(nextAccessToken);

        if (!cancelled) {
          setAuth({
            user: nextUser,
            accessToken: nextAccessToken,
            clientType: getAuthClientType(),
          });
          router.replace("/dashboard");
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      }
    }

    void redirectIfSessionExists();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

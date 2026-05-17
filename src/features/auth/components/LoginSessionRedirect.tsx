"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

function isMobileStandalonePwa() {
  const userAgent = navigator.userAgent;
  const isMobile =
    /android|iphone|ipad|ipod|mobile|tablet/i.test(userAgent) ||
    (/macintosh/i.test(userAgent) && (navigator.maxTouchPoints ?? 0) > 1);
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true;

  return isMobile && isStandalone;
}

export function LoginSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isMobileStandalonePwa()) {
      return;
    }

    const redirectIfStoredSessionExists = () => {
      const { accessToken, restoreAuthSession, user } = useAuthStore.getState();

      if (!user || !accessToken) {
        return;
      }

      restoreAuthSession();
      router.replace("/dashboard");
    };

    if (useAuthStore.persist.hasHydrated()) {
      redirectIfStoredSessionExists();
      return;
    }

    return useAuthStore.persist.onFinishHydration(
      redirectIfStoredSessionExists,
    );
  }, [router]);

  return null;
}

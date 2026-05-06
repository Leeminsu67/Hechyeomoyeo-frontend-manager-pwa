"use client";

import { useEffect } from "react";

const CLEANUP_RELOAD_KEY = "dev-service-worker-cleanup-reloaded";

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function cleanupServiceWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const staleRegistrations = registrations.filter((registration) => {
        const scriptURL =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL;

        if (!scriptURL) return false;

        return new URL(scriptURL).pathname === "/sw.js";
      });
      const hadRegistrations = staleRegistrations.length > 0;

      await Promise.all(
        staleRegistrations.map((registration) => registration.unregister()),
      );

      if (hadRegistrations && "caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      const needsReload =
        hadRegistrations &&
        Boolean(navigator.serviceWorker.controller) &&
        sessionStorage.getItem(CLEANUP_RELOAD_KEY) !== "1";

      if (!cancelled && needsReload) {
        sessionStorage.setItem(CLEANUP_RELOAD_KEY, "1");
        window.location.reload();
      }
    }

    void cleanupServiceWorker().catch(() => {
      // 개발 환경 보조 로직이므로 앱 렌더링을 막지 않는다.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

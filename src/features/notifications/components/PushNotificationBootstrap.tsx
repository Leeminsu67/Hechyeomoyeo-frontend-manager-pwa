"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { subscribeForegroundMessage } from "../lib/fcm";
import { syncFcmTokenIfGranted } from "../services/pushNotificationRegistration";

export function PushNotificationBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    void syncFcmTokenIfGranted();

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void subscribeForegroundMessage((payload) => {
      const title =
        payload.notification?.title ?? payload.data?.title ?? "새 알림";
      const description =
        payload.notification?.body ?? payload.data?.body ?? undefined;

      toast(title, { description });
    }).then((nextUnsubscribe) => {
      if (cancelled) {
        nextUnsubscribe?.();
        return;
      }
      unsubscribe = nextUnsubscribe;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isAuthenticated]);

  return null;
}

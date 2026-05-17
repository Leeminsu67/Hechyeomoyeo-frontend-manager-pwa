"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { subscribeForegroundMessage } from "../lib/fcm";
import { canUsePushNotifications } from "../lib/pushNotificationEligibility";
import { syncFcmTokenIfGranted } from "../services/pushNotificationRegistration";

export function PushNotificationBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const canReceivePushNotifications = canUsePushNotifications(userRole);

  useEffect(() => {
    if (!isAuthenticated || !canReceivePushNotifications) return;

    void syncFcmTokenIfGranted(userRole).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("FCM 토큰 자동 등록에 실패했습니다.", error);
      }
    });

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
    }).catch((error) => {
      if (!cancelled && process.env.NODE_ENV !== "production") {
        console.warn("FCM foreground 메시지 구독에 실패했습니다.", error);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [canReceivePushNotifications, isAuthenticated, userRole]);

  return null;
}

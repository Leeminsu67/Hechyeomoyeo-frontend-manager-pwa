"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getNotificationPermission,
  isFirebaseMessagingSupported,
} from "../lib/fcm";
import { canUsePushNotifications as canUsePushNotificationsForRole } from "../lib/pushNotificationEligibility";
import {
  deactivateCurrentFcmToken,
  isCurrentFcmTokenRegistered,
  registerCurrentFcmToken,
} from "../services/pushNotificationRegistration";

type PushPermission = NotificationPermission | "unsupported";

export function usePushNotifications() {
  const userRole = useAuthStore((state) => state.user?.role);
  const canUsePushNotifications = canUsePushNotificationsForRole(userRole);
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!canUsePushNotifications) {
        setIsSupported(false);
        setPermission("unsupported");
        setRegistered(false);
        return;
      }

      const supported = await isFirebaseMessagingSupported();
      const nextPermission = getNotificationPermission();
      setIsSupported(supported);
      setPermission(nextPermission);

      if (supported && nextPermission === "granted") {
        setRegistered(await isCurrentFcmTokenRegistered(userRole));
      } else {
        setRegistered(false);
      }
    } catch (error) {
      setRegistered(false);
      if (process.env.NODE_ENV !== "production") {
        console.warn("푸시 알림 등록 상태 확인에 실패했습니다.", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [canUsePushNotifications, userRole]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setIsUpdating(true);
    try {
      const result = await registerCurrentFcmToken({
        requestPermission: true,
        role: userRole,
      });
      await refresh();

      if (result === "registered") {
        toast.success("알림이 켜졌습니다.");
      } else if (result === "ineligible-role") {
        toast.error("현재 계정은 알림 대상이 아닙니다.");
      } else if (result === "permission-denied") {
        toast.error("브라우저 설정에서 알림 권한을 허용해주세요.");
      } else if (result === "unsupported") {
        toast.error("이 브라우저에서는 Web Push를 사용할 수 없습니다.");
      } else if (result === "permission-default") {
        toast.error("알림 권한을 허용해야 토큰을 발급할 수 있습니다.");
      } else if (result === "token-unavailable") {
        toast.error("FCM 토큰을 발급하지 못했습니다. Firebase 설정을 확인해주세요.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알림 등록에 실패했습니다.";
      toast.error(message);
      await refresh();
    } finally {
      setIsUpdating(false);
    }
  }, [refresh, userRole]);

  const disable = useCallback(async () => {
    setIsUpdating(true);
    try {
      await deactivateCurrentFcmToken();
      toast.success("알림이 꺼졌습니다.");
    } catch {
      toast.error("알림 해제에 실패했습니다.");
    } finally {
      await refresh();
      setIsUpdating(false);
    }
  }, [refresh]);

  return {
    permission,
    isSupported,
    registered,
    canUsePushNotifications,
    isLoading,
    isUpdating,
    enable,
    disable,
    refresh,
  };
}

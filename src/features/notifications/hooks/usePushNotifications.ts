"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getNotificationPermission,
  getStoredFcmToken,
  isFirebaseMessagingSupported,
} from "../lib/fcm";
import {
  deactivateCurrentFcmToken,
  registerCurrentFcmToken,
} from "../services/pushNotificationRegistration";

type PushPermission = NotificationPermission | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const supported = await isFirebaseMessagingSupported();
    setIsSupported(supported);
    setPermission(getNotificationPermission());
    setRegistered(Boolean(getStoredFcmToken()));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setIsUpdating(true);
    try {
      const result = await registerCurrentFcmToken({ requestPermission: true });
      await refresh();

      if (result === "registered") {
        toast.success("알림이 켜졌습니다.");
      } else if (result === "permission-denied") {
        toast.error("브라우저 설정에서 알림 권한을 허용해주세요.");
      } else if (result === "unsupported") {
        toast.error("이 브라우저에서는 Web Push를 사용할 수 없습니다.");
      } else {
        toast.error("알림 토큰을 발급하지 못했습니다.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알림 등록에 실패했습니다.";
      toast.error(message);
      await refresh();
    } finally {
      setIsUpdating(false);
    }
  }, [refresh]);

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
    isLoading,
    isUpdating,
    enable,
    disable,
    refresh,
  };
}

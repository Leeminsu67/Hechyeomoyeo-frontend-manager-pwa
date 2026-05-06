"use client";

import {
  deleteBrowserFcmToken,
  getCurrentFcmToken,
  getNotificationPermission,
  getStoredFcmToken,
  isFirebaseMessagingSupported,
  removeStoredFcmToken,
  resolveDeviceType,
  setStoredFcmToken,
} from "../lib/fcm";
import {
  deleteNotificationDeviceToken,
  registerNotificationDevice,
} from "./notificationDeviceApi";

export type PushRegistrationResult =
  | "registered"
  | "unsupported"
  | "permission-default"
  | "permission-denied"
  | "token-unavailable";

export async function registerCurrentFcmToken({
  requestPermission,
}: {
  requestPermission: boolean;
}): Promise<PushRegistrationResult> {
  const supported = await isFirebaseMessagingSupported();
  if (!supported) return "unsupported";

  let permission = getNotificationPermission();

  if (permission === "default") {
    if (!requestPermission) return "permission-default";
    permission = await Notification.requestPermission();
  }

  if (permission === "denied") return "permission-denied";
  if (permission !== "granted") return "permission-default";

  const fcmToken = await getCurrentFcmToken();
  if (!fcmToken) return "token-unavailable";

  const previousToken = getStoredFcmToken();

  await registerNotificationDevice({
    fcmToken,
    platform: "web",
    deviceType: resolveDeviceType(),
    userAgent: navigator.userAgent,
  });

  setStoredFcmToken(fcmToken);

  if (previousToken && previousToken !== fcmToken) {
    await deleteNotificationDeviceToken(previousToken).catch(() => undefined);
  }

  return "registered";
}

export async function syncFcmTokenIfGranted() {
  if (getNotificationPermission() !== "granted") return;
  await registerCurrentFcmToken({ requestPermission: false });
}

export async function deactivateStoredFcmToken() {
  const storedToken = getStoredFcmToken();

  if (storedToken) {
    await deleteNotificationDeviceToken(storedToken);
  }

  removeStoredFcmToken();
  await deleteBrowserFcmToken().catch(() => undefined);
}

"use client";

import {
  deleteBrowserFcmToken,
  getCurrentFcmToken,
  getNotificationPermission,
  getStoredFcmToken,
  isFirebaseMessagingSupported,
  removeStoredFcmToken,
  setStoredFcmToken,
} from "../lib/fcm";
import {
  deleteNotificationDeviceToken,
  getNotificationDeviceStatus,
  registerNotificationDevice,
  type NotificationDeviceType,
} from "./notificationDeviceApi";
import {
  canUsePushNotifications,
  type PushNotificationRole,
} from "../lib/pushNotificationEligibility";

export type PushRegistrationResult =
  | "registered"
  | "ineligible-role"
  | "unsupported"
  | "permission-default"
  | "permission-denied"
  | "token-unavailable";

let syncIfGrantedPromise: Promise<void> | null = null;

function getCurrentDeviceType(): NotificationDeviceType {
  const userAgent = navigator.userAgent;
  const isIpadOs =
    /macintosh/i.test(userAgent) && (navigator.maxTouchPoints ?? 0) > 1;
  const isAndroid = /android/i.test(userAgent);

  if (
    /ipad|tablet/i.test(userAgent) ||
    isIpadOs ||
    (isAndroid && !/mobile/i.test(userAgent))
  ) {
    return "tablet";
  }
  if (/mobi|android|iphone|ipod/i.test(userAgent)) return "mobile";

  return "desktop";
}

export async function registerCurrentFcmToken({
  requestPermission,
  role,
}: {
  requestPermission: boolean;
  role: PushNotificationRole;
}): Promise<PushRegistrationResult> {
  if (!canUsePushNotifications(role)) return "ineligible-role";

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
  const userAgent = navigator.userAgent;

  await registerNotificationDevice({
    fcmToken,
    platform: "web",
    deviceType: getCurrentDeviceType(),
    userAgent,
  });

  setStoredFcmToken(fcmToken);

  if (previousToken && previousToken !== fcmToken) {
    await deleteNotificationDeviceToken(previousToken).catch(() => undefined);
  }

  return "registered";
}

export async function isCurrentFcmTokenRegistered(role: PushNotificationRole) {
  if (!canUsePushNotifications(role)) return false;

  const supported = await isFirebaseMessagingSupported();
  if (!supported) return false;

  if (getNotificationPermission() !== "granted") {
    removeStoredFcmToken();
    return false;
  }

  const fcmToken = await getCurrentFcmToken().catch(() => null);
  if (!fcmToken) {
    removeStoredFcmToken();
    return false;
  }

  const status = await getNotificationDeviceStatus(fcmToken);

  if (status.data.registered) {
    setStoredFcmToken(fcmToken);
    return true;
  }

  removeStoredFcmToken();
  return false;
}

export async function syncFcmTokenIfGranted(role: PushNotificationRole) {
  if (!canUsePushNotifications(role)) return;
  if (getNotificationPermission() !== "granted") return;

  if (!syncIfGrantedPromise) {
    syncIfGrantedPromise = registerCurrentFcmToken({
      requestPermission: false,
      role,
    })
      .then(() => undefined)
      .finally(() => {
        syncIfGrantedPromise = null;
      });
  }

  await syncIfGrantedPromise;
}

async function getKnownFcmTokens() {
  const storedToken = getStoredFcmToken();
  const tokens = new Set<string>();

  if (storedToken) {
    tokens.add(storedToken);
  }

  if (getNotificationPermission() === "granted") {
    const currentToken = await getCurrentFcmToken().catch(() => null);
    if (currentToken) {
      tokens.add(currentToken);
    }
  }

  return tokens;
}

export async function deactivateCurrentFcmToken() {
  const tokens = await getKnownFcmTokens();

  for (const token of Array.from(tokens)) {
    await deleteNotificationDeviceToken(token);
  }

  removeStoredFcmToken();
  await deleteBrowserFcmToken().catch(() => undefined);
}

export const deactivateStoredFcmToken = deactivateCurrentFcmToken;

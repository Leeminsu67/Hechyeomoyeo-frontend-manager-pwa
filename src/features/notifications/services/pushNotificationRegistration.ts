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
  registerNotificationDevice,
} from "./notificationDeviceApi";

export type PushRegistrationResult =
  | "registered"
  | "unsupported"
  | "permission-default"
  | "permission-denied"
  | "token-unavailable";

let syncIfGrantedPromise: Promise<void> | null = null;

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
    deviceType: "manager-web",
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

  if (!syncIfGrantedPromise) {
    syncIfGrantedPromise = registerCurrentFcmToken({
      requestPermission: false,
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

"use client";

import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import type { MessagePayload, Messaging, Unsubscribe } from "firebase/messaging";
import { firebaseApp, firebaseConfig } from "@/lib/firebase";

const FCM_TOKEN_STORAGE_KEY = "hechyeomoyeo:fcm-token";
const FCM_SW_URL = "/firebase-messaging-sw.js";
const FCM_SW_SCOPE = "/firebase-cloud-messaging-push-scope";

let messagingPromise: Promise<Messaging | null> | null = null;

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
}

export function getStoredFcmToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
}

export function setStoredFcmToken(token: string) {
  localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
}

export function removeStoredFcmToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function isFirebaseMessagingSupported() {
  if (typeof window === "undefined") return false;
  if (!hasFirebaseConfig()) return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;

  return isSupported();
}

async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = isFirebaseMessagingSupported().then((supported) =>
      supported ? getMessaging(firebaseApp) : null,
    );
  }

  return messagingPromise;
}

async function getMessagingServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE);
  if (existing) {
    await existing.update().catch(() => undefined);
    return existing;
  }

  return navigator.serviceWorker.register(FCM_SW_URL, {
    scope: FCM_SW_SCOPE,
  });
}

export async function getCurrentFcmToken() {
  const messaging = await getFirebaseMessaging();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!messaging || !vapidKey) return null;

  const serviceWorkerRegistration =
    await getMessagingServiceWorkerRegistration();

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });
}

export async function deleteBrowserFcmToken() {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  await deleteToken(messaging);
}

export async function subscribeForegroundMessage(
  onPayload: (payload: MessagePayload) => void,
): Promise<Unsubscribe | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  return onMessage(messaging, onPayload);
}

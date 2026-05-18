/* Firebase Cloud Messaging service worker. */

const DEFAULT_NOTIFICATION_TITLE = "헤쳐모여";
const DEFAULT_NOTIFICATION_BODY = "새 알림이 도착했습니다.";
const DEFAULT_NOTIFICATION_URL = "/";
const ICON_URL = "/icons/icon-192x192.png";
const BADGE_URL = "/icons/icon-96x96.png";
const FCM_PUSH_RECEIVED = "push-received";

function parsePushPayload(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return {
      notification: {
        title: DEFAULT_NOTIFICATION_TITLE,
        body: event.data.text(),
      },
    };
  }
}

function getNotificationPayload(payload) {
  return payload?.notification ?? {};
}

function getDataPayload(payload) {
  return payload?.data ?? {};
}

function getTargetUrl(payload) {
  const data = getDataPayload(payload);
  const notification = getNotificationPayload(payload);

  return (
    data.url ||
    data.link ||
    payload?.fcmOptions?.link ||
    payload?.webpush?.fcmOptions?.link ||
    notification.click_action ||
    DEFAULT_NOTIFICATION_URL
  );
}

function getNotificationTitle(payload) {
  const notification = getNotificationPayload(payload);
  const data = getDataPayload(payload);

  return (
    notification.title ||
    data.title ||
    payload?.title ||
    DEFAULT_NOTIFICATION_TITLE
  );
}

function getNotificationOptions(payload) {
  const notification = getNotificationPayload(payload);
  const data = getDataPayload(payload);

  return {
    body:
      notification.body ||
      data.body ||
      payload?.body ||
      DEFAULT_NOTIFICATION_BODY,
    icon: notification.icon || data.icon || ICON_URL,
    badge: data.badge || BADGE_URL,
    image: notification.image || data.image,
    data: {
      ...data,
      url: getTargetUrl(payload),
      fcmMessageId: payload?.fcmMessageId,
    },
  };
}

async function getWindowClients() {
  return self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
}

function hasVisibleClient(clients) {
  return clients.some(
    (client) =>
      client.visibilityState === "visible" &&
      !client.url.startsWith("chrome-extension://"),
  );
}

function postForegroundMessage(clients, payload) {
  for (const client of clients) {
    client.postMessage({
      ...payload,
      isFirebaseMessaging: true,
      messageType: FCM_PUSH_RECEIVED,
    });
  }
}

async function handlePush(event) {
  const payload = parsePushPayload(event);
  const clients = await getWindowClients();

  if (hasVisibleClient(clients)) {
    postForegroundMessage(clients, payload);
  }

  await self.registration.showNotification(
    getNotificationTitle(payload),
    getNotificationOptions(payload),
  );
}

async function openAppFromNotification(event) {
  const rawUrl = event.notification.data?.url || DEFAULT_NOTIFICATION_URL;
  const targetUrl = new URL(rawUrl, self.location.origin);

  if (targetUrl.origin !== self.location.origin) {
    targetUrl.href = new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).href;
  }

  const clients = await getWindowClients();
  const existingClient = clients.find((client) => {
    try {
      return new URL(client.url).origin === self.location.origin;
    } catch {
      return false;
    }
  });

  if (existingClient) {
    const navigatedClient = await existingClient
      .navigate(targetUrl.href)
      .catch(() => existingClient);
    return (navigatedClient ?? existingClient).focus();
  }

  return self.clients.openWindow(targetUrl.href);
}

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(openAppFromNotification(event));
});

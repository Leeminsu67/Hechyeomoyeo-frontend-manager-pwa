import apiClient from "@/lib/axios";

export type NotificationDeviceType = "desktop" | "mobile" | "tablet";

export interface RegisterNotificationDeviceDto {
  fcmToken: string;
  platform: "web";
  deviceType: NotificationDeviceType;
  userAgent: string;
}

export interface NotificationDevice {
  id: string;
  platform: "web";
  deviceType: NotificationDeviceType | null;
  isActive: boolean;
  lastUsedAt: string;
}

export interface NotificationDeviceStatusResponse {
  data: {
    registered: boolean;
    device: NotificationDevice | null;
  };
}

export const registerNotificationDevice = async (
  dto: RegisterNotificationDeviceDto,
): Promise<void> => {
  await apiClient.post("/notifications/devices", dto);
};

export const getNotificationDeviceStatus = async (
  fcmToken: string,
): Promise<NotificationDeviceStatusResponse> => {
  const response = await apiClient.post("/notifications/devices/status", {
    fcmToken,
  });
  return response.data;
};

export const deleteNotificationDeviceToken = async (
  fcmToken: string,
): Promise<void> => {
  await apiClient.delete("/notifications/devices/token", {
    data: { fcmToken },
  });
};

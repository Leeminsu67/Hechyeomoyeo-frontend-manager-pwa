import apiClient from "@/lib/axios";

export type NotificationDeviceType = "desktop" | "mobile" | "tablet";

export interface RegisterNotificationDeviceDto {
  fcmToken: string;
  platform: "web";
  deviceType?: NotificationDeviceType;
  userAgent?: string;
}

export const registerNotificationDevice = async (
  dto: RegisterNotificationDeviceDto,
): Promise<void> => {
  await apiClient.post("/notifications/devices", dto);
};

export const deleteNotificationDeviceToken = async (
  fcmToken: string,
): Promise<void> => {
  await apiClient.delete("/notifications/devices/token", {
    data: { fcmToken },
  });
};

import apiClient from "@/lib/axios";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@/types/notification";

export const getMyNotifications = async (
  params: NotificationListParams,
): Promise<NotificationListResponse> => {
  const response = await apiClient.get("/notifications/me", { params });
  return response.data;
};

export const getUnreadNotificationCount =
  async (): Promise<NotificationUnreadCountResponse> => {
    const response = await apiClient.get("/notifications/me/unread-count");
    return response.data;
  };

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.patch("/notifications/read-all");
};

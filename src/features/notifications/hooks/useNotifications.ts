import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@/types/notification";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationApi";

export const NOTIFICATION_LIMIT = 50;

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  lists: () => ["notifications", "me", "list"] as const,
  list: (limit: number, sessionKey: number) =>
    ["notifications", "me", "list", { limit, sessionKey }] as const,
  unreadCount: () => ["notifications", "me", "unread-count"] as const,
};

function getLoadedCount(pages: NotificationListResponse[]) {
  return pages.reduce(
    (sum, page) => sum + page.data.notifications.length,
    0,
  );
}

function setUnreadCount(
  old: NotificationUnreadCountResponse | undefined,
  count: number,
) {
  if (!old) return old;
  return {
    ...old,
    data: {
      ...old.data,
      count: Math.max(0, count),
    },
  };
}

function decrementUnreadCount(
  old: NotificationUnreadCountResponse | undefined,
) {
  if (!old) return old;
  return setUnreadCount(old, old.data.count - 1);
}

function updateNotificationReadAt(
  old: InfiniteData<NotificationListResponse> | undefined,
  id: string | null,
  readAt: string,
) {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: {
        ...page.data,
        notifications: page.data.notifications.map((notification) => {
          if (id !== null && notification.id !== id) return notification;
          return { ...notification, readAt };
        }),
      },
    })),
  };
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: getUnreadNotificationCount,
    enabled,
  });
}

export function useMyNotifications({
  enabled,
  limit = NOTIFICATION_LIMIT,
  sessionKey,
}: {
  enabled: boolean;
  limit?: number;
  sessionKey: number;
}) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.list(limit, sessionKey),
    queryFn: ({ pageParam }) =>
      getMyNotifications({ limit, offset: pageParam }),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = getLoadedCount(allPages);
      return lastPage.data.total > loadedCount ? loadedCount : undefined;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_data, id) => {
      const readAt = new Date().toISOString();
      queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => updateNotificationReadAt(old, id, readAt),
      );
      queryClient.setQueryData<NotificationUnreadCountResponse>(
        NOTIFICATION_KEYS.unreadCount(),
        decrementUnreadCount,
      );
    },
    onError: () => {
      toast.error("알림 읽음 처리에 실패했습니다.");
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      const readAt = new Date().toISOString();
      queryClient.setQueriesData<InfiniteData<NotificationListResponse>>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => updateNotificationReadAt(old, null, readAt),
      );
      queryClient.setQueryData<NotificationUnreadCountResponse>(
        NOTIFICATION_KEYS.unreadCount(),
        (old) => setUnreadCount(old, 0),
      );
    },
    onError: () => {
      toast.error("모두 읽음 처리에 실패했습니다.");
    },
  });
}

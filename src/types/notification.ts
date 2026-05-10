export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationState = {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  limit: number;
  offset: number;
};

export type NotificationListParams = {
  limit: number;
  offset: number;
};

export type NotificationListResponse = {
  data: {
    notifications: NotificationItem[];
    total: number;
  };
};

export type NotificationUnreadCountResponse = {
  data: {
    count: number;
  };
};

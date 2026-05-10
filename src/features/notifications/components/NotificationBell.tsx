"use client";

import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";
import {
  NOTIFICATION_LIMIT,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
  useUnreadNotificationCount,
} from "../hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";

function formatUnreadBadge(count: number) {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

function sortNotificationsByLatest(notifications: NotificationItem[]) {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(
    () => new Set(),
  );

  const unreadQuery = useUnreadNotificationCount();
  const notificationsQuery = useMyNotifications({
    enabled: isOpen,
    limit: NOTIFICATION_LIMIT,
    sessionKey,
  });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = unreadQuery.data?.data.count ?? 0;
  const badge = formatUnreadBadge(unreadCount);
  const notificationPages = notificationsQuery.data?.pages;
  const total = notificationPages?.[0]?.data.total ?? 0;
  const notifications = useMemo(
    () =>
      sortNotificationsByLatest(
        (notificationPages ?? []).flatMap((page) => page.data.notifications),
      ),
    [notificationPages],
  );

  const openPanel = () => {
    setSessionKey((prev) => prev + 1);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (notification.readAt !== null || pendingReadIds.has(notification.id)) {
      return;
    }

    setPendingReadIds((prev) => new Set(prev).add(notification.id));
    markReadMutation.mutate(notification.id, {
      onSettled: () => {
        setPendingReadIds((prev) => {
          const next = new Set(prev);
          next.delete(notification.id);
          return next;
        });
      },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-lg",
          "text-muted-foreground transition-colors duration-150",
          "hover:bg-muted hover:text-text-strong active:scale-95",
        )}
        aria-label="알림 열기"
        title="알림"
      >
        <Bell size={18} />
        {badge && (
          <span className="absolute right-1.5 top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-danger-foreground ring-2 ring-surface">
            {badge}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isOpen}
        notifications={notifications}
        total={total}
        unreadCount={unreadCount}
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
        isFetchingNextPage={notificationsQuery.isFetchingNextPage}
        hasNextPage={notificationsQuery.hasNextPage}
        isMarkAllPending={markAllReadMutation.isPending}
        pendingReadIds={pendingReadIds}
        onClose={closePanel}
        onRetry={() => notificationsQuery.refetch()}
        onLoadMore={() => notificationsQuery.fetchNextPage()}
        onItemClick={handleItemClick}
        onMarkAllRead={() => markAllReadMutation.mutate()}
      />
    </>
  );
}

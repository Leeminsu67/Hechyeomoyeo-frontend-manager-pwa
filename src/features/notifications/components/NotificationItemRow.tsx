"use client";

import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";
import { formatNotificationTime } from "../lib/formatNotificationTime";

type NotificationItemRowProps = {
  notification: NotificationItem;
  onClick: (notification: NotificationItem) => void;
  disabled?: boolean;
};

export function NotificationItemRow({
  notification,
  onClick,
  disabled = false,
}: NotificationItemRowProps) {
  const unread = notification.readAt === null;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      disabled={disabled}
      className={cn(
        "flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150",
        "hover:bg-muted active:bg-muted disabled:cursor-wait disabled:opacity-70",
        unread ? "bg-primary-50" : "bg-surface",
      )}
    >
      <span
        className={cn(
          "mt-2 h-2 w-2 flex-shrink-0 rounded-full",
          unread ? "bg-primary-500" : "bg-transparent",
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "line-clamp-2 text-sm leading-5 text-text-strong",
              unread ? "font-bold" : "font-semibold",
            )}
          >
            {notification.title}
          </span>
          <span className="flex-shrink-0 whitespace-nowrap text-[11px] font-medium text-muted-foreground">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </span>
        <span className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
          {notification.body}
        </span>
      </span>
    </button>
  );
}

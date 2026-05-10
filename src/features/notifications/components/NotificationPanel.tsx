"use client";

import { useEffect } from "react";
import { ModalPortal } from "@/components/shared/ModalPortal";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";
import { NotificationItemRow } from "./NotificationItemRow";
import { NotificationPanelFooter } from "./NotificationPanelFooter";
import { NotificationPanelHeader } from "./NotificationPanelHeader";
import {
  NotificationEmpty,
  NotificationError,
  NotificationSkeleton,
} from "./NotificationPanelState";

type NotificationPanelProps = {
  isOpen: boolean;
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isMarkAllPending: boolean;
  pendingReadIds: Set<string>;
  onClose: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onItemClick: (notification: NotificationItem) => void;
  onMarkAllRead: () => void;
};

export function NotificationPanel({
  isOpen,
  notifications,
  total,
  unreadCount,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  isMarkAllPending,
  pendingReadIds,
  onClose,
  onRetry,
  onLoadMore,
  onItemClick,
  onMarkAllRead,
}: NotificationPanelProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none pointer-events-auto"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative z-10 flex h-full items-end justify-center p-0 pointer-events-none sm:items-start sm:justify-end sm:p-4 sm:pt-16">
          <section
            className={cn(
              "pointer-events-auto flex w-full flex-col overflow-hidden bg-surface shadow-card",
              "max-h-[86dvh] rounded-t-2xl border-t border-border animate-slide-up",
              "sm:max-h-[calc(100dvh-5rem)] sm:w-[420px] sm:rounded-lg sm:border",
            )}
            role="dialog"
            aria-modal="true"
            aria-label="알림"
          >
            <NotificationPanelHeader
              unreadCount={unreadCount}
              isMarkAllPending={isMarkAllPending}
              onClose={onClose}
              onMarkAllRead={onMarkAllRead}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <NotificationSkeleton />
              ) : isError && notifications.length === 0 ? (
                <NotificationError onRetry={onRetry} />
              ) : notifications.length === 0 ? (
                <NotificationEmpty />
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <NotificationItemRow
                      key={notification.id}
                      notification={notification}
                      disabled={pendingReadIds.has(notification.id)}
                      onClick={onItemClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isLoading && notifications.length > 0 && (
              <NotificationPanelFooter
                currentCount={notifications.length}
                total={total}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={onLoadMore}
              />
            )}
          </section>
        </div>
      </div>
    </ModalPortal>
  );
}

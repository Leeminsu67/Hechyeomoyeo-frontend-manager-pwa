"use client";

import { CheckCheck, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotificationPanelHeaderProps = {
  unreadCount: number;
  isMarkAllPending: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
};

export function NotificationPanelHeader({
  unreadCount,
  isMarkAllPending,
  onClose,
  onMarkAllRead,
}: NotificationPanelHeaderProps) {
  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4">
      <div>
        <h2 className="text-base font-bold text-text-strong">알림</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          미읽음 {unreadCount}개
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3 text-xs"
          disabled={unreadCount <= 0 || isMarkAllPending}
          onClick={onMarkAllRead}
        >
          {isMarkAllPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          모두 읽음
        </Button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-text-strong"
          onClick={onClose}
          aria-label="알림 닫기"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

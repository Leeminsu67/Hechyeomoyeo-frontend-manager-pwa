"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotificationPanelFooterProps = {
  currentCount: number;
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function NotificationPanelFooter({
  currentCount,
  total,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: NotificationPanelFooterProps) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="text-xs text-muted-foreground">
        {currentCount} / {total}
      </span>
      {hasNextPage && (
        <Button
          type="button"
          variant="outline"
          className="h-11 px-4"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          더보기
        </Button>
      )}
    </div>
  );
}

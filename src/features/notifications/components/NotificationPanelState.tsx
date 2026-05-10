"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationSkeleton() {
  return (
    <div className="space-y-1 px-4 py-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3 py-2">
          <div className="mt-2 h-2 w-2 rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationEmpty() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-text-strong">
        알림이 없습니다.
      </p>
    </div>
  );
}

export function NotificationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-danger-foreground" />
      <p className="text-sm font-semibold text-text-strong">
        알림을 불러오지 못했습니다.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={onRetry}
      >
        재시도
      </Button>
    </div>
  );
}

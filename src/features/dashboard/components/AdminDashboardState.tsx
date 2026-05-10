"use client";

import { AlertTriangle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
        <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    </div>
  );
}

export function AdminDashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-border bg-surface px-4 text-center shadow-card">
      <AlertTriangle className="mb-3 h-10 w-10 text-danger-foreground" />
      <h2 className="text-base font-bold text-text-strong">
        대시보드를 불러오지 못했습니다.
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        잠시 후 다시 시도해주세요.
      </p>
      <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
        다시 불러오기
      </Button>
    </div>
  );
}

export function AdminDashboardEmpty() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-border bg-surface px-4 text-center shadow-card">
      <LayoutDashboard className="mb-3 h-9 w-9 text-muted-foreground" />
      <h2 className="text-base font-bold text-text-strong">
        표시할 대시보드 데이터가 없습니다.
      </h2>
    </div>
  );
}

export function AdminDashboardForbidden() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-border bg-surface px-4 text-center shadow-card">
      <AlertTriangle className="mb-3 h-10 w-10 text-danger-foreground" />
      <h2 className="text-base font-bold text-text-strong">
        대시보드 접근 권한이 없습니다.
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        관리자 권한이 있는 계정으로 접속해주세요.
      </p>
    </div>
  );
}

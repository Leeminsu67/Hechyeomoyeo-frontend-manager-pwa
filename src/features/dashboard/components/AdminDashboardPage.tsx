"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE } from "@/types/user";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import {
  DASHBOARD_SCOPE_LABEL,
  formatDashboardDate,
} from "../lib/dashboardFormat";
import { AdminDashboardKpiGrid } from "./AdminDashboardKpiGrid";
import { AdminDashboardRiskList } from "./AdminDashboardRiskList";
import { AdminDashboardSiteSummaries } from "./AdminDashboardSiteSummaries";
import {
  AdminDashboardEmpty,
  AdminDashboardError,
  AdminDashboardForbidden,
  AdminDashboardSkeleton,
} from "./AdminDashboardState";

export function AdminDashboardPage({ siteId }: { siteId?: string }) {
  const role = useAuthStore((state) => state.user?.role);
  const currentRole = Number(role);
  const canAccessDashboard =
    Number.isFinite(currentRole) && currentRole <= ROLE.MANAGER;
  const { data, isLoading, isError, isFetching, refetch } = useAdminDashboard(
    { siteId },
    canAccessDashboard,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-strong">
              관리자 대시보드
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              오늘 현장 운영, 당직 배정, 출결, 승인, 위치 이상을 한 번에
              확인합니다.
            </p>
            {data && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {formatDashboardDate(data.date)} · {data.timezone} ·{" "}
                {DASHBOARD_SCOPE_LABEL[data.scope.mode]}
              </p>
            )}
          </div>
          {canAccessDashboard && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RefreshCw className={isFetching ? "animate-spin" : undefined} />
              새로고침
            </Button>
          )}
        </div>

        {!canAccessDashboard ? (
          <AdminDashboardForbidden />
        ) : isLoading ? (
          <AdminDashboardSkeleton />
        ) : isError ? (
          <AdminDashboardError onRetry={() => refetch()} />
        ) : !data ? (
          <AdminDashboardEmpty />
        ) : (
          <div className="space-y-6">
            <AdminDashboardKpiGrid data={data} />
            <AdminDashboardRiskList items={data.riskItems} />
            <AdminDashboardSiteSummaries sites={data.siteSummaries} />
          </div>
        )}
      </div>
    </div>
  );
}

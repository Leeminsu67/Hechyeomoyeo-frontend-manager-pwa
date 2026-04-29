"use client";

import { useMemo } from "react";
import { Bell, BellOff, Clock, MapPin } from "lucide-react";
import { useAlerts, useMarkAlertRead } from "../hooks/useAttendance";
import { ALERT_TYPE_META } from "@/types/attendance";
import { cn } from "@/lib/utils";
import type { AttendanceAlert } from "@/types/attendance";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

const ALERT_ICON_COLOR: Record<string, string> = {
  lateCheckIn: "bg-danger/20 text-danger-foreground",
  noCheckIn: "bg-danger/20 text-danger-foreground",
  earlyCheckOut: "bg-secondary/20 text-secondary-foreground",
  noCheckOut: "bg-secondary/20 text-secondary-foreground",
  locationMismatch: "bg-danger/30 text-danger-foreground",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AlertsTab({ siteId }: { siteId: string }) {
  const { data, isLoading } = useAlerts(siteId);
  const { mutate: markRead } = useMarkAlertRead();
  const alerts = data?.data?.alerts ?? [];

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.isRead).length,
    [alerts]
  );

  const handleClick = (alert: AttendanceAlert) => {
    if (!alert.isRead) {
      markRead(alert.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 border border-danger/20 rounded-xl">
          <Bell className="w-4 h-4 text-danger-foreground" />
          <span className="text-sm font-semibold text-danger-foreground">
            미확인 알림 {unreadCount}건
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  시간
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  이름
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  구역
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  유형
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  내용
                </th>
                <th className="text-center px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    이상 알림이 없습니다
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const typeMeta = ALERT_TYPE_META[alert.alertType];
                  const colorClass =
                    ALERT_ICON_COLOR[alert.alertType] ?? "bg-muted text-text";

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => handleClick(alert)}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors cursor-pointer",
                        alert.isRead
                          ? "hover:bg-muted/20"
                          : "bg-danger/5 hover:bg-danger/10"
                      )}
                    >
                      <td className="px-4 py-3 text-text whitespace-nowrap">
                        {formatDateTime(alert.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-strong whitespace-nowrap">
                        {alert.user.name}
                      </td>
                      <td className="px-4 py-3 text-text whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {alert.schedule.zone.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
                            colorClass
                          )}
                        >
                          {typeMeta?.label ?? alert.alertType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text max-w-[240px] truncate">
                        {alert.message}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {alert.isRead ? (
                          <span className="text-xs text-muted-foreground">
                            확인
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger-foreground animate-pulse" />
                            미확인
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** 미확인 알림 수를 반환하는 유틸 (탭 뱃지용) */
export function useUnreadAlertCount(siteId: string): number {
  const { data } = useAlerts(siteId);
  const alerts = data?.data?.alerts ?? [];
  return alerts.filter((a) => !a.isRead).length;
}

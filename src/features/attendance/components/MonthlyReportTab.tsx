"use client";

import { useState, useMemo } from "react";
import { Calendar, Download, Clock } from "lucide-react";
import { useMonthlyReport } from "../hooks/useAttendance";
import { ATTENDANCE_STATUS_META } from "@/types/attendance";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, MonthlyReportUser } from "@/types/attendance";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysInMonth(yearMonth: string): number[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) => i + 1);
}

const CELL_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-success/30 text-success-foreground",
  late: "bg-danger/30 text-danger-foreground",
  earlyLeave: "bg-secondary/30 text-secondary-foreground",
  absent: "bg-danger/40 text-danger-foreground font-bold",
  excused: "bg-primary/30 text-primary-foreground",
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(report: MonthlyReportUser[], month: string, days: number[]) {
  const header = [
    "이름",
    ...days.map((d) => `${d}일`),
    "출근",
    "지각",
    "조퇴",
    "결근",
    "사유인정",
  ];

  const rows = report.map((user) => {
    const dateMap = new Map(user.records.map((r) => [r.date, r.status]));
    const cells = days.map((d) => {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`;
      const status = dateMap.get(dateStr);
      return status ? ATTENDANCE_STATUS_META[status].short : "";
    });
    const s = user.summary;
    return [
      user.userName,
      ...cells,
      s.present,
      s.late,
      s.earlyLeave,
      s.absent,
      s.excused,
    ];
  });

  const csvContent = [header, ...rows]
    .map((row) => row.map((c) => `"${c}"`).join(","))
    .join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `출결리포트_${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MonthlyReportTab({ siteId }: { siteId: string }) {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, isLoading } = useMonthlyReport(siteId, month);
  const report = data?.data?.report ?? [];
  const days = useMemo(() => getDaysInMonth(month), [month]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
          />
        </div>

        <button
          onClick={() => exportCSV(report, month, days)}
          disabled={report.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          CSV 다운로드
        </button>

        <span className="text-xs text-muted-foreground ml-auto">
          총 {report.length}명
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(ATTENDANCE_STATUS_META) as [AttendanceStatus, { label: string; short: string }][]).map(
          ([status, meta]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                  CELL_COLORS[status]
                )}
              >
                {meta.short}
              </span>
              <span className="text-muted-foreground">{meta.label}</span>
            </div>
          )
        )}
      </div>

      {/* Matrix Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="h-40 w-full bg-muted rounded animate-pulse" />
            </div>
          ) : report.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-40" />
              리포트 데이터가 없습니다
            </div>
          ) : (
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="sticky left-0 z-[1] bg-muted/50 text-left px-3 py-2 font-semibold text-text-strong whitespace-nowrap min-w-[80px]">
                    이름
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className="px-1 py-2 font-semibold text-text-strong text-center min-w-[28px]"
                    >
                      {d}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-semibold text-text-strong text-center whitespace-nowrap border-l border-border">
                    출근
                  </th>
                  <th className="px-2 py-2 font-semibold text-text-strong text-center whitespace-nowrap">
                    지각
                  </th>
                  <th className="px-2 py-2 font-semibold text-text-strong text-center whitespace-nowrap">
                    조퇴
                  </th>
                  <th className="px-2 py-2 font-semibold text-text-strong text-center whitespace-nowrap">
                    결근
                  </th>
                  <th className="px-2 py-2 font-semibold text-text-strong text-center whitespace-nowrap">
                    사유
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.map((user) => {
                  const dateMap = new Map(
                    user.records.map((r) => [r.date, r.status])
                  );
                  return (
                    <tr
                      key={user.userId}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="sticky left-0 z-[1] bg-surface px-3 py-2 font-medium text-text-strong whitespace-nowrap">
                        {user.userName}
                      </td>
                      {days.map((d) => {
                        const dateStr = `${month}-${String(d).padStart(2, "0")}`;
                        const status = dateMap.get(dateStr);
                        if (!status) {
                          return (
                            <td
                              key={d}
                              className="px-1 py-2 text-center text-muted-foreground/30"
                            >
                              -
                            </td>
                          );
                        }
                        const meta = ATTENDANCE_STATUS_META[status];
                        return (
                          <td key={d} className="px-1 py-2 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold",
                                CELL_COLORS[status]
                              )}
                              title={`${dateStr} - ${meta.label}`}
                            >
                              {meta.short}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center font-semibold text-success-foreground border-l border-border">
                        {user.summary.present}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-danger-foreground">
                        {user.summary.late}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-secondary-foreground">
                        {user.summary.earlyLeave}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-danger-foreground">
                        {user.summary.absent}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-primary-foreground">
                        {user.summary.excused}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Filter,
  CheckCircle2,
  Timer,
  LogOut,
  XCircle,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCalendarSchedules } from "@/features/duty/services/scheduleApi";
import { useAttendanceList } from "../hooks/useAttendance";
import { ExcuseModal } from "./ExcuseModal";
import { ManualTimeModal } from "./ManualTimeModal";
import { ATTENDANCE_STATUS_META } from "@/types/attendance";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, AttendanceRecord } from "@/types/attendance";
import type { CalendarScheduleItem } from "@/types/schedule";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_ICON: Record<AttendanceStatus, React.ElementType> = {
  present: CheckCircle2,
  late: Timer,
  earlyLeave: LogOut,
  absent: XCircle,
  excused: ShieldCheck,
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-success/20 text-success-foreground",
  late: "bg-danger/20 text-danger-foreground",
  earlyLeave: "bg-secondary/20 text-secondary-foreground",
  absent: "bg-danger/20 text-danger-foreground",
  excused: "bg-primary/20 text-primary-foreground",
};

type FilterValue = "all" | AttendanceStatus | "noRecord";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "noRecord", label: "미기록" },
  { value: "present", label: "출근" },
  { value: "late", label: "지각" },
  { value: "absent", label: "결근" },
  { value: "earlyLeave", label: "조퇴" },
  { value: "excused", label: "사유인정" },
];

// ─── Merged Row ───────────────────────────────────────────────────────────────
// 스케줄 배정 인력 1명 = 행 1개. 출결 기록이 없어도 행은 존재.

interface MergedRow {
  key: string; // scheduleId + userId
  scheduleId: string;
  userId: string;
  userName: string;
  zoneName: string;
  attendance: AttendanceRecord | null;
}

function buildRows(
  schedules: CalendarScheduleItem[],
  attendances: AttendanceRecord[],
): MergedRow[] {
  // userId → 출결 기록 매핑
  const attendanceMap = new Map<string, AttendanceRecord>(
    attendances.map((a) => [a.user.id, a]),
  );

  const rows: MergedRow[] = [];
  const seen = new Set<string>(); // 중복 방지

  for (const schedule of schedules) {
    for (const worker of schedule.zone.workers) {
      const key = `${schedule.id}-${worker.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        key,
        scheduleId: schedule.id,
        userId: worker.id,
        userName: worker.name,
        zoneName: schedule.zone.name,
        attendance: attendanceMap.get(worker.id) ?? null,
      });
    }
  }

  return rows;
}

// ─── 비고 열 버튼 ────────────────────────────────────────────────────────────

function ActionCell({
  row,
  onCheckIn,
  onCheckOut,
  onExcuse,
}: {
  row: MergedRow;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onExcuse: () => void;
}) {
  const att = row.attendance;

  // 이미 출근+퇴근 완료
  if (att && att.checkInTime && att.checkOutTime) {
    return (
      <span className="text-xs text-muted-foreground">{att.memo ?? "-"}</span>
    );
  }

  // 사유인정 처리됨
  if (att?.status === "excused") {
    return (
      <span className="text-xs text-muted-foreground">{att.memo ?? "-"}</span>
    );
  }

  // 출근 기록 있음 → 퇴근 입력 버튼
  if (att?.checkInTime && !att.checkOutTime) {
    return (
      <button
        onClick={onCheckOut}
        className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-foreground bg-secondary/20 hover:bg-secondary/30 px-2.5 py-1 rounded-lg transition-colors"
      >
        <LogOut className="w-3 h-3" />
        퇴근 입력
      </button>
    );
  }

  // 출근 기록 없음 → 출근 입력 + (기록 있는 경우) 사유처리
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={onCheckIn}
        className="inline-flex items-center gap-1 text-xs font-semibold text-success-foreground bg-success/20 hover:bg-success/30 px-2.5 py-1 rounded-lg transition-colors"
      >
        <Clock className="w-3 h-3" />
        출근 입력
      </button>
      {att && (att.status === "absent" || att.status === "late") && (
        <button
          onClick={onExcuse}
          className="text-xs font-semibold text-primary-foreground bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
        >
          사유처리
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DailyAttendanceTab({ siteId }: { siteId: string }) {
  const [date, setDate] = useState(getToday);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [excuseTarget, setExcuseTarget] = useState<AttendanceRecord | null>(
    null,
  );
  const [timeModal, setTimeModal] = useState<{
    actionType: "checkIn" | "checkOut";
    row: MergedRow;
  } | null>(null);

  // 날짜 파싱
  const [year, month, day] = date.split("-");

  // 당일 스케줄 (배정된 인력 목록 기준)
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", siteId, "calendar", year, month, day],
    queryFn: () => getCalendarSchedules(siteId, { year, month, day }),
    enabled: !!siteId && !!date,
  });

  // 당일 출결 기록
  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendanceList(siteId, date);

  const isLoading = scheduleLoading || attendanceLoading;

  const rows = useMemo(() => {
    const schedules = scheduleData?.data?.schedules ?? [];
    const attendances = attendanceData?.data?.attendances ?? [];
    return buildRows(schedules, attendances);
  }, [scheduleData, attendanceData]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "noRecord") return rows.filter((r) => !r.attendance);
    return rows.filter((r) => r.attendance?.status === filter);
  }, [rows, filter]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Date Picker */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterValue)}
            className="pl-9 pr-8 py-2 text-sm border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow appearance-none cursor-pointer"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          총 {filtered.length}명
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  이름
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  구역
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  상태
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  출근
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  퇴근
                </th>
                <th className="text-left px-4 py-3 font-semibold text-text-strong whitespace-nowrap">
                  비고
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {rows.length === 0
                      ? "해당 날짜에 배정된 인력이 없습니다"
                      : "조건에 맞는 인력이 없습니다"}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const att = row.attendance;
                  const status = att?.status;
                  const meta = status ? ATTENDANCE_STATUS_META[status] : null;
                  const Icon = status ? STATUS_ICON[status] : null;

                  return (
                    <tr
                      key={row.key}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-strong whitespace-nowrap">
                        {row.userName}
                      </td>
                      <td className="px-4 py-3 text-text whitespace-nowrap">
                        {row.zoneName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {meta && Icon ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold",
                              STATUS_COLOR[status!],
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-muted text-text-strong">
                            미기록
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text whitespace-nowrap">
                        {formatTime(att?.checkInTime ?? null)}
                      </td>
                      <td className="px-4 py-3 text-text whitespace-nowrap">
                        {formatTime(att?.checkOutTime ?? null)}
                      </td>
                      <td className="px-4 py-3">
                        <ActionCell
                          row={row}
                          onCheckIn={() =>
                            setTimeModal({ actionType: "checkIn", row })
                          }
                          onCheckOut={() =>
                            setTimeModal({ actionType: "checkOut", row })
                          }
                          onExcuse={() => att && setExcuseTarget(att)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사유처리 모달 */}
      {excuseTarget && (
        <ExcuseModal
          record={excuseTarget}
          onClose={() => setExcuseTarget(null)}
        />
      )}

      {/* 출근/퇴근 시간 입력 모달 */}
      {timeModal && (
        <ManualTimeModal
          actionType={timeModal.actionType}
          scheduleId={timeModal.row.scheduleId}
          userId={timeModal.row.userId}
          userName={timeModal.row.userName}
          zoneName={timeModal.row.zoneName}
          date={date}
          onClose={() => setTimeModal(null)}
        />
      )}
    </div>
  );
}

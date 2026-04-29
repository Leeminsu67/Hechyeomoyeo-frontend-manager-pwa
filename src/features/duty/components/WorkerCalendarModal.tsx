"use client";

import { useMemo, useState, useCallback } from "react";
import { X, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { cn } from "@/lib/utils";
import { SCHEDULE_STATUS_META } from "@/types/schedule";
import { ROLE_META } from "@/types/user";
import { useWorkerCalendar } from "../hooks/useSchedules";
import type { RoleValue } from "@/types/user";
import type { SiteUser } from "@/types/site";
import type { WorkerScheduleItem } from "@/types/schedule";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: number }) {
  const meta = ROLE_META[role as RoleValue];
  if (!meta) return null;
  const colorMap: Record<string, string> = {
    primary: "bg-primary/20 text-primary-foreground border-primary/30",
    secondary: "bg-secondary/30 text-secondary-foreground border-secondary/40",
    success: "bg-success/30 text-success-foreground border-success/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
        colorMap[meta.color] ?? colorMap.success,
      )}
    >
      {meta.label}
    </span>
  );
}

// ─── 스케줄 Zone Chip ─────────────────────────────────────────────────────────

const STATUS_CHIP: Record<number, string> = {
  0: "bg-secondary/25 text-secondary-foreground border-secondary/40",
  1: "bg-success/25 text-success-foreground border-success/35",
  2: "bg-muted text-muted-foreground border-border line-through opacity-60",
};

function ZoneChip({ schedule }: { schedule: WorkerScheduleItem }) {
  return (
    <span
      className={cn(
        "block w-full truncate px-1 py-0.5 rounded border text-[10px] font-semibold leading-tight",
        STATUS_CHIP[schedule.status] ?? STATUS_CHIP[0],
      )}
      title={`${schedule.zone.name} (${SCHEDULE_STATUS_META[schedule.status].label})`}
    >
      {schedule.zone.name}
    </span>
  );
}

// ─── 캘린더 스켈레톤 ──────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-px">
          {Array.from({ length: 7 }).map((_, col) => (
            <div
              key={col}
              className="h-14 bg-muted/60 rounded-lg"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkerCalendarModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  user: SiteUser;
  year: number;
  month: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WorkerCalendarModal({
  open,
  onClose,
  siteId,
  user,
  year,
  month,
}: WorkerCalendarModalProps) {
  // 모달 내부 독립 년/월 상태 (props로 초기화)
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const handlePrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 1) { setViewYear((y) => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    setViewMonth((m) => {
      if (m === 12) { setViewYear((y) => y + 1); return 1; }
      return m + 1;
    });
  }, []);

  const params = useMemo(
    () => ({ year: String(viewYear), month: String(viewMonth) }),
    [viewYear, viewMonth],
  );

  const { data, isLoading } = useWorkerCalendar(siteId, user.id, params);
  const totalDays = data?.data?.totalDays ?? 0;
  const schedules = data?.data?.schedules ?? [];

  // scheduleDate → WorkerScheduleItem[] 맵
  const scheduleMap = useMemo(() => {
    const map = new Map<string, WorkerScheduleItem[]>();
    for (const s of schedules) {
      const list = map.get(s.scheduleDate) ?? [];
      list.push(s);
      map.set(s.scheduleDate, list);
    }
    return map;
  }, [schedules]);

  // 달력 셀 계산
  const { cells, totalWeeks } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    const cellList: { day: number | null; dateStr: string | null }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const day = i - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) {
        cellList.push({ day: null, dateStr: null });
      } else {
        const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        cellList.push({ day, dateStr });
      }
    }

    return { cells: cellList, totalWeeks: totalCells / 7 };
  }, [viewYear, viewMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {/* 이니셜 아바타 */}
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 shrink-0 text-sm font-bold text-primary-foreground">
              {user.name.charAt(0)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-strong leading-tight">
                  {user.name}
                </h2>
                <RoleBadge role={user.role} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                당직 배정 현황
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 월 내비게이션 ── */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/60 shrink-0">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-text"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-strong tabular-nums">
              {viewYear}년 {viewMonth}월
            </span>
            {(viewYear !== year || viewMonth !== month) && (
              <button
                onClick={() => { setViewYear(year); setViewMonth(month); }}
                className="text-[10px] font-medium text-primary-foreground bg-primary/15 border border-primary/25 px-1.5 py-0.5 rounded-full hover:bg-primary/25 transition-colors"
              >
                현재로
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-text"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── 요약 바 ── */}
        <div className="px-5 py-2 border-b border-border/60 shrink-0 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {isLoading ? (
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {viewMonth}월 당직{" "}
              <span className="font-bold text-text-strong text-sm">
                {totalDays}
              </span>
              일 배정
              {totalDays === 0 && " — 배정된 당직이 없습니다."}
            </span>
          )}
        </div>

        {/* ── 캘린더 ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  "text-center text-[11px] font-bold py-1",
                  i === 0 ? "text-danger-foreground" : i === 6 ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {isLoading ? (
            <CalendarSkeleton />
          ) : (
            <div
              className="grid grid-cols-7 gap-px"
              style={{ gridTemplateRows: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
            >
              {cells.map(({ day, dateStr }, idx) => {
                if (!day || !dateStr) {
                  return <div key={idx} className="min-h-[60px]" />;
                }

                const daySchedules = scheduleMap.get(dateStr) ?? [];
                const hasSchedule = daySchedules.length > 0;
                const isToday = dateStr === todayStr;
                const weekday = idx % 7;
                const isSunday = weekday === 0;
                const isSaturday = weekday === 6;

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "min-h-[60px] p-1 rounded-lg flex flex-col gap-0.5 transition-colors",
                      hasSchedule
                        ? "bg-primary/5 border border-primary/15"
                        : "border border-transparent",
                      isToday && "ring-1 ring-primary/40",
                    )}
                  >
                    {/* 날짜 숫자 */}
                    <span
                      className={cn(
                        "text-[11px] font-semibold leading-none mb-0.5 text-right pr-0.5",
                        isToday
                          ? "text-primary-foreground font-bold"
                          : isSunday
                            ? "text-danger-foreground/70"
                            : isSaturday
                              ? "text-primary-foreground/70"
                              : "text-text-strong",
                      )}
                    >
                      {day}
                    </span>

                    {/* 구역 칩 */}
                    {daySchedules.map((s) => (
                      <ZoneChip key={s.id} schedule={s} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 범례 + Footer ── */}
        <div className="px-5 py-3.5 border-t border-border bg-muted/20 rounded-b-2xl shrink-0 flex items-center justify-between gap-3">
          {/* 상태 범례 */}
          <div className="flex items-center gap-3 flex-wrap">
            {([0, 1, 2] as const).map((status) => (
              <span key={status} className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-block w-2.5 h-2.5 rounded-sm border",
                    STATUS_CHIP[status],
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {SCHEDULE_STATUS_META[status].label}
                </span>
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors shrink-0"
          >
            닫기
          </button>
        </div>
    </BaseModal>
  );
}

"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldWorkSchedule } from "@/types/field";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const days: Array<{
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
  }> = [];

  // Prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    days.push({ date: prevMonthDays - i, month: m, year: y, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, isCurrentMonth: true });
  }

  // Next month head
  const totalCells = Math.ceil(days.length / 7) * 7;
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;
  let d = 1;
  while (days.length < totalCells) {
    days.push({ date: d++, month: nextM, year: nextY, isCurrentMonth: false });
  }

  return days;
}

// ─── Schedule Chip ────────────────────────────────────────────────────────────

function ScheduleChip({
  schedule,
  color,
  onClick,
}: {
  schedule: FieldWorkSchedule;
  color?: string;
  onClick: (s: FieldWorkSchedule) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(schedule);
      }}
      className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate leading-tight transition-opacity hover:opacity-80 focus:outline-none"
      style={
        color
          ? { backgroundColor: color + "33", color: "#2d3436", borderLeft: `2px solid ${color}` }
          : { backgroundColor: "rgba(165,216,255,0.2)", color: "#2d3436", borderLeft: "2px solid #A5D8FF" }
      }
    >
      {schedule.fieldSite.title}
    </button>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;

function DayCell({
  date,
  month,
  year,
  isCurrentMonth,
  isToday,
  schedules,
  canManage,
  siteColorMap,
  onAddClick,
  onScheduleClick,
}: {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: FieldWorkSchedule[];
  canManage: boolean;
  siteColorMap: Map<string, string>;
  onAddClick: (date: string) => void;
  onScheduleClick: (s: FieldWorkSchedule) => void;
}) {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  const visible = schedules.slice(0, MAX_VISIBLE);
  const overflow = schedules.length - MAX_VISIBLE;

  return (
    <div
      className={cn(
        "relative min-h-[80px] sm:min-h-[100px] h-full p-1 border-b border-r border-border group",
        !isCurrentMonth && "bg-muted/20",
        isToday && "bg-primary/5"
      )}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full",
            isToday
              ? "bg-primary text-primary-foreground"
              : isCurrentMonth
              ? "text-text"
              : "text-muted-foreground"
          )}
        >
          {date}
        </span>

        {/* Add button — visible on hover / always on mobile if canManage */}
        {canManage && isCurrentMonth && (
          <button
            type="button"
            onClick={() => onAddClick(dateStr)}
            className="opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-primary/20 transition-opacity text-muted-foreground hover:text-primary-foreground"
            aria-label={`${dateStr} 스케줄 추가`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Schedule chips */}
      <div className="space-y-0.5">
        {visible.map((s) => (
          <ScheduleChip
            key={s.id}
            schedule={s}
            color={siteColorMap.get(s.fieldSite.id) ?? s.fieldSite.fieldSiteType?.color}
            onClick={onScheduleClick}
          />
        ))}
        {overflow > 0 && (
          <p className="text-xs text-muted-foreground px-1">+{overflow}개 더</p>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

interface FieldCalendarProps {
  year: number;
  month: number;
  schedules: FieldWorkSchedule[];
  isLoading: boolean;
  canManage: boolean;
  siteColorMap: Map<string, string>;
  onAddSchedule: (date: string) => void;
  onScheduleClick: (schedule: FieldWorkSchedule) => void;
}

export function FieldCalendar({
  year,
  month,
  schedules,
  isLoading,
  canManage,
  siteColorMap,
  onAddSchedule,
  onScheduleClick,
}: FieldCalendarProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  // Group schedules by date — 날짜 범위(startDate~endDate) 내 모든 날에 표시
  const scheduleMap = useMemo(() => {
    const map = new Map<string, FieldWorkSchedule[]>();
    for (const s of schedules) {
      const start = new Date(s.startDate + "T00:00:00");
      const end = s.endDate ? new Date(s.endDate + "T00:00:00") : new Date(s.startDate + "T00:00:00");
      const current = new Date(start);
      while (current <= end) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        const existing = map.get(dateStr) ?? [];
        if (!existing.find((e) => e.id === s.id)) {
          map.set(dateStr, [...existing, s]);
        }
        current.setDate(current.getDate() + 1);
      }
    }
    return map;
  }, [schedules]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {/* Skeleton */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[80px] sm:min-h-[100px] p-2 border-b border-r border-border"
            >
              <div className="w-6 h-6 bg-muted rounded-full animate-pulse" />
              <div className="mt-1.5 space-y-1">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden h-full flex flex-col">
      {/* Weekday header */}
      <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-2.5 text-center text-xs font-bold",
              i === 0 ? "text-danger-foreground" : i === 6 ? "text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 flex-1">
          {week.map((day) => {
            const dateStr = `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
            const daySchedules = scheduleMap.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;

            return (
              <DayCell
                key={dateStr}
                date={day.date}
                month={day.month}
                year={day.year}
                isCurrentMonth={day.isCurrentMonth}
                isToday={isToday}
                schedules={daySchedules}
                canManage={canManage}
                siteColorMap={siteColorMap}
                onAddClick={onAddSchedule}
                onScheduleClick={onScheduleClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

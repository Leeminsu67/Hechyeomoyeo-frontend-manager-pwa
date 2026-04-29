"use client";

import { useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarScheduleItem } from "@/types/schedule";

// ─── Palette (index → Tailwind class set) ────────────────────────────────────
// Classes are listed as full strings so Tailwind JIT includes them.
const ZONE_PALETTES = [
  "bg-primary/15 border-primary/30 text-primary-foreground",
  "bg-secondary/20 border-secondary/30 text-secondary-foreground",
  "bg-success/15 border-success/30 text-success-foreground",
  "bg-danger/15 border-danger/30 text-danger-foreground",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  type Day = { date: number; month: number; year: number; isCurrentMonth: boolean };
  const days: Day[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    days.push({ date: prevMonthDays - i, month: m, year: y, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, isCurrentMonth: true });
  }
  const totalCells = Math.ceil(days.length / 7) * 7;
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;
  let d = 1;
  while (days.length < totalCells) {
    days.push({ date: d++, month: nextM, year: nextY, isCurrentMonth: false });
  }
  return days;
}

// ─── Zone Chip ────────────────────────────────────────────────────────────────

function ZoneChip({
  schedule,
  paletteClass,
  onClick,
}: {
  schedule: CalendarScheduleItem;
  paletteClass: string;
  onClick: (s: CalendarScheduleItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(schedule);
      }}
      className={cn(
        "w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] sm:text-xs font-medium truncate leading-tight transition-opacity hover:opacity-75 focus:outline-none",
        paletteClass,
      )}
    >
      <span className="truncate">{schedule.zone.name}</span>
      <span className="shrink-0 flex items-center gap-0.5 opacity-70">
        <Users className="w-2.5 h-2.5" />
        {schedule.zone.workers.length}
      </span>
    </button>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 2;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function DayCell({
  date,
  month,
  year,
  isCurrentMonth,
  isToday,
  isSelected,
  schedules,
  canManage,
  zoneColorMap,
  onSelect,
  onAddClick,
  onZoneClick,
}: {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  schedules: CalendarScheduleItem[];
  canManage: boolean;
  zoneColorMap: Map<string, string>;
  onSelect: (dateStr: string) => void;
  onAddClick: (dateStr: string) => void;
  onZoneClick: (s: CalendarScheduleItem) => void;
}) {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  const visible = schedules.slice(0, MAX_VISIBLE);
  const overflow = schedules.length - MAX_VISIBLE;

  return (
    <div
      onClick={() => isCurrentMonth && onSelect(dateStr)}
      className={cn(
        "relative min-h-[80px] sm:min-h-[100px] h-full p-1 border-b border-r border-border group transition-colors",
        isCurrentMonth ? "cursor-pointer hover:bg-primary/5" : "bg-muted/20",
        isToday && "bg-primary/8",
        isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground"
              : isToday
                ? "bg-primary/20 text-primary-foreground"
                : isCurrentMonth
                  ? "text-text"
                  : "text-muted-foreground",
          )}
        >
          {date}
        </span>
        {canManage && isCurrentMonth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(dateStr);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-primary/20 transition-opacity text-muted-foreground hover:text-primary-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {visible.map((s) => (
          <ZoneChip
            key={s.id}
            schedule={s}
            paletteClass={zoneColorMap.get(s.zone.id) ?? ZONE_PALETTES[0]}
            onClick={onZoneClick}
          />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground px-1">+{overflow}개 더</p>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

export interface DutyCalendarProps {
  year: number;
  month: number;
  schedules: CalendarScheduleItem[];
  isLoading: boolean;
  canManage: boolean;
  selectedDate: string | null;
  zoneColorMap: Map<string, string>;
  onSelectDate: (dateStr: string) => void;
  onAddSchedule: (dateStr: string) => void;
  onZoneClick: (s: CalendarScheduleItem) => void;
}

export function DutyCalendar({
  year,
  month,
  schedules,
  isLoading,
  canManage,
  selectedDate,
  zoneColorMap,
  onSelectDate,
  onAddSchedule,
  onZoneClick,
}: DutyCalendarProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  // Group schedules by date
  const scheduleMap = useMemo(() => {
    const map = new Map<string, CalendarScheduleItem[]>();
    for (const s of schedules) {
      const existing = map.get(s.scheduleDate) ?? [];
      map.set(s.scheduleDate, [...existing, s]);
    }
    return map;
  }, [schedules]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-bold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[80px] sm:min-h-[100px] p-2 border-b border-r border-border">
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
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="rounded-2xl border border-border overflow-hidden h-full flex flex-col shadow-card">
      <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-2.5 text-center text-xs font-bold",
              i === 0 ? "text-danger-foreground" : i === 6 ? "text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 flex-1">
          {week.map((day) => {
            const dateStr = `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
            return (
              <DayCell
                key={dateStr}
                {...day}
                isToday={dateStr === todayStr}
                isSelected={dateStr === selectedDate}
                schedules={scheduleMap.get(dateStr) ?? []}
                canManage={canManage}
                zoneColorMap={zoneColorMap}
                onSelect={onSelectDate}
                onAddClick={onAddSchedule}
                onZoneClick={onZoneClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

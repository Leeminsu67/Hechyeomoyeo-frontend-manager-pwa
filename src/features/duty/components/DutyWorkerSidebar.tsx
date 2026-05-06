"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  CalendarDays,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_META } from "@/types/user";
import type { RoleValue } from "@/types/user";
import {
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from "../hooks/useSchedules";
import type {
  CalendarScheduleParams,
  CalendarScheduleItem,
  ScheduleDateCandidate,
  ScheduleWorker,
} from "@/types/schedule";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DutyWorkerSidebarProps {
  selectedDate: string | null;
  siteId: string;
  candidates: ScheduleDateCandidate[];
  /** 선택된 날짜의 모든 구역 스케줄 */
  dateSchedules: CalendarScheduleItem[];
  /** 이달 전체 스케줄 (월간 배정 집계용) */
  allMonthSchedules: CalendarScheduleItem[];
  calendarParams: CalendarScheduleParams;
  canManage: boolean;
  /** 모달로 사용될 때 닫기 콜백 */
  onClose?: () => void;
}

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


// ─── Monthly Date Popover ─────────────────────────────────────────────────────

function MonthlyDatePopover({
  dates,
  onClose,
}: {
  dates: string[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div
      ref={ref}
      className="mt-2 p-3 bg-surface border border-border rounded-xl shadow-card-hover animate-slide-up z-10"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-primary-foreground" />
          <span className="text-xs font-bold text-text-strong">
            이달 배정 날짜 ({dates.length}회)
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-text transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dates.map((d) => {
          const [, , day] = d.split("-");
          const dow = new Date(d + "T00:00:00").getDay();
          return (
            <span
              key={d}
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold border",
                dow === 0
                  ? "bg-danger/10 border-danger/30 text-danger-foreground"
                  : dow === 6
                    ? "bg-primary/10 border-primary/30 text-primary-foreground"
                    : "bg-muted border-border text-text",
              )}
            >
              {parseInt(day, 10)}일
              <span className="opacity-60 text-[10px]">({DAY_NAMES[dow]})</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Worker Row ───────────────────────────────────────────────────────────────

const UNAVAILABLE_REASON_LABELS: Record<string, string> = {
  alreadyScheduled: "타 구역 배정",
  approvedLeave: "휴가",
  outsideSiteOperationPeriod: "운영 기간 외",
};

const ASSIGNMENT_TYPE_LABELS = {
  regularWorker: "일반",
  substituteWorker: "대체",
} as const;

function WorkerRow({
  user,
  isAssigned,
  isPending,
  monthlyCount,
  monthlyDates,
  canManage,
  onToggle,
}: {
  user: ScheduleDateCandidate;
  isAssigned: boolean;
  isPending: boolean;
  monthlyCount: number;
  monthlyDates: string[];
  canManage: boolean;
  onToggle: (user: ScheduleDateCandidate) => void;
}) {
  const [showDates, setShowDates] = useState(false);
  const isUnavailable = !isAssigned && !user.available;
  const unavailableLabel =
    user.assignedZoneName ??
    user.unavailableReasons
      .map((reason) => UNAVAILABLE_REASON_LABELS[reason] ?? reason)
      .join(", ");

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors",
          isAssigned
            ? "bg-success/10 border border-success/30"
            : isUnavailable
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-muted/60 border border-transparent",
        )}
      >
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="text-sm font-semibold text-text-strong truncate flex-1 min-w-0">
            {user.name}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <RoleBadge role={user.role} />
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border">
              {ASSIGNMENT_TYPE_LABELS[user.siteAssignmentType]}
            </span>
            {isUnavailable && unavailableLabel && (
              <span className="text-[10px] text-danger-foreground font-medium">
                {unavailableLabel}
              </span>
            )}
            {monthlyCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDates((v) => !v);
                }}
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors",
                  showDates
                    ? "bg-secondary/60 text-secondary-foreground"
                    : "bg-secondary/30 text-secondary-foreground hover:bg-secondary/50",
                )}
                title="이달 배정 날짜 보기"
              >
                <CalendarDays className="w-2.5 h-2.5" />
                {monthlyCount}회
              </button>
            )}
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            disabled={isPending || isUnavailable}
            onClick={() => onToggle(user)}
            className={cn(
              "shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              isAssigned
                ? "text-danger-foreground hover:bg-danger/10"
                : "text-success-foreground hover:bg-success/10",
            )}
            title={isAssigned ? "이 날 배정 해제" : "이 날 배정"}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAssigned ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </button>
        )}

        {isAssigned && (
          <CheckCircle2 className="w-4 h-4 text-success-foreground shrink-0" />
        )}
      </div>

      {/* 날짜 팝오버 — 인라인 아래 펼침 */}
      {showDates && monthlyDates.length > 0 && (
        <div className="px-3">
          <MonthlyDatePopover
            dates={monthlyDates}
            onClose={() => setShowDates(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Zone Section ─────────────────────────────────────────────────────────────

function ZoneSection({
  schedule,
  siteId,
  selectedDate,
  candidates,
  calendarParams,
  canManage,
  paletteClass,
  monthlyCountMap,
  monthlyDatesMap,
}: {
  schedule: CalendarScheduleItem;
  siteId: string;
  selectedDate: string;
  candidates: ScheduleDateCandidate[];
  calendarParams: CalendarScheduleParams;
  canManage: boolean;
  paletteClass: string;
  monthlyCountMap: Map<string, number>;
  monthlyDatesMap: Map<string, string[]>;
}) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { mutate: createSchedule } = useCreateSchedule(siteId, calendarParams);
  const { mutate: updateSchedule } = useUpdateSchedule(siteId, calendarParams);
  const { mutate: deleteSchedule } = useDeleteSchedule(siteId, calendarParams);

  const assignedWorkers: ScheduleWorker[] = schedule.zone.workers;
  const assignedIds = new Set(assignedWorkers.map((w) => w.id));

  const sectionUsers = useMemo(() => {
    const map = new Map<string, ScheduleDateCandidate>();
    for (const candidate of candidates) {
      map.set(candidate.id, candidate);
    }
    for (const worker of assignedWorkers) {
      if (!map.has(worker.id)) {
        map.set(worker.id, {
          ...worker,
          siteAssignmentType: "regularWorker",
          available: true,
          unavailableReasons: [],
          assignedScheduleId: schedule.scheduleId,
          assignedZoneName: schedule.zone.name,
        });
      }
    }
    return Array.from(map.values());
  }, [assignedWorkers, candidates, schedule.scheduleId, schedule.zone.name]);

  const handleToggle = (user: ScheduleDateCandidate) => {
    if (pendingUserId) return;
    setPendingUserId(user.id);

    const wasAssigned = assignedIds.has(user.id);
    const newWorkerIds = wasAssigned
      ? assignedWorkers.filter((w) => w.id !== user.id).map((w) => w.id)
      : [...assignedWorkers.map((w) => w.id), user.id];

    if (!schedule.scheduleId) {
      createSchedule(
        { zoneId: schedule.zone.id, dto: { scheduleDate: selectedDate, status: 0, workerIds: newWorkerIds } },
        { onSettled: () => setPendingUserId(null) },
      );
    } else if (newWorkerIds.length === 0) {
      deleteSchedule(schedule.scheduleId, {
        onSettled: () => setPendingUserId(null),
      });
    } else {
      updateSchedule(
        { id: schedule.scheduleId, dto: { workerIds: newWorkerIds } },
        { onSettled: () => setPendingUserId(null) },
      );
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className={cn("w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80", paletteClass)}
      >
        <span className="text-xs font-bold truncate">{schedule.zone.name}</span>
        <span className="text-[10px] opacity-70 shrink-0">
          {schedule.assignedCount}/{schedule.requiredWorkers}명
        </span>
        {schedule.missingCount > 0 && (
          <span className="text-[10px] text-danger-foreground shrink-0">
            부족 {schedule.missingCount}
          </span>
        )}
        {schedule.isFullyAssigned && (
          <span className="text-[10px] text-success-foreground shrink-0">
            완료
          </span>
        )}
        <span className="ml-auto" />
        <span className="text-[10px] opacity-70 shrink-0">
          #{schedule.zone.sortOrder}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            isCollapsed && "-rotate-90",
          )}
        />
      </button>

      {!isCollapsed && (
        <div className="space-y-1 pl-1">
          {sectionUsers.map((user) => (
            <WorkerRow
              key={user.id}
              user={user}
              isAssigned={assignedIds.has(user.id)}
              isPending={pendingUserId === user.id}
              monthlyCount={monthlyCountMap.get(user.id) ?? 0}
              monthlyDates={monthlyDatesMap.get(user.id) ?? []}
              canManage={canManage}
              onToggle={handleToggle}
            />
          ))}
          {sectionUsers.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 px-3">
              배정 가능한 인력이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE_LIST = [
  "bg-primary/15 border border-primary/30 text-primary-foreground",
  "bg-secondary/20 border border-secondary/30 text-secondary-foreground",
  "bg-success/15 border border-success/30 text-success-foreground",
  "bg-danger/15 border border-danger/30 text-danger-foreground",
];

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function DutyWorkerSidebar({
  selectedDate,
  siteId,
  candidates,
  dateSchedules,
  allMonthSchedules,
  calendarParams,
  canManage,
  onClose,
}: DutyWorkerSidebarProps) {
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(
    () =>
      userSearch.trim()
        ? candidates.filter((u) =>
            `${u.name} ${u.loginId}`
              .toLowerCase()
              .includes(userSearch.toLowerCase()),
          )
        : candidates,
    [candidates, userSearch],
  );

  // 이달 인력별 배정 횟수 & 날짜 목록 집계
  const { monthlyCountMap, monthlyDatesMap } = useMemo(() => {
    const countMap = new Map<string, number>();
    const datesMap = new Map<string, string[]>();
    for (const s of allMonthSchedules) {
      for (const w of s.zone.workers) {
        countMap.set(w.id, (countMap.get(w.id) ?? 0) + 1);
        const existing = datesMap.get(w.id) ?? [];
        if (!existing.includes(s.scheduleDate)) {
          datesMap.set(w.id, [...existing, s.scheduleDate].sort());
        }
      }
    }
    return { monthlyCountMap: countMap, monthlyDatesMap: datesMap };
  }, [allMonthSchedules]);

  const dateLabel = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split("-");
    const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return `${y}년 ${m}월 ${d}일 (${dayNames[dayOfWeek]})`;
  }, [selectedDate]);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col shadow-card h-full">
      {/* ── Header ── */}
      <div className="px-4 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Users className="w-4 h-4 text-primary-foreground shrink-0" />
          <h3 className="text-sm font-bold text-text-strong">인력 배정</h3>
          <span className="text-xs text-muted-foreground">
            ({candidates.length}명)
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-text transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {dateLabel ? (
          <p className="text-xs text-primary-foreground font-semibold mt-1">
            {dateLabel}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            날짜를 선택하면 인력을 배정할 수 있습니다.
          </p>
        )}
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="이름 또는 ID 검색…"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 border border-transparent focus:border-primary/30 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-5">
        {!selectedDate ? (
          <div className="py-12 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">달력에서 날짜를 선택해주세요.</p>
          </div>
        ) : dateSchedules.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">운영 구역 슬롯이 없습니다.</p>
          </div>
        ) : (
          dateSchedules.map((schedule, idx) => (
            <ZoneSection
              key={schedule.id}
              schedule={schedule}
              siteId={siteId}
              selectedDate={selectedDate}
              candidates={filteredUsers}
              calendarParams={calendarParams}
              canManage={canManage}
              paletteClass={PALETTE_LIST[idx % PALETTE_LIST.length]}
              monthlyCountMap={monthlyCountMap}
              monthlyDatesMap={monthlyDatesMap}
            />
          ))
        )}
      </div>
    </div>
  );
}

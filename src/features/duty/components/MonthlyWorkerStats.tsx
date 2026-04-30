"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ROLE_META } from "@/types/user";
import { WorkerCalendarModal } from "./WorkerCalendarModal";
import type { RoleValue } from "@/types/user";
import type { ScheduleWorkerSummary } from "@/types/schedule";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyWorkerStatsProps {
  siteId: string;
  workerSummary: ScheduleWorkerSummary[];
  year: number;
  month: number;
  isLoading: boolean;
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

// ─── Worker Stat Card ─────────────────────────────────────────────────────────

function WorkerStatCard({
  user,
  totalDays,
  maxDays,
  rank,
  onClick,
}: {
  user: ScheduleWorkerSummary;
  totalDays: number;
  maxDays: number;
  rank: number;
  onClick: () => void;
}) {
  const pct = maxDays > 0 ? Math.round((totalDays / maxDays) * 100) : 0;

  const barColor =
    totalDays === 0
      ? "bg-muted"
      : pct >= 80
        ? "bg-primary/70"
        : pct >= 50
          ? "bg-primary/50"
          : "bg-primary/30";

  const countColor =
    totalDays === 0
      ? "text-muted-foreground"
      : pct >= 80
        ? "text-primary-foreground font-bold"
        : "text-text-strong font-semibold";

  return (
    <div
      className={cn(
        "group bg-surface border border-border rounded-2xl px-4 py-3.5 flex flex-col gap-2.5 cursor-pointer",
        "hover:border-primary/40 hover:shadow-card transition-all duration-200",
        totalDays === 0 && "opacity-60",
      )}
      onClick={onClick}
    >
      {/* 상단: 순위 + 이름 + 역할 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[10px] font-bold w-4 shrink-0 text-center",
            rank === 1 && totalDays > 0
              ? "text-secondary-foreground"
              : "text-muted-foreground",
          )}
        >
          {totalDays > 0 ? `${rank}` : "—"}
        </span>
        <p className="text-sm font-semibold text-text-strong truncate flex-1 min-w-0">
          {user.name}
        </p>
        <RoleBadge role={user.role} />
      </div>

      {/* 프로그레스 바 */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              barColor,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={cn(
            "text-sm tabular-nums shrink-0 min-w-[2ch] text-right",
            countColor,
          )}
        >
          {totalDays}일
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-muted rounded" />
        <div className="flex-1 h-4 bg-muted rounded" />
        <div className="w-12 h-4 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-1.5 bg-muted rounded-full" />
        <div className="w-8 h-4 bg-muted rounded" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MonthlyWorkerStats({
  siteId,
  workerSummary,
  year,
  month,
  isLoading,
}: MonthlyWorkerStatsProps) {
  const [selectedUser, setSelectedUser] =
    useState<ScheduleWorkerSummary | null>(null);

  const workerStats = useMemo(() => {
    return [...workerSummary]
      .map((u) => ({
        user: u,
        totalDays: u.assignmentCount,
      }))
      .sort(
        (a, b) =>
          b.totalDays - a.totalDays ||
          a.user.name.localeCompare(b.user.name),
      );
  }, [workerSummary]);

  const maxDays = workerStats[0]?.totalDays ?? 0;
  const totalAssigned = workerStats.filter((w) => w.totalDays > 0).length;

  if (!isLoading && workerSummary.length === 0) return null;

  return (
    <>
      <section className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-strong">
              {month}월 인력 배정 현황
            </h2>
            {!isLoading && (
              <span className="text-xs text-muted-foreground">
                전체 {workerSummary.length}명 중{" "}
                <span className="font-semibold text-primary-foreground">
                  {totalAssigned}명
                </span>{" "}
                배정됨
              </span>
            )}
          </div>
          {!isLoading && maxDays > 0 && (
            <span className="text-xs text-muted-foreground">
              최다{" "}
              <span className="font-bold text-text-strong">{maxDays}일</span>
            </span>
          )}
        </div>

        {/* 힌트 */}
        {!isLoading && workerSummary.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            인력을 클릭하면 이달 배정 달력을 볼 수 있습니다.
          </p>
        )}

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 gap-2.5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : workerStats.map(({ user, totalDays }, idx) => (
                <WorkerStatCard
                  key={user.id}
                  user={user}
                  totalDays={totalDays}
                  maxDays={maxDays}
                  rank={idx + 1}
                  onClick={() => setSelectedUser(user)}
                />
              ))}
        </div>
      </section>

      {/* 인력별 달력 모달 */}
      {selectedUser && (
        <WorkerCalendarModal
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          siteId={siteId}
          user={selectedUser}
          year={year}
          month={month}
        />
      )}
    </>
  );
}

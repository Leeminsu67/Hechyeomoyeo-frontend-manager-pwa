"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
  X,
} from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAutoAssignCollectionCount,
  toAutoAssignArray,
} from "../lib/autoAssignResult";
import type {
  AutoAssignAssignmentSummary,
  AutoAssignIncompleteSlot,
  AutoAssignResponse,
  AutoAssignScheduleItem,
  AutoAssignSkippedExistingSlot,
  AutoAssignUnassignedSlot,
} from "@/types/schedule";

type AutoAssignResult = AutoAssignResponse["data"];
type ResultTone = "primary" | "success" | "secondary" | "danger" | "muted";
type SlotItem =
  | AutoAssignIncompleteSlot
  | AutoAssignUnassignedSlot
  | AutoAssignSkippedExistingSlot;
type AssignmentSummaryItem = AutoAssignAssignmentSummary & { id?: string };

const TONE_CLASS: Record<ResultTone, string> = {
  primary: "bg-primary/15 text-primary-foreground",
  success: "bg-success/15 text-success-foreground",
  secondary: "bg-secondary/20 text-secondary-foreground",
  danger: "bg-danger/20 text-danger-foreground",
  muted: "bg-muted text-muted-foreground",
};

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return month && day ? `${month}.${day}` : date;
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: ResultTone;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-bold", TONE_CLASS[tone], "inline-flex rounded-lg px-2 py-1")}>
        {value}
      </p>
    </div>
  );
}

function getSlotDetail(item: SlotItem) {
  if ("assignedWorkers" in item) {
    return `${item.assignedWorkers}/${item.requiredWorkers}명 배정 · 부족 ${item.missingCount}명`;
  }
  if ("requiredWorkers" in item) {
    return `필요 ${item.requiredWorkers}명 · 부족 ${item.missingCount}명`;
  }
  return "기존 스케줄 유지";
}

function SlotList({
  title,
  items,
  count,
  emptyText,
  tone,
}: {
  title: string;
  items: SlotItem[];
  count?: number;
  emptyText: string;
  tone: ResultTone;
}) {
  const displayCount = count ?? items.length;

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold text-text-strong">{title}</h3>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", TONE_CLASS[tone])}>
          {displayCount}건
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="max-h-44 divide-y divide-border overflow-y-auto">
          {items.map((item) => (
            <li key={`${item.date}-${item.zoneId}`} className="px-4 py-3">
              <p className="text-sm font-semibold text-text-strong">
                {formatDate(item.date)} · {item.zoneName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {getSlotDetail(item)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AutoAssignResultModal({
  open,
  result,
  onClose,
}: {
  open: boolean;
  result: AutoAssignResult | null;
  onClose: () => void;
}) {
  if (!result) return null;

  const skippedExistingSlots =
    toAutoAssignArray<AutoAssignSkippedExistingSlot>(result.skippedExisting);
  const incompleteSlots =
    toAutoAssignArray<AutoAssignIncompleteSlot>(result.incompleteSlots);
  const unassignedSlots =
    toAutoAssignArray<AutoAssignUnassignedSlot>(result.unassignedSlots);
  const assignmentSummary =
    toAutoAssignArray<AssignmentSummaryItem>(result.assignmentSummary);
  const schedules = toAutoAssignArray<AutoAssignScheduleItem>(result.schedules);
  const skippedExistingCount = getAutoAssignCollectionCount(
    result.skippedExisting,
  );
  const incompleteCount = getAutoAssignCollectionCount(result.incompleteSlots);
  const unassignedCount = getAutoAssignCollectionCount(result.unassignedSlots);

  const assignedWorkers = assignmentSummary
    .filter((worker) => worker.assignedCount > 0)
    .sort(
      (a, b) =>
        b.assignedCount - a.assignedCount || a.name.localeCompare(b.name),
    );
  const incompleteScheduleCount = schedules.filter(
    (schedule) => !schedule.isAssignmentComplete,
  ).length;
  const hasIncomplete = incompleteCount > 0;
  const hasUnassigned = unassignedCount > 0;
  const alertMessage = hasUnassigned
    ? "배정 가능한 인력이 없어 생성되지 않은 근무가 있습니다."
    : hasIncomplete
      ? "필요 인원을 모두 채우지 못한 근무가 있습니다. 근무표에서 확인해 주세요."
      : "근무 자동 배정이 완료되었습니다.";
  const alertClass = hasUnassigned
    ? "border-danger/40 bg-danger/20 text-danger-foreground"
    : hasIncomplete
      ? "border-secondary/50 bg-secondary/20 text-secondary-foreground"
      : "border-success/40 bg-success/15 text-success-foreground";

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-4xl"
      panelClassName="max-h-[90dvh] overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            근무 자동 배정 결과
          </p>
          <h2 className="mt-1 text-lg font-bold text-text-strong">
            {result.message}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-text"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[calc(90dvh-8rem)] overflow-y-auto px-5 py-5">
        <div className={cn("mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold", alertClass)}>
          {hasUnassigned ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : hasIncomplete ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{alertMessage}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <SummaryTile label="요청 슬롯" value={result.requestedSlots} tone="primary" />
          <SummaryTile label="생성 스케줄" value={result.created} tone="success" />
          <SummaryTile label="기존 유지" value={skippedExistingCount} tone="muted" />
          <SummaryTile label="부분 배정" value={incompleteCount} tone="secondary" />
          <SummaryTile label="미배정" value={unassignedCount} tone="danger" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SlotList
            title="부분 배정 슬롯"
            items={incompleteSlots}
            count={incompleteCount}
            emptyText="필요 인원을 모두 채운 슬롯만 있습니다."
            tone="secondary"
          />
          <SlotList
            title="미배정 슬롯"
            items={unassignedSlots}
            count={unassignedCount}
            emptyText="배정하지 못한 슬롯이 없습니다."
            tone="danger"
          />
          <SlotList
            title="기존 스케줄"
            items={skippedExistingSlots}
            count={skippedExistingCount}
            emptyText="기존 스케줄과 겹친 슬롯이 없습니다."
            tone="muted"
          />
        </div>

        <section className="mt-4 rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-text-strong">인력별 신규 배정</h3>
            </div>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success-foreground">
              {assignedWorkers.length}명
            </span>
          </div>
          {assignedWorkers.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              신규로 배정된 인력이 없습니다.
            </p>
          ) : (
            <ul className="grid max-h-56 grid-cols-1 divide-y divide-border overflow-y-auto md:grid-cols-2 md:divide-x md:divide-y-0">
              {assignedWorkers.map((worker) => (
                <li key={worker.userId ?? worker.id ?? worker.loginId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-strong">{worker.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{worker.loginId}</p>
                  </div>
                  <span className="rounded-lg bg-success/15 px-2 py-1 text-sm font-bold text-success-foreground">
                    {worker.assignedCount}회
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {incompleteScheduleCount > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/20 px-4 py-3 text-sm text-secondary-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            생성된 스케줄 중 {incompleteScheduleCount}건은 필요 인원을 모두 채우지 못했습니다.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          <ClipboardList className="h-4 w-4" />
          확인
        </Button>
      </div>
    </BaseModal>
  );
}

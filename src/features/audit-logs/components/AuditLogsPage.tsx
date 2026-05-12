"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileClock,
  Filter,
  Inbox,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuditEntity, AuditLogItem } from "@/types/auditLog";
import { ROLE } from "@/types/user";
import { useAuditLogs } from "../hooks/useAuditLogs";

type AuditEntityFilter = AuditEntity | "all";

const PAGE_SIZE = 30;

const AUDIT_ENTITY_OPTIONS: Array<{ value: AuditEntityFilter; label: string }> = [
  { value: "all", label: "전체 대상" },
  { value: "USER", label: "인력" },
  { value: "COMPANY", label: "회사" },
  { value: "SITE", label: "현장" },
  { value: "SITE_ASSIGNMENT", label: "현장 배정" },
  { value: "SITE_TYPE", label: "현장 타입" },
  { value: "ZONE", label: "구역" },
  { value: "SCHEDULE", label: "당직 일정" },
  { value: "ATTENDANCE", label: "출결" },
  { value: "BLE_SESSION", label: "BLE 세션" },
  { value: "SWAP_REQUEST", label: "교환 요청" },
  { value: "LEAVE_REQUEST", label: "휴가 신청" },
  { value: "MANUAL_CLOCK_OUT_REQUEST", label: "퇴근 보정" },
  { value: "FIELD_SITE", label: "외근 현장" },
  { value: "FIELD_WORK_LOG", label: "외근 기록" },
  { value: "FIELD_WORK_SCHEDULE", label: "외근 일정" },
  { value: "LOCATION", label: "위치" },
  { value: "OTHER", label: "기타" },
];

const ENTITY_LABELS = AUDIT_ENTITY_OPTIONS.reduce<Record<string, string>>(
  (acc, option) => {
    if (option.value !== "all") acc[option.value] = option.label;
    return acc;
  },
  {},
);

const ACTION_LABELS: Record<string, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  remove: "삭제",
  approve: "승인",
  reject: "반려",
  assign: "배정",
  unassign: "배정 해제",
  auto_assign: "자동 배정",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDayStartIso(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toDayEndIso(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatActor(log: AuditLogItem) {
  if (!log.actor) return "SYSTEM";
  if (log.actor.name && log.actor.loginId) {
    return `${log.actor.name} (${log.actor.loginId})`;
  }
  return log.actor.name ?? log.actor.loginId ?? log.actor.id;
}

function formatJson(value: Record<string, unknown> | null) {
  if (!value) return "-";
  return JSON.stringify(value, null, 2);
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border bg-surface px-5 text-center shadow-card">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-semibold text-text-strong">
        조회된 감사 로그가 없습니다.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        대상 또는 기간 필터를 변경해서 확인해보세요.
      </p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-border bg-muted"
        />
      ))}
    </div>
  );
}

function AuditLogDetailModal({
  log,
  onClose,
}: {
  log: AuditLogItem | null;
  onClose: () => void;
}) {
  return (
    <BaseModal
      open={!!log}
      onClose={onClose}
      maxWidth="max-w-3xl"
      panelClassName="max-h-[85vh] overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary/15 p-2 text-primary-foreground">
            <FileClock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-strong">감사 로그 상세</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {log ? formatDateTime(log.createdAt) : "-"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {log && (
        <div className="max-h-[calc(85vh-73px)] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem label="대상" value={ENTITY_LABELS[log.entity] ?? log.entity} />
            <DetailItem label="동작" value={ACTION_LABELS[log.action] ?? log.action} />
            <DetailItem label="작업자" value={formatActor(log)} />
            <DetailItem label="요청 방식" value={log.method ?? "-"} />
            <DetailItem label="대상 ID" value={log.entityId ?? "-"} />
            <DetailItem label="IP" value={log.ipAddress ?? "-"} />
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">요청 경로</p>
            <p className="mt-1 break-all font-mono text-xs font-semibold text-text-strong">
              {log.path ?? "-"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <JsonBlock title="변경 전" value={log.before} />
            <JsonBlock title="변경 후" value={log.after} />
          </div>
        </div>
      )}
    </BaseModal>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-text-strong">
        {value}
      </p>
    </div>
  );
}

function JsonBlock({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown> | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-3 py-2 text-xs font-semibold text-text-strong">
        {title}
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-3 text-xs leading-relaxed text-text">
        {formatJson(value)}
      </pre>
    </div>
  );
}

export function AuditLogsPage() {
  const { user } = useAuthStore();
  const [entity, setEntity] = useState<AuditEntityFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const canViewAuditLogs =
    user?.role !== undefined && Number(user.role) <= ROLE.HR_MANAGER;

  const params = useMemo(
    () => ({
      ...(entity !== "all" ? { entity } : {}),
      ...(fromDate ? { from: toDayStartIso(fromDate) } : {}),
      ...(toDate ? { to: toDayEndIso(toDate) } : {}),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [entity, fromDate, page, toDate],
  );

  const { data, isLoading, isFetching } = useAuditLogs(params, canViewAuditLogs);
  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const handleEntityChange = (nextEntity: AuditEntityFilter | null) => {
    setEntity(nextEntity ?? "all");
    setPage(1);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setPage(1);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setPage(1);
  };

  if (!canViewAuditLogs) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-xl font-bold text-text-strong">접근 권한이 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          감사 로그는 인력관리자 이상 권한에서 조회할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-strong">감사 로그</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            관리자 웹앱의 쓰기 작업 변경 이력을 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground">
          <UserRound className="h-4 w-4" />
          총 {total.toLocaleString()}건
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-text-strong">
          <Filter className="h-4 w-4 text-muted-foreground" />
          필터
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_1fr]">
          <SelectDropdown
            options={AUDIT_ENTITY_OPTIONS}
            value={entity}
            onChange={handleEntityChange}
            align="left"
          />
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">
              시작일
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => handleFromDateChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">
              종료일
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => handleToDateChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <div className="hidden grid-cols-[170px_150px_120px_minmax(180px,1fr)_90px_90px] gap-3 border-b border-border bg-muted/60 px-4 py-3 text-xs font-bold text-muted-foreground lg:grid">
          <span>시각</span>
          <span>대상</span>
          <span>동작</span>
          <span>작업자/경로</span>
          <span>IP</span>
          <span className="text-right">상세</span>
        </div>

        {isLoading ? (
          <div className="p-4">
            <SkeletonRows />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-4">
            <EmptyState />
          </div>
        ) : (
          <div className={cn("divide-y divide-border", isFetching && "opacity-70")}>
            {logs.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setSelectedLog(log)}
                className="grid w-full grid-cols-1 gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/60 lg:grid-cols-[170px_150px_120px_minmax(180px,1fr)_90px_90px] lg:items-center"
              >
                <div>
                  <p className="text-xs font-semibold text-text-strong">
                    {formatDateTime(log.createdAt)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">
                    {log.ipAddress ?? "-"}
                  </p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary-foreground">
                    {ENTITY_LABELS[log.entity] ?? log.entity}
                  </span>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-secondary/20 px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-strong">
                    {formatActor(log)}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {log.method ?? "-"} {log.path ?? "-"}
                  </p>
                </div>
                <div className="hidden font-mono text-xs text-muted-foreground lg:block">
                  {log.ipAddress ?? "-"}
                </div>
                <div className="flex justify-end">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    상세
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {page} / {totalPages} 페이지
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}

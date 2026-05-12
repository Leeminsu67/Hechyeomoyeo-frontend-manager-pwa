"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Inbox,
  LogOut,
  UserRound,
  XCircle,
} from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ApprovalStatus,
  ApprovalStatusFilter,
  ApprovalTab,
  ApprovalUserSummary,
  LeaveRequestItem,
  ManualClockOutRequestItem,
} from "@/types/approval";
import {
  useApproveLeaveRequest,
  useApproveManualClockOutRequest,
  useLeaveRequest,
  useLeaveRequestList,
  useManualClockOutRequest,
  useManualClockOutRequestList,
  useRejectLeaveRequest,
  useRejectManualClockOutRequest,
} from "../hooks/useApprovals";

const PAGE_SIZE_OPTIONS = [5, 10, 30, 50, 100].map((value) => ({
  value,
  label: `${value}개`,
}));

const STATUS_OPTIONS: Array<{ value: ApprovalStatusFilter; label: string }> = [
  { value: "PENDING", label: "승인 대기" },
  { value: "all", label: "전체 상태" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
];

const STATUS_META: Record<
  ApprovalStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "승인 대기",
    className: "bg-secondary/25 text-secondary-foreground",
  },
  APPROVED: {
    label: "승인",
    className: "bg-success/20 text-success-foreground",
  },
  REJECTED: {
    label: "반려",
    className: "bg-danger/20 text-danger-foreground",
  },
  CANCELED: {
    label: "취소",
    className: "bg-muted text-muted-foreground",
  },
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

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

function formatUser(user: ApprovalUserSummary | null | undefined) {
  if (!user) return "사용자 정보 없음";
  return `${user.name} (${user.loginId})`;
}

function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "pending";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border px-4 py-3",
        tone === "pending" ? "bg-primary/10" : "bg-muted/40",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold",
          tone === "pending" ? "text-primary-foreground" : "text-text-strong",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-lg border border-border bg-muted"
        />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-border bg-surface px-5 text-center shadow-card">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-semibold text-text-strong">
        조회된 {label} 없습니다.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        상태 필터를 변경해서 이전 처리 내역을 확인할 수 있습니다.
      </p>
    </div>
  );
}

function LeaveRequestCard({
  request,
  onOpen,
}: {
  request: LeaveRequestItem;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(request.id)}
      className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-left shadow-card transition-all hover:border-primary/35 hover:shadow-card-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-strong">
              {formatUser(request.requester)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              요청 {formatDateTime(request.createdAt)}
            </p>
          </div>
        </div>
        <ApprovalStatusBadge status={request.status} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            휴가 기간
          </p>
          <p className="mt-0.5 text-xs font-semibold text-text-strong">
            {formatDate(request.startDate)} ~ {formatDate(request.endDate)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">사유</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-text-strong">
            {request.reason || "-"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end text-xs font-semibold text-primary-foreground">
        <Eye className="mr-1 h-3.5 w-3.5" />
        상세
      </div>
    </button>
  );
}

function ManualClockOutRequestCard({
  request,
  onOpen,
}: {
  request: ManualClockOutRequestItem;
  onOpen: (id: string) => void;
}) {
  const siteName =
    request.attendance?.schedule?.zone?.site?.name ?? "현장 정보 없음";
  const zoneName = request.attendance?.schedule?.zone?.name ?? "구역 정보 없음";

  return (
    <button
      type="button"
      onClick={() => onOpen(request.id)}
      className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-left shadow-card transition-all hover:border-primary/35 hover:shadow-card-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground">
            <LogOut className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-strong">
              {formatUser(request.requester)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              요청 {formatDateTime(request.createdAt)}
            </p>
          </div>
        </div>
        <ApprovalStatusBadge status={request.status} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            요청 퇴근
          </p>
          <p className="mt-0.5 text-xs font-semibold text-text-strong">
            {formatDateTime(request.requestedCheckOutTime)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">현장</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-text-strong">
            {siteName}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">구역</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-text-strong">
            {zoneName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end text-xs font-semibold text-primary-foreground">
        <Eye className="mr-1 h-3.5 w-3.5" />
        상세
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-text-strong">{value}</div>
    </div>
  );
}

function LeaveApprovalDetailModal({
  requestId,
  open,
  onClose,
}: {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const { data, isLoading } = useLeaveRequest(open ? requestId : null);
  const { mutate: approve, isPending: approving } = useApproveLeaveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectLeaveRequest();
  const request = data;
  const canProcess = request?.status === "PENDING";
  const isSubmitting = approving || rejecting;

  useEffect(() => {
    if (open) setComment("");
  }, [open, requestId]);

  const handleApprove = () => {
    if (!request) return;
    approve(
      { id: request.id, dto: comment.trim() ? { comment: comment.trim() } : {} },
      { onSuccess: onClose },
    );
  };

  const handleReject = () => {
    if (!request) return;
    reject(
      { id: request.id, dto: comment.trim() ? { comment: comment.trim() } : {} },
      { onSuccess: onClose },
    );
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      panelClassName="flex max-h-[90vh] flex-col"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-text-strong">휴가 승인 상세</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            휴가 신청 내용과 처리 상태를 확인합니다.
          </p>
        </div>
        {request && <ApprovalStatusBadge status={request.status} />}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading || !request ? (
          <SkeletonList />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow
                label="신청자"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    {formatUser(request.requester)}
                  </span>
                }
              />
              <DetailRow
                label="신청 시각"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDateTime(request.createdAt)}
                  </span>
                }
              />
              <DetailRow
                label="휴가 시작"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {formatDate(request.startDate)}
                  </span>
                }
              />
              <DetailRow
                label="휴가 종료"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {formatDate(request.endDate)}
                  </span>
                }
              />
            </div>

            <div className="rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground">신청 사유</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-strong">
                {request.reason || "-"}
              </p>
            </div>

            {request.processor && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-semibold text-text-strong">
                  처리자 {formatUser(request.processor)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  처리 시각 {formatDateTime(request.processedAt)}
                </p>
                {request.processorComment && (
                  <p className="mt-2 whitespace-pre-wrap text-text">
                    {request.processorComment}
                  </p>
                )}
              </div>
            )}

            {canProcess && (
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">
                  처리 메모
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="승인 또는 반려 사유를 입력합니다."
                />
              </label>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          닫기
        </Button>
        {canProcess && (
          <>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleReject}
            >
              <XCircle />
              반려
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
            >
              <CheckCircle2 />
              승인
            </Button>
          </>
        )}
      </div>
    </BaseModal>
  );
}

function ManualClockOutApprovalDetailModal({
  requestId,
  open,
  onClose,
}: {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const { data, isLoading } = useManualClockOutRequest(open ? requestId : null);
  const { mutate: approve, isPending: approving } =
    useApproveManualClockOutRequest();
  const { mutate: reject, isPending: rejecting } =
    useRejectManualClockOutRequest();
  const request = data;
  const canProcess = request?.status === "PENDING";
  const isSubmitting = approving || rejecting;
  const siteName =
    request?.attendance?.schedule?.zone?.site?.name ?? "현장 정보 없음";
  const zoneName = request?.attendance?.schedule?.zone?.name ?? "구역 정보 없음";

  useEffect(() => {
    if (open) setComment("");
  }, [open, requestId]);

  const handleApprove = () => {
    if (!request) return;
    approve(
      { id: request.id, dto: comment.trim() ? { comment: comment.trim() } : {} },
      { onSuccess: onClose },
    );
  };

  const handleReject = () => {
    if (!request) return;
    reject(
      { id: request.id, dto: comment.trim() ? { comment: comment.trim() } : {} },
      { onSuccess: onClose },
    );
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      panelClassName="flex max-h-[90vh] flex-col"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-text-strong">
            퇴근 보정 승인 상세
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            신청된 퇴근 시각과 출근 기록을 확인합니다.
          </p>
        </div>
        {request && <ApprovalStatusBadge status={request.status} />}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading || !request ? (
          <SkeletonList />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow
                label="신청자"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    {formatUser(request.requester)}
                  </span>
                }
              />
              <DetailRow label="신청 시각" value={formatDateTime(request.createdAt)} />
              <DetailRow label="현장" value={siteName} />
              <DetailRow label="구역" value={zoneName} />
              <DetailRow
                label="출근 시각"
                value={formatDateTime(request.attendance?.checkInTime)}
              />
              <DetailRow
                label="요청 퇴근 시각"
                value={formatDateTime(request.requestedCheckOutTime)}
              />
            </div>

            <div className="rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground">신청 사유</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-strong">
                {request.reason || "-"}
              </p>
            </div>

            {request.processor && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-semibold text-text-strong">
                  처리자 {formatUser(request.processor)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  처리 시각 {formatDateTime(request.processedAt)}
                </p>
                {request.processorComment && (
                  <p className="mt-2 whitespace-pre-wrap text-text">
                    {request.processorComment}
                  </p>
                )}
              </div>
            )}

            {canProcess && (
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">
                  처리 메모
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="승인 또는 반려 사유를 입력합니다."
                />
              </label>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          닫기
        </Button>
        {canProcess && (
          <>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleReject}
            >
              <XCircle />
              반려
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
            >
              <CheckCircle2 />
              승인
            </Button>
          </>
        )}
      </div>
    </BaseModal>
  );
}

export function ApprovalsPage({
  initialTab = "leave",
}: {
  initialTab?: ApprovalTab;
}) {
  const [tab, setTab] = useState<ApprovalTab>(initialTab);
  const [status, setStatus] = useState<ApprovalStatusFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setPage(1);
    setDetailId(null);
  }, [tab, status, take]);

  const leaveParams = useMemo(
    () => ({
      page,
      take,
      includeSupervisedSites: true,
      ...(status === "all" ? {} : { status }),
    }),
    [page, status, take],
  );
  const manualParams = useMemo(
    () => (status === "all" ? {} : { status }),
    [status],
  );

  const isLeaveTab = tab === "leave";
  const leaveQuery = useLeaveRequestList(leaveParams, isLeaveTab);
  const manualQuery = useManualClockOutRequestList(manualParams, !isLeaveTab);

  const leaveRequests = leaveQuery.data?.data.leaveRequests ?? [];
  const leaveTotal = leaveQuery.data?.data.total ?? 0;
  const leaveTotalPages = Math.max(1, Math.ceil(leaveTotal / take));
  const manualRequests = manualQuery.data ?? [];
  const manualTotal = manualRequests.length;
  const manualPending = manualRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

  const activeTotal = isLeaveTab ? leaveTotal : manualTotal;
  const activePending = isLeaveTab
    ? status === "PENDING"
      ? leaveTotal
      : leaveRequests.filter((request) => request.status === "PENDING").length
    : manualPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-strong">
              승인 관리
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              휴가 신청과 퇴근 보정 신청을 조회하고 처리합니다.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => setTab("leave")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      isLeaveTab
                        ? "bg-surface text-text-strong shadow-sm"
                        : "text-muted-foreground hover:text-text-strong",
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    휴가 승인
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("manual-clock-out")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      !isLeaveTab
                        ? "bg-surface text-text-strong shadow-sm"
                        : "text-muted-foreground hover:text-text-strong",
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    퇴근 보정
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatBox label="조회 결과" value={activeTotal} />
                  <StatBox label="승인 대기" value={activePending} tone="pending" />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <SelectDropdown
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(value) => {
                    if (value) setStatus(value);
                  }}
                  align="left"
                  minWidth="180px"
                  className="w-full sm:w-48"
                />
                {isLeaveTab && (
                  <SelectDropdown
                    options={PAGE_SIZE_OPTIONS}
                    value={take}
                    onChange={(value) => {
                      if (value !== null) setTake(value);
                    }}
                    renderLabel={(selected) => `${selected?.value ?? take}개씩 보기`}
                    minWidth="120px"
                    className="w-full sm:w-36"
                  />
                )}
              </div>
            </div>
          </section>

          {isLeaveTab ? (
            <>
              {leaveQuery.isError && (
                <div className="flex items-center gap-3 rounded-lg border border-danger/40 bg-danger/20 px-4 py-3 text-danger-foreground">
                  <Inbox className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    휴가 신청 목록을 불러오는 중 오류가 발생했습니다.
                  </p>
                </div>
              )}

              {leaveQuery.isLoading ? (
                <SkeletonList />
              ) : leaveRequests.length === 0 ? (
                <EmptyState label="휴가 신청이" />
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <LeaveRequestCard
                      key={request.id}
                      request={request}
                      onOpen={setDetailId}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                  이전
                </Button>
                <span className="text-sm font-semibold text-text-strong">
                  {page} / {leaveTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= leaveTotalPages}
                  onClick={() =>
                    setPage((current) => Math.min(leaveTotalPages, current + 1))
                  }
                >
                  다음
                  <ChevronRight />
                </Button>
              </div>

              <LeaveApprovalDetailModal
                open={!!detailId}
                requestId={detailId}
                onClose={() => setDetailId(null)}
              />
            </>
          ) : (
            <>
              {manualQuery.isError && (
                <div className="flex items-center gap-3 rounded-lg border border-danger/40 bg-danger/20 px-4 py-3 text-danger-foreground">
                  <Inbox className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    퇴근 보정 신청 목록을 불러오는 중 오류가 발생했습니다.
                  </p>
                </div>
              )}

              {manualQuery.isLoading ? (
                <SkeletonList />
              ) : manualRequests.length === 0 ? (
                <EmptyState label="퇴근 보정 신청이" />
              ) : (
                <div className="space-y-3">
                  {manualRequests.map((request) => (
                    <ManualClockOutRequestCard
                      key={request.id}
                      request={request}
                      onOpen={setDetailId}
                    />
                  ))}
                </div>
              )}

              <ManualClockOutApprovalDetailModal
                open={!!detailId}
                requestId={detailId}
                onClose={() => setDetailId(null)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

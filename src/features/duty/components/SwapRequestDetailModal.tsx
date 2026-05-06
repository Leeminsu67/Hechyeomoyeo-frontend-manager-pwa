"use client";

import { CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { cn } from "@/lib/utils";
import {
  useApproveSwapRequest,
  useRejectSwapRequest,
  useSwapRequest,
} from "../hooks/useSwapRequests";
import { SCHEDULE_STATUS_META } from "@/types/schedule";
import { SwapRequestStatusBadge } from "./SwapRequestStatusBadge";
import type { SwapRequestItem, SwapRequestSchedule } from "@/types/swapRequest";

function formatDate(date: string) {
  return date ? date.slice(0, 10) : "-";
}

function ScheduleBox({
  title,
  name,
  loginId,
  schedule,
}: {
  title: string;
  name: string;
  loginId: string;
  schedule: SwapRequestSchedule;
}) {
  const scheduleMeta = SCHEDULE_STATUS_META[schedule.status];

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", scheduleMeta.colorClass)}>
          {scheduleMeta.label}
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-text-strong">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{loginId}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-muted-foreground">근무일</p>
          <p className="font-semibold text-text-strong mt-0.5">
            {formatDate(schedule.scheduleDate)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-muted-foreground">구역</p>
          <p className="font-semibold text-text-strong mt-0.5">
            {schedule.zone.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate">{schedule.site.name}</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-5 space-y-3">
      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="h-44 bg-muted rounded-xl animate-pulse" />
        <div className="h-44 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export function SwapRequestDetailModal({
  open,
  requestId,
  siteId,
  onClose,
}: {
  open: boolean;
  requestId: string | null;
  siteId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useSwapRequest(open ? requestId : null);
  const { mutate: approve, isPending: approving } = useApproveSwapRequest(siteId);
  const { mutate: reject, isPending: rejecting } = useRejectSwapRequest(siteId);
  const request = data as SwapRequestItem | undefined;
  const canReview = request?.status === "target_accepted";
  const isPending = approving || rejecting;

  const handleApprove = () => {
    if (!request) return;
    approve(request.id, { onSuccess: onClose });
  };

  const handleReject = () => {
    if (!request) return;
    reject(request.id, { onSuccess: onClose });
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      panelClassName="flex flex-col max-h-[90vh]"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-text-strong">교환 요청 상세</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            요청된 두 스케줄과 처리 상태를 확인합니다
          </p>
        </div>
        {request && <SwapRequestStatusBadge status={request.status} />}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading || !request ? (
          <Skeleton />
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                요청 {new Date(request.createdAt).toLocaleString("ko-KR")}
              </span>
              {request.reviewedBy && (
                <span>
                  처리자 {request.reviewedBy.name} ({request.reviewedBy.loginId})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ScheduleBox
                title="첫 번째 스케줄"
                name={request.requester.name}
                loginId={request.requester.loginId}
                schedule={request.requesterSchedule}
              />
              <ScheduleBox
                title="두 번째 스케줄"
                name={request.targetUser.name}
                loginId={request.targetUser.loginId}
                schedule={request.targetSchedule}
              />
            </div>

            {!canReview && (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                승인/반려는 대상자가 수락한 요청만 가능합니다.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
        >
          닫기
        </button>
        {canReview && (
          <>
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-danger/40 bg-danger/15 text-danger-foreground text-sm font-semibold hover:bg-danger/25 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              반려
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-300 transition-colors shadow-field disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              승인
            </button>
          </>
        )}
      </div>
    </BaseModal>
  );
}

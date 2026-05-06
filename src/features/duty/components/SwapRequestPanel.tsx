"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  PlusCircle,
} from "lucide-react";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { cn } from "@/lib/utils";
import { useSwapRequestList } from "../hooks/useSwapRequests";
import { DirectSwapModal } from "./DirectSwapModal";
import { SwapRequestDetailModal } from "./SwapRequestDetailModal";
import {
  SWAP_REQUEST_STATUS_META,
  SwapRequestStatusBadge,
} from "./SwapRequestStatusBadge";
import type { CalendarScheduleItem } from "@/types/schedule";
import type { SwapRequestItem, SwapRequestStatus } from "@/types/swapRequest";

const PAGE_SIZE_OPTIONS = [5, 10, 30, 50, 100].map((value) => ({
  value,
  label: `${value}개`,
}));

const STATUS_OPTIONS: Array<{ value: "all" | SwapRequestStatus; label: string }> = [
  { value: "all", label: "전체 상태" },
  { value: "pending", label: SWAP_REQUEST_STATUS_META.pending.label },
  { value: "target_accepted", label: SWAP_REQUEST_STATUS_META.target_accepted.label },
  { value: "approved", label: SWAP_REQUEST_STATUS_META.approved.label },
  { value: "rejected", label: SWAP_REQUEST_STATUS_META.rejected.label },
  { value: "cancelled", label: SWAP_REQUEST_STATUS_META.cancelled.label },
];

function toMonthRange(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
  return { startDate, endDate };
}

function formatDate(date: string) {
  return date ? date.slice(0, 10) : "-";
}

function SwapRequestCard({
  request,
  onOpen,
}: {
  request: SwapRequestItem;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(request.id)}
      className="w-full text-left bg-surface border border-border rounded-2xl px-4 py-3.5 shadow-card hover:shadow-card-hover hover:border-primary/35 transition-all"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary-foreground shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-strong truncate">
              {request.requester.name}
              <span className="mx-1.5 text-muted-foreground font-medium">↔</span>
              {request.targetUser.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              요청 {new Date(request.createdAt).toLocaleString("ko-KR")}
            </p>
          </div>
        </div>
        <SwapRequestStatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
        <div className="rounded-xl bg-muted/50 px-3 py-2 border border-border/60">
          <p className="text-[11px] font-medium text-muted-foreground">첫 번째</p>
          <p className="text-xs font-semibold text-text-strong mt-0.5">
            {formatDate(request.requesterSchedule.scheduleDate)} · {request.requesterSchedule.zone.name}
          </p>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2 border border-border/60">
          <p className="text-[11px] font-medium text-muted-foreground">두 번째</p>
          <p className="text-xs font-semibold text-text-strong mt-0.5">
            {formatDate(request.targetSchedule.scheduleDate)} · {request.targetSchedule.zone.name}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 text-xs text-muted-foreground">
        <span className="truncate">{request.requesterSchedule.site.name}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary-foreground">
          <Eye className="w-3.5 h-3.5" />
          상세
        </span>
      </div>
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-36 bg-muted rounded-2xl border border-border animate-pulse"
        />
      ))}
    </div>
  );
}

export function SwapRequestPanel({
  siteId,
  year,
  month,
  schedules,
}: {
  siteId: string;
  year: number;
  month: number;
  schedules: CalendarScheduleItem[];
}) {
  const initialRange = useMemo(() => toMonthRange(year, month), [year, month]);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [status, setStatus] = useState<"all" | SwapRequestStatus>("target_accepted");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [directOpen, setDirectOpen] = useState(false);

  useEffect(() => {
    setStartDate(initialRange.startDate);
    setEndDate(initialRange.endDate);
    setPage(1);
  }, [initialRange.endDate, initialRange.startDate]);

  const params = useMemo(
    () => ({
      page,
      take,
      ...(status === "all" ? {} : { status }),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
    [endDate, page, startDate, status, take],
  );

  const { data, isLoading, isError } = useSwapRequestList(siteId, params);
  const requests = data?.data.swapRequests ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / take));
  const approvalWaitCount = requests.filter(
    (request) => request.status === "target_accepted",
  ).length;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-strong">교환 요청</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              선택한 현장의 당직 교환 요청을 조회하고 승인합니다
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDirectOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-300 transition-colors shadow-field"
          >
            <PlusCircle className="w-4 h-4" />
            직접 교환
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium">조회 결과</p>
            <p className="text-xl font-bold text-text-strong mt-0.5">{total}</p>
          </div>
          <div className="rounded-xl border border-border bg-primary/10 px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium">현재 페이지 승인 대기</p>
            <p className="text-xl font-bold text-primary-foreground mt-0.5">
              {approvalWaitCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium">기간</p>
            <p className="text-sm font-bold text-text-strong mt-1">
              {startDate} ~ {endDate}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <SelectDropdown
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              if (value) setStatus(value);
              setPage(1);
            }}
            align="left"
            minWidth="180px"
            className="w-full lg:w-48"
          />
          <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
            <label className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-40 pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </label>
            <label className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-40 pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </label>
            <SelectDropdown
              options={PAGE_SIZE_OPTIONS}
              value={take}
              onChange={(value) => {
                if (value !== null) {
                  setTake(value);
                  setPage(1);
                }
              }}
              renderLabel={(selected) => `${selected?.value ?? take}개씩 보기`}
              minWidth="120px"
              className="w-full sm:w-36"
            />
          </div>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40">
          <Inbox className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            교환 요청을 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      )}

      {isLoading ? (
        <SkeletonList />
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-surface border border-border rounded-2xl shadow-card">
          <Inbox className="w-10 h-10 text-muted-foreground/35" />
          <div>
            <p className="text-sm font-semibold text-text-strong">
              조회된 교환 요청이 없습니다.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              필터 조건을 변경하거나 직접 교환을 등록해보세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <SwapRequestCard
              key={request.id}
              request={request}
              onOpen={setDetailId}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className={cn(
              "p-2 rounded-xl border border-border bg-surface text-muted-foreground hover:text-text hover:bg-muted transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className={cn(
              "p-2 rounded-xl border border-border bg-surface text-muted-foreground hover:text-text hover:bg-muted transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <SwapRequestDetailModal
        open={!!detailId}
        requestId={detailId}
        siteId={siteId}
        onClose={() => setDetailId(null)}
      />
      <DirectSwapModal
        open={directOpen}
        onClose={() => setDirectOpen(false)}
        siteId={siteId}
        schedules={schedules}
      />
    </div>
  );
}

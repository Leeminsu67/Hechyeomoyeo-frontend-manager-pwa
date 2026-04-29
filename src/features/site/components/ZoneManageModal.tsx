"use client";

import { useState, useCallback, useRef } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import {
  X,
  PlusCircle,
  Trash2,
  Search,
  MapPin,
  Moon,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  AlertCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useZoneList, useDeleteZone } from "../hooks/useZones";
import { ZoneDetailModal } from "./ZoneDetailModal";
import type { SiteItem } from "@/types/site";
import type { ZoneItem, ZoneTake } from "@/types/zone";

// ─── Constants ────────────────────────────────────────────────────────────────

/** 백엔드 @IsIn([5, 10, 30, 50, 100]) 제약 */
const PAGE_SIZE: ZoneTake = 10;

// ─── Accent Colors (sortOrder 기반 순환) ──────────────────────────────────────

const ZONE_ACCENTS = [
  "bg-primary/20 text-primary-foreground border-primary/30",
  "bg-secondary/30 text-secondary-foreground border-secondary/40",
  "bg-success/25 text-success-foreground border-success/35",
  "bg-danger/20 text-danger-foreground border-danger/30",
];

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <LayoutGrid className="w-6 h-6 opacity-30" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-text">
          {hasSearch ? "검색 결과가 없습니다" : "등록된 구역이 없습니다"}
        </p>
        <p className="text-sm mt-1">
          {hasSearch
            ? "다른 구역명으로 검색해보세요"
            : "상단 [구역 추가] 버튼으로 첫 구역을 등록하세요"}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="w-8 h-8 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-text" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={cn(
                "min-w-[30px] h-7 px-2 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground shadow-field"
                  : "text-text hover:bg-muted"
              )}
            >
              {p}
            </button>
          )
        )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-text" />
      </button>
    </div>
  );
}

// ─── Zone Card ────────────────────────────────────────────────────────────────

function ZoneCard({
  zone,
  canManage,
  onRowClick,
  onEdit,
  onDelete,
}: {
  zone: ZoneItem;
  canManage: boolean;
  onRowClick: (zone: ZoneItem) => void;
  onEdit?: (zone: ZoneItem) => void;
  onDelete: (zone: ZoneItem) => void;
}) {
  const accentClass = ZONE_ACCENTS[(zone.sortOrder - 1) % ZONE_ACCENTS.length];
  const hasLocation =
    typeof zone.latitude === "number" && typeof zone.longitude === "number";
  const formatTime = (t: string | null) => (t ? t.slice(0, 5) : "--:--");

  return (
    <div
      onClick={() => onRowClick(zone)}
      className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-card transition-all cursor-pointer"
    >
      {/* Sort Order Badge */}
      <span
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border shrink-0",
          accentClass
        )}
      >
        {zone.sortOrder}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-text-strong truncate">{zone.name}</p>
          {zone.isOvernight && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary/25 text-secondary-foreground border border-secondary/40 rounded-full text-[10px] font-bold">
              <Moon className="w-2.5 h-2.5" />
              야간
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 shrink-0" />
            {formatTime(zone.workStartTime)}
            <span className="mx-0.5">~</span>
            {formatTime(zone.workEndTime)}
            {zone.isOvernight && (
              <span className="text-[10px] text-secondary-foreground ml-0.5">(익일)</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3 shrink-0" />
            {zone.requiredWorkers ?? 1}명
          </span>
          {hasLocation ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              위치 설정됨
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              위치 미설정
            </span>
          )}
        </div>
      </div>

      {/* 삭제 버튼 — stopPropagation으로 카드 클릭과 분리 */}
      {canManage && (
        <div
          className="flex items-center shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onDelete(zone)}
            title="구역 삭제"
            className="p-2 rounded-lg hover:bg-danger/20 transition-colors text-muted-foreground hover:text-danger-foreground opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  zone,
  onConfirm,
  onCancel,
  isLoading,
}: {
  zone: ZoneItem;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 animate-slide-up">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-danger-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-strong">
            <span className="text-danger-foreground">&quot;{zone.name}&quot;</span> 구역을 삭제할까요?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            삭제된 구역은 복구할 수 없습니다.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-danger text-danger-foreground rounded-lg hover:bg-danger/80 transition-colors font-semibold disabled:opacity-50"
        >
          {isLoading && (
            <span className="w-3 h-3 border-2 border-danger-foreground/30 border-t-danger-foreground rounded-full animate-spin" />
          )}
          삭제
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ZoneManageModalProps {
  open: boolean;
  onClose: () => void;
  site: SiteItem;
  canManage: boolean;
  onAddZone: () => void;
  onEditZone: (zone: ZoneItem) => void;
}

export function ZoneManageModal({
  open,
  onClose,
  site,
  canManage,
  onAddZone,
  onEditZone,
}: ZoneManageModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ZoneItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<ZoneItem | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const { data, isLoading, isError } = useZoneList(site.id, {
    page,
    take: PAGE_SIZE,
    name: debouncedSearch || undefined,
  });
  const { mutate: deleteZone, isPending: deleting } = useDeleteZone(site.id);

  const zones = data?.data?.zones ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteZone(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  // 상세 모달에서 수정 클릭 시 상세 모달 닫고 수정 폼 오픈
  const handleEditFromDetail = (zone: ZoneItem) => {
    setDetailTarget(null);
    onEditZone(zone);
  };

  return (
    <>
      <BaseModal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="flex flex-col max-h-[90vh]">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 shrink-0">
                <LayoutGrid className="w-[18px] h-[18px] text-primary-foreground" />
              </span>
              <div>
                <h2 className="text-base font-bold text-text-strong">현장 구역 관리</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                  {site.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={onAddZone}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-xs hover:bg-primary-300 transition-colors shadow-field whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  구역 추가
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="px-6 py-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="구역명으로 검색..."
                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm text-text placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {isError && (
              <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-medium">구역 목록을 불러오는 중 오류가 발생했습니다.</p>
              </div>
            )}

            {deleteTarget && (
              <div className="mb-3">
                <DeleteConfirm
                  zone={deleteTarget}
                  onConfirm={handleDelete}
                  onCancel={() => setDeleteTarget(null)}
                  isLoading={deleting}
                />
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : zones.length === 0 ? (
              <EmptyState hasSearch={!!debouncedSearch} />
            ) : (
              <div className="space-y-2.5">
                {zones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    canManage={canManage}
                    onRowClick={setDetailTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}

            {!isLoading && zones.length > 0 && (
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20 rounded-b-2xl shrink-0">
            <p className="text-xs text-muted-foreground">
              전체 <span className="font-semibold text-text">{total}</span>개 구역
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
            >
              닫기
            </button>
          </div>
      </BaseModal>

      {/* 구역 상세 모달 — z-[70]으로 목록 모달 위에 렌더링 */}
      {detailTarget && (
        <ZoneDetailModal
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          zone={detailTarget}
          site={site}
          canManage={canManage}
          onEdit={handleEditFromDetail}
        />
      )}
    </>
  );
}

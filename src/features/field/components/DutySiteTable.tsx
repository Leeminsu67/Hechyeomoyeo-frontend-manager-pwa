"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeleteSite } from "@/features/site/hooks/useSites";
import type { SiteItem, SiteStatus } from "@/types/site";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<SiteStatus, { label: string; bg: string; dot: string }> = {
  planned: { label: "예정",    bg: "#FFD8A8", dot: "#F59F00" },
  active:  { label: "운영 중", bg: "#B2F2BB", dot: "#2F9E44" },
  closed:  { label: "종료",    bg: "#DEE2E6", dot: "#868E96" },
};

function StatusBadge({ status }: { status: SiteStatus }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.planned;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{
        backgroundColor: s.bg + "66",
        borderColor: s.bg,
        color: "#333",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

function formatCreatedDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Clock className="w-7 h-7 opacity-30" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-text">
          {hasSearch ? "검색 결과가 없습니다" : "등록된 당직 현장이 없습니다"}
        </p>
        <p className="text-sm mt-1">
          {hasSearch
            ? "다른 검색어를 입력해보세요"
            : "상단 [현장 등록] 버튼으로 새 당직 현장을 추가하세요"}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          <td className="px-4 py-3.5">
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-muted rounded-full animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3.5 hidden sm:table-cell">
            <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
          </td>
          <td className="px-4 py-3.5 hidden sm:table-cell">
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
          </td>
          <td className="px-4 py-3.5 hidden md:table-cell">
            <div className="h-7 w-28 bg-muted rounded-lg animate-pulse" />
          </td>
          <td className="px-4 py-3.5">
            <div className="flex gap-2 justify-end">
              <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
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
  const range = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );
  const pagesWithEllipsis: (number | "...")[] = [];
  let prev = 0;
  for (const p of range) {
    if (prev && p - prev > 1) pagesWithEllipsis.push("...");
    pagesWithEllipsis.push(p);
    prev = p;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-text" />
      </button>
      {pagesWithEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={cn(
              "min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors",
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

// ─── Main Component ───────────────────────────────────────────────────────────

interface DutySiteTableProps {
  data: SiteItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  canManage: boolean;
  onRowClick: (site: SiteItem) => void;
  onEdit: (site: SiteItem) => void;
  onZoneSettings: (site: SiteItem) => void;
  onPageChange: (p: number) => void;
  hasSearch: boolean;
}

export function DutySiteTable({
  data,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  canManage,
  onRowClick,
  onEdit,
  onZoneSettings,
  onPageChange,
  hasSearch,
}: DutySiteTableProps) {
  const { mutate: deleteSite, isPending: deleting } = useDeleteSite();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteSite(id, { onSuccess: () => setDeleteConfirm(null) });
  };

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">
                생성일
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                현장명
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                사업 타입
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                운영 상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                구역 설정
              </th>
              {canManage && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  관리
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5}>
                  <EmptyState hasSearch={hasSearch} />
                </td>
              </tr>
            ) : (
              data.map((site) => (
                <tr
                  key={site.id}
                  onClick={() => {
                    if (deleteConfirm !== site.id) onRowClick(site);
                  }}
                  className={cn(
                    "border-b border-border/60 transition-colors group",
                    deleteConfirm === site.id
                      ? "bg-danger/5"
                      : "hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  {/* Created At */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {formatCreatedDate(site.createdAt)}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0 transition-all group-hover:h-12"
                        style={{
                          backgroundColor: site.siteType?.color ?? "#DEE2E6",
                        }}
                      />
                      <div>
                        <p className="font-semibold text-text-strong group-hover:text-primary-foreground transition-colors">
                          {site.name}
                        </p>
                        <div className="sm:hidden flex flex-wrap items-center gap-1 mt-1">
                          {(() => {
                            const s = STATUS_MAP[site.status] ?? STATUS_MAP.planned;
                            return (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                                style={{
                                  backgroundColor: s.bg + "66",
                                  borderColor: s.bg,
                                  color: "#333",
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                                {s.label}
                              </span>
                            );
                          })()}
                          {site.siteType && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{
                                backgroundColor: site.siteType.color + "33",
                                borderColor: site.siteType.color + "88",
                                color: "#333",
                              }}
                            >
                              {site.siteType.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Site Type Badge */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {site.siteType ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: site.siteType.color + "33",
                          borderColor: site.siteType.color + "88",
                          color: "#333",
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: site.siteType.color }}
                        />
                        {site.siteType.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground border border-dashed border-border">
                        <Tag className="w-3 h-3" />
                        미설정
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <StatusBadge status={site.status} />
                  </td>

                  {/* 현장 구역 설정 */}
                  <td
                    className="px-4 py-3.5 hidden md:table-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onZoneSettings(site)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-secondary/30 hover:text-secondary-foreground border border-border hover:border-secondary/40 rounded-lg text-xs font-semibold text-text transition-all whitespace-nowrap"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      현장 구역 설정
                    </button>
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {deleteConfirm === site.id ? (
                          <div className="flex items-center gap-2 animate-slide-up">
                            <span className="text-xs text-danger-foreground whitespace-nowrap">
                              삭제할까요?
                            </span>
                            <button
                              onClick={() => handleDelete(site.id)}
                              disabled={deleting}
                              className="px-2.5 py-1 text-xs bg-danger text-danger-foreground rounded-lg hover:bg-danger/70 transition-colors font-semibold"
                            >
                              {deleting ? "…" : "삭제"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(site);
                              }}
                              title="현장 수정"
                              aria-label={`${site.name} 현장 수정`}
                              className="p-1.5 rounded-lg hover:bg-primary/15 transition-colors text-primary-foreground"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(site.id);
                              }}
                              title="현장 삭제"
                              aria-label={`${site.name} 현장 삭제`}
                              className="p-1.5 rounded-lg hover:bg-danger/20 transition-colors text-danger-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            전체 <span className="font-semibold text-text">{total}</span>개 중{" "}
            {startIdx}–{endIdx}번째
            <span className="ml-2 text-muted-foreground/70">· 행을 클릭하면 상세 정보를 볼 수 있습니다</span>
          </p>
          <Pagination page={page} totalPages={totalPages} onPage={onPageChange} />
        </div>
      )}
    </div>
  );
}

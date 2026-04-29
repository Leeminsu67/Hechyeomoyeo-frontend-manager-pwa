"use client";

import {
  X,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  Moon,
  AlignLeft,
  CalendarDays,
  AlertCircle,
  LayoutGrid,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseModal } from "@/components/shared/BaseModal";
import { KakaoMapViewer } from "@/features/field/components/KakaoMapViewer";
import { useZone, useDeleteZone } from "../hooks/useZones";
import { useState } from "react";
import type { ZoneItem } from "@/types/zone";
import type { SiteItem } from "@/types/site";

// ─── 요일 레이블 ──────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-text-strong">{children}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="h-4 w-1/2 bg-muted rounded" />
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-4 w-2/3 bg-muted rounded" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ZoneDetailModalProps {
  open: boolean;
  onClose: () => void;
  zone: ZoneItem;         // 목록에서 넘어온 기본 데이터 (즉시 표시용)
  site: SiteItem;
  canManage: boolean;
  onEdit: (zone: ZoneItem) => void;
}

export function ZoneDetailModal({
  open,
  onClose,
  zone,
  site,
  canManage,
  onEdit,
}: ZoneDetailModalProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // 개별 조회 — description·repeatWeekdays 등 목록에 없는 필드 포함
  const { data, isLoading } = useZone(site.id, zone.id);
  const detail: ZoneItem = data?.data?.zone ?? zone;

  const { mutate: deleteZone, isPending: deleting } = useDeleteZone(site.id);

  const handleDelete = () => {
    deleteZone(zone.id, { onSuccess: onClose });
  };

  const formatTime = (t: string | null) => (t ? t.slice(0, 5) : "—");
  const hasLocation =
    typeof detail.latitude === "number" && typeof detail.longitude === "number";

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="flex flex-col max-h-[90vh]" zIndex="z-[70]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 shrink-0">
              <LayoutGrid className="w-[18px] h-[18px] text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-strong leading-tight">
                구역 상세 정보
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                {site.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* 구역명 + sortOrder 배지 */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-muted/40 rounded-xl border border-border/50">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 text-sm font-bold text-primary-foreground shrink-0">
              {detail.sortOrder}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-text-strong truncate">
                {detail.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {site.name}
              </p>
            </div>
            {detail.isOvernight && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/25 text-secondary-foreground border border-secondary/40 rounded-full text-xs font-bold shrink-0">
                <Moon className="w-3 h-3" />
                야간
              </span>
            )}
          </div>

          {isLoading ? (
            <DetailSkeleton />
          ) : (
            <div className="divide-y divide-border/40">

              {/* 설명 */}
              <InfoRow icon={AlignLeft} label="구역 설명">
                {detail.description ? (
                  <span className="font-normal text-text leading-relaxed whitespace-pre-wrap">
                    {detail.description}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-normal">없음</span>
                )}
              </InfoRow>

              {/* 근무 시간 */}
              <InfoRow icon={Clock} label="근무 시간">
                <span className="font-mono">
                  {formatTime(detail.workStartTime)}
                  <span className="mx-1.5 font-sans text-muted-foreground">~</span>
                  {formatTime(detail.workEndTime)}
                </span>
                {detail.isOvernight && (
                  <span className="ml-2 text-xs text-secondary-foreground font-normal">
                    (익일 종료)
                  </span>
                )}
              </InfoRow>

              {/* 하루 필요 인원 */}
              <InfoRow icon={Users} label="하루 필요 인원">
                <span className="font-semibold">
                  {detail.requiredWorkers ?? 1}명
                </span>
              </InfoRow>

              {/* 반복 요일 */}
              <InfoRow icon={CalendarDays} label="운영 요일">
                {detail.repeatWeekdays === null || detail.repeatWeekdays.length === 7 ? (
                  <span className="text-xs font-semibold text-primary-foreground bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-full">
                    매일 운영
                  </span>
                ) : (
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {WEEKDAY_LABELS.map((label, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border",
                          detail.repeatWeekdays!.includes(idx)
                            ? "bg-primary/20 text-primary-foreground border-primary/30"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </InfoRow>

            </div>
          )}

          {/* 위치 지도 */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              구역 위치
            </p>
            {isLoading ? (
              <div className="h-52 bg-muted rounded-xl animate-pulse" />
            ) : hasLocation ? (
              <KakaoMapViewer
                lat={detail.latitude!}
                lng={detail.longitude!}
                className="h-52"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-3 border border-dashed border-border/60 rounded-xl bg-muted/20">
                <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <p className="text-xs text-muted-foreground">위치 정보가 없습니다</p>
              </div>
            )}
          </div>

          {/* 삭제 확인 */}
          {deleteConfirm && (
            <div className="mt-4 p-4 rounded-xl border border-danger/40 bg-danger/10 animate-slide-up">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-strong">
                    <span className="text-danger-foreground">&quot;{detail.name}&quot;</span> 구역을 삭제할까요?
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    삭제된 구역은 복구할 수 없습니다.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-danger text-danger-foreground rounded-lg hover:bg-danger/80 transition-colors font-semibold disabled:opacity-50"
                >
                  {deleting && (
                    <span className="w-3 h-3 border-2 border-danger-foreground/30 border-t-danger-foreground rounded-full animate-spin" />
                  )}
                  삭제 확인
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
          >
            닫기
          </button>
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirm(true)}
                disabled={deleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-danger-foreground border border-danger/40 bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
              <button
                onClick={() => onEdit(detail)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors shadow-field"
              >
                <Pencil className="w-4 h-4" />
                수정
              </button>
            </div>
          )}
        </div>
    </BaseModal>
  );
}

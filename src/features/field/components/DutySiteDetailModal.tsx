"use client";

import {
  X,
  Pencil,
  MapPin,
  Tag,
  Calendar,
  Hash,
  Activity,
  Users,
  UserCheck,
  Navigation,
  LayoutGrid,
} from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { cn } from "@/lib/utils";
import { useSite } from "@/features/site/hooks/useSites";
import { KakaoMapViewer } from "./KakaoMapViewer";
import { ROLE_META } from "@/types/user";
import type { SiteAssignmentType, SiteItem, SiteStatus, SiteUser } from "@/types/site";
import type { RoleValue } from "@/types/user";

type SiteAssignmentDisplayUser = SiteUser & {
  assignmentType?: SiteAssignmentType;
};

// ─── Status Map ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<SiteStatus, { label: string; bg: string; border: string; dot: string }> = {
  planned: { label: "예정",    bg: "#FFD8A8", border: "#FFD8A8", dot: "#F59F00" },
  active:  { label: "운영 중", bg: "#B2F2BB", border: "#B2F2BB", dot: "#2F9E44" },
  closed:  { label: "종료",    bg: "#DEE2E6", border: "#DEE2E6", dot: "#868E96" },
};

// ─── Role Style Helper ─────────────────────────────────────────────────────

function getRoleStyle(role: number) {
  const meta = ROLE_META[role as RoleValue];
  const color = meta?.color ?? "success";
  const avatarClass =
    color === "primary"
      ? "bg-primary/25 text-primary-foreground"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground"
      : "bg-success/30 text-success-foreground";
  const badgeClass =
    color === "primary"
      ? "bg-primary/20 text-primary-foreground border border-primary/30"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground border border-secondary/40"
      : "bg-success/30 text-success-foreground border border-success/40";
  return { avatarClass, badgeClass, label: meta?.label ?? "인력" };
}

const ASSIGNMENT_TYPE_META: Record<
  SiteAssignmentType,
  { label: string; className: string }
> = {
  siteSupervisor: {
    label: "총괄",
    className: "bg-primary/15 text-primary-foreground border-primary/30",
  },
  regularWorker: {
    label: "일반",
    className: "bg-success/20 text-success-foreground border-success/40",
  },
  substituteWorker: {
    label: "대체",
    className: "bg-secondary/30 text-secondary-foreground border-secondary/40",
  },
};

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

// ─── User Row (read-only) ─────────────────────────────────────────────────────

function UserRow({ user }: { user: SiteAssignmentDisplayUser }) {
  const { badgeClass, label } = getRoleStyle(user.role);
  return (
    <li className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-border/70">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text-strong truncate leading-tight">{user.name}</p>
      </div>
      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", badgeClass)}>
        {label}
      </span>
      {user.assignmentType && (
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0", ASSIGNMENT_TYPE_META[user.assignmentType].className)}>
          {ASSIGNMENT_TYPE_META[user.assignmentType].label}
        </span>
      )}
    </li>
  );
}

// ─── User Skeleton ────────────────────────────────────────────────────────────

function UserSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-border/70">
      <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-20 bg-muted rounded animate-pulse" />
        <div className="h-2 w-14 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-4 w-10 bg-muted rounded-full animate-pulse shrink-0" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DutySiteDetailModalProps {
  site: SiteItem | null;
  onClose: () => void;
  onEdit: (site: SiteItem) => void;
  onZoneSettings: (site: SiteItem) => void;
  canManage: boolean;
}

export function DutySiteDetailModal({
  site,
  onClose,
  onEdit,
  onZoneSettings,
  canManage,
}: DutySiteDetailModalProps) {
  // GET /site/:id includes siteType and minimal assigned users.
  const { data: detail, isLoading: detailLoading } = useSite(site?.id ?? "");

  if (!site) return null;

  const displaySite = detail ?? site;
  const assignmentUsers: SiteAssignmentDisplayUser[] =
    detail?.assignments?.reduce<SiteAssignmentDisplayUser[]>((acc, assignment) => {
      if (assignment.user) {
        acc.push({ ...assignment.user, assignmentType: assignment.type });
      }
      return acc;
    }, []) ?? [];
  const users: SiteAssignmentDisplayUser[] =
    assignmentUsers.length > 0 ? assignmentUsers : detail?.users ?? [];

  return (
    <BaseModal open={!!site} onClose={onClose} maxWidth="max-w-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ backgroundColor: (displaySite.siteType?.color ?? "#A5D8FF") + "33" }}
            >
              <MapPin className="w-5 h-5" style={{ color: displaySite.siteType?.color ?? "#1C4E6E" }} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-strong leading-tight">현장 상세 정보</h2>
              <p className="text-xs text-muted-foreground mt-0.5">당직 현장</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body: 2-column (tablet 이하에서 세로 스택) ── */}
        <div className="flex flex-col md:flex-row min-h-0 max-h-[70vh] overflow-y-auto md:overflow-hidden">

          {/* ── 왼쪽: 현장 정보 ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 px-6 py-5 md:overflow-y-auto">

            {/* 색상 바 + 이름 */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/40 rounded-xl border border-border/50">
              <div
                className="w-1.5 h-12 rounded-full shrink-0"
                style={{ backgroundColor: displaySite.siteType?.color ?? "#DEE2E6" }}
              />
              <div>
                <p className="text-lg font-bold text-text-strong leading-tight">{displaySite.name}</p>
                {displaySite.siteType && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 border"
                    style={{
                      backgroundColor: displaySite.siteType.color + "33",
                      borderColor: displaySite.siteType.color + "88",
                      color: "#333",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: displaySite.siteType.color }} />
                    {displaySite.siteType.name}
                  </span>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="divide-y divide-border/40">
              <InfoRow icon={Hash} label="현장 코드">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                  #{displaySite.displayCode.toString().padStart(4, "0")}
                </span>
              </InfoRow>

              <InfoRow icon={Activity} label="운영 상태">
                {(() => {
                  const s = STATUS_MAP[displaySite.status] ?? STATUS_MAP.planned;
                  return (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                      style={{ backgroundColor: s.bg + "55", borderColor: s.border, color: "#333" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                      {s.label}
                    </span>
                  );
                })()}
              </InfoRow>

              <InfoRow icon={Calendar} label="운영 기간">
                <span className="text-sm font-medium text-text">
                  {displaySite.operationStartDate?.slice(0, 10) ?? "—"}
                  {" ~ "}
                  {displaySite.operationEndDate?.slice(0, 10) ?? "—"}
                </span>
              </InfoRow>

              <InfoRow icon={Tag} label="사업 타입">
                {displaySite.siteType ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: displaySite.siteType.color + "33",
                      borderColor: displaySite.siteType.color + "88",
                      color: "#333",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: displaySite.siteType.color }} />
                    {displaySite.siteType.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground font-normal">미설정</span>
                )}
              </InfoRow>


            </div>

            {/* 현장 위치 */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                현장 위치
              </p>
              {displaySite.latitude && displaySite.longitude ? (
                <KakaoMapViewer
                  lat={displaySite.latitude}
                  lng={displaySite.longitude}
                  className="h-52"
                />
              ) : (
                <div className="flex items-center gap-2 px-3 py-3 border border-dashed border-border/60 rounded-xl bg-muted/20">
                  <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <p className="text-xs text-muted-foreground">위치 정보가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* ── 구분선 (모바일: 가로선 / 데스크탑: 세로선) ─────────────── */}
          <div className="h-px md:h-auto md:w-px bg-border shrink-0" />

          {/* ── 오른쪽 (모바일에서는 아래): 투입 인원 ───────────────────── */}
          <div className="w-full md:w-64 shrink-0 flex flex-col px-5 py-5 gap-3 md:overflow-hidden">

            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-text flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                현장 매칭
              </span>
              {!detailLoading && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/40 text-secondary-foreground border border-secondary/40">
                  {users.length}명
                </span>
              )}
            </div>

            {/* 인원 목록 */}
            {detailLoading ? (
              <div className="space-y-1.5">
                <UserSkeleton />
                <UserSkeleton />
                <UserSkeleton />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                <UserCheck className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground text-center">
                  배치된 인원이 없습니다
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5 md:overflow-y-auto md:flex-1 max-h-64 md:max-h-none">
                {users.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className={cn(
            "gap-3 px-6 py-4 border-t border-border",
            canManage
              ? "grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] sm:flex sm:items-center sm:justify-between"
              : "flex items-center justify-between"
          )}
        >
          <button
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl border border-border px-4 text-sm font-medium text-text transition-colors hover:bg-muted"
          >
            닫기
          </button>
          <div
            className={cn(
              "flex items-center gap-2",
              canManage && "contents sm:flex"
            )}
          >
            <button
              onClick={() => onZoneSettings(displaySite)}
              className="inline-flex h-12 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-secondary/80 px-3 text-sm font-semibold text-secondary-foreground shadow-field transition-colors hover:bg-secondary sm:gap-2 sm:px-4"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">구역 설정</span>
              <span className="hidden sm:inline">현장 구역 설정</span>
            </button>
            {canManage && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(displaySite);
                }}
                className="inline-flex h-12 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-field transition-colors hover:bg-primary-300 sm:gap-2 sm:px-4"
              >
                <Pencil className="w-4 h-4 shrink-0" />
                수정하기
              </button>
            )}
          </div>
        </div>
    </BaseModal>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  CalendarDays,
  Trash2,
  Clock,
  FileText,
  Users,
  User,
  Loader2,
  Pencil,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { FieldWorkSchedule } from "@/types/field";
import { ROLE_META } from "@/types/user";
import { BaseModal } from "@/components/shared/BaseModal";
import {
  useFieldWorkSchedule,
  useDeleteFieldWorkSchedule,
} from "../hooks/useFieldWorkSchedules";
import { KakaoMapViewer } from "./KakaoMapViewer";
import type { DetailSchedule, DetailWorkLog } from "./CreateScheduleModal";

export type { DetailSchedule, DetailWorkLog };

// ─── 권한별 색상 헬퍼 ──────────────────────────────────────────────────────────

function getRoleStyle(role: number) {
  const meta = ROLE_META[role as keyof typeof ROLE_META];
  const color = meta?.color ?? "success";
  const avatarClass =
    color === "primary"
      ? "bg-primary/25 text-primary-foreground"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground"
      : "bg-success/30 text-success-foreground";
  const badgeClass =
    color === "primary"
      ? "bg-primary/20 text-primary-foreground"
      : color === "secondary"
      ? "bg-secondary/40 text-secondary-foreground"
      : "bg-success/30 text-success-foreground";
  return { avatarClass, badgeClass, label: meta?.label ?? "인력" };
}

// ─── 시간 포맷 헬퍼 ────────────────────────────────────────────────────────────

function formatTime(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatWorkDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

// ─── 유저 칩 ──────────────────────────────────────────────────────────────────

function UserChip({ user }: { user: { id: string; name: string; role?: number } }) {
  const { avatarClass, badgeClass, label } = getRoleStyle(user.role ?? 4);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface">
      <span className="text-sm text-text font-medium">{user.name}</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
        {label}
      </span>
    </div>
  );
}

// ─── 섹션 레이블 ──────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="p-1.5 bg-primary/15 rounded-lg text-primary-foreground">{icon}</span>
      <span className="text-sm font-semibold text-text">{label}</span>
    </div>
  );
}

// ─── 현장 기록 패널 (오른쪽 컬럼) ────────────────────────────────────────────

function WorkLogPanel({ workLogs }: { workLogs: DetailWorkLog[] }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 패널 헤더 */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="p-1.5 bg-secondary/30 rounded-lg">
          <FileText className="w-4 h-4 text-secondary-foreground" />
        </span>
        <span className="text-sm font-semibold text-text">현장 기록</span>
        <span className="text-xs text-muted-foreground/70 ml-0.5">({workLogs.length}건)</span>
      </div>

      {workLogs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8">
          <FileText className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground text-center">현장 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {workLogs.map((log, i) => (
            <div
              key={log.id}
              className="p-4 bg-surface border border-border rounded-xl space-y-3"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                현장 기록 #{i + 1}
              </p>

              {/* 작업 날짜 */}
              {(log.startedAt || log.endedAt) && (
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
                  <span className="text-xs font-medium text-text">
                    {formatWorkDate(log.startedAt ?? log.endedAt)}
                  </span>
                </div>
              )}

              {/* 시간 */}
              {(log.startedAt || log.endedAt) && (
                <div className="flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-secondary-foreground mt-0.5 shrink-0" />
                  <div className="text-xs text-text space-y-0.5">
                    {log.startedAt && (
                      <p>
                        <span className="text-muted-foreground">시작</span>{" "}
                        {formatTime(log.startedAt)}
                      </p>
                    )}
                    {log.endedAt && (
                      <p>
                        <span className="text-muted-foreground">종료</span>{" "}
                        {formatTime(log.endedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 설명 */}
              {log.description && (
                <div className="flex items-start gap-2.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-text leading-relaxed">{log.description}</p>
                </div>
              )}

              {/* 작성자 */}
              {log.user && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>작성자</span>
                  </div>
                  <UserChip user={log.user} />
                </div>
              )}

              {/* 참여자 */}
              {log.users && log.users.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>참여자 ({log.users.length}명)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {log.users.map((u) => (
                      <UserChip key={u.id} user={u} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 모달 ────────────────────────────────────────────────────────────────

interface ScheduleDetailModalProps {
  schedule: FieldWorkSchedule | null;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
  onEdit?: (detail: DetailSchedule) => void;
}

export function ScheduleDetailModal({
  schedule,
  open,
  onClose,
  canManage,
  onEdit,
}: ScheduleDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteSchedule, isPending: deleting } = useDeleteFieldWorkSchedule();

  useEffect(() => {
    if (!open) setShowDeleteConfirm(false);
  }, [open]);

  // 상세 조회 — findByMonth 목록의 id 그대로 사용
  const { data: detailData, isLoading } = useFieldWorkSchedule(
    open && schedule ? schedule.id : null
  );
  const detail: DetailSchedule | null = detailData?.data?.schedule ?? null;

  const handleDelete = () => {
    if (!schedule) return;
    deleteSchedule(schedule.id, {
      onSuccess: () => {
        onClose();
        toast.success("스케줄이 삭제되었습니다.");
      },
    });
  };

  const handleEdit = () => {
    if (!detail || !onEdit) return;
    onEdit(detail);
    onClose();
  };

  if (!schedule) return null;

  const typeColor = detail?.fieldSite.fieldSiteType?.color;
  const startLabel = new Date(schedule.startDate + "T00:00:00").toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const endLabel = schedule.endDate
    ? new Date(schedule.endDate + "T00:00:00").toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : null;
  const dateLabel = endLabel ? `${startLabel} ~ ${endLabel}` : startLabel;

  return (
    <BaseModal open={open && !!schedule} onClose={onClose} maxWidth="max-w-4xl" panelClassName="flex flex-col max-h-[92dvh] overflow-hidden shadow-2xl" padding="p-3 sm:p-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <span
                className="p-2 rounded-xl"
                style={
                  typeColor
                    ? { backgroundColor: typeColor + "33" }
                    : { backgroundColor: "var(--color-primary-15, #A5D8FF33)" }
                }
              >
                <CalendarDays
                  className="w-5 h-5"
                  style={typeColor ? { color: typeColor } : undefined}
                />
              </span>
              <div>
                <h2 className="text-base font-bold text-text">외근 스케줄 상세</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  현장 정보와 현장 기록을 확인합니다
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Body ── */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground py-20">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">불러오는 중…</span>
            </div>
          ) : !detail ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_300px]">

              {/* ── 왼쪽: 스케줄 & 현장 정보 ── */}
              <div className="overflow-y-auto px-6 py-5 space-y-5 border-r border-border">

                {/* 작업 날짜 */}
                <section>
                  <SectionLabel icon={<CalendarDays className="w-4 h-4" />} label="작업 날짜" />
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 rounded-xl border border-border">
                    <CalendarDays className="w-4 h-4 text-secondary-foreground shrink-0" />
                    <p className="text-sm font-semibold text-text">{dateLabel}</p>
                  </div>
                </section>

                {/* 현장 정보 */}
                <section>
                  <SectionLabel icon={<MapPin className="w-4 h-4" />} label="외근 현장" />
                  <div className="px-4 py-3.5 bg-muted/40 rounded-xl border border-border space-y-2.5">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text">{detail.fieldSite.title}</p>
                        {detail.fieldSite.fieldSiteType && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                            style={{
                              backgroundColor:
                                (detail.fieldSite.fieldSiteType.color ?? "#A5D8FF") + "33",
                              color: detail.fieldSite.fieldSiteType.color ?? "#1C4E6E",
                            }}
                          >
                            {detail.fieldSite.fieldSiteType.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {detail.fieldSite.latitude != null && detail.fieldSite.longitude != null && (
                      <div className="pt-2 border-t border-border/50">
                        <KakaoMapViewer
                          lat={detail.fieldSite.latitude}
                          lng={detail.fieldSite.longitude}
                          className="h-52"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* 삭제 확인 */}
                {showDeleteConfirm && (
                  <section className="p-4 bg-danger/10 border border-danger/30 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-danger-foreground">
                      이 스케줄을 삭제하시겠습니까?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      삭제된 스케줄은 복구할 수 없습니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-3 py-2 text-sm font-semibold bg-danger text-danger-foreground rounded-lg hover:bg-danger/80 transition-colors disabled:opacity-50"
                      >
                        {deleting ? "삭제 중…" : "삭제 확인"}
                      </button>
                    </div>
                  </section>
                )}
              </div>

              {/* ── 오른쪽: 현장 기록 패널 ── */}
              <div className="overflow-y-auto px-5 py-5 flex flex-col min-h-0 bg-muted/20">
                <WorkLogPanel workLogs={detail.workLogs} />
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-6 pb-5 pt-3.5 border-t border-border shrink-0 flex items-center justify-between">
            {/* 왼쪽: 삭제 (관리자만) */}
            <div>
              {canManage && !showDeleteConfirm && detail && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-danger-foreground border border-danger/30 rounded-xl hover:bg-danger/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              )}
            </div>
            {/* 오른쪽: 수정 + 닫기 */}
            <div className="flex items-center gap-2">
              {onEdit && detail && !showDeleteConfirm && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-secondary-foreground border border-secondary/40 rounded-xl hover:bg-secondary/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  수정
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
    </BaseModal>
  );
}

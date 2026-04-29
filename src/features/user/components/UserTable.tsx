"use client";

import { useState } from "react";
import {
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { ImageViewModal } from "./ImageViewModal";
import { useDeleteUser } from "../hooks/useUsers";
import type { UserListItem, RoleValue } from "@/types/user";
import { ROLE, ROLE_META } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Masking utilities ────────────────────────────────────────────────────────

function maskPhone(phone?: string) {
  if (!phone) return "—";
  return phone.replace(/^(\d{3})-?(\d{3,4})-?(\d{4})$/, "$1-****-$3");
}

function maskAccount(account?: string) {
  if (!account) return "—";
  if (account.length <= 6) return "****";
  return account.slice(0, 3) + "-****-" + account.slice(-3);
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: RoleValue }) {
  const meta = ROLE_META[role];
  const colorClass =
    meta.color === "primary"
      ? "bg-primary/20 text-primary-foreground"
      : meta.color === "secondary"
        ? "bg-secondary/40 text-secondary-foreground"
        : "bg-success/30 text-success-foreground";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", colorClass)}>
      {meta.label}
    </span>
  );
}

function getRoleAccentClass(role: RoleValue) {
  const color = ROLE_META[role].color;

  if (color === "primary") return "bg-primary";
  if (color === "secondary") return "bg-secondary";
  return "bg-success";
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-muted rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── Sensitive Cell ───────────────────────────────────────────────────────────

function SensitiveCell({
  masked,
  original,
}: {
  masked: string;
  original: string;
}) {
  const [revealed, setRevealed] = useState(false);
  if (original === "—") return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 group">
      <span className="font-mono text-sm">{revealed ? original : masked}</span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-text"
        aria-label={revealed ? "숨기기" : "보기"}
      >
        {revealed ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserTableProps {
  data: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  isOwner: boolean;
  canManage: boolean;
  onEdit: (user: UserListItem) => void;
  onPageChange: (page: number) => void;
}

// ─── Delete Button ────────────────────────────────────────────────────────────

function DeleteButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    await deleteUser.mutateAsync(userId);
    setConfirming(false);
  };

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleteUser.isPending}
          className="px-2 py-1 text-xs rounded bg-danger text-danger-foreground font-semibold hover:opacity-80 transition-opacity"
        >
          삭제
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-text"
        >
          취소
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-danger-foreground hover:bg-danger/10 transition-colors"
      aria-label={`${userName} 삭제`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserTable({
  data,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  isOwner,
  canManage,
  onEdit,
  onPageChange,
}: UserTableProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const pageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <>
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-text whitespace-nowrap">
                  이름 / 역할
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text whitespace-nowrap">
                  아이디
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text whitespace-nowrap">
                  연락처
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text whitespace-nowrap hidden md:table-cell">
                  은행 / 계좌
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text whitespace-nowrap hidden lg:table-cell">
                  등록일
                </th>
                <th className="px-4 py-3 text-center font-semibold text-text whitespace-nowrap">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : data.map((user, idx) => (
                    <tr
                      key={user.id}
                      onClick={() => onEdit(user)}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-primary/5 cursor-pointer group",
                        idx % 2 === 0 ? "bg-surface" : "bg-muted/20"
                      )}
                    >
                      {/* Name / Role */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-1.5 h-10 rounded-full shrink-0 transition-all group-hover:h-12",
                              getRoleAccentClass(user.role)
                            )}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-text-strong whitespace-nowrap">
                              {user.name}
                            </span>
                            <RoleBadge role={user.role} />
                          </div>
                        </div>
                      </td>

                      {/* Login ID */}
                      <td className="px-4 py-3.5 text-text font-mono">
                        {user.loginId}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <SensitiveCell
                          masked={maskPhone(user.phone)}
                          original={user.phone ?? "—"}
                        />
                      </td>

                      {/* Bank / Account */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {user.bankName || user.bankAccountEncrypted ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-text">
                              {user.bankName ?? "—"}
                            </span>
                            <SensitiveCell
                              masked={maskAccount(user.bankAccountEncrypted)}
                              original={user.bankAccountEncrypted ?? "—"}
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3.5 text-text hidden lg:table-cell whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* 삭제 버튼: OWNER는 모두, canManage HRManager는 WORKER만 */}
                          {(isOwner || (canManage && user.role === ROLE.WORKER)) ? (
                            <DeleteButton
                              userId={user.id}
                              userName={user.name}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground px-1">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!isLoading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-text-strong text-lg">
                인력이 없습니다
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                인력을 추가하여 서비스를 시작하세요
              </p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              전체 <strong className="text-text">{total}</strong>명 중{" "}
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}명
              표시
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="이전 페이지"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                    p === page
                      ? "bg-primary text-primary-foreground shadow-field"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="다음 페이지"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ImageViewModal url={imageUrl} onClose={() => setImageUrl(null)} />
    </>
  );
}

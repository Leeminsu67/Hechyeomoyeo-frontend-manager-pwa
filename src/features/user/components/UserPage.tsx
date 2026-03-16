"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  UserPlus,
  Users,
  ShieldCheck,
  HardHat,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserList } from "../hooks/useUsers";
import { UserTable } from "./UserTable";
import { UserFormModal } from "./UserFormModal";
import type { UserListItem } from "@/types/user";
import { ROLE } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card px-5 py-4 flex items-center gap-4">
      <span
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-xl shrink-0",
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {isLoading ? (
          <div className="h-6 w-10 mt-0.5 bg-muted rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-text-strong leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page Size Selector ───────────────────────────────────────────────────────

const PAGE_SIZES = [10, 30, 50, 100] as const;

function PageSizeSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text hover:border-primary/50 transition-colors"
      >
        {value}명씩 보기
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-card-hover z-20 overflow-hidden min-w-[100px] animate-slide-up">
          {PAGE_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                value === n && "bg-primary/10 font-semibold text-primary-foreground"
              )}
            >
              {n}명
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserPage() {
  const { user } = useAuthStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10); // 백엔드 파라미터명 take

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  // 백엔드 Role: 0=serviceAdmin, 1=owner, 2=HRManager, 3=manager, 4=worker
  const currentRole = Number(user?.role);
  const isOwner = currentRole === ROLE.SERVICE_ADMIN || currentRole === ROLE.OWNER;
  const canManage = isOwner || currentRole === ROLE.HR_MANAGER;

  const { data, isLoading, isError } = useUserList({
    page,
    take,
    name: debouncedSearch || undefined, // 백엔드: name으로 검색
  });

  const users = data?.data?.users ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / take) || 1;

  const handleEdit = (target: UserListItem) => {
    setEditTarget(target);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleTakeChange = (n: number) => {
    setTake(n);
    setPage(1);
  };

  // Stats
  const adminCount = users.filter(
    (u) => u.role === ROLE.HR_MANAGER || u.role === ROLE.MANAGER
  ).length;
  const workerCount = users.filter((u) => u.role === ROLE.WORKER).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-strong tracking-tight">
                인력 통합 관리
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                등록된 관리자와 현장 인력을 한눈에 관리합니다
              </p>
            </div>
            {canManage && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-300 transition-colors shadow-field whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                인력 등록
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="전체 인력"
            value={total}
            color="bg-primary/15 text-primary-foreground"
            isLoading={isLoading}
          />
          <StatCard
            icon={ShieldCheck}
            label="관리자"
            value={adminCount}
            color="bg-secondary/30 text-secondary-foreground"
            isLoading={isLoading}
          />
          <StatCard
            icon={HardHat}
            label="일반 인력"
            value={workerCount}
            color="bg-success/30 text-success-foreground"
            isLoading={isLoading}
          />
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search — 백엔드는 이름(name)으로 검색 */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="이름으로 검색..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div className="sm:ml-auto">
            <PageSizeSelector value={take} onChange={handleTakeChange} />
          </div>
        </div>

        {/* ── Error State ── */}
        {isError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              인력 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시
              시도해주세요.
            </p>
          </div>
        )}

        {/* ── Table ── */}
        <UserTable
          data={users}
          total={total}
          page={page}
          pageSize={take}
          totalPages={totalPages}
          isLoading={isLoading}
          isOwner={isOwner}
          canManage={canManage}
          onEdit={handleEdit}
          onPageChange={setPage}
        />
      </div>

      {/* ── Form Modal ── */}
      <UserFormModal
        open={modalOpen}
        onClose={handleModalClose}
        editTarget={editTarget}
        canManage={canManage}
      />
    </div>
  );
}

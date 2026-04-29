"use client";

import { useState, useRef, useEffect } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  Search,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteUsers, useAssignSiteUsers } from "../hooks/useSites";
import { useUserList } from "@/features/user/hooks/useUsers";
import { ROLE, ROLE_META } from "@/types/user";
import type { SiteItem } from "@/types/site";
import type { UserListItem } from "@/types/user";

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: number }) {
  const meta = ROLE_META[role as keyof typeof ROLE_META];
  if (!meta) return null;
  const colorMap: Record<string, string> = {
    primary: "bg-primary/20 text-primary-foreground border-primary/30",
    secondary: "bg-secondary/30 text-secondary-foreground border-secondary/40",
    success: "bg-success/30 text-success-foreground border-success/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
        colorMap[meta.color] ?? colorMap.success
      )}
    >
      {meta.label}
    </span>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

interface StaffCardProps {
  user: UserListItem;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

function StaffCard({
  user,
  selected,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: StaffCardProps) {
  const role = user.role as number;
  const isOwner = role === ROLE.OWNER || role === ROLE.SERVICE_ADMIN;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={onDoubleClick}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all group",
        selected
          ? "bg-primary/15 border-primary/50 shadow-field"
          : "bg-surface border-border hover:border-primary/30 hover:bg-primary/5",
        isDragging && "opacity-40 scale-95",
        isOwner && "border-l-4"
      )}
      style={isOwner ? { borderLeftColor: "#FFD8A8" } : undefined}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
<div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-text-strong truncate">
            {user.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {user.loginId}
        </p>
      </div>
      <RoleBadge role={role} />
      <input
        type="checkbox"
        checked={selected}
        readOnly
        className="w-4 h-4 rounded border-border accent-primary-foreground pointer-events-none shrink-0"
      />
    </div>
  );
}

// ─── Staff Panel ──────────────────────────────────────────────────────────────

interface StaffPanelProps {
  title: string;
  subtitle: string;
  users: UserListItem[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDoubleClick: (id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  draggingId: string | null;
  draggingFrom: "left" | "right" | null;
  panelSide: "left" | "right";
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  isOver: boolean;
  accentColor?: string;
  icon: React.ReactNode;
  search: string;
  onSearch: (v: string) => void;
  isLoading?: boolean;
}

function StaffPanel({
  title,
  subtitle,
  users,
  selected,
  onSelect,
  onSelectAll,
  onDoubleClick,
  onDrop,
  onDragOver,
  onDragLeave,
  draggingId,
  draggingFrom,
  panelSide,
  onDragStart,
  onDragEnd,
  isOver,
  accentColor = "#A5D8FF",
  icon,
  search,
  onSearch,
  isLoading,
}: StaffPanelProps) {
  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  return (
    <div
      className={cn(
        "flex-1 flex flex-col rounded-2xl border-2 transition-all min-w-0",
        isOver
          ? "border-primary shadow-field bg-primary/5"
          : "border-border bg-surface"
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {/* Header */}
      <div
        className="px-4 py-3 rounded-t-xl border-b border-border/60"
        style={{ backgroundColor: accentColor + "22" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h3 className="text-sm font-bold text-text-strong">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: accentColor + "44",
              borderColor: accentColor + "88",
              color: "#333",
            }}
          >
            {users.length}명
          </span>
        </div>
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="이름 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-surface/80 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Select All */}
      {users.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
          <input
            type="checkbox"
            id={`select-all-${panelSide}`}
            checked={allSelected}
            onChange={onSelectAll}
            className="w-3.5 h-3.5 rounded border-border accent-primary-foreground cursor-pointer"
          />
          <label
            htmlFor={`select-all-${panelSide}`}
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            전체 선택
            {selected.size > 0 && (
              <span className="ml-1 font-semibold text-primary-foreground">
                ({selected.size}명 선택됨)
              </span>
            )}
          </label>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[240px]">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-muted-foreground">
            <Users className="w-8 h-8 opacity-25" />
            <p className="text-xs">
              {search ? "검색 결과 없음" : "인원이 없습니다"}
            </p>
          </div>
        ) : (
          users.map((u) => (
            <StaffCard
              key={u.id}
              user={u}
              selected={selected.has(u.id)}
              onSelect={() => onSelect(u.id)}
              onDoubleClick={() => onDoubleClick(u.id)}
              onDragStart={(e) => onDragStart(u.id, e)}
              onDragEnd={onDragEnd}
              isDragging={draggingId === u.id && draggingFrom === panelSide}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface StaffAssignModalProps {
  open: boolean;
  onClose: () => void;
  site: SiteItem;
}

export function StaffAssignModal({ open, onClose, site }: StaffAssignModalProps) {
  // ─ Server Data ────────────────────────────────────────────────────────────
  const { data: assignedData, isLoading: loadingAssigned } = useSiteUsers(site.id);
  const { data: allUsersData, isLoading: loadingAll } = useUserList({
    page: 1,
    take: 200,
  });
  const { mutate: assign, isPending: saving } = useAssignSiteUsers();

  // ─ 핵심 상태: assignedIds 하나만 관리, 나머지는 전체 유저에서 파생 ───────
  // assignedIds 가 정해지면, assigned = allUsers.filter(in ids), unassigned = rest
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // 서버 데이터가 로드되면 최초 1회 초기화
  useEffect(() => {
    if (initialized) return;

    const allUsers = allUsersData?.data?.users;
    // allUsers 가 로드되면 초기화 시작
    // assignedData가 아직 로딩 중이면 서버 배치 목록을 모르므로 대기
    if (!allUsers) return;

    // assignedData가 에러났거나 없으면 빈 배치로 초기화
    const serverAssigned = assignedData?.data?.users ?? [];
    setAssignedIds(new Set(serverAssigned.map((u) => u.id)));
    setInitialized(true);
  }, [initialized, allUsersData, assignedData]);

  // 모달이 닫힐 때 초기화 상태 리셋 (다음 번 열릴 때 재초기화)
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      setAssignedIds(new Set());
      setLeftSelected(new Set());
      setRightSelected(new Set());
      setLeftSearch("");
      setRightSearch("");
    }
  }, [open]);

  // ─ 전체 유저 목록에서 배치/미배치 파생 ──────────────────────────────────
  const allUsers: UserListItem[] = allUsersData?.data?.users ?? [];
  const assignedList = allUsers.filter((u) => assignedIds.has(u.id));
  const unassignedList = allUsers.filter((u) => !assignedIds.has(u.id));

  // ─ UI 상태 ────────────────────────────────────────────────────────────────
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set());
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set());
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<"left" | "right" | null>(null);
  const [leftOver, setLeftOver] = useState(false);
  const [rightOver, setRightOver] = useState(false);

  // ─ 검색 필터 ──────────────────────────────────────────────────────────────
  const filteredLeft = assignedList.filter(
    (u) => u.name.includes(leftSearch) || u.loginId.includes(leftSearch)
  );
  const filteredRight = unassignedList.filter(
    (u) => u.name.includes(rightSearch) || u.loginId.includes(rightSearch)
  );

  // ─ 이동 헬퍼 ─────────────────────────────────────────────────────────────
  const moveToAssigned = (ids: string[]) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setRightSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const moveToUnassigned = (ids: string[]) => {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setLeftSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  // ─ 선택 토글 ──────────────────────────────────────────────────────────────
  const toggleLeft = (id: string) =>
    setLeftSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleRight = (id: string) =>
    setRightSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAllLeft = () =>
    setLeftSelected(
      leftSelected.size === filteredLeft.length
        ? new Set()
        : new Set(filteredLeft.map((u) => u.id))
    );

  const toggleAllRight = () =>
    setRightSelected(
      rightSelected.size === filteredRight.length
        ? new Set()
        : new Set(filteredRight.map((u) => u.id))
    );

  // ─ 드래그앤드롭 ───────────────────────────────────────────────────────────
  const handleDragStart = (
    id: string,
    from: "left" | "right",
    e: React.DragEvent
  ) => {
    e.dataTransfer.setData("userId", id);
    e.dataTransfer.setData("from", from);
    setDraggingId(id);
    setDraggingFrom(from);
  };

  const handleDrop = (to: "left" | "right", e: React.DragEvent) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData("userId");
    const from = e.dataTransfer.getData("from") as "left" | "right";
    setLeftOver(false);
    setRightOver(false);
    if (from === to || !userId) return;
    if (to === "left") moveToAssigned([userId]);
    else moveToUnassigned([userId]);
  };

  const resetDrag = () => {
    setDraggingId(null);
    setDraggingFrom(null);
    setLeftOver(false);
    setRightOver(false);
  };

  // ─ 저장 ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    assign(
      { siteId: site.id, dto: { userIds: Array.from(assignedIds) } },
      { onSuccess: onClose }
    );
  };

  const siteColor = site.siteType?.color ?? "#A5D8FF";
  const isDataLoading = loadingAll || (loadingAssigned && !initialized);

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-4xl" panelClassName="bg-background flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-border"
          style={{ background: `linear-gradient(135deg, ${siteColor}22, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 text-white"
              style={{ backgroundColor: siteColor }}
            >
              {site.displayCode}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-strong flex items-center gap-2 flex-wrap">
                {site.name}
                <span className="text-sm font-normal text-muted-foreground">
                  인력 배치 관리
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                더블클릭 또는 드래그앤드롭으로 인력을 이동합니다
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

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4 flex gap-3 items-stretch min-h-0">
          {/* Left — 배치된 인원 */}
          <StaffPanel
            title="현장 배치 인력"
            subtitle="이 현장에 배치된 인원"
            users={filteredLeft}
            selected={leftSelected}
            onSelect={toggleLeft}
            onSelectAll={toggleAllLeft}
            onDoubleClick={(id) => moveToUnassigned([id])}
            onDrop={(e) => handleDrop("left", e)}
            onDragOver={(e) => { e.preventDefault(); setLeftOver(true); }}
            onDragLeave={() => setLeftOver(false)}
            draggingId={draggingId}
            draggingFrom={draggingFrom}
            panelSide="left"
            onDragStart={(id, e) => handleDragStart(id, "left", e)}
            onDragEnd={resetDrag}
            isOver={leftOver}
            accentColor={siteColor}
            icon={<UserCheck className="w-4 h-4" style={{ color: siteColor }} />}
            search={leftSearch}
            onSearch={setLeftSearch}
            isLoading={isDataLoading}
          />

          {/* Center — 이동 버튼 */}
          <div className="flex flex-col items-center justify-center gap-3 py-4 shrink-0">
            <button
              onClick={() => moveToAssigned(Array.from(rightSelected))}
              disabled={rightSelected.size === 0}
              title="선택한 인원을 현장에 배치"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                rightSelected.size > 0
                  ? "bg-primary border-primary hover:bg-primary-300 text-primary-foreground shadow-field hover:scale-105"
                  : "bg-surface border-border text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-border" />
            <button
              onClick={() => moveToUnassigned(Array.from(leftSelected))}
              disabled={leftSelected.size === 0}
              title="선택한 인원을 현장에서 해제"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                leftSelected.size > 0
                  ? "bg-danger/20 border-danger/50 hover:bg-danger/30 text-danger-foreground hover:scale-105"
                  : "bg-surface border-border text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right — 미배치 인원 */}
          <StaffPanel
            title="미배치 인력"
            subtitle="현재 배치되지 않은 인원"
            users={filteredRight}
            selected={rightSelected}
            onSelect={toggleRight}
            onSelectAll={toggleAllRight}
            onDoubleClick={(id) => moveToAssigned([id])}
            onDrop={(e) => handleDrop("right", e)}
            onDragOver={(e) => { e.preventDefault(); setRightOver(true); }}
            onDragLeave={() => setRightOver(false)}
            draggingId={draggingId}
            draggingFrom={draggingFrom}
            panelSide="right"
            onDragStart={(id, e) => handleDragStart(id, "right", e)}
            onDragEnd={resetDrag}
            isOver={rightOver}
            accentColor="#DEE2E6"
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
            search={rightSearch}
            onSearch={setRightSearch}
            isLoading={isDataLoading}
          />
        </div>

        {/* Info Bar */}
        <div className="px-4 pb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          저장 버튼 클릭 시 배치 이력이 자동으로 기록됩니다. 더블클릭 또는
          드래그앤드롭으로 이동하세요.
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: siteColor }}
              />
              <span className="font-semibold text-text-strong">
                {assignedList.length}명
              </span>
              <span className="text-muted-foreground">배치됨</span>
            </span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground">
              미배치 {unassignedList.length}명
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors shadow-field disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  저장 중…
                </>
              ) : (
                "배치 저장"
              )}
            </button>
          </div>
        </div>
    </BaseModal>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import {
  Search,
  PlusCircle,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Palette,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSiteList } from "@/features/site/hooks/useSites";
import { useSiteTypeList } from "@/features/site/hooks/useSiteTypes";
import { DutySiteFormModal } from "./DutySiteFormModal";
import { DutySiteTypeModal } from "./DutySiteTypeModal";
import { DutySiteTable } from "./DutySiteTable";
import { DutySiteDetailModal } from "./DutySiteDetailModal";
import { ZoneManageModal } from "@/features/site/components/ZoneManageModal";
import { ZoneFormModal } from "@/features/site/components/ZoneFormModal";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { ROLE } from "@/types/user";
import { cn } from "@/lib/utils";
import type { SiteItem } from "@/types/site";
import type { ZoneItem } from "@/types/zone";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100].map((n) => ({
  value: n,
  label: `${n}개`,
}));

// ─── Main Component ───────────────────────────────────────────────────────────

export function DutySitePage() {
  const { user } = useAuthStore();
  const currentRole = Number(user?.role);
  const canManageAll = currentRole <= ROLE.HR_MANAGER;
  const canManage = canManageAll || currentRole === ROLE.MANAGER;

  // ─ Search & Pagination ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  // ─ Data ─────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useSiteList({
    page,
    take,
    name: debouncedSearch || undefined,
  });
  const { data: siteTypeData } = useSiteTypeList();

  const sites = data?.data?.sites ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / take) || 1;
  const siteTypes = siteTypeData?.data?.siteTypes ?? [];
  const { data: statsData, isLoading: isStatsLoading } = useSiteList({
    page: 1,
    take: Math.max(total, take),
    name: debouncedSearch || undefined,
  });
  const statsSites = statsData?.data?.sites ?? sites;

  // ─ Modals ───────────────────────────────────────────────────────────────────
  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SiteItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<SiteItem | null>(null);
  const [siteTypeModalOpen, setSiteTypeModalOpen] = useState(false);

  // 구역 관리
  const [zoneSite, setZoneSite] = useState<SiteItem | null>(null);
  const [zoneEditTarget, setZoneEditTarget] = useState<ZoneItem | null>(null);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);

  const handleAdd = () => {
    setEditTarget(null);
    setSiteFormOpen(true);
  };
  const handleEdit = (site: SiteItem) => {
    setEditTarget(site);
    setSiteFormOpen(true);
  };
  const handleFormClose = () => {
    setSiteFormOpen(false);
    setEditTarget(null);
  };
  const handleRowClick = (site: SiteItem) => {
    setDetailTarget(site);
  };
  const handleDetailClose = () => {
    setDetailTarget(null);
  };
  const handleDetailEdit = (site: SiteItem) => {
    setDetailTarget(null);
    handleEdit(site);
  };
  const handleZoneSettings = (site: SiteItem) => {
    setDetailTarget(null);
    setZoneSite(site);
    setZoneEditTarget(null);
    setZoneFormOpen(false);
  };
  const handleAddZone = () => {
    setZoneEditTarget(null);
    setZoneFormOpen(true);
  };
  const handleEditZone = (zone: ZoneItem) => {
    setZoneEditTarget(zone);
    setZoneFormOpen(true);
  };
  const handleZoneFormClose = () => {
    setZoneFormOpen(false);
    setZoneEditTarget(null);
  };

  // ─ Stats ────────────────────────────────────────────────────────────────────
  const activeCount = statsSites.filter((s) => s.status === "active").length;
  const untypedCount = statsSites.filter((s) => s.siteType === null).length;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Section Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-strong tracking-tight">
              당직 현장 목록
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              당직이 배정된 현장을 조회하고 관리합니다
            </p>
          </div>
          {canManageAll && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSiteTypeModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-surface border border-border text-text rounded-xl font-semibold text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">타입 관리</span>
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-300 transition-colors shadow-field whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                현장 등록
              </button>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Building2}
            label="전체 당직 현장"
            value={total}
            color="bg-primary/15 text-primary-foreground"
            isLoading={isLoading}
          />
          <StatCard
            icon={CheckCircle2}
            label="운영 중 현장"
            value={activeCount}
            color="bg-success/30 text-success-foreground"
            isLoading={isLoading || isStatsLoading}
          />
          <StatCard
            icon={Tag}
            label="타입 미지정 현장"
            value={untypedCount}
            color="bg-secondary/30 text-secondary-foreground"
            isLoading={isLoading || isStatsLoading}
          />
        </div>

        {/* ── Site Type Tags ── */}
        {siteTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">사업 타입:</span>
            {siteTypes.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: t.color + "33",
                  borderColor: t.color + "88",
                  color: "#333",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="현장명으로 검색..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
          <div className="sm:ml-auto">
            <SelectDropdown
              options={PAGE_SIZE_OPTIONS}
              value={take}
              onChange={(n) => {
                if (n !== null) {
                  setTake(n);
                  setPage(1);
                }
              }}
              renderLabel={(sel) => `${sel?.value ?? take}개씩 보기`}
              align="right"
              minWidth="120px"
            />
          </div>
        </div>

        {/* ── Error State ── */}
        {isError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              당직 현장 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시
              시도해주세요.
            </p>
          </div>
        )}

        {/* ── Table ── */}
        <DutySiteTable
          data={sites}
          total={total}
          page={page}
          pageSize={take}
          totalPages={totalPages}
          isLoading={isLoading}
          canManage={canManage}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onZoneSettings={handleZoneSettings}
          onPageChange={setPage}
          hasSearch={!!debouncedSearch}
        />
      </div>

      {/* ── Modals ── */}
      <DutySiteFormModal
        open={siteFormOpen}
        onClose={handleFormClose}
        editTarget={editTarget}
      />
      <DutySiteTypeModal
        open={siteTypeModalOpen}
        onClose={() => setSiteTypeModalOpen(false)}
      />
      <DutySiteDetailModal
        site={detailTarget}
        onClose={handleDetailClose}
        onEdit={handleDetailEdit}
        onZoneSettings={handleZoneSettings}
        canManage={canManage}
      />

      {/* 현장 구역 관리 */}
      {zoneSite && (
        <ZoneManageModal
          open={!!zoneSite}
          onClose={() => setZoneSite(null)}
          site={zoneSite}
          canManage={canManage}
          onAddZone={handleAddZone}
          onEditZone={handleEditZone}
        />
      )}

      {/* 구역 추가/수정 폼 */}
      {zoneSite && zoneFormOpen && (
        <ZoneFormModal
          open={zoneFormOpen}
          onClose={handleZoneFormClose}
          site={zoneSite}
          editTarget={zoneEditTarget}
        />
      )}
    </div>
  );
}

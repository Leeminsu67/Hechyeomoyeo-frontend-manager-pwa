"use client";

import { useState, useCallback, useRef } from "react";
import {
  Search,
  MapPin,
  PlusCircle,
  Settings2,
  AlertCircle,
  Building2,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSiteList } from "../hooks/useSites";
import { useSiteTypeList } from "../hooks/useSiteTypes";
import { SiteTable } from "./SiteTable";
import { SiteFormModal } from "./SiteFormModal";
import { SiteTypeModal } from "./SiteTypeModal";
import { StaffAssignModal } from "./StaffAssignModal";
import { SiteDetailModal } from "./SiteDetailModal";
import { ZoneManageModal } from "./ZoneManageModal";
import { ZoneFormModal } from "./ZoneFormModal";
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

export function SitePage() {
  const { user } = useAuthStore();
  const currentRole = Number(user?.role);
  const isOwner = currentRole === ROLE.SERVICE_ADMIN || currentRole === ROLE.OWNER;
  const canManage = isOwner || currentRole === ROLE.HR_MANAGER;

  // ─ Search & Pagination ────────────────────────────────────────────────────
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

  // ─ Data ───────────────────────────────────────────────────────────────────
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

  // ─ Modals ─────────────────────────────────────────────────────────────────
  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SiteItem | null>(null);
  const [siteTypeModalOpen, setSiteTypeModalOpen] = useState(false);
  const [staffTarget, setStaffTarget] = useState<SiteItem | null>(null);

  // 현장 상세 / 구역 관리
  const [detailSite, setDetailSite] = useState<SiteItem | null>(null);
  const [zoneSite, setZoneSite] = useState<SiteItem | null>(null);
  const [zoneEditTarget, setZoneEditTarget] = useState<ZoneItem | null>(null);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);

  const handleAdd = () => { setEditTarget(null); setSiteFormOpen(true); };
  const handleEdit = (site: SiteItem) => { setEditTarget(site); setSiteFormOpen(true); };
  const handleFormClose = () => { setSiteFormOpen(false); setEditTarget(null); };
  const handleStaffClose = () => setStaffTarget(null);

  const handleRowClick = (site: SiteItem) => setDetailSite(site);
  const handleZoneSettings = (site: SiteItem) => {
    setDetailSite(null);
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

  // ─ Stats ──────────────────────────────────────────────────────────────────
  const typedCount = sites.filter((s) => s.siteType !== null).length;
  const untypedCount = sites.filter((s) => s.siteType === null).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-5 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-strong tracking-tight">
                현장 통합 관리
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                등록된 사업지를 한눈에 조회하고 인력을 배치합니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  <button
                    onClick={() => setSiteTypeModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-surface border border-border text-text rounded-xl font-semibold text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span className="hidden sm:inline">타입 관리</span>
                  </button>
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-300 transition-colors shadow-field whitespace-nowrap"
                  >
                    <PlusCircle className="w-4 h-4" />
                    현장 등록
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Building2}
            label="전체 현장"
            value={total}
            color="bg-primary/15 text-primary-foreground"
            isLoading={isLoading}
          />
          <StatCard
            icon={Tag}
            label="타입 지정됨"
            value={typedCount}
            color="bg-secondary/30 text-secondary-foreground"
            isLoading={isLoading}
          />
          <StatCard
            icon={CheckCircle2}
            label="등록 타입"
            value={siteTypes.length}
            color="bg-success/30 text-success-foreground"
          />
        </div>

        {/* ── Site Type Summary Bar ── */}
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
              onChange={(n) => { if (n !== null) { setTake(n); setPage(1); } }}
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
              현장 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
          </div>
        )}

        {/* ── Table ── */}
        <SiteTable
          data={sites}
          total={total}
          page={page}
          pageSize={take}
          totalPages={totalPages}
          isLoading={isLoading}
          canManage={canManage}
          onEdit={handleEdit}
          onManageStaff={(site) => setStaffTarget(site)}
          onRowClick={handleRowClick}
          onZoneSettings={handleZoneSettings}
          onPageChange={setPage}
          hasSearch={!!debouncedSearch}
        />
      </div>

      {/* ── Modals ── */}
      <SiteFormModal
        open={siteFormOpen}
        onClose={handleFormClose}
        editTarget={editTarget}
      />
      <SiteTypeModal
        open={siteTypeModalOpen}
        onClose={() => setSiteTypeModalOpen(false)}
      />
      {staffTarget && (
        <StaffAssignModal
          open={!!staffTarget}
          onClose={handleStaffClose}
          site={staffTarget}
        />
      )}

      {/* 현장 상세 */}
      {detailSite && (
        <SiteDetailModal
          open={!!detailSite}
          onClose={() => setDetailSite(null)}
          site={detailSite}
          onZoneSettings={handleZoneSettings}
        />
      )}

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

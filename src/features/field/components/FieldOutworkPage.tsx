"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MapPin,
  CalendarDays,
  Building2,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  Palette,
} from "lucide-react";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE } from "@/types/user";
import {
  useFieldWorkSchedules,
  useFieldWorkSchedule,
} from "../hooks/useFieldWorkSchedules";
import { useDeleteFieldSite } from "../hooks/useFieldSites";
import { FieldCalendar } from "./FieldCalendar";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { ScheduleDetailModal } from "./ScheduleDetailModal";
import { FieldSiteTypeModal } from "./FieldSiteTypeModal";
import type { FieldSite, FieldWorkSchedule } from "@/types/field";
import type { DetailSchedule } from "./CreateScheduleModal";

// ─── Month Navigation ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

function MonthNav({
  year,
  month,
  onPrev,
  onNext,
  onYearChange,
  onMonthChange,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="p-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-text"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {/* Year selector */}
        <SelectDropdown
          options={Array.from({ length: 10 }, (_, i) => year - 5 + i).map((y) => ({
            value: y,
            label: `${y}년`,
          }))}
          value={year}
          onChange={(v) => v !== null && onYearChange(v)}
          renderLabel={(sel) => `${sel?.value ?? year}년`}
          variant="ghost"
          align="left"
          minWidth="100px"
        />
        {/* Month selector */}
        <SelectDropdown
          options={MONTH_NAMES.map((name, i) => ({
            value: i + 1,
            label: name,
          }))}
          value={month}
          onChange={(v) => v !== null && onMonthChange(v)}
          renderLabel={(sel) => sel?.label ?? MONTH_NAMES[month - 1]}
          variant="ghost"
          align="left"
          minWidth="80px"
        />
      </div>

      <button
        onClick={onNext}
        className="p-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-text"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Site List Item ───────────────────────────────────────────────────────────

function SiteListItem({
  site,
  canManage,
  onEdit,
  onClick,
}: {
  site: FieldSite;
  canManage: boolean;
  onEdit: (s: FieldSite) => void;
  onClick: (s: FieldSite) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: deleteSite, isPending } = useDeleteFieldSite();

  const handleDelete = () => {
    deleteSite(site.id, { onSuccess: () => setShowConfirm(false) });
  };

  const color = site.fieldSiteType?.color;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group cursor-pointer"
      onClick={() => !showConfirm && onClick(site)}
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color ?? "#A5D8FF" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{site.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {site.fieldSiteType && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: (color ?? "#A5D8FF") + "33",
                color: color ?? "#1C4E6E",
              }}
            >
              {site.fieldSiteType.name}
            </span>
          )}
          {site.schedules && site.schedules.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {(() => {
                const latest = [...site.schedules].sort((a, b) =>
                  b.startDate.localeCompare(a.startDate),
                )[0];
                const fmt = (d: string) =>
                  d.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
                return latest.endDate
                  ? `${fmt(latest.startDate)} ~ ${fmt(latest.endDate)}`
                  : fmt(latest.startDate);
              })()}
            </span>
          )}
        </div>
      </div>

      {canManage && !showConfirm && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(site);
            }}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(true);
            }}
            className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger-foreground transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(false);
            }}
            className="px-2 py-1 text-xs font-medium border border-border rounded-lg hover:bg-muted"
          >
            취소
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isPending}
            className="px-2 py-1 text-xs font-semibold bg-danger/80 text-danger-foreground rounded-lg hover:bg-danger disabled:opacity-50"
          >
            {isPending ? "…" : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FieldOutworkPage() {
  const { user } = useAuthStore();
  const currentRole = Number(user?.role);
  const canManage = currentRole <= ROLE.HR_MANAGER; // SERVICE_ADMIN(0), OWNER(1), HR_MANAGER(2)

  // ─ Month State ─────────────────────────────────────────────────────────
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const handlePrev = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }, [now]);

  // ─ Schedule Data ───────────────────────────────────────────────────────
  const {
    data: scheduleData,
    isLoading: schedulesLoading,
    isError: schedulesError,
  } = useFieldWorkSchedules({ year, month });
  const schedules: FieldWorkSchedule[] = scheduleData?.data?.schedules ?? [];

  // ─ Site Data (스케줄 데이터에서 중복 제거하여 추출) ──────────────────
  const [siteSearch, setSiteSearch] = useState("");

  const allSites = useMemo<FieldSite[]>(() => {
    const map = new Map<string, FieldSite>();
    for (const s of schedules) {
      if (!map.has(s.fieldSite.id)) {
        map.set(s.fieldSite.id, {
          id: s.fieldSite.id,
          title: s.fieldSite.title,
          latitude: s.fieldSite.latitude,
          longitude: s.fieldSite.longitude,
          isDeleted: false,
          createdAt: "",
          updatedAt: "",
          fieldSiteType: s.fieldSite.fieldSiteType ?? null,
          schedules: [],
        });
      }
      // 해당 현장의 스케줄 날짜 누적
      const site = map.get(s.fieldSite.id)!;
      site.schedules!.push({ id: s.id, startDate: s.startDate, endDate: s.endDate });
    }
    return Array.from(map.values());
  }, [schedules]);

  const sites = useMemo(
    () =>
      siteSearch.trim()
        ? allSites.filter((s) =>
            s.title.toLowerCase().includes(siteSearch.toLowerCase()),
          )
        : allSites,
    [allSites, siteSearch],
  );

  const siteTotal = allSites.length;

  // siteId → hex color
  const siteColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const site of allSites) {
      if (site.fieldSiteType?.color) {
        map.set(site.id, site.fieldSiteType.color);
      }
    }
    return map;
  }, [allSites]);

  // ─ Modals ──────────────────────────────────────────────────────────────
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [createScheduleDate, setCreateScheduleDate] = useState<
    string | undefined
  >();
  const [selectedSchedule, setSelectedSchedule] =
    useState<FieldWorkSchedule | null>(null);
  const [editScheduleData, setEditScheduleData] =
    useState<DetailSchedule | null>(null);
  const [pendingEditScheduleId, setPendingEditScheduleId] = useState<
    string | null
  >(null);
  const [siteTypeModalOpen, setSiteTypeModalOpen] = useState(false);

  // 사이드바 수정 버튼 클릭 시 최근 스케줄 상세 fetch 후 수정 모달 열기
  const { data: pendingEditDetail } = useFieldWorkSchedule(
    pendingEditScheduleId,
  );
  useEffect(() => {
    const detail = pendingEditDetail?.data?.schedule;
    if (!detail) return;
    setEditScheduleData(detail);
    setPendingEditScheduleId(null);
  }, [pendingEditDetail]);

  const handleAddSchedule = useCallback((date?: string) => {
    setCreateScheduleDate(date);
    setCreateScheduleOpen(true);
  }, []);

  const handleSiteEdit = useCallback((site: FieldSite) => {
    const latest = [...(site.schedules ?? [])].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    )[0];
    if (latest) {
      setPendingEditScheduleId(latest.id);
    }
  }, []);

  const handleSiteClick = useCallback((site: FieldSite) => {
    if (!site.schedules || site.schedules.length === 0) return;
    // 가장 최근 스케줄을 상세 모달로 열기
    const latest = [...site.schedules].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    )[0];
    setSelectedSchedule({
      id: latest.id,
      startDate: latest.startDate,
      endDate: latest.endDate ?? null,
      fieldSite: {
        id: site.id,
        title: site.title,
        latitude: site.latitude,
        longitude: site.longitude,
        fieldSiteType: site.fieldSiteType ?? null,
      },
      workLogs: [],
      createdAt: "",
      updatedAt: "",
    });
  }, []);

  // ─ Stats ───────────────────────────────────────────────────────────────
  const scheduledDays = new Set(schedules.map((s) => s.startDate)).size;
  const monthLabel = `${year}년 ${month}월`;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Month Navigation */}
        <MonthNav
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 hover:text-text transition-colors"
          >
            오늘
          </button>
          {canManage && (
            <>
              <button
                onClick={() => setSiteTypeModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-surface border border-border text-text rounded-xl font-semibold text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">현장 타입</span>
              </button>
              <button
                onClick={() => handleAddSchedule(undefined)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-300 transition-colors shadow-field"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">현장 & 스케줄 등록</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={CalendarDays}
          label={`${monthLabel} 스케줄`}
          value={schedules.length}
          color="bg-secondary/30 text-secondary-foreground"
          isLoading={schedulesLoading}
        />
        {/* <StatCard
          icon={Building2}
          label="스케줄 일수"
          value={scheduledDays}
          color="bg-primary/15 text-primary-foreground"
          isLoading={schedulesLoading}
        />
        <StatCard
          icon={MapPin}
          label="등록 현장"
          value={siteTotal}
          color="bg-success/30 text-success-foreground"
          isLoading={schedulesLoading}
        />
        <StatCard
          icon={CalendarDays}
          label="이번달 현장 수"
          value={new Set(schedules.map((s) => s.fieldSite.id)).size}
          color="bg-muted text-muted-foreground"
          isLoading={schedulesLoading}
        /> */}
      </div>

      {/* ── Error ── */}
      {schedulesError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            스케줄을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}

      {/* ── Main Layout: Calendar + Site Sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-stretch">
        {/* ── Calendar ── */}
        <div className="min-w-0 flex flex-col">
          <FieldCalendar
            year={year}
            month={month}
            schedules={schedules}
            isLoading={schedulesLoading}
            canManage={canManage}
            siteColorMap={siteColorMap}
            onAddSchedule={handleAddSchedule}
            onScheduleClick={setSelectedSchedule}
          />
        </div>

        {/* ── Site List Sidebar ── */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-foreground" />
              <h3 className="text-sm font-bold text-text-strong">
                외근 현장 목록
              </h3>
              <span className="text-xs text-muted-foreground">
                ({siteTotal})
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder="현장 검색…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 border border-transparent focus:border-primary/30 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* List — grows to fill remaining sidebar height */}
          <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
            {schedulesLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : sites.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {siteSearch
                    ? "검색 결과가 없습니다."
                    : "등록된 외근 현장이 없습니다."}
                </p>
                {!siteSearch && canManage && (
                  <button
                    onClick={() => handleAddSchedule()}
                    className="mt-2 text-xs text-primary-foreground font-semibold hover:underline"
                  >
                    + 현장 등록하기
                  </button>
                )}
              </div>
            ) : (
              sites.map((site) => (
                <SiteListItem
                  key={site.id}
                  site={site}
                  canManage={canManage}
                  onEdit={handleSiteEdit}
                  onClick={handleSiteClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <CreateScheduleModal
        open={createScheduleOpen}
        onClose={() => setCreateScheduleOpen(false)}
        defaultDate={createScheduleDate}
      />

      <ScheduleDetailModal
        schedule={selectedSchedule}
        open={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        canManage={canManage}
        onEdit={(detail) => setEditScheduleData(detail)}
      />

      <CreateScheduleModal
        open={!!editScheduleData}
        onClose={() => setEditScheduleData(null)}
        mode="edit"
        editData={editScheduleData}
      />

      <FieldSiteTypeModal
        open={siteTypeModalOpen}
        onClose={() => setSiteTypeModalOpen(false)}
      />
    </div>
  );
}

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
    <div className="bg-surface rounded-xl border border-border shadow-card px-4 py-3.5 flex items-center gap-3">
      <span
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
          color,
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground font-medium leading-tight">
          {label}
        </p>
        {isLoading ? (
          <div className="h-6 w-8 mt-0.5 bg-muted rounded animate-pulse" />
        ) : (
          <p className="text-xl font-bold text-text-strong leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

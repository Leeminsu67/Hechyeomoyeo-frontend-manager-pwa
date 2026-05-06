"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertCircle,
  ArrowLeftRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE } from "@/types/user";
import {
  useCalendarSchedules,
  useScheduleDateDetail,
  useScheduleCandidates,
  useScheduleSiteOptions,
} from "../hooks/useSchedules";
import { DutyCalendar } from "./DutyCalendar";
import { DutyWorkerSidebar } from "./DutyWorkerSidebar";
import { MonthlyWorkerStats } from "./MonthlyWorkerStats";
import { SwapRequestPanel } from "./SwapRequestPanel";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { ModalPortal } from "@/components/shared/ModalPortal";
import type { CalendarScheduleItem, ScheduleSiteOption } from "@/types/schedule";

// ─── Palette (zone index → color classes) ─────────────────────────────────────
const ZONE_PALETTES = [
  "bg-primary/15 border-primary/30 text-primary-foreground",
  "bg-secondary/20 border-secondary/30 text-secondary-foreground",
  "bg-success/15 border-success/30 text-success-foreground",
  "bg-danger/15 border-danger/30 text-danger-foreground",
];

// ─── Month Names ──────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "1월","2월","3월","4월","5월","6월",
  "7월","8월","9월","10월","11월","12월",
];

// ─── Month Navigation ─────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-text"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        <SelectDropdown
          options={Array.from({ length: 10 }, (_, i) => year - 5 + i).map(
            (y) => ({ value: y, label: `${y}년` }),
          )}
          value={year}
          onChange={(v) => v !== null && onYearChange(v)}
          renderLabel={(sel) => `${sel?.value ?? year}년`}
          variant="ghost"
          align="left"
          minWidth="100px"
        />
        <SelectDropdown
          options={MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }))}
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
      <span className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0", color)}>
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground font-medium leading-tight">{label}</p>
        {isLoading ? (
          <div className="h-6 w-8 mt-0.5 bg-muted rounded animate-pulse" />
        ) : (
          <p className="text-xl font-bold text-text-strong leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Site Selector ────────────────────────────────────────────────────────────
function SiteSelector({
  sites,
  selectedId,
  isLoading,
  onSelect,
}: {
  sites: ScheduleSiteOption[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">등록된 현장이 없습니다.</p>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {sites.map((site) => (
        <button
          key={site.id}
          type="button"
          onClick={() => onSelect(site.id)}
          className={cn(
            "px-3.5 py-2 text-sm font-semibold rounded-xl border transition-colors",
            selectedId === site.id
              ? "bg-primary text-primary-foreground border-primary shadow-field"
              : "bg-surface border-border text-text hover:border-primary/50 hover:bg-primary/5",
          )}
        >
          {site.name}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DutyManagementPage() {
  const { user } = useAuthStore();
  const currentRole = Number(user?.role);
  const canManage = currentRole <= ROLE.MANAGER;
  const canAccessDutyManagement = currentRole <= ROLE.MANAGER;

  // ── Month State ──────────────────────────────────────────────────────────
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const handlePrev = useCallback(() => {
    setMonth((m) => {
      if (m === 1) { setYear((y) => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    setMonth((m) => {
      if (m === 12) { setYear((y) => y + 1); return 1; }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  }, []);

  // ── Date selection ───────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "swap">("calendar");

  // ── Site selection ───────────────────────────────────────────────────────
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const { data: siteOptionsData, isLoading: sitesLoading } =
    useScheduleSiteOptions(canAccessDutyManagement);
  const sites = useMemo(
    () => siteOptionsData?.data?.sites ?? [],
    [siteOptionsData],
  );

  // 현장 선택 시 초기화
  const handleSiteSelect = useCallback((id: string) => {
    setSelectedSiteId(id);
    setSelectedDate(null);
  }, []);

  useEffect(() => {
    if (sites.length === 0) return;
    if (!selectedSiteId || !sites.some((site) => site.id === selectedSiteId)) {
      setSelectedSiteId(sites[0].id);
      setSelectedDate(null);
    }
  }, [selectedSiteId, sites]);

  const effectiveSiteId = selectedSiteId ?? null;

  // ── Calendar schedules ───────────────────────────────────────────────────
  const calendarParams = useMemo(
    () => ({ year: String(year), month: String(month) }),
    [year, month],
  );

  const {
    data: scheduleData,
    isLoading: schedulesLoading,
    isError: schedulesError,
  } = useCalendarSchedules(effectiveSiteId ?? "", calendarParams);

  const schedules: CalendarScheduleItem[] = useMemo(
    () => scheduleData?.data?.schedules ?? [],
    [scheduleData],
  );
  const workerSummary = useMemo(
    () =>
      scheduleData?.data && "workerSummary" in scheduleData.data
        ? scheduleData.data.workerSummary
        : [],
    [scheduleData],
  );

  const {
    data: dateDetailData,
    isLoading: dateDetailLoading,
  } = useScheduleDateDetail(effectiveSiteId ?? "", selectedDate);

  const {
    data: scheduleCandidatesData,
    isLoading: candidatesLoading,
  } = useScheduleCandidates(effectiveSiteId ?? "", selectedDate);

  const dateSchedules: CalendarScheduleItem[] = useMemo(
    () => dateDetailData?.data?.schedules ?? [],
    [dateDetailData],
  );
  const dateCandidates = useMemo(
    () => scheduleCandidatesData?.data?.users ?? [],
    [scheduleCandidatesData],
  );

  // Build zone → palette index map (stable by sortOrder)
  const zoneColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueZones = new Map<string, { id: string; sortOrder: number }>();
    for (const schedule of schedules) {
      uniqueZones.set(schedule.zone.id, {
        id: schedule.zone.id,
        sortOrder: schedule.zone.sortOrder,
      });
    }
    Array.from(uniqueZones.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((zone, idx) => {
        map.set(zone.id, ZONE_PALETTES[idx % ZONE_PALETTES.length]);
      });
    return map;
  }, [schedules]);

  // Stats
  const totalWorkerAssignments = useMemo(
    () => schedules.reduce((sum, s) => sum + s.zone.workers.length, 0),
    [schedules],
  );
  const scheduledDays = useMemo(
    () => new Set(schedules.map((s) => s.scheduleDate)).size,
    [schedules],
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <MonthNav
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 hover:text-text transition-colors"
          >
            오늘
          </button>
        </div>
      </div>

      {!canAccessDutyManagement && (
        <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            당직 관리 페이지에 접근할 수 없습니다.
          </p>
        </div>
      )}

      {/* ── Site Selector ── */}
      {canAccessDutyManagement && (
        <div className="bg-surface border border-border rounded-2xl px-4 py-3.5 space-y-2 shadow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            현장 선택
          </p>
          <SiteSelector
            sites={sites}
            selectedId={effectiveSiteId}
            isLoading={sitesLoading}
            onSelect={handleSiteSelect}
          />
        </div>
      )}

      {/* ── Stats ── */}
      {effectiveSiteId && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={CalendarDays}
            label="이달 스케줄 일수"
            value={scheduledDays}
            color="bg-primary/15 text-primary-foreground"
            isLoading={schedulesLoading}
          />
          <StatCard
            icon={Building2}
            label="이달 구역 배정 수"
            value={schedules.length}
            color="bg-secondary/30 text-secondary-foreground"
            isLoading={schedulesLoading}
          />
          <StatCard
            icon={CalendarDays}
            label="이달 인력 배정 수"
            value={totalWorkerAssignments}
            color="bg-success/20 text-success-foreground"
            isLoading={schedulesLoading}
          />
        </div>
      )}

      {/* ── View Tabs ── */}
      {effectiveSiteId && (
        <div className="inline-flex w-full sm:w-auto rounded-2xl border border-border bg-surface p-1 shadow-card">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              activeTab === "calendar"
                ? "bg-primary text-primary-foreground shadow-field"
                : "text-muted-foreground hover:bg-muted hover:text-text",
            )}
          >
            <CalendarDays className="w-4 h-4" />
            스케줄 달력
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(null);
              setActiveTab("swap");
            }}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              activeTab === "swap"
                ? "bg-primary text-primary-foreground shadow-field"
                : "text-muted-foreground hover:bg-muted hover:text-text",
            )}
          >
            <ArrowLeftRight className="w-4 h-4" />
            교환 요청
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {schedulesError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-danger/20 text-danger-foreground rounded-xl border border-danger/40">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            스케줄을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}

      {/* ── No Site Selected ── */}
      {!effectiveSiteId && !sitesLoading && (
        <div className="flex items-center justify-center py-20 text-center text-muted-foreground">
          <div>
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">위에서 현장을 선택해주세요.</p>
            <p className="text-xs mt-1 opacity-70">선택한 현장의 당직 스케줄을 달력에서 확인하고 관리할 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      {effectiveSiteId && activeTab === "calendar" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
            {/* Calendar */}
            <div className="min-w-0">
              <DutyCalendar
                year={year}
                month={month}
                schedules={schedules}
                isLoading={schedulesLoading}
                canManage={canManage}
                selectedDate={selectedDate}
                zoneColorMap={zoneColorMap}
                onSelectDate={setSelectedDate}
                onAddSchedule={setSelectedDate}
                onZoneClick={(s) => setSelectedDate(s.scheduleDate)}
              />
            </div>

            {/* Monthly Worker Stats — 우측 고정 컬럼 */}
            <div className="xl:sticky xl:top-4 bg-surface border border-border rounded-2xl p-4 shadow-card overflow-y-auto max-h-[calc(100vh-6rem)]">
              <MonthlyWorkerStats
                siteId={effectiveSiteId!}
                workerSummary={workerSummary}
                year={year}
                month={month}
                isLoading={schedulesLoading}
              />
            </div>
          </div>
        </>
      )}

      {effectiveSiteId && activeTab === "swap" && (
        <SwapRequestPanel
          siteId={effectiveSiteId}
          year={year}
          month={month}
          schedules={schedules}
        />
      )}

      {/* ── 인력 배정 모달 ── */}
      {selectedDate && effectiveSiteId && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDate(null)}
          >
            <div
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <DutyWorkerSidebar
                selectedDate={selectedDate}
                siteId={effectiveSiteId}
                candidates={dateCandidates}
                dateSchedules={dateSchedules}
                allMonthSchedules={schedules}
                calendarParams={calendarParams}
                canManage={canManage}
                onClose={() => setSelectedDate(null)}
              />
              {(dateDetailLoading || candidatesLoading) && (
                <div className="absolute inset-0 rounded-2xl bg-surface/60 backdrop-blur-[1px] flex items-center justify-center text-sm text-muted-foreground">
                  불러오는 중…
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

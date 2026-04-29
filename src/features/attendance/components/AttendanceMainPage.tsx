"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useSiteList } from "@/features/site/hooks/useSites";
import { useSiteSummaries } from "../hooks/useAttendance";
import { cn } from "@/lib/utils";
import type { SiteItem } from "@/types/site";
import type { AttendanceSummary } from "@/types/attendance";

// ─── 오늘 날짜 (YYYY-MM-DD) ─────────────────────────────────────────────────

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY_SUMMARY: AttendanceSummary = {
  present: 0,
  late: 0,
  earlyLeave: 0,
  absent: 0,
  excused: 0,
};

// ─── Summary Stat ─────────────────────────────────────────────────────────────

function SummaryStat({
  icon: Icon,
  label,
  value,
  colorClass,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1 py-2 rounded-lg", colorClass)}>
      <Icon className="w-3.5 h-3.5" />
      <span className={cn("text-base font-bold leading-none", highlight && "text-danger-foreground")}>
        {value}
      </span>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
    </div>
  );
}

// ─── Site Card ────────────────────────────────────────────────────────────────

function SiteAttendanceCard({
  site,
  summary,
}: {
  site: SiteItem;
  summary: AttendanceSummary;
}) {
  const router = useRouter();
  const hasWarning = summary.absent > 0 || summary.late > 0;
  const hasData = Object.values(summary).some((v) => v > 0);

  return (
    <button
      onClick={() => router.push(`/attendance/${site.id}`)}
      className={cn(
        "w-full text-left bg-surface rounded-xl border shadow-card p-5 transition-all hover:shadow-card-hover hover:-translate-y-0.5",
        hasWarning ? "border-danger/50" : "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 shrink-0">
            <Clock className="w-5 h-5 text-primary-foreground" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-strong truncate">{site.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {site.siteType?.name ?? "미분류"}
            </p>
          </div>
        </div>
        {hasWarning && (
          <span className="flex items-center gap-1 bg-danger/20 text-danger-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <AlertTriangle className="w-3 h-3" />
            주의
          </span>
        )}
      </div>

      {/* Summary Grid */}
      {hasData ? (
        <div className="grid grid-cols-5 gap-2">
          <SummaryStat icon={CheckCircle2} label="출근" value={summary.present} colorClass="text-success-foreground bg-success/20" />
          <SummaryStat icon={Timer} label="지각" value={summary.late} colorClass="text-danger-foreground bg-danger/20" highlight={summary.late > 0} />
          <SummaryStat icon={LogOut} label="조퇴" value={summary.earlyLeave} colorClass="text-secondary-foreground bg-secondary/20" />
          <SummaryStat icon={XCircle} label="결근" value={summary.absent} colorClass="text-danger-foreground bg-danger/20" highlight={summary.absent > 0} />
          <SummaryStat icon={ShieldCheck} label="사유" value={summary.excused} colorClass="text-primary-foreground bg-primary/20" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">
          금일 출결 데이터 없음
        </p>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AttendanceMainPage() {
  const [search, setSearch] = useState("");
  const today = useMemo(() => getToday(), []);

  // 현장 전체 목록 (출결 데이터 없는 현장도 포함)
  const { data: siteData, isLoading: sitesLoading } = useSiteList({ page: 1, take: 100 });
  // 금일 출결 요약 (출결 데이터 있는 현장만)
  const { data: summaryData, isLoading: summaryLoading } = useSiteSummaries(today);

  const isLoading = sitesLoading || summaryLoading;

  // siteId → summary 맵
  const summaryMap = useMemo(() => {
    const map = new Map<string, AttendanceSummary>();
    for (const item of summaryData?.data?.siteSummaries ?? []) {
      map.set(item.siteId, item.summary);
    }
    return map;
  }, [summaryData]);

  const sites = siteData?.data?.sites ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((s) => s.name.toLowerCase().includes(q));
  }, [sites, search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-5 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-6 h-6 text-primary-foreground" />
              <h1 className="text-2xl font-bold text-text-strong tracking-tight">출결 관리</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              현장별 금일 출결 현황을 확인하고 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="현장명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
          />
        </div>

        {/* Site Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-surface rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "검색 결과가 없습니다" : "등록된 현장이 없습니다"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((site) => (
              <SiteAttendanceCard
                key={site.id}
                site={site}
                summary={summaryMap.get(site.id) ?? EMPTY_SUMMARY}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

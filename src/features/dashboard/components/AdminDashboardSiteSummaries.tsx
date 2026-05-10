"use client";

import Link from "next/link";
import { Building2, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AdminDashboardSiteStatus,
  AdminDashboardSiteSummary,
} from "@/types/dashboard";
import {
  formatCoverageRate,
  getSlotCoverageRate,
  SITE_STATUS_LABEL,
} from "../lib/dashboardFormat";

const STATUS_CLASS: Record<AdminDashboardSiteStatus, string> = {
  planned: "bg-secondary/25 text-secondary-foreground",
  active: "bg-success/20 text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

function SiteSummaryCard({ site }: { site: AdminDashboardSiteSummary }) {
  const coverageRate = getSlotCoverageRate(site.assignedSlots, site.totalSlots);
  const locationIssues = site.staleLocations + site.outOfZoneLocations;

  return (
    <Link
      href={`/attendance/${encodeURIComponent(site.siteId)}`}
      className="rounded-lg border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-text-strong">
              {site.siteName}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              배정 {site.assignedSlots} / {site.totalSlots}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
            STATUS_CLASS[site.status],
          )}
        >
          {SITE_STATUS_LABEL[site.status]}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-text">배정률</span>
          <span className="font-bold text-text-strong">
            {formatCoverageRate(coverageRate)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-400"
            style={{ width: `${Math.min(100, coverageRate)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Metric label="출근" value={site.checkedIn} tone="success" />
        <Metric label="지각" value={site.late} tone="secondary" />
        <Metric label="결근" value={site.absent} tone="danger" />
        <Metric label="미퇴근" value={site.notCheckedOut} tone="muted" />
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <MapPinOff className="h-3.5 w-3.5" />
        <span>
          위치 이상 {locationIssues}건
          <span className="ml-1">
            지연 {site.staleLocations} · 이탈 {site.outOfZoneLocations}
          </span>
        </span>
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "secondary" | "danger" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-2 py-2",
        tone === "success" && "bg-success/15 text-success-foreground",
        tone === "secondary" && "bg-secondary/20 text-secondary-foreground",
        tone === "danger" && "bg-danger/20 text-danger-foreground",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      <p className="text-sm font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold">{label}</p>
    </div>
  );
}

export function AdminDashboardSiteSummaries({
  sites,
}: {
  sites: AdminDashboardSiteSummary[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-strong">
            현장별 요약
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            배정, 출결, 위치 이상을 현장 단위로 확인합니다.
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {sites.length}개 현장
        </span>
      </div>

      {sites.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-12 text-center text-sm text-muted-foreground shadow-card">
          표시할 현장 요약이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {sites.map((site) => (
            <SiteSummaryCard key={site.siteId} site={site} />
          ))}
        </div>
      )}
    </section>
  );
}

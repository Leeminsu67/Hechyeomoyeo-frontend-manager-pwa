"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MapPinOff,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@/types/dashboard";
import { formatCoverageRate } from "../lib/dashboardFormat";

type KpiItem = {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: "primary" | "success" | "secondary" | "danger" | "muted";
};

const KPI_TONE_CLASS: Record<KpiItem["tone"], string> = {
  primary: "bg-primary/20 text-primary-foreground",
  success: "bg-success/20 text-success-foreground",
  secondary: "bg-secondary/25 text-secondary-foreground",
  danger: "bg-danger/25 text-danger-foreground",
  muted: "bg-muted text-muted-foreground",
};

function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-bold leading-none text-text-strong">
            {item.value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
            KPI_TONE_CLASS[item.tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 truncate text-xs text-muted-foreground">
        {item.detail}
      </p>
    </div>
  );
}

export function AdminDashboardKpiGrid({ data }: { data: AdminDashboardData }) {
  const approvalPending =
    data.approvals.leavePending +
    data.approvals.swapPending +
    data.approvals.manualClockOutPending;
  const locationIssues = data.locations.stale + data.locations.outOfZone;

  const items: KpiItem[] = [
    {
      label: "운영 현장",
      value: `${data.sites.active} / ${data.sites.total}`,
      detail: `예정 ${data.sites.planned} · 종료 ${data.sites.closed}`,
      icon: Users,
      tone: "primary",
    },
    {
      label: "오늘 배정률",
      value: formatCoverageRate(data.todaySchedule.coverageRate),
      detail: `${data.todaySchedule.assignedSlots} / ${data.todaySchedule.totalSlots} 슬롯`,
      icon: ClipboardList,
      tone: data.todaySchedule.unassignedSlots > 0 ? "secondary" : "success",
    },
    {
      label: "미배정 슬롯",
      value: String(data.todaySchedule.unassignedSlots),
      detail: "오늘 당직 기준",
      icon: AlertTriangle,
      tone: data.todaySchedule.unassignedSlots > 0 ? "danger" : "muted",
    },
    {
      label: "출근 인원",
      value: `${data.attendance.checkedIn} / ${data.attendance.scheduledWorkers}`,
      detail: `지각 ${data.attendance.late} · 결근 ${data.attendance.absent}`,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "승인 대기",
      value: String(approvalPending),
      detail: `휴가 ${data.approvals.leavePending} · 교환 ${data.approvals.swapPending} · 퇴근 ${data.approvals.manualClockOutPending}`,
      icon: ShieldCheck,
      tone: approvalPending > 0 ? "secondary" : "muted",
    },
    {
      label: "위치 이상",
      value: String(locationIssues),
      detail: `지연 ${data.locations.stale} · 이탈 ${data.locations.outOfZone}`,
      icon: MapPinOff,
      tone: locationIssues > 0 ? "danger" : "muted",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}
    </div>
  );
}

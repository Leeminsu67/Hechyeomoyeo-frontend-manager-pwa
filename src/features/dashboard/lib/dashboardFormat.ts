import type {
  AdminDashboardRiskSeverity,
  AdminDashboardRiskType,
  AdminDashboardScopeMode,
  AdminDashboardSiteStatus,
} from "@/types/dashboard";

export function formatDashboardDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}.${month}.${day}`;
}

export function formatCoverageRate(rate: number) {
  const normalized = rate <= 1 ? rate * 100 : rate;
  return `${Math.round(normalized)}%`;
}

export function getSlotCoverageRate(assigned: number, total: number) {
  if (total <= 0) return 0;
  return (assigned / total) * 100;
}

export function formatKstDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const DASHBOARD_SCOPE_LABEL: Record<AdminDashboardScopeMode, string> = {
  company: "회사 전체",
  supervisedSites: "담당 현장",
  site: "단일 현장",
};

export const SITE_STATUS_LABEL: Record<AdminDashboardSiteStatus, string> = {
  planned: "예정",
  active: "운영",
  closed: "종료",
};

export const RISK_TYPE_LABEL: Record<AdminDashboardRiskType, string> = {
  schedule: "당직",
  attendance: "출결",
  location: "위치",
  approval: "승인",
};

export const RISK_SEVERITY_LABEL: Record<
  AdminDashboardRiskSeverity,
  string
> = {
  warning: "주의",
  critical: "긴급",
};

export type AdminDashboardScopeMode = "company" | "supervisedSites" | "site";
export type AdminDashboardSiteStatus = "planned" | "active" | "closed";
export type AdminDashboardRiskType =
  | "schedule"
  | "attendance"
  | "location"
  | "approval";
export type AdminDashboardRiskSeverity = "warning" | "critical";

export interface AdminDashboardScope {
  mode: AdminDashboardScopeMode;
  siteId: string | null;
}

export interface AdminDashboardSites {
  total: number;
  planned: number;
  active: number;
  closed: number;
}

export interface AdminDashboardTodaySchedule {
  totalSlots: number;
  assignedSlots: number;
  unassignedSlots: number;
  incompleteSchedules: number;
  incompleteSlots: number;
  coverageRate: number;
}

export interface AdminDashboardAttendance {
  scheduledWorkers: number;
  checkedIn: number;
  late: number;
  earlyLeave: number;
  absent: number;
  notCheckedOut: number;
}

export interface AdminDashboardApprovals {
  leavePending: number;
  swapPending: number;
  manualClockOutPending: number;
}

export interface AdminDashboardLocations {
  trackedUsers: number;
  online: number;
  stale: number;
  outOfZone: number;
}

export interface AdminDashboardSiteSummary {
  siteId: string;
  siteName: string;
  status: AdminDashboardSiteStatus;
  totalSlots: number;
  assignedSlots: number;
  unassignedSlots: number;
  incompleteSchedules: number;
  incompleteSlots: number;
  scheduledWorkers: number;
  checkedIn: number;
  late: number;
  earlyLeave: number;
  absent: number;
  notCheckedOut: number;
  staleLocations: number;
  outOfZoneLocations: number;
}

export interface AdminDashboardRiskItem {
  type: AdminDashboardRiskType;
  severity: AdminDashboardRiskSeverity;
  title: string;
  siteId: string | null;
  siteName: string | null;
  targetId: string | null;
  targetName: string | null;
  createdAt: string;
}

export interface AdminDashboardData {
  date: string;
  timezone: "Asia/Seoul" | string;
  scope: AdminDashboardScope;
  sites: AdminDashboardSites;
  todaySchedule: AdminDashboardTodaySchedule;
  attendance: AdminDashboardAttendance;
  approvals: AdminDashboardApprovals;
  locations: AdminDashboardLocations;
  siteSummaries: AdminDashboardSiteSummary[];
  riskItems: AdminDashboardRiskItem[];
}

export interface AdminDashboardParams {
  siteId?: string;
}

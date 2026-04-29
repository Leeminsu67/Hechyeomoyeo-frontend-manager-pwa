// ─── Attendance Status ───────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "late" | "earlyLeave" | "absent" | "excused";

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; short: string }
> = {
  present: { label: "정상", color: "success", short: "O" },
  late: { label: "지각", color: "danger", short: "지" },
  earlyLeave: { label: "조퇴", color: "secondary", short: "조" },
  absent: { label: "결근", color: "danger", short: "결" },
  excused: { label: "사유인정", color: "primary", short: "인" },
};

// ─── Alert Type ──────────────────────────────────────────────────────────────

export type AlertType =
  | "lateCheckIn"
  | "noCheckIn"
  | "earlyCheckOut"
  | "noCheckOut"
  | "locationMismatch";

export const ALERT_TYPE_META: Record<AlertType, { label: string }> = {
  lateCheckIn: { label: "지각" },
  noCheckIn: { label: "미출근" },
  earlyCheckOut: { label: "조퇴" },
  noCheckOut: { label: "미퇴근" },
  locationMismatch: { label: "위치불일치" },
};

// ─── Attendance Record ───────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  memo: string | null;
  user: {
    id: string;
    name: string;
  };
  schedule: {
    id: string;
    scheduleDate: string;
    zone: {
      name: string;
    };
  };
}

export interface AttendanceListResponse {
  data: {
    attendances: AttendanceRecord[];
  };
}

// ─── Status Summary ──────────────────────────────────────────────────────────

export interface AttendanceSummary {
  present: number;
  late: number;
  earlyLeave: number;
  absent: number;
  excused: number;
}

export interface AttendanceSummaryResponse {
  data: {
    summary: AttendanceSummary;
  };
}

// ─── Monthly Report ──────────────────────────────────────────────────────────

export interface MonthlyRecord {
  date: string;
  zoneName: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export interface MonthlyReportUser {
  userId: string;
  userName: string;
  records: MonthlyRecord[];
  summary: AttendanceSummary;
}

export interface MonthlyReportResponse {
  data: {
    month: string;
    siteId: string;
    report: MonthlyReportUser[];
  };
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export interface AttendanceAlert {
  id: string;
  alertType: AlertType;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  schedule: {
    scheduleDate: string;
    zone: {
      name: string;
    };
  };
  attendance: AttendanceRecord | null;
}

export interface AlertListResponse {
  data: {
    alerts: AttendanceAlert[];
  };
}

// ─── Mutation DTOs ───────────────────────────────────────────────────────────

export interface UpdateAttendanceDto {
  status: "excused";
  memo: string;
}

// ─── Site Summaries ──────────────────────────────────────────────────────────

export interface SiteAttendanceSummary {
  siteId: string;
  siteName: string;
  summary: AttendanceSummary;
}

export interface SiteSummariesResponse {
  data: {
    date: string;
    siteSummaries: SiteAttendanceSummary[];
  };
}

export interface ManualCheckInDto {
  scheduleId: string;
  userId: string;
  checkInTime?: string; // ISO 8601 (e.g. "2025-04-14T09:00:00")
}

export interface ManualCheckOutDto {
  scheduleId: string;
  userId: string;
  checkOutTime?: string; // ISO 8601
}

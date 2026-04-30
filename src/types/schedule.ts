import type { SiteStatus } from "./site";

// Backend ScheduleStatus: numeric enum 0=scheduled, 1=completed, 2=cancelled
export type ScheduleStatus = 0 | 1 | 2;

export const SCHEDULE_STATUS_META: Record<
  ScheduleStatus,
  { label: string; colorClass: string }
> = {
  0: { label: '예정', colorClass: 'bg-secondary/30 text-secondary-foreground' },
  1: { label: '완료', colorClass: 'bg-success/30 text-success-foreground' },
  2: { label: '취소', colorClass: 'bg-muted text-muted-foreground' },
};

export interface ScheduleWorker {
  id: string;
  loginId: string;
  role: number;
  name: string;
}

export interface ScheduleWorkerSummary extends ScheduleWorker {
  assignmentCount: number;
}

export interface ScheduleSiteOption {
  id: string;
  name: string;
  displayCode: number;
  status: SiteStatus;
  operationStartDate: string;
  operationEndDate: string;
}

export interface ScheduleSiteOptionsResponse {
  data: {
    sites: ScheduleSiteOption[];
  };
}

export interface ScheduleDateCandidate extends ScheduleWorker {
  available: boolean;
  unavailableReasons: Array<
    | "alreadyScheduled"
    | "approvedLeave"
    | "outsideSiteOperationPeriod"
    | string
  >;
  assignedScheduleId: string | null;
  assignedZoneName: string | null;
}

export interface ScheduleZoneSlot {
  zoneId: string;
  zoneName: string;
  sortOrder: number;
  requiredWorkers: number;
  scheduleId: string | null;
  status: ScheduleStatus;
  workers: ScheduleWorker[];
  assignedCount: number;
  missingCount: number;
  isFullyAssigned: boolean;
}

export interface ScheduleMonthDay {
  date: string;
  zones: ScheduleZoneSlot[];
}

export interface ScheduleManager {
  id: string;
  name: string;
  loginId: string;
}

// Compatibility shape used by the calendar UI.
export interface CalendarScheduleZone {
  id: string;
  name: string;
  sortOrder: number;
  workStartTime: string | null;
  workEndTime: string | null;
  workers: ScheduleWorker[];
  manager?: ScheduleManager;
}

export interface CalendarScheduleItem {
  id: string;
  scheduleId: string | null;
  scheduleDate: string; // 'YYYY-MM-DD'
  status: ScheduleStatus;
  zone: CalendarScheduleZone;
  requiredWorkers: number;
  assignedCount: number;
  missingCount: number;
  isFullyAssigned: boolean;
}

export interface ScheduleMonthResponse {
  data: {
    site: ScheduleSiteOption;
    year: number;
    month: number;
    days: ScheduleMonthDay[];
    workerSummary: ScheduleWorkerSummary[];
    schedules: CalendarScheduleItem[];
  };
}

export interface ScheduleDateDetailResponse {
  data: {
    site: ScheduleSiteOption;
    date: string;
    isOperatingDate: boolean;
    zones: ScheduleZoneSlot[];
    candidates: ScheduleDateCandidate[];
    schedules: CalendarScheduleItem[];
  };
}

export type CalendarScheduleResponse =
  | ScheduleMonthResponse
  | ScheduleDateDetailResponse;

// POST /schedule/site/:siteId/zone/:zoneId
export interface CreateSchedulePayload {
  scheduleDate: string; // 'YYYY-MM-DD'
  status: ScheduleStatus;
  workerIds: string[];
}

// PATCH /schedule/site/:siteId/:scheduleId
export interface UpdateSchedulePayload {
  scheduleDate?: string;
  status?: ScheduleStatus;
  workerIds?: string[];
}

export interface CalendarScheduleParams {
  year: string;
  month: string;
  day?: string;
}

// ─── Worker Calendar ──────────────────────────────────────────────────────────

/** 개별 인력 스케줄 항목 */
export interface WorkerScheduleItem {
  id: string;
  scheduleId: string;
  scheduleDate: string; // 'YYYY-MM-DD'
  status: ScheduleStatus;
  zone: { id: string; name: string };
}

/** GET /schedule/site/:siteId/worker/:userId/month */
export interface WorkerCalendarResponse {
  data: {
    worker: ScheduleWorker;
    year: number;
    month: number;
    assignments: WorkerScheduleItem[];
    total: number;
    totalDays: number;
    schedules: WorkerScheduleItem[];
  };
}

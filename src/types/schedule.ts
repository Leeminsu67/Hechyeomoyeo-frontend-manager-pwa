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
  name: string;
  loginId: string;
  role: number;
  phone?: string;
}

export interface ScheduleManager {
  id: string;
  name: string;
  loginId: string;
}

// Zone shape returned in GET /schedule/:siteId/calendar
// zone entity fields + workers/manager injected by the service
export interface CalendarScheduleZone {
  id: string;
  name: string;
  sortOrder: number;
  workStartTime: string | null;
  workEndTime: string | null;
  workers: ScheduleWorker[];
  manager: ScheduleManager;
}

export interface CalendarScheduleItem {
  id: string;
  scheduleDate: string; // 'YYYY-MM-DD'
  status: ScheduleStatus;
  zone: CalendarScheduleZone;
}

export interface CalendarScheduleResponse {
  data: { schedules: CalendarScheduleItem[] };
}

// POST /schedule/:zoneId
export interface CreateSchedulePayload {
  scheduleDate: string; // 'YYYY-MM-DD'
  status: ScheduleStatus;
  workerIds: string[];
}

// PATCH /schedule/:id
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

/** 개별 인력 스케줄 항목 (A·B API 공통) */
export interface WorkerScheduleItem {
  id: string;
  scheduleDate: string; // 'YYYY-MM-DD'
  status: ScheduleStatus;
  zone: { id: string; name: string };
}

/** A API: GET /schedule/:siteId/worker/:userId/calendar */
export interface WorkerCalendarResponse {
  data: {
    worker: { id: string; name: string };
    totalDays: number;
    schedules: WorkerScheduleItem[];
  };
}

/** B API: GET /schedule/:siteId/workers/calendar */
export interface WorkerCalendarEntry {
  id: string;
  name: string;
  totalDays: number;
  schedules: WorkerScheduleItem[];
}

export interface WorkersCalendarResponse {
  data: {
    workers: WorkerCalendarEntry[];
  };
}

// ─── Auto Assign ──────────────────────────────────────────────────────────────

// POST /schedule/auto-assign/:siteId
export interface AutoAssignDto {
  year: number;
  month: number;
  restDaysPerWeek: number;
}

export interface AutoAssignResponse {
  data: {
    created: number;
    schedules: CalendarScheduleItem[];
  };
}

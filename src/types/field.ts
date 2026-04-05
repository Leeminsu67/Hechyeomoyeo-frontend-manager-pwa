// ─── Field Site Type ──────────────────────────────────────────────────────────

export interface FieldSiteType {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

// ─── Field Site (외근 현장) ───────────────────────────────────────────────────

export interface FieldSite {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  fieldSiteType: Pick<FieldSiteType, "id" | "name" | "color"> | null;
  schedules?: Array<{ id: string; startDate: string; endDate?: string | null }>;
}

// ─── Field Work Log ───────────────────────────────────────────────────────────

export interface FieldWorkLog {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Field Work Schedule ──────────────────────────────────────────────────────

export interface FieldWorkSchedule {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD (null이면 당일 스케줄)
  createdAt: string;
  updatedAt: string;
  fieldSite: {
    id: string;
    title: string;
    latitude: number | null;
    longitude: number | null;
    fieldSiteType: Pick<FieldSiteType, "id" | "name" | "color"> | null;
  };
  workLogs: FieldWorkLog[];
}

// ─── API Params / DTOs ────────────────────────────────────────────────────────

export interface GetFieldSiteParams {
  page: number;
  take: number;
  title?: string;
}

export interface CreateFieldSiteDto {
  title: string;
  latitude?: number;
  longitude?: number;
  fieldSiteTypeId?: number;
}

export interface UpdateFieldSiteDto {
  title?: string;
  latitude?: number;
  longitude?: number;
  fieldSiteTypeId?: number | null;
}

export interface GetFieldWorkScheduleParams {
  year: number;
  month: number;
  fieldSiteId?: string;
}

export interface CreateFieldWorkScheduleDto {
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (optional, 미입력 시 당일 스케줄)
  fieldSiteId: string;
}

export interface UpdateFieldWorkScheduleDto {
  startDate?: string;
  endDate?: string | null;
  fieldSiteId?: string;
}
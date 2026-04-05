import apiClient from "@/lib/axios";

export interface CreateFieldWorkLogDto {
  scheduleId: string;
  startedAt?: string; // ISO 8601: 2026-03-28T09:00:00
  endedAt?: string;
  description?: string;
}

export const createFieldWorkLog = (dto: CreateFieldWorkLogDto) =>
  apiClient.post("/field-work-log", dto).then((r) => r.data);

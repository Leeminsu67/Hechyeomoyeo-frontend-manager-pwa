import apiClient from "@/lib/axios";
import type {
  CalendarScheduleResponse,
  CalendarScheduleParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  WorkerCalendarResponse,
  ScheduleDateDetailResponse,
  ScheduleSiteOptionsResponse,
  ScheduleZoneSlot,
  CalendarScheduleItem,
  WorkerScheduleItem,
} from "@/types/schedule";

function toDateString(params: CalendarScheduleParams) {
  if (!params.day) return null;
  return `${params.year}-${params.month.padStart(2, "0")}-${params.day.padStart(2, "0")}`;
}

function toCalendarSchedule(date: string, zone: ScheduleZoneSlot): CalendarScheduleItem {
  return {
    id: zone.scheduleId ?? `${date}:${zone.zoneId}`,
    scheduleId: zone.scheduleId,
    scheduleDate: date,
    status: zone.status,
    zone: {
      id: zone.zoneId,
      name: zone.zoneName,
      sortOrder: zone.sortOrder,
      workStartTime: null,
      workEndTime: null,
      workers: zone.workers,
    },
    requiredWorkers: zone.requiredWorkers,
    assignedCount: zone.assignedCount,
    missingCount: zone.missingCount,
    isFullyAssigned: zone.isFullyAssigned,
  };
}

function withMonthSchedules<T extends { data: { days: Array<{ date: string; zones: ScheduleZoneSlot[] }> } }>(
  payload: T,
) {
  return {
    ...payload,
    data: {
      ...payload.data,
      schedules: payload.data.days.flatMap((day) =>
        day.zones.map((zone) => toCalendarSchedule(day.date, zone)),
      ),
    },
  };
}

function withDateSchedules<T extends { data: { date: string; zones: ScheduleZoneSlot[] } }>(
  payload: T,
) {
  return {
    ...payload,
    data: {
      ...payload.data,
      schedules: payload.data.zones.map((zone) =>
        toCalendarSchedule(payload.data.date, zone),
      ),
    },
  };
}

// GET /schedule/site-options
export const getScheduleSiteOptions = async (): Promise<ScheduleSiteOptionsResponse> => {
  const response = await apiClient.get("/schedule/site-options");
  return response.data;
};

// GET /schedule/site/:siteId/month?year=&month=
export const getCalendarSchedules = async (
  siteId: string,
  params: CalendarScheduleParams,
): Promise<CalendarScheduleResponse> => {
  const date = toDateString(params);

  if (date) {
    const response = await apiClient.get(`/schedule/site/${siteId}/date`, {
      params: { date },
    });
    return withDateSchedules(response.data);
  }

  const response = await apiClient.get(`/schedule/site/${siteId}/month`, {
    params: { year: params.year, month: params.month },
  });
  return withMonthSchedules(response.data);
};

// GET /schedule/site/:siteId/date?date=
export const getScheduleDateDetail = async (
  siteId: string,
  date: string,
): Promise<ScheduleDateDetailResponse> => {
  const response = await apiClient.get(`/schedule/site/${siteId}/date`, {
    params: { date },
  });
  return withDateSchedules(response.data);
};

// POST /schedule/site/:siteId/zone/:zoneId
export const createSchedule = async (
  siteId: string,
  zoneId: string,
  dto: CreateSchedulePayload,
): Promise<{ data: { schedule: { id: string } } }> => {
  const response = await apiClient.post(
    `/schedule/site/${siteId}/zone/${zoneId}`,
    dto,
  );
  return response.data;
};

// PATCH /schedule/site/:siteId/:scheduleId
export const updateSchedule = async ({
  siteId,
  id,
  dto,
}: {
  siteId: string;
  id: string;
  dto: UpdateSchedulePayload;
}): Promise<{ data: { schedule: { id: string } } }> => {
  const response = await apiClient.patch(`/schedule/site/${siteId}/${id}`, dto);
  return response.data;
};

// DELETE /schedule/site/:siteId/:scheduleId
export const deleteSchedule = async (
  siteId: string,
  id: string,
): Promise<void> => {
  await apiClient.delete(`/schedule/site/${siteId}/${id}`);
};

// GET /schedule/site/:siteId/worker/:userId/month?year=&month=
export const getWorkerCalendar = async (
  siteId: string,
  userId: string,
  params: { year: string; month: string },
): Promise<WorkerCalendarResponse> => {
  const response = await apiClient.get(
    `/schedule/site/${siteId}/worker/${userId}/month`,
    { params },
  );
  const data = response.data.data;
  const assignments: WorkerScheduleItem[] = data.assignments.map(
    (assignment: Omit<WorkerScheduleItem, "id">) => ({
      ...assignment,
      id: assignment.scheduleId,
    }),
  );
  return {
    ...response.data,
    data: {
      ...data,
      assignments,
      schedules: assignments,
      totalDays: data.total,
    },
  };
};

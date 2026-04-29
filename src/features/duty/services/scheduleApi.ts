import apiClient from "@/lib/axios";
import type {
  CalendarScheduleResponse,
  CalendarScheduleParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  AutoAssignDto,
  AutoAssignResponse,
  WorkerCalendarResponse,
  WorkersCalendarResponse,
} from "@/types/schedule";

// GET /schedule/:siteId/calendar?year=&month=&day=
export const getCalendarSchedules = async (
  siteId: string,
  params: CalendarScheduleParams,
): Promise<CalendarScheduleResponse> => {
  const response = await apiClient.get(`/schedule/${siteId}/calendar`, {
    params,
  });
  return response.data;
};

// POST /schedule/:zoneId
export const createSchedule = async (
  zoneId: string,
  dto: CreateSchedulePayload,
): Promise<{ data: { schedule: { id: string } } }> => {
  const response = await apiClient.post(`/schedule/${zoneId}`, dto);
  return response.data;
};

// PATCH /schedule/:id
export const updateSchedule = async ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateSchedulePayload;
}): Promise<{ data: { schedule: { id: string } } }> => {
  const response = await apiClient.patch(`/schedule/${id}`, dto);
  return response.data;
};

// DELETE /schedule/:id
export const deleteSchedule = async (id: string): Promise<void> => {
  await apiClient.delete(`/schedule/${id}`);
};

// GET /schedule/:siteId/worker/:userId/calendar?year=&month=
export const getWorkerCalendar = async (
  siteId: string,
  userId: string,
  params: { year: string; month: string },
): Promise<WorkerCalendarResponse> => {
  const response = await apiClient.get(
    `/schedule/${siteId}/worker/${userId}/calendar`,
    { params },
  );
  return response.data;
};

// GET /schedule/:siteId/workers/calendar?year=&month=
export const getWorkersCalendar = async (
  siteId: string,
  params: { year: string; month: string },
): Promise<WorkersCalendarResponse> => {
  const response = await apiClient.get(
    `/schedule/${siteId}/workers/calendar`,
    { params },
  );
  return response.data;
};

// POST /schedule/auto-assign/:siteId
export const autoAssignSchedule = async (
  siteId: string,
  dto: AutoAssignDto,
): Promise<AutoAssignResponse> => {
  const response = await apiClient.post(`/schedule/auto-assign/${siteId}`, dto);
  return response.data;
};

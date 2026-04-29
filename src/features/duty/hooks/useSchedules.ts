import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCalendarSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  autoAssignSchedule,
  getWorkerCalendar,
  getWorkersCalendar,
} from "../services/scheduleApi";
import type {
  CalendarScheduleParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  AutoAssignDto,
} from "@/types/schedule";

export const SCHEDULE_KEYS = {
  all: ["schedules"] as const,
  calendar: (siteId: string, params: CalendarScheduleParams) =>
    ["schedules", "calendar", siteId, params] as const,
  workerCalendar: (
    siteId: string,
    userId: string,
    params: { year: string; month: string },
  ) => ["schedules", "worker-calendar", siteId, userId, params] as const,
  workersCalendar: (siteId: string, params: { year: string; month: string }) =>
    ["schedules", "workers-calendar", siteId, params] as const,
};

export function useCalendarSchedules(
  siteId: string,
  params: CalendarScheduleParams,
) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.calendar(siteId, params),
    queryFn: () => getCalendarSchedules(siteId, params),
    enabled: !!siteId,
    placeholderData: (prev) => prev,
  });
}

// ── 스케줄 변경 시 calendar + workers-calendar 동시 무효화 헬퍼 ──
function invalidateScheduleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  siteId: string,
  params: CalendarScheduleParams,
) {
  queryClient.invalidateQueries({
    queryKey: SCHEDULE_KEYS.calendar(siteId, params),
  });
  queryClient.invalidateQueries({
    queryKey: ["schedules", "workers-calendar", siteId],
  });
}

export function useCreateSchedule(
  siteId: string,
  params: CalendarScheduleParams,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      zoneId,
      dto,
    }: {
      zoneId: string;
      dto: CreateSchedulePayload;
    }) => createSchedule(zoneId, dto),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, siteId, params);
      toast.success("스케줄이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "스케줄 등록에 실패했습니다.");
    },
  });
}

export function useUpdateSchedule(
  siteId: string,
  params: CalendarScheduleParams,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSchedulePayload }) =>
      updateSchedule({ id, dto }),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, siteId, params);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "스케줄 수정에 실패했습니다.");
    },
  });
}

export function useDeleteSchedule(
  siteId: string,
  params: CalendarScheduleParams,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, siteId, params);
    },
    onError: () => {
      toast.error("스케줄 삭제에 실패했습니다.");
    },
  });
}

export function useAutoAssignSchedule(
  siteId: string,
  params: CalendarScheduleParams,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AutoAssignDto) => autoAssignSchedule(siteId, dto),
    onSuccess: (data) => {
      invalidateScheduleQueries(queryClient, siteId, params);
      toast.success(`자동 배치 완료 (${data.data.created}건 생성)`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "자동 배치에 실패했습니다.");
    },
  });
}

// ── Worker Calendar Queries ──────────────────────────────────────────────────

/** A API: 특정 인력의 월별 배정 날짜 조회 */
export function useWorkerCalendar(
  siteId: string,
  userId: string,
  params: { year: string; month: string },
) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.workerCalendar(siteId, userId, params),
    queryFn: () => getWorkerCalendar(siteId, userId, params),
    enabled: !!siteId && !!userId,
  });
}

/** B API: 전체 인력의 월별 배정 현황 조회 */
export function useWorkersCalendar(
  siteId: string,
  params: { year: string; month: string },
) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.workersCalendar(siteId, params),
    queryFn: () => getWorkersCalendar(siteId, params),
    enabled: !!siteId,
    placeholderData: (prev) => prev,
  });
}

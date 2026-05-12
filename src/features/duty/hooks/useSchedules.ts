import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getScheduleSiteOptions,
  getCalendarSchedules,
  getScheduleDateDetail,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  autoAssignSchedules,
  getWorkerCalendar,
} from "../services/scheduleApi";
import { getAutoAssignCollectionCount } from "../lib/autoAssignResult";
import { getScheduleCandidates } from "@/features/field/services/userApi";
import type {
  AutoAssignSchedulePayload,
  CalendarScheduleParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
} from "@/types/schedule";

export const SCHEDULE_KEYS = {
  all: ["schedules"] as const,
  siteOptions: () => ["schedules", "site-options"] as const,
  calendar: (siteId: string, params: CalendarScheduleParams) =>
    ["schedules", "calendar", siteId, params] as const,
  date: (siteId: string, date: string | null) =>
    ["schedules", "date", siteId, date] as const,
  candidates: (siteId: string, date: string | null) =>
    ["schedules", "candidates", siteId, date] as const,
  workerCalendar: (
    siteId: string,
    userId: string,
    params: { year: string; month: string },
  ) => ["schedules", "worker-calendar", siteId, userId, params] as const,
};

export function useScheduleSiteOptions(enabled = true) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.siteOptions(),
    queryFn: getScheduleSiteOptions,
    enabled,
  });
}

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

export function useScheduleDateDetail(siteId: string, date: string | null) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.date(siteId, date),
    queryFn: () => getScheduleDateDetail(siteId, date ?? ""),
    enabled: !!siteId && !!date,
    placeholderData: (prev) => prev,
  });
}

export function useScheduleCandidates(siteId: string, date: string | null) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.candidates(siteId, date),
    queryFn: () => getScheduleCandidates(siteId, date ?? ""),
    enabled: !!siteId && !!date,
    placeholderData: (prev) => prev,
  });
}

// ── 스케줄 변경 시 월간 달력, 날짜 상세, 인력별 달력을 함께 무효화 ──
function invalidateScheduleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  siteId: string,
  params: CalendarScheduleParams,
) {
  queryClient.invalidateQueries({
    queryKey: SCHEDULE_KEYS.calendar(siteId, params),
  });
  queryClient.invalidateQueries({
    queryKey: ["schedules", "date", siteId],
  });
  queryClient.invalidateQueries({
    queryKey: ["schedules", "candidates", siteId],
  });
  queryClient.invalidateQueries({
    queryKey: ["schedules", "worker-calendar", siteId],
  });
  queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] });
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
    }) => createSchedule(siteId, zoneId, dto),
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
      updateSchedule({ siteId, id, dto }),
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
    mutationFn: (id: string) => deleteSchedule(siteId, id),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, siteId, params);
    },
    onError: () => {
      toast.error("스케줄 삭제에 실패했습니다.");
    },
  });
}

export function useAutoAssignSchedules(
  siteId: string,
  params: CalendarScheduleParams,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AutoAssignSchedulePayload) =>
      autoAssignSchedules(siteId, dto),
    onSuccess: (response) => {
      invalidateScheduleQueries(queryClient, siteId, params);

      const hasIncomplete =
        getAutoAssignCollectionCount(response.data.incompleteSlots) > 0;
      const hasUnassigned =
        getAutoAssignCollectionCount(response.data.unassignedSlots) > 0;

      if (hasUnassigned) {
        toast.error("배정 가능한 인력이 없어 생성되지 않은 근무가 있습니다.");
      } else if (hasIncomplete) {
        toast.warning(
          "필요 인원을 모두 채우지 못한 근무가 있습니다. 근무표에서 확인해 주세요.",
        );
      } else {
        toast.success(response.data.message || "근무 자동 배정이 완료되었습니다.");
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "자동 배정에 실패했습니다.");
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

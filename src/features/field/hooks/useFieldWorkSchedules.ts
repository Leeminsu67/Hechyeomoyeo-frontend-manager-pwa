import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFieldWorkSchedules,
  getFieldWorkSchedule,
  createFieldWorkSchedule,
  updateFieldWorkSchedule,
  deleteFieldWorkSchedule,
} from "../services/fieldWorkScheduleApi";
import type {
  CreateFieldWorkScheduleDto,
  GetFieldWorkScheduleParams,
  UpdateFieldWorkScheduleDto,
} from "@/types/field";

export const SCHEDULE_KEYS = {
  all: ["field-work-schedule"] as const,
  month: (params: GetFieldWorkScheduleParams) =>
    ["field-work-schedule", "month", params] as const,
  detail: (id: string) => ["field-work-schedule", "detail", id] as const,
};

export function useFieldWorkSchedule(id: string | null) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.detail(id ?? ""),
    queryFn: () => getFieldWorkSchedule(id!),
    enabled: !!id,
  });
}

export function useFieldWorkSchedules(params: GetFieldWorkScheduleParams) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.month(params),
    queryFn: () => getFieldWorkSchedules(params),
    enabled: !!params.year && !!params.month,
    placeholderData: (prev) => prev,
  });
}

export function useCreateFieldWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFieldWorkScheduleDto) => createFieldWorkSchedule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
      toast.success("외근 스케줄이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "스케줄 등록에 실패했습니다.");
    },
  });
}

export function useUpdateFieldWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFieldWorkScheduleDto }) =>
      updateFieldWorkSchedule({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
      toast.success("스케줄이 수정되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "스케줄 수정에 실패했습니다.");
    },
  });
}

export function useDeleteFieldWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFieldWorkSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
      toast.success("스케줄이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("스케줄 삭제에 실패했습니다.");
    },
  });
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFieldSites,
  createFieldSite,
  updateFieldSite,
  deleteFieldSite,
} from "../services/fieldSiteApi";
import type { CreateFieldSiteDto, GetFieldSiteParams, UpdateFieldSiteDto } from "@/types/field";
import { SCHEDULE_KEYS } from "./useFieldWorkSchedules";

export const FIELD_SITE_KEYS = {
  all: ["field-site"] as const,
  list: (params: GetFieldSiteParams) => ["field-site", "list", params] as const,
  detail: (id: string) => ["field-site", "detail", id] as const,
};

export function useFieldSiteList(params: GetFieldSiteParams) {
  return useQuery({
    queryKey: FIELD_SITE_KEYS.list(params),
    queryFn: () => getFieldSites(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateFieldSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFieldSiteDto) => createFieldSite(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_SITE_KEYS.all });
      toast.success("외근 현장이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "현장 등록에 실패했습니다.");
    },
  });
}

export function useUpdateFieldSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFieldSiteDto }) =>
      updateFieldSite({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_SITE_KEYS.all });
      toast.success("현장 정보가 수정되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "현장 수정에 실패했습니다.");
    },
  });
}

export function useDeleteFieldSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFieldSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_SITE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
      toast.success("현장이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("현장 삭제에 실패했습니다.");
    },
  });
}
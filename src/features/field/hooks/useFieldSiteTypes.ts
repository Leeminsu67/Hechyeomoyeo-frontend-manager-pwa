import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFieldSiteTypes,
  createFieldSiteType,
  updateFieldSiteType,
  deleteFieldSiteType,
} from "../services/fieldSiteTypeApi";

export const FIELD_SITE_TYPE_KEYS = {
  all: ["field-site-type"] as const,
  list: () => ["field-site-type", "list"] as const,
};

export function useFieldSiteTypeList() {
  return useQuery({
    queryKey: FIELD_SITE_TYPE_KEYS.list(),
    queryFn: () => getFieldSiteTypes(),
  });
}

export function useCreateFieldSiteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; color: string }) => createFieldSiteType(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_SITE_TYPE_KEYS.all });
      toast.success("현장 타입이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "타입 등록에 실패했습니다.");
    },
  });
}

export function useUpdateFieldSiteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: Partial<{ name: string; color: string }>;
    }) => updateFieldSiteType({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_SITE_TYPE_KEYS.all });
      toast.success("현장 타입이 수정되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "타입 수정에 실패했습니다.");
    },
  });
}

export function useDeleteFieldSiteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFieldSiteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FIELD_SITE_TYPE_KEYS.all });
      toast.success("현장 타입이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("타입 삭제에 실패했습니다.");
    },
  });
}

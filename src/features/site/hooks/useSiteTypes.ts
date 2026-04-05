import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSiteTypes,
  createSiteType,
  updateSiteType,
  deleteSiteType,
} from "../services/siteTypeApi";
import type { CreateSiteTypeDto, UpdateSiteTypeDto } from "@/types/site";

export const SITE_TYPE_KEYS = {
  all: ["siteTypes"] as const,
};

export function useSiteTypeList() {
  return useQuery({
    queryKey: SITE_TYPE_KEYS.all,
    queryFn: getSiteTypes,
  });
}

export function useCreateSiteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSiteTypeDto) => createSiteType(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_TYPE_KEYS.all });
      toast.success("사업 타입이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "사업 타입 등록에 실패했습니다.");
    },
  });
}

export function useUpdateSiteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateSiteTypeDto }) =>
      updateSiteType({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_TYPE_KEYS.all });
      toast.success("사업 타입이 수정되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "사업 타입 수정에 실패했습니다.");
    },
  });
}

export function useDeleteSiteType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSiteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_TYPE_KEYS.all });
      toast.success("사업 타입이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("사업 타입 삭제에 실패했습니다.");
    },
  });
}

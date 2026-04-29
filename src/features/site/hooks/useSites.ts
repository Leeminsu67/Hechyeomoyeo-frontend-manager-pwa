import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  getSiteUsers,
  assignSiteUsers,
  removeSiteUser,
} from "../services/siteApi";
import type { SiteListParams, CreateSiteDto, UpdateSiteDto, AssignUsersDto } from "@/types/site";

export const SITE_KEYS = {
  all: ["sites"] as const,
  list: (params: SiteListParams) => ["sites", "list", params] as const,
  detail: (id: string) => ["sites", "detail", id] as const,
  users: (siteId: string) => ["sites", "users", siteId] as const,
};

export function useSiteList(params: SiteListParams) {
  return useQuery({
    queryKey: SITE_KEYS.list(params),
    queryFn: () => getSites(params),
    placeholderData: (prev) => prev,
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: SITE_KEYS.detail(id),
    queryFn: () => getSite(id),
    enabled: !!id,
  });
}

export function useSiteUsers(siteId: string) {
  return useQuery({
    queryKey: SITE_KEYS.users(siteId),
    queryFn: () => getSiteUsers(siteId),
    enabled: !!siteId,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSiteDto) => createSite(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.all });
      toast.success("현장이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "현장 등록에 실패했습니다.");
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSiteDto }) =>
      updateSite({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.all });
      toast.success("현장 정보가 수정되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "현장 수정에 실패했습니다.");
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.all });
      toast.success("현장이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("현장 삭제에 실패했습니다.");
    },
  });
}

export function useAssignSiteUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, dto }: { siteId: string; dto: AssignUsersDto }) =>
      assignSiteUsers({ siteId, dto }),
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.users(siteId) });
      toast.success("인력 배치가 저장되었습니다.");
    },
    onError: () => {
      toast.error("인력 배치 저장에 실패했습니다.");
    },
  });
}

export function useRemoveSiteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, userId }: { siteId: string; userId: string }) =>
      removeSiteUser({ siteId, userId }),
    onSuccess: (_data, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.users(siteId) });
    },
    onError: () => {
      toast.error("인력 제거에 실패했습니다.");
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getZones,
  getZone,
  createZone,
  updateZone,
  deleteZone,
} from "../services/zoneApi";
import type {
  ZoneListParams,
  ZoneListResponse,
  CreateZoneDto,
  UpdateZoneDto,
} from "@/types/zone";

export const ZONE_KEYS = {
  all: (siteId: string) => ["zones", siteId] as const,
  list: (siteId: string, params: ZoneListParams) =>
    ["zones", siteId, "list", params] as const,
  detail: (siteId: string, id: string) =>
    ["zones", siteId, "detail", id] as const,
};

/** 구역 없을 때 백엔드가 404를 반환하므로, empty state로 변환 */
const EMPTY_RESPONSE: ZoneListResponse = { data: { zones: [], total: 0 } };

export function useZoneList(siteId: string, params: ZoneListParams) {
  return useQuery({
    queryKey: ZONE_KEYS.list(siteId, params),
    queryFn: async () => {
      try {
        return await getZones(siteId, params);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) return EMPTY_RESPONSE;
        throw err;
      }
    },
    enabled: !!siteId,
    placeholderData: (prev) => prev,
    retry: (failureCount, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}

/** GET /zone/:siteId/:id — 개별 조회 (description, repeatWeekdays 등 전체 필드 포함) */
export function useZone(siteId: string, id: string) {
  return useQuery({
    queryKey: ZONE_KEYS.detail(siteId, id),
    queryFn: () => getZone(id, siteId),
    enabled: !!siteId && !!id,
  });
}

export function useCreateZone(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateZoneDto) => createZone(siteId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all(siteId) });
      toast.success("구역이 등록되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "구역 등록에 실패했습니다.");
    },
  });
}

export function useUpdateZone(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateZoneDto }) =>
      updateZone({ id, siteId, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all(siteId) });
      toast.success("구역 정보가 수정되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "구역 수정에 실패했습니다.");
    },
  });
}

export function useDeleteZone(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteZone(id, siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all(siteId) });
      toast.success("구역이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("구역 삭제에 실패했습니다.");
    },
  });
}

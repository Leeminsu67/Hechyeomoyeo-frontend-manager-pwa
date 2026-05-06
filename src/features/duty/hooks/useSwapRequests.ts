import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveSwapRequest,
  createDirectSwapRequest,
  getSwapRequest,
  getSwapRequestsBySite,
  rejectSwapRequest,
} from "../services/swapRequestApi";
import type {
  DirectSwapRequestDto,
  SwapRequestListParams,
} from "@/types/swapRequest";

export const SWAP_REQUEST_KEYS = {
  all: ["swap-requests"] as const,
  site: (siteId: string) => ["swap-requests", "site", siteId] as const,
  list: (siteId: string, params: SwapRequestListParams) =>
    ["swap-requests", "site", siteId, "list", params] as const,
  detail: (id: string) => ["swap-requests", "detail", id] as const,
};

function invalidateSwapRequestQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  siteId?: string,
  id?: string,
) {
  if (siteId) {
    queryClient.invalidateQueries({ queryKey: SWAP_REQUEST_KEYS.site(siteId) });
  } else {
    queryClient.invalidateQueries({ queryKey: SWAP_REQUEST_KEYS.all });
  }

  if (id) {
    queryClient.invalidateQueries({ queryKey: SWAP_REQUEST_KEYS.detail(id) });
  }

  queryClient.invalidateQueries({ queryKey: ["schedules"] });
}

export function useSwapRequestList(
  siteId: string,
  params: SwapRequestListParams,
) {
  return useQuery({
    queryKey: SWAP_REQUEST_KEYS.list(siteId, params),
    queryFn: () => getSwapRequestsBySite(siteId, params),
    enabled: !!siteId,
    placeholderData: (prev) => prev,
  });
}

export function useSwapRequest(id: string | null) {
  return useQuery({
    queryKey: SWAP_REQUEST_KEYS.detail(id ?? ""),
    queryFn: () => getSwapRequest(id ?? ""),
    enabled: !!id,
  });
}

export function useApproveSwapRequest(siteId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveSwapRequest(id),
    onSuccess: (_data, id) => {
      invalidateSwapRequestQueries(queryClient, siteId, id);
      toast.success("교환 요청을 승인했습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "교환 요청 승인에 실패했습니다.");
    },
  });
}

export function useRejectSwapRequest(siteId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectSwapRequest(id),
    onSuccess: (_data, id) => {
      invalidateSwapRequestQueries(queryClient, siteId, id);
      toast.success("교환 요청을 반려했습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "교환 요청 반려에 실패했습니다.");
    },
  });
}

export function useCreateDirectSwapRequest(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: DirectSwapRequestDto) =>
      createDirectSwapRequest(siteId, dto),
    onSuccess: () => {
      invalidateSwapRequestQueries(queryClient, siteId);
      toast.success("직접 교환을 처리했습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "직접 교환 처리에 실패했습니다.");
    },
  });
}

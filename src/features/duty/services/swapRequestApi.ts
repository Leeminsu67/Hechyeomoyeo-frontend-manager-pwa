import apiClient from "@/lib/axios";
import type {
  DirectSwapRequestDto,
  SwapRequestItem,
  SwapRequestListParams,
  SwapRequestListResponse,
} from "@/types/swapRequest";

interface SwapRequestListPayload {
  swapRequests?: SwapRequestItem[];
  requests?: SwapRequestItem[];
  items?: SwapRequestItem[];
  total?: number;
}

interface ApiEnvelope<T> {
  data?: T;
}

function normalizeSwapRequestList(payload: unknown): SwapRequestListResponse {
  const envelope = payload as ApiEnvelope<SwapRequestListPayload>;
  const data = envelope.data ?? {};
  const swapRequests = data.swapRequests ?? data.requests ?? data.items ?? [];

  return {
    data: {
      swapRequests,
      total: data.total ?? swapRequests.length,
    },
  };
}

function normalizeSwapRequest(payload: unknown): SwapRequestItem {
  const envelope = payload as ApiEnvelope<{
    swapRequest?: SwapRequestItem;
  } | SwapRequestItem>;
  const data = envelope.data;

  if (data && "swapRequest" in data && data.swapRequest) {
    return data.swapRequest;
  }

  return data as SwapRequestItem;
}

export const getSwapRequestsBySite = async (
  siteId: string,
  params: SwapRequestListParams,
): Promise<SwapRequestListResponse> => {
  const response = await apiClient.get(`/swap-request/site/${siteId}`, {
    params,
  });
  return normalizeSwapRequestList(response.data);
};

export const getSwapRequest = async (
  id: string,
): Promise<SwapRequestItem> => {
  const response = await apiClient.get(`/swap-request/${id}`);
  return normalizeSwapRequest(response.data);
};

export const approveSwapRequest = async (
  id: string,
): Promise<SwapRequestItem> => {
  const response = await apiClient.patch(`/swap-request/${id}/approve`);
  return normalizeSwapRequest(response.data);
};

export const rejectSwapRequest = async (
  id: string,
): Promise<SwapRequestItem> => {
  const response = await apiClient.patch(`/swap-request/${id}/reject`);
  return normalizeSwapRequest(response.data);
};

export const createDirectSwapRequest = async (
  siteId: string,
  dto: DirectSwapRequestDto,
): Promise<SwapRequestItem> => {
  const response = await apiClient.post(
    `/swap-request/site/${siteId}/direct`,
    dto,
  );
  return normalizeSwapRequest(response.data);
};

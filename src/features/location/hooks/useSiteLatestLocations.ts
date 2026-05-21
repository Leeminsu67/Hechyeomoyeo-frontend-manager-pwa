import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createLocationMemo,
  getLocationHistory,
  getSiteLatestLocations,
  notifyLocationWorker,
} from "../api/locationApi";
import type {
  CreateLocationMemoDto,
  LocationHistoryParams,
  LocationWorkerNotificationDto,
} from "../types/location.types";

export const LOCATION_KEYS = {
  all: ["locations"] as const,
  latest: (siteId: string | null) =>
    ["locations", "site", siteId, "latest"] as const,
  history: (params: LocationHistoryParams | null) =>
    ["locations", "site", params?.siteId ?? null, "history", params] as const,
};

export function useSiteLatestLocations(siteId: string | null, enabled = true) {
  return useQuery({
    queryKey: LOCATION_KEYS.latest(siteId),
    queryFn: () => getSiteLatestLocations(siteId ?? ""),
    enabled: enabled && !!siteId,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  });
}

export function useLocationHistory(
  params: LocationHistoryParams | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: LOCATION_KEYS.history(params),
    queryFn: () => getLocationHistory(params as LocationHistoryParams),
    enabled: enabled && !!params,
  });
}

export function useNotifyLocationWorker() {
  return useMutation({
    mutationFn: ({
      attendanceId,
      dto,
    }: {
      attendanceId: string;
      dto: LocationWorkerNotificationDto;
    }) => notifyLocationWorker({ attendanceId, dto }),
    onSuccess: () => {
      toast.success("근무자에게 확인 알림을 보냈습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? "근무자 알림 발송에 실패했습니다.",
      );
    },
  });
}

export function useCreateLocationMemo() {
  return useMutation({
    mutationFn: ({
      attendanceId,
      dto,
    }: {
      attendanceId: string;
      dto: CreateLocationMemoDto;
    }) => createLocationMemo({ attendanceId, dto }),
    onSuccess: () => {
      toast.success("위치 확인 메모를 저장했습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? "위치 확인 메모 저장에 실패했습니다.",
      );
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import {
  getLocationHistory,
  getSiteLatestLocations,
  getSiteOnlineStatus,
} from "../api/locationApi";
import type { LocationHistoryParams } from "../types/location.types";

export const LOCATION_KEYS = {
  all: ["locations"] as const,
  latest: (siteId: string | null) =>
    ["locations", "site", siteId, "latest"] as const,
  onlineStatus: (siteId: string | null) =>
    ["locations", "site", siteId, "online-status"] as const,
  history: (params: LocationHistoryParams | null) =>
    ["locations", "site", params?.siteId ?? null, "history", params] as const,
};

export function useSiteLatestLocations(siteId: string | null) {
  return useQuery({
    queryKey: LOCATION_KEYS.latest(siteId),
    queryFn: () => getSiteLatestLocations(siteId ?? ""),
    enabled: !!siteId,
  });
}

export function useSiteOnlineStatus(siteId: string | null) {
  return useQuery({
    queryKey: LOCATION_KEYS.onlineStatus(siteId),
    queryFn: () => getSiteOnlineStatus(siteId ?? ""),
    enabled: !!siteId,
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

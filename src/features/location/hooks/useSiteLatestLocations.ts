import { useQuery } from "@tanstack/react-query";
import {
  getLocationHistory,
  getSiteLatestLocations,
} from "../api/locationApi";
import type { LocationHistoryParams } from "../types/location.types";

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

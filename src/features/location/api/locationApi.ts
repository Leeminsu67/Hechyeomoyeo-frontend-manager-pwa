import apiClient from "@/lib/axios";
import type {
  LocationHistoryParams,
  LocationPingPayload,
  SiteOnlineStatus,
} from "../types/location.types";

type LocationListPayload =
  | LocationPingPayload[]
  | { locations: LocationPingPayload[] }
  | { data: LocationPingPayload[] }
  | { data: { locations: LocationPingPayload[] } };

type OnlineStatusPayload = SiteOnlineStatus | { data: SiteOnlineStatus };

function unwrapLocationList(payload: LocationListPayload) {
  if (Array.isArray(payload)) return payload;
  if ("locations" in payload) return payload.locations;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data.locations;
}

function unwrapOnlineStatus(payload: OnlineStatusPayload) {
  if ("data" in payload) return payload.data;
  return payload;
}

export async function getSiteLatestLocations(siteId: string) {
  const response = await apiClient.get<LocationListPayload>(
    `/locations/site/${siteId}/latest`,
  );
  return unwrapLocationList(response.data);
}

export async function getSiteOnlineStatus(siteId: string) {
  const response = await apiClient.get<OnlineStatusPayload>(
    `/locations/site/${siteId}/online-status`,
  );
  return unwrapOnlineStatus(response.data);
}

export async function getLocationHistory({
  siteId,
  userId,
  from,
  to,
}: LocationHistoryParams) {
  const response = await apiClient.get<LocationListPayload>(
    `/locations/site/${siteId}/history`,
    {
      params: { userId, from, to },
    },
  );
  return unwrapLocationList(response.data);
}

import axios, { type AxiosRequestConfig } from "axios";
import apiClient from "@/lib/axios";
import type { LocationHistoryParams } from "../types/location.types";
import { normalizeLocationPayload, sortLocations } from "../lib/locationState";

type LocationListPayload = unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapLocationList(payload: LocationListPayload, fallbackSiteId: string) {
  if (Array.isArray(payload)) {
    return sortLocations(
      payload.flatMap((item) => {
        const normalized = normalizeLocationPayload(item, fallbackSiteId);
        return normalized ? [normalized] : [];
      }),
    );
  }

  if (!isRecord(payload)) return [];

  const data = payload.data;
  const siteId =
    isRecord(data) && typeof data.siteId === "string"
      ? data.siteId
      : fallbackSiteId;
  let list: unknown[] = [];
  if (Array.isArray(payload.workers)) list = payload.workers;
  else if (Array.isArray(payload.locations)) list = payload.locations;
  else if (Array.isArray(payload.history)) list = payload.history;
  else if (Array.isArray(data)) list = data;
  else if (isRecord(data) && Array.isArray(data.workers)) list = data.workers;
  else if (isRecord(data) && Array.isArray(data.locations)) {
    list = data.locations;
  }

  return sortLocations(
    list.flatMap((item) => {
      const normalized = normalizeLocationPayload(item, siteId);
      return normalized ? [normalized] : [];
    }),
  );
}

async function getWithPrefixFallback<T>(
  primaryUrl: string,
  fallbackUrl: string,
  config?: AxiosRequestConfig,
) {
  try {
    return await apiClient.get<T>(primaryUrl, config);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return apiClient.get<T>(fallbackUrl, config);
    }
    throw error;
  }
}

export async function getSiteLatestLocations(siteId: string) {
  const response = await getWithPrefixFallback<LocationListPayload>(
    `/site/${siteId}/live-locations`,
    `/locations/site/${siteId}/live-locations`,
  );
  return unwrapLocationList(response.data, siteId);
}

export async function getLocationHistory({
  siteId,
  workerId,
  from,
  to,
}: LocationHistoryParams) {
  const response = await getWithPrefixFallback<LocationListPayload>(
    `/site/${siteId}/location-history`,
    `/locations/site/${siteId}/history`,
    {
      params: { workerId, from, to },
    },
  );
  return unwrapLocationList(response.data, siteId);
}

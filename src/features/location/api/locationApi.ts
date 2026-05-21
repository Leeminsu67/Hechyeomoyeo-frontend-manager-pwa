import axios, { type AxiosRequestConfig } from "axios";
import apiClient from "@/lib/axios";
import type {
  CreateLocationMemoDto,
  LocationHistoryParams,
  LocationMemo,
  LocationWorkerNotificationDto,
} from "../types/location.types";
import { normalizeLocationPayload, sortLocations } from "../lib/locationState";

type LocationListPayload = unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
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
  else if (Array.isArray(payload.pings)) list = payload.pings;
  else if (Array.isArray(data)) list = data;
  else if (isRecord(data) && Array.isArray(data.workers)) list = data.workers;
  else if (isRecord(data) && Array.isArray(data.locations)) {
    list = data.locations;
  } else if (isRecord(data) && Array.isArray(data.pings)) {
    list = data.pings;
  }

  return sortLocations(
    list.flatMap((item) => {
      const normalized = normalizeLocationPayload(item, siteId);
      return normalized ? [normalized] : [];
    }),
  );
}

function normalizeLocationMemo(value: unknown): LocationMemo | null {
  if (!isRecord(value)) return null;

  const memo = toStringOrNull(value.memo);
  if (!memo) return null;

  const authorValue = value.author;
  const author = toStringOrNull(authorValue) ??
    (isRecord(authorValue)
      ? toStringOrNull(authorValue.name) ??
        toStringOrNull(authorValue.userName) ??
        toStringOrNull(authorValue.nickname)
      : null);

  return {
    id: toStringOrNull(value.id),
    author,
    createdAt: toStringOrNull(value.createdAt),
    memo,
  };
}

function unwrapLocationMemo(payload: unknown) {
  const direct = normalizeLocationMemo(payload);
  if (direct) return direct;
  if (!isRecord(payload)) return null;

  const data = payload.data;
  const dataMemo = isRecord(data) ? normalizeLocationMemo(data.memo) : null;
  if (dataMemo) return dataMemo;

  return normalizeLocationMemo(payload.memo);
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

export async function notifyLocationWorker({
  attendanceId,
  dto,
}: {
  attendanceId: string;
  dto: LocationWorkerNotificationDto;
}) {
  await apiClient.post(`/locations/${attendanceId}/notify-worker`, dto);
}

export async function createLocationMemo({
  attendanceId,
  dto,
}: {
  attendanceId: string;
  dto: CreateLocationMemoDto;
}) {
  const response = await apiClient.post(
    `/locations/${attendanceId}/memos`,
    dto,
  );
  return unwrapLocationMemo(response.data);
}

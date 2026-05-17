import type { ScheduleSiteOption } from "@/types/schedule";
import type { LocationPingPayload, WorkerLocationZone } from "../types/location.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBooleanOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeZone(value: unknown): WorkerLocationZone | null {
  if (!isRecord(value)) return null;

  const id = toStringOrNull(value.id);
  const name = toStringOrNull(value.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    latitude: toNumberOrNull(value.latitude),
    longitude: toNumberOrNull(value.longitude),
  };
}

export function normalizeLocationPayload(
  value: unknown,
  fallbackSiteId?: string,
): LocationPingPayload | null {
  if (!isRecord(value)) return null;

  const siteId = toStringOrNull(value.siteId) ?? fallbackSiteId ?? null;
  if (!siteId) return null;

  const workerId = toStringOrNull(value.workerId) ?? toStringOrNull(value.userId);
  const userId = toStringOrNull(value.userId) ?? workerId;
  const workerName =
    toStringOrNull(value.workerName) ??
    toStringOrNull(value.userName) ??
    "이름 없음";
  const userName = toStringOrNull(value.userName) ?? workerName;

  return {
    siteId,
    attendanceId: toStringOrNull(value.attendanceId),
    workerId,
    workerName,
    userId,
    userName,
    role: toNumberOrNull(value.role),
    assignmentType: toStringOrNull(value.assignmentType),
    attendanceStatus: toStringOrNull(value.attendanceStatus),
    latitude: toNumberOrNull(value.latitude),
    longitude: toNumberOrNull(value.longitude),
    accuracy: toNumberOrNull(value.accuracy),
    battery: toNumberOrNull(value.battery),
    recordedAt: toStringOrNull(value.recordedAt),
    receivedAt: toStringOrNull(value.receivedAt),
    lastReceivedAt: toStringOrNull(value.lastReceivedAt),
    status: toStringOrNull(value.status),
    accuracyStatus: toStringOrNull(value.accuracyStatus),
    isStale: toBooleanOrNull(value.isStale),
    isOutOfZone: toBooleanOrNull(value.isOutOfZone),
    distanceFromZoneMeters: toNumberOrNull(value.distanceFromZoneMeters),
    zone: normalizeZone(value.zone),
  };
}

export function getLocationKey(location: LocationPingPayload) {
  return (
    location.attendanceId ??
    location.workerId ??
    location.userId ??
    `${location.siteId}:${location.workerName}`
  );
}

function getLocationIdentityKeys(location: LocationPingPayload) {
  return [
    location.attendanceId,
    location.workerId,
    location.userId,
  ].filter((key): key is string => Boolean(key));
}

export function isSameLocationIdentity(
  first: LocationPingPayload,
  second: LocationPingPayload,
) {
  const secondKeys = new Set(getLocationIdentityKeys(second));
  return getLocationIdentityKeys(first).some((key) => secondKeys.has(key));
}

export function getLocationLastReceivedAt(location: LocationPingPayload) {
  return location.lastReceivedAt ?? location.receivedAt;
}

export function hasLocationCoordinates(
  location: LocationPingPayload,
): location is LocationPingPayload & { latitude: number; longitude: number } {
  return (
    typeof location.latitude === "number" &&
    Number.isFinite(location.latitude) &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.longitude)
  );
}

function getSortTime(location: LocationPingPayload) {
  const last = getLocationLastReceivedAt(location) ?? location.recordedAt;
  if (!last) return 0;

  const time = new Date(last).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function upsertLocation(
  items: LocationPingPayload[],
  next: LocationPingPayload,
) {
  const nextIdentityKeys = new Set(getLocationIdentityKeys(next));
  const map = new Map<string, LocationPingPayload>();

  for (const item of items) {
    const hasSameIdentity = getLocationIdentityKeys(item).some((key) =>
      nextIdentityKeys.has(key),
    );
    if (!hasSameIdentity) {
      map.set(getLocationKey(item), item);
    }
  }

  map.set(getLocationKey(next), next);
  return sortLocations(Array.from(map.values()));
}

export function sortLocations(items: LocationPingPayload[]) {
  return [...items].sort((a, b) => {
    const timeDiff = getSortTime(b) - getSortTime(a);
    if (timeDiff !== 0) return timeDiff;
    return a.workerName.localeCompare(b.workerName, "ko");
  });
}

export function getInitialSiteId(
  sites: ScheduleSiteOption[],
  requestedSiteId?: string,
) {
  if (requestedSiteId && sites.some((site) => site.id === requestedSiteId)) {
    return requestedSiteId;
  }
  return sites[0]?.id ?? null;
}

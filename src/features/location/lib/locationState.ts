import type { ScheduleSiteOption } from "@/types/schedule";
import type {
  LocationHistoryTimelineItem,
  LocationPingPayload,
  LocationSharingStatus,
  WorkerLocationZone,
} from "../types/location.types";
import { LOCATION_HISTORY_GAP_MS } from "./locationPolicy";

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

function toLocationSharingStatus(value: unknown): LocationSharingStatus | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(/[-_\s]/g, "").toLowerCase();
  if (normalized === "online" || normalized === "normal") return "online";
  if (normalized === "delayed" || normalized === "stale") return "delayed";
  if (
    normalized === "interruptionsuspected" ||
    normalized === "interrupted"
  ) {
    return "interruptionSuspected";
  }
  if (normalized === "longmissing") return "longMissing";
  if (
    normalized === "permissiondenied" ||
    normalized === "permissionoff" ||
    normalized === "consentmissing" ||
    normalized === "denied" ||
    normalized === "blocked"
  ) {
    return "permissionDenied";
  }
  if (
    normalized === "networkpending" ||
    normalized === "networkunsent" ||
    normalized === "offlinepending"
  ) {
    return "networkPending";
  }
  if (
    normalized === "ended" ||
    normalized === "workended" ||
    normalized === "finished"
  ) {
    return "ended";
  }
  return null;
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
  const locationSharingStatus =
    toLocationSharingStatus(value.locationSharingStatus) ??
    toLocationSharingStatus(value.status);

  return {
    id: toStringOrNull(value.id),
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
    reportedAt: toStringOrNull(value.reportedAt),
    status: toStringOrNull(value.status),
    locationSharingStatus,
    locationConsentStatus: toStringOrNull(value.locationConsentStatus),
    locationPermissionStatus: toStringOrNull(value.locationPermissionStatus),
    reason: toStringOrNull(value.reason),
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
  return location.lastReceivedAt ?? location.receivedAt ?? location.reportedAt;
}

function getLocationTimelineAt(location: LocationPingPayload) {
  return location.recordedAt ?? getLocationLastReceivedAt(location);
}

export function buildLocationHistoryTimeline(
  items: LocationPingPayload[],
  gapThresholdMs = LOCATION_HISTORY_GAP_MS,
): LocationHistoryTimelineItem[] {
  const datedItems: { item: LocationPingPayload; time: number; at: string }[] = [];
  const undatedItems: LocationHistoryTimelineItem[] = [];

  for (const item of items) {
    const at = getLocationTimelineAt(item);
    const time = at ? new Date(at).getTime() : Number.NaN;

    if (at && Number.isFinite(time)) {
      datedItems.push({ item, time, at });
      continue;
    }

    undatedItems.push({
      type: "location",
      item,
      key: `${getLocationKey(item)}-undated`,
    });
  }

  const timeline: LocationHistoryTimelineItem[] = [];
  const sortedItems = datedItems.sort((a, b) => a.time - b.time);

  sortedItems.forEach((entry, index) => {
    const previous = sortedItems[index - 1];
    if (previous) {
      const durationMs = entry.time - previous.time;
      if (durationMs >= gapThresholdMs) {
        timeline.push({
          type: "gap",
          from: previous.at,
          to: entry.at,
          durationMs,
          key: `gap-${previous.at}-${entry.at}`,
        });
      }
    }

    timeline.push({
      type: "location",
      item: entry.item,
      key: `${getLocationKey(entry.item)}-${entry.at}`,
    });
  });

  return [...timeline.reverse(), ...undatedItems];
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

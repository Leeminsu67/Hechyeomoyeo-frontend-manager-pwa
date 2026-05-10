import type { ScheduleSiteOption } from "@/types/schedule";
import type { LocationPingPayload } from "../types/location.types";

export function upsertLocation(
  items: LocationPingPayload[],
  next: LocationPingPayload,
) {
  const map = new Map(items.map((item) => [item.userId, item]));
  map.set(next.userId, next);
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
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

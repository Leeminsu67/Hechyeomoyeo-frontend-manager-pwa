"use client";

import { Battery, Clock, History, MapPin, MapPinOff, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationPingPayload } from "../types/location.types";
import {
  formatLocationTime,
  getAssignmentTypeLabel,
  getAttendanceStatusLabel,
  getLocationStatusClass,
  getLocationStatusLabel,
  resolveWorkerLocationStatus,
} from "../lib/locationFormat";
import {
  getLocationKey,
  getLocationLastReceivedAt,
  hasLocationCoordinates,
  isSameLocationIdentity,
} from "../lib/locationState";

const STATUS_ORDER = {
  outOfZone: 0,
  missing: 1,
  lowAccuracy: 2,
  online: 3,
};

function StatusBadge({ location }: { location: LocationPingPayload }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold",
        getLocationStatusClass(location),
      )}
    >
      {getLocationStatusLabel(location)}
    </span>
  );
}

export function LocationStatusList({
  locations,
  selectedLocation,
  canViewHistory,
  onSelect,
  onOpenHistory,
}: {
  locations: LocationPingPayload[];
  selectedLocation: LocationPingPayload | null;
  canViewHistory: boolean;
  onSelect: (location: LocationPingPayload) => void;
  onOpenHistory: (location: LocationPingPayload) => void;
}) {
  const sortedLocations = [...locations].sort((a, b) => {
    const statusDiff =
      STATUS_ORDER[resolveWorkerLocationStatus(a)] -
      STATUS_ORDER[resolveWorkerLocationStatus(b)];
    if (statusDiff !== 0) return statusDiff;

    const aLast = getLocationLastReceivedAt(a);
    const bLast = getLocationLastReceivedAt(b);
    const timeDiff =
      (bLast ? new Date(bLast).getTime() : 0) -
      (aLast ? new Date(aLast).getTime() : 0);
    if (timeDiff !== 0) return timeDiff;
    return a.workerName.localeCompare(b.workerName, "ko");
  });

  return (
    <section className="rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-text-strong">인력 위치</h2>
          <p className="text-xs text-muted-foreground">
            출근 중 인력의 마지막 위치 수신 상태입니다.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
          {locations.length}
        </span>
      </div>

      {locations.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
          <Radio className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-text-strong">
            수신된 위치가 없습니다.
          </p>
        </div>
      ) : (
        <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
          {sortedLocations.map((location) => (
            <div
              key={getLocationKey(location)}
              className={cn(
                "px-4 py-3 transition-colors hover:bg-muted",
                selectedLocation &&
                  isSameLocationIdentity(selectedLocation, location) &&
                  "bg-primary-50",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(location)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-strong">
                      {location.workerName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-xs text-muted-foreground">
                        {getAssignmentTypeLabel(location.assignmentType)}
                      </span>
                      {location.attendanceStatus && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                          {getAttendanceStatusLabel(location.attendanceStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge location={location} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatLocationTime(getLocationLastReceivedAt(location))}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Battery className="h-3.5 w-3.5" />
                    {location.battery == null ? "-" : `${Math.round(location.battery)}%`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPinOff className="h-3.5 w-3.5" />
                    정확도 {location.accuracy == null ? "-" : `${Math.round(location.accuracy)}m`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {hasLocationCoordinates(location)
                      ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                      : "위치 없음"}
                  </span>
                </div>
              </button>
              {canViewHistory && location.workerId && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenHistory(location);
                  }}
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-bold text-muted-foreground hover:bg-surface"
                >
                  <History className="h-3.5 w-3.5" />
                  이력
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

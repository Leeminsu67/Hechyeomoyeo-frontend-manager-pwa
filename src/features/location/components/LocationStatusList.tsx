"use client";

import { Battery, Clock, MapPinOff, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationPingPayload } from "../types/location.types";
import { formatLocationTime, getLocationStatusLabel } from "../lib/locationFormat";

function StatusBadge({ location }: { location: LocationPingPayload }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
        location.isOutOfZone === true
          ? "bg-danger/25 text-danger-foreground"
          : location.isStale
          ? "bg-secondary/30 text-secondary-foreground"
          : "bg-success/20 text-success-foreground",
      )}
    >
      {getLocationStatusLabel(location)}
    </span>
  );
}

export function LocationStatusList({
  locations,
  selectedUserId,
  onSelect,
  onOpenHistory,
}: {
  locations: LocationPingPayload[];
  selectedUserId: string | null;
  onSelect: (location: LocationPingPayload) => void;
  onOpenHistory: (location: LocationPingPayload) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-text-strong">인력 위치</h2>
          <p className="text-xs text-muted-foreground">마커 또는 행을 선택하면 위치 이력을 볼 수 있습니다.</p>
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
          {locations.map((location) => (
            <button
              key={location.userId}
              type="button"
              onClick={() => {
                onSelect(location);
                onOpenHistory(location);
              }}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors hover:bg-muted",
                selectedUserId === location.userId && "bg-primary-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-strong">
                    {location.userName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-xs text-muted-foreground">
                      {location.assignmentType ?? "배정 정보 없음"}
                    </span>
                    {location.attendanceStatus && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                        {location.attendanceStatus}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge location={location} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatLocationTime(location.recordedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Battery className="h-3.5 w-3.5" />
                  {location.battery == null ? "-" : `${Math.round(location.battery)}%`}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPinOff className="h-3.5 w-3.5" />
                  정확도 {location.accuracy == null ? "-" : `${Math.round(location.accuracy)}m`}
                </span>
                <span>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

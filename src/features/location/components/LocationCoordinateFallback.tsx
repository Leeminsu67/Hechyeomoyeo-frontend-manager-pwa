"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationPingPayload } from "../types/location.types";
import { resolveWorkerLocationStatus } from "../lib/locationFormat";
import { getLocationKey, isSameLocationIdentity } from "../lib/locationState";

export function LocationCoordinateFallback({
  locations,
  selectedLocation,
  onSelect,
}: {
  locations: LocationPingPayload[];
  selectedLocation: LocationPingPayload | null;
  onSelect: (location: LocationPingPayload) => void;
}) {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(222,226,230,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(222,226,230,0.7)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute left-4 top-4 rounded-lg bg-surface/90 px-3 py-2 text-xs text-muted-foreground shadow-card">
        Kakao 지도 키가 없어 좌표 기반 마커 UI로 표시합니다.
      </div>
      {locations.map((location, index) => (
        <button
          key={getLocationKey(location)}
          type="button"
          onClick={() => onSelect(location)}
          className={cn(
            "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-lg border bg-surface px-2 py-1 text-xs font-bold shadow-card",
            selectedLocation &&
              isSameLocationIdentity(selectedLocation, location) &&
              "ring-2 ring-primary-300",
            resolveWorkerLocationStatus(location) === "permissionDenied"
              ? "border-danger/60 text-danger-foreground"
              : resolveWorkerLocationStatus(location) === "consentMissing"
              ? "border-border text-muted-foreground"
              : resolveWorkerLocationStatus(location) === "missing"
              ? "border-secondary/60 text-secondary-foreground"
              : "border-success/60 text-success-foreground",
          )}
          style={{
            left: `${20 + (index * 17) % 60}%`,
            top: `${22 + (index * 23) % 56}%`,
          }}
        >
          <MapPin className="h-3.5 w-3.5" />
          {location.workerName}
        </button>
      ))}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="rounded-lg bg-surface/95 px-4 py-3 text-sm font-semibold text-muted-foreground shadow-card">
            표시할 위치 마커가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}

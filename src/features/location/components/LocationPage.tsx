"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useScheduleSiteOptions } from "@/features/duty/hooks/useSchedules";
import type { LocationPingPayload } from "../types/location.types";
import { getInitialSiteId, upsertLocation } from "../lib/locationState";
import { useAdminLocationSocket } from "../hooks/useAdminLocationSocket";
import {
  useSiteLatestLocations,
  useSiteOnlineStatus,
} from "../hooks/useSiteLatestLocations";
import { LocationConnectionStatus } from "./LocationConnectionStatus";
import { LocationHistoryModal } from "./LocationHistoryModal";
import { LocationMap } from "./LocationMap";
import { LocationPageHeader } from "./LocationPageHeader";
import { LocationStatusList } from "./LocationStatusList";

export function LocationPage({ initialSiteId }: { initialSiteId?: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationPingPayload[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationPingPayload | null>(null);
  const [historyTarget, setHistoryTarget] =
    useState<LocationPingPayload | null>(null);

  const { data: siteOptionsData, isLoading: sitesLoading } =
    useScheduleSiteOptions();
  const sites = useMemo(
    () => siteOptionsData?.data.sites ?? [],
    [siteOptionsData],
  );
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? null;
  const {
    data: latestLocations,
    isLoading: latestLoading,
    isError: latestError,
    refetch: refetchLatest,
  } = useSiteLatestLocations(selectedSiteId);
  const { data: onlineStatus } = useSiteOnlineStatus(selectedSiteId);

  useEffect(() => {
    if (sites.length === 0 || selectedSiteId) return;
    setSelectedSiteId(getInitialSiteId(sites, initialSiteId));
  }, [initialSiteId, selectedSiteId, sites]);

  useEffect(() => {
    setLocations([]);
    setSelectedLocation(null);
    setHistoryTarget(null);
  }, [selectedSiteId]);

  useEffect(() => {
    if (!latestLocations) return;
    setLocations(latestLocations);
  }, [latestLocations]);

  const handlePing = useCallback((payload: LocationPingPayload) => {
    setLocations((prev) => upsertLocation(prev, payload));
    setSelectedLocation((prev) =>
      prev?.userId === payload.userId ? payload : prev,
    );
  }, []);

  const socketDebug = useAdminLocationSocket({
    accessToken,
    selectedSiteId,
    onPing: handlePing,
  });

  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <LocationPageHeader
          sites={sites}
          selectedSiteId={selectedSiteId}
          sitesLoading={sitesLoading}
          latestLoading={latestLoading}
          onSelectSite={handleSiteSelect}
          onRefresh={() => refetchLatest()}
        />

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <p className="text-xs font-semibold text-muted-foreground">선택 현장</p>
            <p className="mt-1 text-lg font-bold text-text-strong">
              {selectedSite?.name ?? "현장을 선택해주세요"}
            </p>
          </div>
          <LocationConnectionStatus
            debug={socketDebug}
            onlineStatus={onlineStatus}
          />
        </div>

        {latestError && (
          <div className="mb-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger-foreground">
            초기 위치 목록을 불러오지 못했습니다.
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <LocationMap
            locations={locations}
            selectedUserId={selectedLocation?.userId ?? null}
            onSelectLocation={(location) => {
              setSelectedLocation(location);
              setHistoryTarget(location);
            }}
          />
          <LocationStatusList
            locations={locations}
            selectedUserId={selectedLocation?.userId ?? null}
            onSelect={setSelectedLocation}
            onOpenHistory={setHistoryTarget}
          />
        </div>
      </div>

      <LocationHistoryModal
        siteId={selectedSiteId}
        location={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    </div>
  );
}
